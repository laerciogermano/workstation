#!/usr/bin/env bash
# Chrome Juliana (:9228) + confirma e-mail LI (PIN Mailcow).
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
CDP_URL="${CDP_URL:-http://127.0.0.1:9228}"

if ! curl -sf "$CDP_URL/json/version" >/dev/null 2>&1; then
  mkdir -p "$HOME/chrome-profiles/juliana-martins"
  nohup "$DIR/start-juliana-martins.sh" "https://www.linkedin.com/feed/" >/tmp/chrome-juliana-martins.log 2>&1 &
  for _ in $(seq 1 40); do
    curl -sf "$CDP_URL/json/version" >/dev/null 2>&1 && break
    sleep 0.5
  done
  curl -sf "$CDP_URL/json/version" >/dev/null || {
    echo "falha Chrome CDP $CDP_URL" >&2
    exit 1
  }
  sleep 2
fi

export CDP_URL
exec node "$DIR/linkedin-confirm-email-cdp.mjs" \
  --email "juliana.martins@clozzy.com.br" \
  --password "in@12345678" \
  "$@"
