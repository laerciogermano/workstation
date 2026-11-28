package exec

import (
	"fmt"
	"os"
	osexec "os/exec"
	"path/filepath"
	"strings"
)

// openTerminal abre uma janela do Terminal. "open" não passa pelo AppleScript: não pede permissão de automação.
func openTerminal(s playSession) error {
	file, err := writeScript(s, "play.command")
	if err != nil {
		return err
	}
	if out, err := osexec.Command("/usr/bin/open", "-a", "Terminal", file).CombinedOutput(); err != nil {
		_ = os.RemoveAll(filepath.Dir(file))
		return fmt.Errorf("%w: %s", err, strings.TrimSpace(string(out)))
	}
	return nil
}
