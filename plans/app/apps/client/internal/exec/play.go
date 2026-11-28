// Play: abre um terminal à parte com uma IA trabalhando numa atividade do projeto.
//
// O front só escolhe a IA (de uma lista fechada) e o id da atividade. O programa, o texto do pedido e as
// opções são fixos aqui: título e descrição do cartão nunca entram numa linha de comando.

package exec

import (
	"errors"
	"fmt"
	"io"
	"os"
	osexec "os/exec"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/laerciogermano/plans-client/internal/protocol"
)

// PlayProgram é o nome reservado que o front pede. Nunca é procurado no PATH: o client o atende com "plans-client play".
const PlayProgram = "plans-play"

type playAgent struct {
	name string
	// args monta os argumentos: sessão interativa já com o pedido, sem opções que pulem as permissões da IA
	args func(prompt string) []string
}

var playAgents = map[string]playAgent{
	"claude": {name: "Claude", args: func(p string) []string { return []string{p} }},
	"gemini": {name: "Gemini", args: func(p string) []string { return []string{"--prompt-interactive", p} }},
}

var activityID = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`)

// CheckPlay exige exatamente uma IA conhecida e o id de uma atividade.
func CheckPlay(args []string) error {
	if len(args) != 2 {
		return errors.New("uso: " + PlayProgram + " <claude|gemini> <id da atividade>")
	}
	if _, ok := playAgents[args[0]]; !ok {
		return fmt.Errorf("IA não suportada: %q (use claude ou gemini)", args[0])
	}
	if !activityID.MatchString(args[1]) {
		return errors.New("id de atividade inválido")
	}
	return nil
}

// playPrompt é o pedido entregue à IA. Só o id (já validado) varia.
func playPrompt(id string) string {
	return "Execute a atividade do arquivo activities/" + id + ".md desta pasta, um projeto do app Plans. " +
		"Antes de começar, leia o arquivo da atividade (o bloco SYSTEM PROMPT no topo é o snapshot das instruções), " +
		"as atividades acima dela (campo parent) e os anexos em attachments/" + id + "/, se houver. " +
		"Siga o SYSTEM PROMPT embutido no arquivo da atividade, " +
		"grave o que produzir em attachments/" + id + "/output/ e um resumo da entrega em um arquivo .md novo em comments/" + id + "/."
}

// playSession é o que será aberto no terminal.
type playSession struct {
	Binary string   // caminho absoluto da IA
	Args   []string // argumentos, já separados
	Dir    string   // pasta do projeto
	Path   string   // PATH do client, para a IA achar o que precisa
}

// openWindow abre a sessão numa janela de terminal nova. Trocado nos testes.
var openWindow = openTerminal

// Play valida o pedido e abre o terminal. Não espera a IA terminar.
func Play(root string, args []string, out io.Writer) error {
	if err := CheckPlay(args); err != nil {
		return err
	}
	who, id := playAgents[args[0]], args[1]
	dir, err := filepath.Abs(root)
	if err != nil {
		return err
	}
	file := "activities/" + id + ".md"
	if info, err := os.Stat(filepath.Join(dir, "activities", id+".md")); err != nil || !info.Mode().IsRegular() {
		return fmt.Errorf("atividade não encontrada na pasta do projeto: %s", file)
	}
	binary, err := osexec.LookPath(args[0])
	if err == nil {
		binary, err = filepath.Abs(binary)
	}
	if err != nil {
		return fmt.Errorf("%s não encontrado no PATH do client: instale o comando %q e rode o client de novo", who.name, args[0])
	}
	if err := openWindow(playSession{Binary: binary, Args: who.args(playPrompt(id)), Dir: dir, Path: os.Getenv("PATH")}); err != nil {
		return fmt.Errorf("não abriu o terminal: %w", err)
	}
	fmt.Fprintf(out, "Terminal aberto: %s trabalhando em %s. Acompanhe e aprove as ações por lá.\n", who.name, file)
	return nil
}

// quote cita para um shell POSIX: dentro de aspas simples nada é interpretado.
func quote(s string) string { return "'" + strings.ReplaceAll(s, "'", `'\''`) + "'" }

// playScript é o arquivo que o terminal executa. Ele se apaga ao começar.
func playScript(s playSession) string {
	line := []string{"exec", quote(s.Binary)}
	for _, a := range s.Args {
		line = append(line, quote(a))
	}
	return "#!/bin/sh\n" +
		`rm -f -- "$0"; rmdir -- "$(dirname -- "$0")" 2>/dev/null` + "\n" +
		"export PATH=" + quote(s.Path) + "\n" +
		"cd -- " + quote(s.Dir) + " || exit 1\n" +
		strings.Join(line, " ") + "\n"
}

// writeScript grava o arquivo fora da pasta do projeto, numa pasta temporária que só a pessoa acessa.
func writeScript(s playSession, name string) (string, error) {
	tmp, err := os.MkdirTemp("", "plans-play-")
	if err != nil {
		return "", err
	}
	file := filepath.Join(tmp, name)
	if err := os.WriteFile(file, []byte(playScript(s)), 0o700); err != nil {
		_ = os.RemoveAll(tmp)
		return "", err
	}
	return file, nil
}

// resolve troca o programa reservado do play por este próprio client ("plans-client play").
// Assim nada no PATH nem na pasta do projeto consegue tomar o lugar dele; a subpasta pedida é ignorada.
func resolve(root string, c protocol.Command) (protocol.Command, error) {
	if c.Program != PlayProgram {
		return c, nil
	}
	if err := CheckPlay(c.Args); err != nil {
		return c, err
	}
	self, err := os.Executable()
	if err != nil {
		return c, err
	}
	return protocol.Command{Program: self, Args: append([]string{"play", "--dir", root, "--"}, c.Args...)}, nil
}
