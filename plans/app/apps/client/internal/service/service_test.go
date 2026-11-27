package service

import (
	"strings"
	"testing"
)

func TestGeneratedFiles(t *testing.T) {
	o := Options{Binary: `/Users/a & b/plans-client`, Log: "/tmp/x.log", Env: map[string]string{"PATH": `/bin:$HOME/%x`}}
	plist := launchdPlist("l", o, []string{"PATH"})
	if !strings.Contains(plist, "/Users/a &amp; b/plans-client") || !strings.Contains(plist, "--no-prompt") {
		t.Fatal(plist)
	}
	unit := systemdUnit(o, []string{"PATH"})
	if !strings.Contains(unit, `Environment="PATH=/bin:$$HOME/%%x"`) || !strings.Contains(unit, `ExecStart="/Users/a & b/plans-client" run --no-prompt`) {
		t.Fatal(unit)
	}
}
