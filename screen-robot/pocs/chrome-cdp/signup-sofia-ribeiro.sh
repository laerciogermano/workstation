#!/usr/bin/env bash
# Chrome Sofia (:9226) + cadastro LI autonomo via CDP.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
CDP_URL="${CDP_URL:-http://127.0.0.1:9226}"

if ! curl -sf "$CDP_URL/json/version" >/dev/null 2>&1; then
  mkdir -p "$HOME/chrome-profiles/sofia-ribeiro"
  nohup "$DIR/start-sofia-ribeiro.sh" "https://www.linkedin.com/signup" >/tmp/chrome-sofia-ribeiro.log 2>&1 &
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
exec node "$DIR/linkedin-signup-cdp.mjs" \
  --email "sofia.ribeiro@clozzy.com.br" \
  --password "in@12345678" \
  --first "Sofia" \
  --last "Ribeiro" \
  --job "Especialista em suprimentos e itens corporativos" \
  --company "ConectMax" \
  --location "São Paulo, Brasil" \
  "$@"
