#!/usr/bin/env bash
# Chrome isolado: Camila Ferreira / LinkedIn (CDP :9229)
exec "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --user-data-dir="$HOME/chrome-profiles/camila-ferreira" \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9229 \
  --remote-allow-origins='*' \
  --no-first-run \
  --no-default-browser-check \
  "$@"
