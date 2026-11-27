//go:build !windows

package exec

import (
	"context"
	"fmt"
	"os"
	osexec "os/exec"
	"slices"
	"syscall"
	"time"

	"github.com/laerciogermano/plans-client/internal/protocol"
)

var shellNames = []string{"sh", "bash", "zsh"}

// Shells lista os shells disponíveis.
func Shells() []string {
	out := []string{}
	for _, s := range shellNames {
		if _, err := osexec.LookPath(s); err == nil {
			out = append(out, s)
		}
	}
	return out
}

// IsElevated informa se o processo roda como root.
func IsElevated() bool { return os.Geteuid() == 0 }

func build(ctx context.Context, root string, c protocol.Command) (*osexec.Cmd, error) {
	dir, err := ResolveDir(root, c.Cwd)
	if err != nil {
		return nil, err
	}
	var cmd *osexec.Cmd
	if c.Script != "" {
		if !slices.Contains(shellNames, c.Shell) {
			return nil, fmt.Errorf("shell não suportado: %q", c.Shell)
		}
		cmd = osexec.CommandContext(ctx, c.Shell, "-c", c.Script)
	} else {
		cmd = osexec.CommandContext(ctx, c.Program, c.Args...)
	}
	cmd.Dir = dir
	// grupo próprio: cancelar encerra também os filhos
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	cmd.Cancel = func() error {
		pid := cmd.Process.Pid
		err := syscall.Kill(-pid, syscall.SIGTERM)
		time.AfterFunc(3*time.Second, func() { _ = syscall.Kill(-pid, syscall.SIGKILL) })
		return err
	}
	return cmd, nil
}
