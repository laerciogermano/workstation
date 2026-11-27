//go:build !windows

package exec

import (
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
	"unicode/utf8"

	p "github.com/laerciogermano/plans-client/internal/protocol"
)

type sink struct {
	mu   sync.Mutex
	msgs []any
	exit chan p.Exit
}

func (s *sink) emit(m any) {
	s.mu.Lock()
	s.msgs = append(s.msgs, m)
	s.mu.Unlock()
	if e, ok := m.(p.Exit); ok {
		s.exit <- e
	}
}

func (s *sink) text(stream string) (out string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, m := range s.msgs {
		if o, ok := m.(p.Output); ok && o.Stream == stream {
			out += o.Data
		}
	}
	return
}

func start(t *testing.T, root string, id string, c p.Command, timeout int) (*Manager, *sink) {
	t.Helper()
	s := &sink{exit: make(chan p.Exit, 8)}
	m := NewManager(root, s.emit)
	r, ok := m.Reserve(p.Incoming{RunID: id, TimeoutSec: timeout}, c)
	if !ok {
		t.Fatal("não reservou")
	}
	m.Start(r)
	return m, s
}

func wait(t *testing.T, s *sink) p.Exit {
	t.Helper()
	select {
	case e := <-s.exit:
		return e
	case <-time.After(15 * time.Second):
		t.Fatal("execução não terminou")
		return p.Exit{}
	}
}

func TestOutputExitAndNoRepeat(t *testing.T) {
	m, s := start(t, t.TempDir(), "a", p.Command{Script: "echo fora; echo erro >&2; exit 3", Shell: "sh"}, 0)
	e := wait(t, s)
	if e.Reason != "exit" || e.Code != 3 || e.Chunks < 2 || s.text("stdout") != "fora\n" || s.text("stderr") != "erro\n" {
		t.Fatalf("%+v %q %q", e, s.text("stdout"), s.text("stderr"))
	}
	if _, ok := m.Reserve(p.Incoming{RunID: "a"}, p.Command{Program: "true"}); ok {
		t.Fatal("aceitou o mesmo runId")
	}
	m.Resume("a", 0)
	if wait(t, s).Chunks != e.Chunks || s.text("stdout") != "fora\nfora\n" {
		t.Fatal("reenvio incompleto")
	}
	m.Ack("a")
	if len(m.List().Runs) != 0 {
		t.Fatal("ack não descartou")
	}
	if _, ok := m.Reserve(p.Incoming{RunID: "a"}, p.Command{Program: "true"}); ok {
		t.Fatal("rodaria de novo depois do ack")
	}
}

func TestArgumentsAreNotInterpreted(t *testing.T) {
	_, s := start(t, t.TempDir(), "a", p.Command{Program: "echo", Args: []string{"$(whoami); rm -rf /"}}, 0)
	wait(t, s)
	if s.text("stdout") != "$(whoami); rm -rf /\n" {
		t.Fatalf("%q", s.text("stdout"))
	}
}

func TestCancelKillsChildren(t *testing.T) {
	root := t.TempDir()
	m, s := start(t, root, "a", p.Command{Script: "(sleep 8; touch filho) & echo pronto; sleep 30", Shell: "sh"}, 0)
	for i := 0; s.text("stdout") == "" && i < 500; i++ {
		time.Sleep(10 * time.Millisecond)
	}
	began := time.Now()
	m.Cancel("a")
	if e := wait(t, s); e.Reason != "cancelled" || time.Since(began) > 7*time.Second {
		t.Fatalf("%+v %v", e, time.Since(began))
	}
	time.Sleep(9 * time.Second)
	if _, err := os.Stat(filepath.Join(root, "filho")); err == nil {
		t.Fatal("processo filho sobreviveu ao cancelamento")
	}
}

func TestTimeoutAndStartError(t *testing.T) {
	_, s := start(t, t.TempDir(), "a", p.Command{Program: "sleep", Args: []string{"20"}}, 1)
	if e := wait(t, s); e.Reason != "timeout" {
		t.Fatalf("%+v", e)
	}
	_, s = start(t, t.TempDir(), "b", p.Command{Program: "programa-que-nao-existe-xyz"}, 0)
	if e := wait(t, s); e.Reason != "error" || e.Error == "" {
		t.Fatalf("%+v", e)
	}
}

func TestLargeOutputIsChunkedAndCapped(t *testing.T) {
	root := t.TempDir()
	big := strings.Repeat("ç✓", 2_000_000) // 10 MB de caracteres de 2 e 3 bytes
	if err := os.WriteFile(filepath.Join(root, "g"), []byte(big), 0o600); err != nil {
		t.Fatal(err)
	}
	_, s := start(t, root, "a", p.Command{Program: "cat", Args: []string{"g"}}, 0)
	e := wait(t, s)
	got := s.text("stdout")
	if !e.Truncated || len(got) > MaxOutputBytes || len(got) < MaxOutputBytes-2*p.OutputChunk || !strings.HasPrefix(big, got) {
		t.Fatalf("truncado=%v tamanho=%d", e.Truncated, len(got))
	}
	for _, m := range s.msgs {
		if o, ok := m.(p.Output); ok && (len(o.Data) > p.OutputChunk || !utf8.ValidString(o.Data) || strings.ContainsRune(o.Data, utf8.RuneError)) {
			t.Fatal("trecho grande demais ou caractere partido")
		}
	}
}

func TestCwdConfined(t *testing.T) {
	root := t.TempDir()
	outside := t.TempDir()
	if err := os.Mkdir(filepath.Join(root, "sub"), 0o700); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join(root, "atalho")); err != nil {
		t.Fatal(err)
	}
	for _, bad := range []string{"..", "sub/../..", outside, "atalho", "nao-existe", "/etc"} {
		if _, err := ResolveDir(root, bad); err == nil {
			t.Errorf("aceitou %q", bad)
		}
	}
	for _, good := range []string{"", ".", "sub"} {
		if _, err := ResolveDir(root, good); err != nil {
			t.Errorf("recusou %q: %v", good, err)
		}
	}
}
