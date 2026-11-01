#!/usr/bin/env bash
# Sobe Chrome Marina (:9224) e chama o signup com as entradas da conta.
# Override: passe --location / --job / --company / --code / etc. depois.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
CDP_URL="${CDP_URL:-http://127.0.0.1:9224}"

if ! curl -sf "$CDP_URL/json/version" >/dev/null 2>&1; then
  mkdir -p "$HOME/chrome-profiles/marina-costa"
  nohup "$DIR/start-marina-costa.sh" "https://www.linkedin.com/signup" >/tmp/chrome-marina-costa.log 2>&1 &
  for _ in $(seq 1 30); do
    curl -sf "$CDP_URL/json/version" >/dev/null 2>&1 && break
    sleep 0.5
  done
fi

export CDP_URL
exec node "$DIR/linkedin-signup-cdp.mjs" \
  --email "marina.costa@clozzy.com.br" \
  --password "in@12345678" \
  --first "Marina" \
  --last "Costa" \
  --job "Especialista em suprimentos e itens corporativos" \
  --company "ConectMax" \
  "$@"
