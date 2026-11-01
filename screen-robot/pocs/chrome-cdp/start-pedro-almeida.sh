#!/usr/bin/env bash
# Chrome isolado: Pedro Almeida / LinkedIn (CDP :9227)
exec "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --user-data-dir="$HOME/chrome-profiles/pedro-almeida" \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9227 \
  --remote-allow-origins='*' \
  --no-first-run \
  --no-default-browser-check \
  "$@"
