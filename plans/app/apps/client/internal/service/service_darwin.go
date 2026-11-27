//go:build darwin

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

const label = "com.laerciogermano.plans-client"

func plistPath() (string, error) {
	home, err := os.UserHomeDir()
	return filepath.Join(home, "Library", "LaunchAgents", label+".plist"), err
}

func target() string { return fmt.Sprintf("gui/%d", os.Getuid()) }

func Start(o Options) error {
	p, err := plistPath()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
		return err
	}
	if err := os.WriteFile(p, []byte(launchdPlist(label, o, slices.Sorted(maps.Keys(o.Env)))), 0o600); err != nil {
		return err
	}
	_ = exec.Command("launchctl", "bootout", target()+"/"+label).Run()
	if out, err := exec.Command("launchctl", "bootstrap", target(), p).CombinedOutput(); err != nil {
		return fmt.Errorf("launchctl: %s", out)
	}
	return nil
}

func Stop() error {
	p, err := plistPath()
	if err != nil {
		return err
	}
	_ = exec.Command("launchctl", "bootout", target()+"/"+label).Run()
	if err := os.Remove(p); err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	return nil
}

func Running() bool { return exec.Command("launchctl", "print", target()+"/"+label).Run() == nil }
