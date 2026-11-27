//go:build windows

package service

import (
	"fmt"
	"os/exec"
	"strings"
)

const task = "PlansClient"

func schtasks(args ...string) error {
	if out, err := exec.Command("schtasks", args...).CombinedOutput(); err != nil {
		return fmt.Errorf("schtasks: %s", out)
	}
	return nil
}

// Start cria uma tarefa no login. Ela herda o ambiente da pessoa, por isso Env não é usado.
func Start(o Options) error {
	if strings.ContainsAny(o.Binary+o.Log, `"`) {
		return fmt.Errorf("caminho com aspas não suportado")
	}
	command := fmt.Sprintf(`"%s" run --no-prompt --log "%s"`, o.Binary, o.Log)
	if err := schtasks("/Create", "/F", "/SC", "ONLOGON", "/RL", "LIMITED", "/TN", task, "/TR", command); err != nil {
		return err
	}
	return schtasks("/Run", "/TN", task)
}

func Stop() error {
	_ = schtasks("/End", "/TN", task)
	if !Running() && schtasks("/Query", "/TN", task) != nil {
		return nil
	}
	return schtasks("/Delete", "/F", "/TN", task)
}

func Running() bool {
	out, err := exec.Command("schtasks", "/Query", "/TN", task, "/FO", "CSV", "/NH").Output()
	return err == nil && strings.Contains(string(out), "Running")
}
