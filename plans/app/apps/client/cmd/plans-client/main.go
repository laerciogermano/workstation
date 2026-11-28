// plans-client: conecta ao hub do Plans, recebe comandos e executa o que a pessoa liberou.
package main

import (
	"bufio"
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"log/slog"
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"syscall"

	"github.com/laerciogermano/plans-client/internal/config"
	"github.com/laerciogermano/plans-client/internal/connection"
	"github.com/laerciogermano/plans-client/internal/exec"
	"github.com/laerciogermano/plans-client/internal/policy"
	"github.com/laerciogermano/plans-client/internal/protocol"
	"github.com/laerciogermano/plans-client/internal/service"
)

var version = "0.2.0"

const defaultHub = "wss://plans.laerciogermano.com/ws"

const usage = `plans-client — executa na sua máquina os comandos pedidos pelo Plans

  plans-client pair <código> --dir <pasta> [--hub <url>]   liga este computador a um projeto
  plans-client run [--no-prompt]                          conecta e pergunta antes de comandos novos
  plans-client allow -- <programa> [argumentos]           libera um comando exato
  plans-client allow --any-args -- <programa>             libera o programa com quaisquer argumentos
  plans-client allow --script <texto> [--shell <nome>]    libera um script exato
  plans-client allow --list | --clear                     mostra ou apaga as liberações
  plans-client play <claude|gemini> <id da atividade>     abre um terminal com a IA na atividade
  plans-client allow --any-args -- plans-play             libera o botão play em qualquer atividade
  plans-client start | stop                               liga ou desliga o início junto com o login
  plans-client status                                     mostra o pareamento
  plans-client unpair                                     apaga o pareamento e as liberações
  plans-client version
`

func main() {
	if err := dispatch(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, "erro:", err)
		os.Exit(1)
	}
}

func dispatch(args []string) error {
	if len(args) == 0 {
		fmt.Print(usage)
		return nil
	}
	name, rest := args[0], args[1:]
	if exec.IsElevated() && name != "version" && name != "help" {
		return errors.New("não rode o client como root ou Administrador")
	}
	switch name {
	case "pair":
		return pair(rest)
	case "run":
		return run(rest)
	case "allow":
		return allow(rest)
	case "play":
		return playActivity(rest)
	case "start":
		return start()
	case "stop":
		return service.Stop()
	case "status":
		return status()
	case "unpair":
		_ = service.Stop()
		return config.Delete()
	case "version", "--version":
		fmt.Println(version)
		return nil
	case "help", "--help", "-h":
		fmt.Print(usage)
		return nil
	}
	return fmt.Errorf("comando desconhecido: %s (use plans-client help)", name)
}

func expand(path string) (string, error) {
	if path == "~" || strings.HasPrefix(path, "~/") || strings.HasPrefix(path, `~\`) {
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		path = filepath.Join(home, path[1:])
	}
	return filepath.Abs(path)
}

func pair(args []string) error {
	if len(args) == 0 || strings.HasPrefix(args[0], "-") {
		return errors.New("uso: plans-client pair <código> --dir <pasta>")
	}
	code := args[0]
	fs := flag.NewFlagSet("pair", flag.ContinueOnError)
	dir := fs.String("dir", "", "pasta do projeto")
	hub := fs.String("hub", defaultHub, "endereço do hub")
	if err := fs.Parse(args[1:]); err != nil {
		return err
	}
	if _, err := protocol.DecodeCode(code); err != nil {
		return err
	}
	if err := connection.CheckHub(*hub); err != nil {
		return err
	}
	if *dir == "" {
		return errors.New("informe a pasta com --dir")
	}
	abs, err := expand(*dir)
	if err != nil {
		return err
	}
	project, err := config.ReadProject(abs)
	if err != nil {
		return err
	}
	next := config.Config{Hub: *hub, Code: code, Dir: abs, Allow: []policy.Rule{}}
	// repetir o pareamento da mesma pasta mantém as liberações
	if old, err := config.Load(); err == nil && old.Dir == abs {
		next.Allow = old.Allow
	}
	if err := config.Save(next); err != nil {
		return err
	}
	fmt.Printf("Pareado com o projeto %q em %s\nAgora rode: plans-client run\n", project.Name, abs)
	return nil
}

type terminal struct {
	mu    sync.Mutex
	lines chan string
}

func newTerminal() *terminal {
	t := &terminal{lines: make(chan string)}
	go func() {
		s := bufio.NewScanner(os.Stdin)
		for s.Scan() {
			t.lines <- s.Text()
		}
		close(t.lines)
	}()
	return t
}

func (t *terminal) Ask(description string) connection.Answer {
	t.mu.Lock()
	defer t.mu.Unlock()
	// descarta o que foi digitado antes da pergunta
	for drained := false; !drained; {
		select {
		case _, ok := <-t.lines:
			drained = !ok
		default:
			drained = true
		}
	}
	fmt.Printf("\n  O Plans quer executar:\n    %s\n  [u] uma vez   [s] sempre   [n] negar (padrão): ", description)
	switch strings.ToLower(strings.TrimSpace(<-t.lines)) {
	case "u":
		return connection.Once
	case "s":
		return connection.Always
	}
	return connection.Deny
}

func run(args []string) error {
	fs := flag.NewFlagSet("run", flag.ContinueOnError)
	noPrompt := fs.Bool("no-prompt", false, "recusa comandos não liberados sem perguntar")
	logFile := fs.String("log", "", "grava o log neste arquivo")
	if err := fs.Parse(args); err != nil {
		return err
	}
	var out io.Writer = os.Stderr
	if *logFile != "" {
		f, err := os.OpenFile(*logFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o600)
		if err != nil {
			return err
		}
		defer f.Close()
		out = f
	}
	agent := &connection.Agent{Log: slog.New(slog.NewTextHandler(out, nil)), Version: version}
	if info, err := os.Stdin.Stat(); !*noPrompt && err == nil && info.Mode()&os.ModeCharDevice != 0 {
		agent.Prompter = newTerminal()
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	return agent.Run(ctx)
}

func allow(args []string) error {
	fs := flag.NewFlagSet("allow", flag.ContinueOnError)
	anyArgs := fs.Bool("any-args", false, "libera o programa com quaisquer argumentos")
	script := fs.String("script", "", "script exato")
	shell := fs.String("shell", policy.DefaultShell(), "shell do script")
	list := fs.Bool("list", false, "mostra as liberações")
	clear := fs.Bool("clear", false, "apaga as liberações")
	if err := fs.Parse(args); err != nil {
		return err
	}
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	switch {
	case *list:
		if len(cfg.Allow) == 0 {
			fmt.Println("Nada liberado.")
		}
		for _, r := range cfg.Allow {
			suffix := ""
			if r.AnyArgs {
				suffix = " (quaisquer argumentos)"
			}
			fmt.Println(" -", policy.Describe(protocol.Command{Program: r.Program, Args: r.Args, Script: r.Script, Shell: r.Shell})+suffix)
		}
		return nil
	case *clear:
		cfg.Allow = []policy.Rule{}
		return config.Save(cfg)
	}
	cmd := protocol.Command{Script: *script}
	if *script != "" {
		cmd.Shell = *shell
		if fs.NArg() > 0 {
			return errors.New("use --script ou -- <programa>, não os dois")
		}
	} else {
		if fs.NArg() == 0 {
			return errors.New("uso: plans-client allow -- <programa> [argumentos]")
		}
		cmd.Program, cmd.Args = fs.Arg(0), fs.Args()[1:]
	}
	cmd, err = policy.Normalize(cmd)
	if err != nil {
		return err
	}
	rule := policy.RuleFor(cmd)
	if *anyArgs {
		if cmd.Program == "" || len(cmd.Args) > 0 {
			return errors.New("--any-args vale para um programa sem argumentos")
		}
		rule.AnyArgs = true
	}
	cfg.Allow = policy.Add(cfg.Allow, rule)
	if err := config.Save(cfg); err != nil {
		return err
	}
	fmt.Println("Liberado:", policy.Describe(cmd))
	return nil
}

// playActivity abre o terminal com a IA. É o que o client chama quando o front pede "plans-play".
func playActivity(args []string) error {
	fs := flag.NewFlagSet("play", flag.ContinueOnError)
	dir := fs.String("dir", "", "pasta do projeto (padrão: a pareada)")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if *dir == "" {
		cfg, err := config.Load()
		if err != nil {
			return err
		}
		*dir = cfg.Dir
	}
	return exec.Play(*dir, fs.Args(), os.Stdout)
}

func start() error {
	if _, err := config.Load(); err != nil {
		return err
	}
	binary, err := os.Executable()
	if err != nil {
		return err
	}
	dir, err := config.Dir()
	if err != nil {
		return err
	}
	env := map[string]string{"PATH": os.Getenv("PATH")}
	if v := os.Getenv("PLANS_CONFIG_DIR"); v != "" {
		env["PLANS_CONFIG_DIR"] = v
	}
	if err := service.Start(service.Options{Binary: binary, Log: filepath.Join(dir, "client.log"), Env: env}); err != nil {
		return err
	}
	fmt.Println("O client agora inicia junto com o login. Para desligar: plans-client stop")
	return nil
}

func status() error {
	fmt.Printf("plans-client %s (%s/%s)\n", version, runtime.GOOS, runtime.GOARCH)
	cfg, err := config.Load()
	if errors.Is(err, config.ErrNotPaired) {
		fmt.Println("Não pareado.")
		return nil
	}
	if err != nil {
		return err
	}
	name := "(pasta sem projeto)"
	if p, err := config.ReadProject(cfg.Dir); err == nil {
		name = p.Name
	}
	fmt.Printf("Projeto:    %s\nPasta:      %s\nHub:        %s\nLiberações: %d\nNo login:   %v\n", name, cfg.Dir, cfg.Hub, len(cfg.Allow), service.Running())
	return nil
}
