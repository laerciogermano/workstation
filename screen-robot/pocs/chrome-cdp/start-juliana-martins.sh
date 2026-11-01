#!/usr/bin/env bash
# Chrome isolado: Juliana Martins / LinkedIn (CDP :9228)
exec "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --user-data-dir="$HOME/chrome-profiles/juliana-martins" \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9228 \
  --remote-allow-origins='*' \
  --no-first-run \
  --no-default-browser-check \
  "$@"
