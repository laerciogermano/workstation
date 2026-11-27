// Package connection mantém o client ligado ao hub e trata os pedidos do front.
package connection

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/url"
	"regexp"
	"runtime"
	"sync"
	"time"

	"github.com/coder/websocket"

	"github.com/laerciogermano/plans-client/internal/config"
	"github.com/laerciogermano/plans-client/internal/exec"
	"github.com/laerciogermano/plans-client/internal/policy"
	"github.com/laerciogermano/plans-client/internal/protocol"
)

// Answer é a resposta de quem aprova no terminal.
type Answer int

const (
	Deny Answer = iota
	Once
	Always
)

// Prompter pergunta à pessoa. nil quando o client roda em segundo plano.
type Prompter interface {
	Ask(description string) Answer
}

type Agent struct {
	Log      *slog.Logger
	Version  string
	Prompter Prompter

	cfg     config.Config
	channel *protocol.Channel
	manager *exec.Manager

	mu      sync.Mutex // protege a conexão atual e a sequência de envio
	conn    *websocket.Conn
	session string
	sender  string
	seq     int64
}

var uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`)

// CheckHub exige conexão cifrada fora da própria máquina.
func CheckHub(raw string) error {
	u, err := url.Parse(raw)
	if err != nil || u.Host == "" {
		return errors.New("endereço do hub inválido")
	}
	host := u.Hostname()
	local := host == "localhost" || (net.ParseIP(host) != nil && net.ParseIP(host).IsLoopback())
	if u.Scheme == "wss" || (u.Scheme == "ws" && local) {
		return nil
	}
	return errors.New("o hub precisa usar wss:// (ws:// só na própria máquina)")
}

func token() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return base64.RawURLEncoding.EncodeToString(b)
}

// Run conecta e reconecta até o contexto terminar.
func (a *Agent) Run(ctx context.Context) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	if err := CheckHub(cfg.Hub); err != nil {
		return err
	}
	secret, err := protocol.DecodeCode(cfg.Code)
	if err != nil {
		return err
	}
	if a.channel, err = protocol.NewClientChannel(secret); err != nil {
		return err
	}
	a.cfg, a.sender = cfg, token()
	a.manager = exec.NewManager(cfg.Dir, a.send)
	defer a.manager.Shutdown()

	wait := time.Second
	for ctx.Err() == nil {
		began := time.Now()
		err := a.connect(ctx)
		if ctx.Err() != nil {
			break
		}
		if errors.Is(err, errRepaired) {
			return err
		}
		if time.Since(began) > 30*time.Second {
			wait = time.Second
		}
		a.Log.Warn("conexão perdida, tentando de novo", "em", wait.String(), "motivo", fmt.Sprint(err))
		select {
		case <-ctx.Done():
		case <-time.After(wait):
		}
		wait = min(wait*2, 15*time.Second)
	}
	return nil
}

var errRepaired = errors.New("o pareamento mudou: rode o client de novo")

func (a *Agent) connect(ctx context.Context) error {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	dialCtx, stop := context.WithTimeout(ctx, 10*time.Second)
	conn, _, err := websocket.Dial(dialCtx, a.cfg.Hub, nil)
	stop()
	if err != nil {
		return err
	}
	defer conn.CloseNow()
	conn.SetReadLimit(protocol.MaxMessageBytes)

	join, _ := json.Marshal(map[string]any{"type": "join", "protocol": protocol.Version, "room": a.channel.Room, "role": "client"})
	if err := conn.Write(ctx, websocket.MessageText, join); err != nil {
		return err
	}
	// sessão nova a cada conexão: comandos de antes não podem ser repetidos
	a.mu.Lock()
	a.conn, a.session, a.seq = conn, token(), 0
	a.mu.Unlock()
	defer func() {
		a.mu.Lock()
		a.conn = nil
		a.mu.Unlock()
	}()

	go func() { // detecta conexão morta
		t := time.NewTicker(20 * time.Second)
		defer t.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-t.C:
				pingCtx, stop := context.WithTimeout(ctx, 10*time.Second)
				err := conn.Ping(pingCtx)
				stop()
				if err != nil {
					conn.CloseNow()
					return
				}
			}
		}
	}()

	// os pedidos são tratados em outra goroutine para o leitor continuar respondendo aos pings
	requests := make(chan protocol.Incoming, 64)
	defer close(requests)
	go func() {
		for in := range requests {
			a.handle(in)
		}
	}()

	lastSeq := map[string]int64{}
	for {
		_, raw, err := conn.Read(ctx)
		if err != nil {
			return err
		}
		var frame struct {
			protocol.Relay
			Code   string `json:"code"`
			Role   string `json:"role"`
			Online bool   `json:"online"`
		}
		if json.Unmarshal(raw, &frame) != nil {
			continue
		}
		switch frame.Type {
		case "joined":
			a.Log.Info("conectado ao hub", "pasta", a.cfg.Dir)
		case "peer":
			a.Log.Info("front", "conectado", frame.Online)
		case "error":
			return fmt.Errorf("o hub recusou: %s", frame.Code)
		case "relay":
			plain, err := a.channel.Open(frame.Relay)
			if err != nil {
				a.Log.Warn("mensagem não autêntica descartada")
				continue
			}
			var inner protocol.Inner
			var in protocol.Incoming
			if json.Unmarshal(plain, &inner) != nil || json.Unmarshal(inner.Msg, &in) != nil {
				continue
			}
			// front.hello é a única mensagem sem sessão: só provoca um hello de volta
			if in.Type != "front.hello" {
				a.mu.Lock()
				session := a.session
				a.mu.Unlock()
				if inner.Session != session || inner.Seq <= lastSeq[inner.Sender] {
					a.Log.Warn("mensagem antiga ou repetida descartada", "tipo", in.Type)
					continue
				}
				lastSeq[inner.Sender] = inner.Seq
			}
			if current, err := config.Load(); err != nil || current.Code != a.cfg.Code || current.Dir != a.cfg.Dir {
				return errRepaired
			}
			select {
			case requests <- in:
			case <-ctx.Done():
				return ctx.Err()
			}
		}
	}
}

// send cifra e envia; sem conexão, a mensagem é descartada (o front pede de novo ao reconectar).
func (a *Agent) send(msg any) {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.conn == nil {
		return
	}
	body, err := json.Marshal(msg)
	if err != nil {
		return
	}
	a.seq++
	plain, err := json.Marshal(protocol.Inner{Sender: a.sender, Session: a.session, Seq: a.seq, Msg: body})
	if err != nil {
		return
	}
	relay, err := a.channel.Seal(plain)
	if err != nil {
		return
	}
	data, _ := json.Marshal(relay)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := a.conn.Write(ctx, websocket.MessageText, data); err != nil {
		a.conn.CloseNow()
		a.conn = nil
	}
}

func (a *Agent) handle(in protocol.Incoming) {
	switch in.Type {
	case "front.hello":
		project, err := config.ReadProject(a.cfg.Dir)
		if err != nil {
			a.Log.Error("projeto", "erro", err.Error())
		}
		a.send(protocol.Hello{Type: "hello", Nonce: in.Nonce, ProjectID: project.ID, OS: runtime.GOOS, Arch: runtime.GOARCH, Shells: exec.Shells(), Version: a.Version})
	case "exec.start":
		a.start(in)
	case "exec.cancel":
		a.manager.Cancel(in.RunID)
	case "exec.list":
		a.send(a.manager.List())
	case "exec.resume":
		a.manager.Resume(in.RunID, in.FromChunk)
	case "exec.ack":
		a.manager.Ack(in.RunID)
	}
}

func (a *Agent) start(in protocol.Incoming) {
	if !uuidPattern.MatchString(in.RunID) {
		return
	}
	cmd, invalid := policy.Normalize(in.Command)
	run, ok := a.manager.Reserve(in, cmd)
	if !ok {
		return
	}
	if invalid != nil {
		a.manager.Reject(run, invalid.Error(), "")
		return
	}
	cfg, err := config.Load() // relê: "plans-client allow" vale na hora
	if err != nil {
		a.manager.Reject(run, err.Error(), "")
		return
	}
	if policy.Allowed(cfg.Allow, cmd) {
		a.Log.Info("executando", "comando", policy.Describe(cmd))
		a.manager.Start(run)
		return
	}
	suggestion := policy.AllowCommand(cmd, runtime.GOOS)
	if a.Prompter == nil {
		a.Log.Warn("comando recusado", "comando", policy.Describe(cmd))
		a.manager.Reject(run, "comando não liberado neste computador", suggestion)
		return
	}
	a.send(protocol.RunRef{Type: "exec.pending", RunID: in.RunID})
	go func() {
		switch a.Prompter.Ask(policy.Describe(cmd)) {
		case Always:
			if latest, err := config.Load(); err == nil {
				latest.Allow = policy.Add(latest.Allow, policy.RuleFor(cmd))
				if err := config.Save(latest); err != nil {
					a.Log.Error("não gravou a liberação", "erro", err.Error())
				}
			}
			a.manager.Start(run)
		case Once:
			a.manager.Start(run)
		default:
			a.manager.Reject(run, "negado no terminal", suggestion)
		}
	}()
}
