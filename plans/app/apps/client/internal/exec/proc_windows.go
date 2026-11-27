//go:build windows

package exec

import (
	"context"
	"errors"
	"fmt"
	osexec "os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"

	"golang.org/x/sys/windows"

	"github.com/laerciogermano/plans-client/internal/protocol"
)

// Shells lista os shells disponíveis.
func Shells() []string {
	out := []string{}
	for _, s := range []string{"cmd", "powershell", "pwsh"} {
		if _, err := osexec.LookPath(s); err == nil {
			out = append(out, s)
		}
	}
	return out
}

// IsElevated informa se o processo roda como Administrador.
func IsElevated() bool { return windows.GetCurrentProcessToken().IsElevated() }

func build(ctx context.Context, root string, c protocol.Command) (*osexec.Cmd, error) {
	dir, err := ResolveDir(root, c.Cwd)
	if err != nil {
		return nil, err
	}
	var cmd *osexec.Cmd
	attr := &syscall.SysProcAttr{CreationFlags: syscall.CREATE_NEW_PROCESS_GROUP}
	switch {
	case c.Script != "" && c.Shell == "cmd":
		cmd = osexec.CommandContext(ctx, "cmd.exe")
		attr.CmdLine = `cmd.exe /d /s /c "` + c.Script + `"`
	case c.Script != "" && (c.Shell == "powershell" || c.Shell == "pwsh"):
		cmd = osexec.CommandContext(ctx, c.Shell, "-NoProfile", "-NonInteractive", "-Command", c.Script)
	case c.Script != "":
		return nil, fmt.Errorf("shell não suportado: %q", c.Shell)
	default:
		cmd = osexec.CommandContext(ctx, c.Program, c.Args...)
		// .cmd e .bat passam pelo cmd.exe, que reinterpreta os argumentos: recusa os caracteres perigosos
		ext := strings.ToLower(filepath.Ext(cmd.Path))
		if (ext == ".cmd" || ext == ".bat") && strings.ContainsAny(strings.Join(c.Args, ""), "&|<>^%!\"\r\n") {
			return nil, errors.New("argumento com caractere não permitido para arquivos .cmd/.bat")
		}
	}
	cmd.Dir = dir
	cmd.SysProcAttr = attr
	cmd.Cancel = func() error {
		return osexec.Command("taskkill", "/T", "/F", "/PID", strconv.Itoa(cmd.Process.Pid)).Run()
	}
	return cmd, nil
}
