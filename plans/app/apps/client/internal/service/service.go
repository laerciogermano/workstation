// Package service inicia o client junto com o login, sempre como a própria pessoa (nunca como serviço do sistema).
package service

import (
	"encoding/xml"
	"strings"
)

type Options struct {
	Binary string
	Log    string
	// Env vai para o serviço: sem o PATH atual, comandos como npm não seriam encontrados.
	Env map[string]string
}

func xmlText(s string) string {
	var b strings.Builder
	_ = xml.EscapeText(&b, []byte(s))
	return b.String()
}

func launchdPlist(label string, o Options, keys []string) string {
	var env strings.Builder
	for _, k := range keys {
		env.WriteString("    <key>" + xmlText(k) + "</key><string>" + xmlText(o.Env[k]) + "</string>\n")
	}
	return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>` + label + `</string>
  <key>ProgramArguments</key>
  <array>
    <string>` + xmlText(o.Binary) + `</string>
    <string>run</string>
    <string>--no-prompt</string>
    <string>--log</string>
    <string>` + xmlText(o.Log) + `</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
` + env.String() + `  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><dict><key>SuccessfulExit</key><false/></dict>
</dict>
</plist>
`
}

// systemdQuote cita um valor para um arquivo de unidade ("%" e "$" são especiais).
func systemdQuote(s string) string {
	return `"` + strings.NewReplacer(`\`, `\\`, `"`, `\"`, `%`, `%%`, `$`, `$$`, "\n", " ").Replace(s) + `"`
}

func systemdUnit(o Options, keys []string) string {
	var env strings.Builder
	for _, k := range keys {
		env.WriteString("Environment=" + systemdQuote(k+"="+o.Env[k]) + "\n")
	}
	return `[Unit]
Description=Plans Client
After=network-online.target

[Service]
ExecStart=` + systemdQuote(o.Binary) + ` run --no-prompt --log ` + systemdQuote(o.Log) + `
` + env.String() + `Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
`
}
