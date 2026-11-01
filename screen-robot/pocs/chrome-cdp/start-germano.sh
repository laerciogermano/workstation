#!/usr/bin/env bash
# Chrome isolado: Germano (CDP :9230)
exec "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --user-data-dir="$HOME/chrome-profiles/germano" \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9230 \
  --remote-allow-origins='*' \
  --no-first-run \
  --no-default-browser-check \
  "$@"
