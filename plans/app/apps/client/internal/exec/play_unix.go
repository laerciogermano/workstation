//go:build !windows && !darwin

package exec

import (
	"errors"
	"os"
	osexec "os/exec"
	"path/filepath"
	"syscall"
)

// terminals são tentados em ordem; o que vem antes do arquivo é como cada um recebe um programa.
var terminals = [][]string{
	{"x-terminal-emulator", "-e"},
	{"gnome-terminal", "--"},
	{"konsole", "-e"},
	{"xfce4-terminal", "-x"},
	{"xterm", "-e"},
}

func openTerminal(s playSession) error {
	if os.Getenv("DISPLAY") == "" && os.Getenv("WAYLAND_DISPLAY") == "" {
		return errors.New("sem ambiente gráfico: rode \"plans-client run\" num terminal da sua sessão")
	}
	for _, t := range terminals {
		bin, err := osexec.LookPath(t[0])
		if err != nil {
			continue
		}
		file, err := writeScript(s, "play.sh")
		if err != nil {
			return err
		}
		cmd := osexec.Command(bin, append(t[1:len(t):len(t)], file)...)
		// sessão própria e sem a saída do client: o terminal continua depois deste processo
		cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}
		if err := cmd.Start(); err != nil {
			_ = os.RemoveAll(filepath.Dir(file))
			return err
		}
		return cmd.Process.Release()
	}
	return errors.New("nenhum emulador de terminal encontrado")
}
