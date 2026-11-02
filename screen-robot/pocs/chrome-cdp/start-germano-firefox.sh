#!/usr/bin/env bash
# Firefox isolado: Germano (perfil ~/firefox-profiles/germano, remote :9231)
mkdir -p "$HOME/firefox-profiles/germano"
exec "/Applications/Firefox.app/Contents/MacOS/firefox" \
  -no-remote \
  -profile "$HOME/firefox-profiles/germano" \
  --remote-debugging-port=9231 \
  --remote-allow-hosts=127.0.0.1 \
  "$@"
