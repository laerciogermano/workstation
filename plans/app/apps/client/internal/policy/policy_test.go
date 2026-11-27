package policy

import (
	"strings"
	"testing"

	p "github.com/laerciogermano/plans-client/internal/protocol"
)

func TestAllowed(t *testing.T) {
	rules := []Rule{{Program: "npm", Args: []string{"test"}}, {Program: "git", AnyArgs: true}, {Script: "ls | wc -l", Shell: "sh"}}
	cases := []struct {
		c    p.Command
		want bool
	}{
		{p.Command{Program: "npm", Args: []string{"test"}}, true},
		{p.Command{Program: "npm", Args: []string{"test", "--", "x"}}, false},
		{p.Command{Program: "npm"}, false},
		{p.Command{Program: "/tmp/npm", Args: []string{"test"}}, false},
		{p.Command{Program: "git", Args: []string{"log"}}, true},
		{p.Command{Script: "ls | wc -l", Shell: "sh"}, true},
		{p.Command{Script: "ls | wc -l", Shell: "bash"}, false},
		{p.Command{Script: "ls | wc -l; rm -rf .", Shell: "sh"}, false},
		{p.Command{Program: "ls | wc -l"}, false},
	}
	for _, c := range cases {
		if got := Allowed(rules, c.c); got != c.want {
			t.Errorf("%+v: %v", c.c, got)
		}
	}
	if Allowed(nil, p.Command{Program: "ls"}) {
		t.Error("nada deve ser liberado por padrão")
	}
}

func TestNormalize(t *testing.T) {
	for _, c := range []p.Command{{}, {Program: "a", Script: "b"}, {Script: "b", Args: []string{"x"}}, {Program: "a", Shell: "sh"}, {Program: "a\x00"}} {
		if _, err := Normalize(c); err == nil {
			t.Errorf("aceitou %+v", c)
		}
	}
	if c, _ := Normalize(p.Command{Script: "x"}); c.Shell == "" {
		t.Error("sem shell padrão")
	}
}

func TestAllowCommandIsSafeToPaste(t *testing.T) {
	got := AllowCommand(p.Command{Program: "echo", Args: []string{"a'; rm -rf ~; '"}}, "linux")
	if want := `plans-client allow -- echo 'a'\''; rm -rf ~; '\'''`; got != want {
		t.Errorf("citação: %s", got)
	}
	if AllowCommand(p.Command{Program: "echo", Args: []string{"a\nrm -rf ~"}}, "linux") != "" {
		t.Error("sugeriu comando com quebra de linha")
	}
	if AllowCommand(p.Command{Program: "echo", Args: []string{"a & del x"}}, "windows") != "" {
		t.Error("sugeriu citação insegura no Windows")
	}
	if AllowCommand(p.Command{Program: "npm", Args: []string{"test"}}, "windows") != "plans-client allow -- npm test" {
		t.Error("comando simples deve ser sugerido")
	}
	if s := Describe(p.Command{Program: "ls", Args: []string{"\x1b[2Kfalso"}}); strings.ContainsRune(s, 0x1b) {
		t.Error("escape de terminal vazou")
	}
}
