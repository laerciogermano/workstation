//go:build !windows

package exec

import (
	"os"
	osexec "os/exec"
	"path/filepath"
	"slices"
	"strings"
	"testing"

	p "github.com/laerciogermano/plans-client/internal/protocol"
)

const playID = "3f2b8c1a-9d4e-4f6a-8b2c-1a2b3c4d5e6f"

// playProject cria uma pasta com nome hostil, uma atividade com título e descrição hostis e IAs falsas no PATH.
func playProject(t *testing.T) (root, bin, proof string) {
	t.Helper()
	base := t.TempDir()
	proof = filepath.Join(base, "invadido")
	root = filepath.Join(base, `projeto 'x' "y" $(touch nao) ; & `+"`z`")
	bin = filepath.Join(base, "bin")
	for _, d := range []string{filepath.Join(root, "activities"), bin} {
		if err := os.MkdirAll(d, 0o755); err != nil {
			t.Fatal(err)
		}
	}
	evil := "---\ntitle: \"'; touch " + proof + "; '\"\n---\n$(touch " + proof + ")\n"
	if err := os.WriteFile(filepath.Join(root, "activities", playID+".md"), []byte(evil), 0o644); err != nil {
		t.Fatal(err)
	}
	// a IA falsa grava a pasta em que está e cada argumento, separados por NUL
	fake := "#!/bin/sh\nfor a in \"$(pwd -P)\" \"$@\"; do printf '%s\\000' \"$a\"; done > \"$0.args\"\n"
	for _, name := range []string{"claude", "gemini"} {
		if err := os.WriteFile(filepath.Join(bin, name), []byte(fake), 0o755); err != nil {
			t.Fatal(err)
		}
	}
	t.Setenv("PATH", bin+string(os.PathListSeparator)+"/usr/bin"+string(os.PathListSeparator)+"/bin")
	t.Setenv("TMPDIR", t.TempDir())
	return
}

// fakeOpen no lugar do terminal: executa o arquivo gerado, como o terminal faria.
func fakeOpen(t *testing.T) *[]playSession {
	t.Helper()
	opened := &[]playSession{}
	previous := openWindow
	openWindow = func(s playSession) error {
		*opened = append(*opened, s)
		file, err := writeScript(s, "play.sh")
		if err != nil {
			return err
		}
		if out, err := osexec.Command(file).CombinedOutput(); err != nil {
			t.Fatalf("%v: %s", err, out)
		}
		if _, err := os.Stat(filepath.Dir(file)); !os.IsNotExist(err) {
			t.Fatal("o arquivo temporário não se apagou")
		}
		return nil
	}
	t.Cleanup(func() { openWindow = previous })
	return opened
}

func TestPlayStartsTheChosenAgentInTheProject(t *testing.T) {
	root, bin, proof := playProject(t)
	fakeOpen(t)
	real, err := filepath.EvalSymlinks(root)
	if err != nil {
		t.Fatal(err)
	}
	for agent, want := range map[string][]string{"claude": {playPrompt(playID)}, "gemini": {"--prompt-interactive", playPrompt(playID)}} {
		var out strings.Builder
		if err := Play(root, []string{agent, playID}, &out); err != nil {
			t.Fatal(err)
		}
		raw, err := os.ReadFile(filepath.Join(bin, agent+".args"))
		if err != nil {
			t.Fatal(err)
		}
		got := strings.Split(strings.TrimSuffix(string(raw), "\x00"), "\x00")
		if !slices.Equal(got, append([]string{real}, want...)) {
			t.Fatalf("%s: %q", agent, got)
		}
		if !strings.Contains(out.String(), "activities/"+playID+".md") {
			t.Fatal(out.String())
		}
	}
	for _, p := range []string{proof, filepath.Join(root, "nao")} {
		if _, err := os.Stat(p); !os.IsNotExist(err) {
			t.Fatalf("texto virou comando: %s existe", p)
		}
	}
}

func TestPlayRefusesEverythingElse(t *testing.T) {
	root, bin, _ := playProject(t)
	opened := fakeOpen(t)
	cases := [][]string{
		nil,
		{"claude"},
		{"claude", playID, "--dangerously-skip-permissions"},
		{"gemini", playID, "--yolo"},
		{"--dangerously-skip-permissions", playID},
		{"sh", playID},
		{"/bin/sh", playID},
		{"Claude", playID},
		{"claude", "--help"},
		{"claude", "../" + playID},
		{"claude", playID + "; touch x"},
		{"claude", playID + "\n"},
		{"claude", "00000000-0000-4000-8000-000000000000"}, // não existe
	}
	for _, args := range cases {
		if err := Play(root, args, &strings.Builder{}); err == nil {
			t.Errorf("aceitou %q", args)
		}
	}
	if err := os.Remove(filepath.Join(bin, "gemini")); err != nil {
		t.Fatal(err)
	}
	if err := Play(root, []string{"gemini", playID}, &strings.Builder{}); err == nil || !strings.Contains(err.Error(), "Gemini não encontrado") {
		t.Errorf("sem o binário: %v", err)
	}
	if len(*opened) != 0 {
		t.Fatalf("abriu terminal: %+v", *opened)
	}
}

func TestPromptHasNoShellSurprises(t *testing.T) {
	if strings.ContainsAny(playPrompt(playID), "\"'`$\\\n%!&|<>^;") || strings.HasPrefix(playPrompt(playID), "-") {
		t.Fatal(playPrompt(playID))
	}
}

func TestResolvePlay(t *testing.T) {
	self, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	got, err := resolve("/projeto", p.Command{Program: "plans-play", Args: []string{"claude", playID}, Cwd: "outra"})
	if err != nil || got.Program != self || got.Cwd != "" || !slices.Equal(got.Args, []string{"play", "--dir", "/projeto", "--", "claude", playID}) {
		t.Fatalf("%+v %v", got, err)
	}
	if _, err := resolve("/projeto", p.Command{Program: "plans-play", Args: []string{"claude", playID, "--yolo"}}); err == nil {
		t.Fatal("aceitou argumento a mais")
	}
	other := p.Command{Program: "git", Args: []string{"status"}}
	if got, err := resolve("/projeto", other); err != nil || got.Program != "git" || !slices.Equal(got.Args, other.Args) {
		t.Fatalf("%+v %v", got, err)
	}
}
