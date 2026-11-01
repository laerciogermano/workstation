#!/usr/bin/env bash
# Chrome isolado: Lucas Mendes / LinkedIn (CDP :9225)
exec "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --user-data-dir="$HOME/chrome-profiles/lucas-mendes" \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9225 \
  --remote-allow-origins='*' \
  --no-first-run \
  --no-default-browser-check \
  "$@"
