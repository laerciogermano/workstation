#!/usr/bin/env bash
# Chrome isolado: Sofia Ribeiro / LinkedIn (CDP :9226)
exec "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --user-data-dir="$HOME/chrome-profiles/sofia-ribeiro" \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9226 \
  --remote-allow-origins='*' \
  --no-first-run \
  --no-default-browser-check \
  "$@"
