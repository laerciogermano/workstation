#!/usr/bin/env bash
# Chrome isolado: Matheus ConectMax / LinkedIn (CDP :9267)
# Preferir: node -e "import { startCdp } from './human-cdp/src/index.mjs'; await startCdp('matheus-conectmax')"
# (aplica fingerprint). Este script só sobe o binário se a meta/keeper não for usada.
exec "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --user-data-dir="$HOME/chrome-profiles/matheus-conectmax" \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9267 \
  --remote-allow-origins='*' \
  --no-first-run \
  --no-default-browser-check \
  "${@:-https://www.linkedin.com/login}"
