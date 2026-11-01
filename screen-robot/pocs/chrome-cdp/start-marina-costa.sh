#!/usr/bin/env bash
# Chrome isolado: Marina Costa / LinkedIn (CDP :9224)
exec "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --user-data-dir="$HOME/chrome-profiles/marina-costa" \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9224 \
  --remote-allow-origins='*' \
  --no-first-run \
  --no-default-browser-check \
  "$@"
