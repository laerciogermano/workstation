// Package policy decide o que o client pode executar. Nada é liberado por padrão.
package policy

import (
	"errors"
	"runtime"
	"slices"
	"strconv"
	"strings"
	"unicode"

	"github.com/laerciogermano/plans-client/internal/protocol"
)

// Rule libera um comando exato, um programa com quaisquer argumentos, ou um script exato num shell.
type Rule struct {
	Program string   `json:"program,omitempty"`
	Args    []string `json:"args,omitempty"`
	AnyArgs bool     `json:"anyArgs,omitempty"`
	Script  string   `json:"script,omitempty"`
	Shell   string   `json:"shell,omitempty"`
}

func DefaultShell() string {
	if runtime.GOOS == "windows" {
		return "cmd"
	}
	return "sh"
}

// Normalize valida o pedido e preenche o shell padrão.
func Normalize(c protocol.Command) (protocol.Command, error) {
	switch {
	case (c.Program == "") == (c.Script == ""):
		return c, errors.New("informe um programa ou um script, não os dois")
	case c.Script != "" && len(c.Args) > 0:
		return c, errors.New("script não aceita lista de argumentos")
	case c.Program != "" && c.Shell != "":
		return c, errors.New("shell só vale para script")
	case strings.ContainsRune(c.Program+c.Script+strings.Join(c.Args, ""), 0):
		return c, errors.New("caractere nulo no comando")
	}
	if c.Script != "" && c.Shell == "" {
		c.Shell = DefaultShell()
	}
	return c, nil
}

func Allowed(rules []Rule, c protocol.Command) bool {
	return slices.ContainsFunc(rules, func(r Rule) bool {
		if c.Script != "" {
			return r.Script == c.Script && r.Shell == c.Shell
		}
		return r.Program != "" && r.Program == c.Program && (r.AnyArgs || slices.Equal(r.Args, c.Args))
	})
}

func RuleFor(c protocol.Command) Rule {
	if c.Script != "" {
		return Rule{Script: c.Script, Shell: c.Shell}
	}
	return Rule{Program: c.Program, Args: slices.Clone(c.Args)}
}

func Add(rules []Rule, r Rule) []Rule {
	same := func(o Rule) bool {
		return o.Program == r.Program && o.AnyArgs == r.AnyArgs && o.Script == r.Script && o.Shell == r.Shell && slices.Equal(o.Args, r.Args)
	}
	if slices.ContainsFunc(rules, same) {
		return rules
	}
	return append(rules, r)
}

// Describe mostra o comando no terminal sem deixar caracteres de controle enganarem quem aprova.
func Describe(c protocol.Command) string {
	var s string
	if c.Script != "" {
		s = c.Shell + " script " + strconv.Quote(c.Script)
	} else {
		parts := []string{strconv.Quote(c.Program)}
		for _, a := range c.Args {
			parts = append(parts, strconv.Quote(a))
		}
		s = strings.Join(parts, " ")
	}
	if c.Cwd != "" {
		s += " (em " + strconv.Quote(c.Cwd) + ")"
	}
	return s
}

func plain(s string) bool {
	return s != "" && !strings.ContainsFunc(s, func(r rune) bool {
		return !(r < unicode.MaxASCII && (unicode.IsLetter(r) || unicode.IsDigit(r) || strings.ContainsRune("-_./:=@+,", r)))
	})
}

// AllowCommand monta o comando que a pessoa pode colar para liberar o pedido.
// Devolve "" quando não há como citar com segurança (a pessoa aprova então com "plans-client run").
func AllowCommand(c protocol.Command, goos string) string {
	all := append([]string{c.Program, c.Script, c.Shell}, c.Args...)
	for _, s := range all {
		if strings.ContainsFunc(s, func(r rune) bool { return !unicode.IsPrint(r) }) {
			return ""
		}
	}
	ok := true
	quote := func(s string) string {
		if plain(s) {
			return s
		}
		if goos == "windows" { // cmd e PowerShell não têm uma citação segura em comum
			ok = false
		}
		return "'" + strings.ReplaceAll(s, "'", `'\''`) + "'"
	}
	var parts []string
	if c.Script != "" {
		parts = []string{"plans-client", "allow", "--shell", quote(c.Shell), "--script", quote(c.Script)}
	} else {
		parts = []string{"plans-client", "allow", "--", quote(c.Program)}
		for _, a := range c.Args {
			parts = append(parts, quote(a))
		}
	}
	if !ok {
		return ""
	}
	return strings.Join(parts, " ")
}
