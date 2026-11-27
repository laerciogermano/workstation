// Package exec cria os processos, junta a saída em trechos e guarda até o front confirmar.
package exec

import (
	"context"
	"errors"
	"slices"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	osexec "os/exec"

	"github.com/laerciogermano/plans-client/internal/protocol"
)

const (
	MaxOutputBytes = 5 * 1024 * 1024
	maxActive      = 4
	maxFinished    = 50
	defaultTimeout = time.Hour
)

// Emit envia uma mensagem ao front, se houver conexão.
type Emit func(msg any)

type Run struct {
	info     protocol.RunInfo
	timeout  time.Duration
	started  time.Time
	cancel   context.CancelFunc
	canceled bool

	mu        sync.Mutex // ordena a saída: envio ao vivo e reenvio nunca se misturam
	chunks    []protocol.Output
	bytes     int
	truncated bool
	exit      *protocol.Exit
	rejected  *protocol.Rejected
}

// Command devolve o comando pedido.
func (r *Run) Command() protocol.Command { return r.info.Command }

type Manager struct {
	root string
	emit Emit

	mu    sync.Mutex
	runs  map[string]*Run
	seen  map[string]bool // o mesmo runId nunca roda duas vezes
	order []string
	wg    sync.WaitGroup
}

func NewManager(root string, emit Emit) *Manager {
	return &Manager{root: root, emit: emit, runs: map[string]*Run{}, seen: map[string]bool{}}
}

// Reserve registra um pedido como pendente. ok é false para runId repetido.
func (m *Manager) Reserve(in protocol.Incoming, cmd protocol.Command) (*Run, bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.seen[in.RunID] {
		return nil, false
	}
	m.seen[in.RunID] = true
	timeout := defaultTimeout
	if in.TimeoutSec > 0 {
		timeout = time.Duration(in.TimeoutSec) * time.Second
	}
	r := &Run{timeout: timeout, info: protocol.RunInfo{RunID: in.RunID, NodeID: in.NodeID, Status: "pending",
		StartedAt: time.Now().UTC().Format(time.RFC3339), Command: cmd}}
	m.runs[in.RunID] = r
	m.order = append(m.order, in.RunID)
	return r, true
}

// Reject encerra um pedido sem executar.
func (m *Manager) Reject(r *Run, reason, allowCommand string) {
	m.mu.Lock()
	r.info.Status = "done"
	m.mu.Unlock()
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.exit != nil || r.rejected != nil {
		return
	}
	r.rejected = &protocol.Rejected{Type: "exec.rejected", RunID: r.info.RunID, Reason: reason, AllowCommand: allowCommand}
	m.emit(*r.rejected)
}

// Start executa um pedido pendente.
func (m *Manager) Start(r *Run) {
	m.mu.Lock()
	if r.info.Status != "pending" {
		m.mu.Unlock()
		return
	}
	active := 0
	for _, o := range m.runs {
		if o.info.Status == "running" {
			active++
		}
	}
	if active >= maxActive {
		m.mu.Unlock()
		m.Reject(r, "já há 4 comandos em execução", "")
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), r.timeout)
	r.cancel = cancel
	r.info.Status = "running"
	r.started = time.Now()
	m.wg.Add(1)
	m.mu.Unlock()
	go m.run(ctx, r)
}

type writer struct {
	m      *Manager
	r      *Run
	stream string
	rest   []byte // fim de um caractere UTF-8 ainda incompleto
}

func (w *writer) Write(p []byte) (int, error) {
	w.rest = append(w.rest, p...)
	w.flush(false)
	return len(p), nil
}

func (w *writer) flush(final bool) {
	for len(w.rest) > 0 {
		n := min(len(w.rest), protocol.OutputChunk)
		// não corta um caractere no meio
		start := n - 1
		for start > 0 && n-start < utf8.UTFMax && !utf8.RuneStart(w.rest[start]) {
			start--
		}
		incomplete := utf8.RuneStart(w.rest[start]) && !utf8.FullRune(w.rest[start:n])
		if incomplete && !(final && n == len(w.rest)) {
			n = start
		}
		if n == 0 {
			return
		}
		w.m.output(w.r, w.stream, strings.ToValidUTF8(string(w.rest[:n]), "�"))
		w.rest = append(w.rest[:0], w.rest[n:]...)
	}
}

func (m *Manager) output(r *Run, stream, data string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.truncated || r.bytes+len(data) > MaxOutputBytes {
		r.truncated = true
		return
	}
	r.bytes += len(data)
	o := protocol.Output{Type: "exec.output", RunID: r.info.RunID, N: len(r.chunks), Stream: stream, Data: data}
	r.chunks = append(r.chunks, o)
	m.emit(o)
}

func (m *Manager) run(ctx context.Context, r *Run) {
	defer m.wg.Done()
	defer r.cancel()
	out := &writer{m: m, r: r, stream: "stdout"}
	errw := &writer{m: m, r: r, stream: "stderr"}

	exit := protocol.Exit{Type: "exec.exit", RunID: r.info.RunID, Reason: "exit", Code: -1}
	cmd, err := build(ctx, m.root, r.info.Command)
	if err == nil {
		cmd.Stdout, cmd.Stderr = out, errw
		cmd.WaitDelay = 5 * time.Second
		if err = cmd.Start(); err == nil {
			m.emit(protocol.RunRef{Type: "exec.started", RunID: r.info.RunID})
			err = cmd.Wait()
		}
	}
	out.flush(true)
	errw.flush(true)

	if cmd != nil && cmd.ProcessState != nil {
		exit.Code = cmd.ProcessState.ExitCode()
	}
	m.mu.Lock()
	canceled := r.canceled
	m.mu.Unlock()
	var exitErr *osexec.ExitError
	switch {
	case canceled:
		exit.Reason = "cancelled"
	case errors.Is(ctx.Err(), context.DeadlineExceeded):
		exit.Reason = "timeout"
	case err != nil && !errors.As(err, &exitErr) && !errors.Is(err, osexec.ErrWaitDelay):
		exit.Reason, exit.Error = "error", err.Error()
	case exit.Code < 0 && err != nil:
		exit.Reason, exit.Error = "error", err.Error()
	}
	m.finish(r, exit, time.Since(r.started))
}

func (m *Manager) finish(r *Run, exit protocol.Exit, took time.Duration) {
	m.mu.Lock()
	r.info.Status = "done"
	m.trim()
	m.mu.Unlock()
	r.mu.Lock()
	defer r.mu.Unlock()
	exit.Chunks, exit.Truncated, exit.DurationMs = len(r.chunks), r.truncated, took.Milliseconds()
	r.exit = &exit
	m.emit(exit)
}

// trim descarta os encerrados mais antigos quando o front não confirma. Chamar com m.mu.
func (m *Manager) trim() {
	done := 0
	for _, r := range m.runs {
		if r.info.Status == "done" {
			done++
		}
	}
	for _, id := range slices.Clone(m.order) {
		if done <= maxFinished {
			return
		}
		if r := m.runs[id]; r != nil && r.info.Status == "done" {
			m.drop(id)
			done--
		}
	}
}

func (m *Manager) drop(id string) {
	delete(m.runs, id)
	m.order = slices.DeleteFunc(m.order, func(o string) bool { return o == id })
}

func (m *Manager) Cancel(id string) {
	m.mu.Lock()
	r := m.runs[id]
	if r == nil || r.info.Status == "done" {
		m.mu.Unlock()
		return
	}
	r.canceled = true
	if r.info.Status == "running" {
		r.cancel()
		m.mu.Unlock()
		return
	}
	// ainda aguardando aprovação
	r.info.Status = "done"
	m.mu.Unlock()
	r.mu.Lock()
	defer r.mu.Unlock()
	r.exit = &protocol.Exit{Type: "exec.exit", RunID: id, Reason: "cancelled", Code: -1}
	m.emit(*r.exit)
}

func (m *Manager) List() protocol.Runs {
	m.mu.Lock()
	defer m.mu.Unlock()
	list := protocol.Runs{Type: "exec.runs", Runs: []protocol.RunInfo{}}
	for _, id := range m.order {
		list.Runs = append(list.Runs, m.runs[id].info)
	}
	return list
}

// Resume reenvia o que o front ainda não tem.
func (m *Manager) Resume(id string, from int) {
	m.mu.Lock()
	r := m.runs[id]
	m.mu.Unlock()
	if r == nil {
		return
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	for i := max(from, 0); i < len(r.chunks); i++ {
		m.emit(r.chunks[i])
	}
	if r.exit != nil {
		m.emit(*r.exit)
	}
	if r.rejected != nil {
		m.emit(*r.rejected)
	}
}

// Ack descarta uma execução encerrada que o front já gravou.
func (m *Manager) Ack(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if r := m.runs[id]; r != nil && r.info.Status == "done" {
		m.drop(id)
	}
}

// Shutdown cancela tudo e espera os processos terminarem.
func (m *Manager) Shutdown() {
	m.mu.Lock()
	var ids []string
	for id, r := range m.runs {
		if r.info.Status != "done" {
			ids = append(ids, id)
		}
	}
	m.mu.Unlock()
	for _, id := range ids {
		m.Cancel(id)
	}
	m.wg.Wait()
}
