//go:build linux

package service

import (
	"errors"
	"fmt"
	"maps"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
)

const unitName = "plans-client.service"

func unitPath() (string, error) {
	base, err := os.UserConfigDir()
	return filepath.Join(base, "systemd", "user", unitName), err
}

func systemctl(args ...string) error {
	if out, err := exec.Command("systemctl", append([]string{"--user"}, args...)...).CombinedOutput(); err != nil {
		return fmt.Errorf("systemctl: %s", out)
	}
	return nil
}

func Start(o Options) error {
	p, err := unitPath()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
		return err
	}
	if err := os.WriteFile(p, []byte(systemdUnit(o, slices.Sorted(maps.Keys(o.Env)))), 0o600); err != nil {
		return err
	}
	if err := systemctl("daemon-reload"); err != nil {
		return err
	}
	if err := systemctl("enable", unitName); err != nil {
		return err
	}
	return systemctl("restart", unitName)
}

func Stop() error {
	p, err := unitPath()
	if err != nil {
		return err
	}
	_ = systemctl("disable", "--now", unitName)
	if err := os.Remove(p); err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	return systemctl("daemon-reload")
}

func Running() bool { return systemctl("is-active", "--quiet", unitName) == nil }
