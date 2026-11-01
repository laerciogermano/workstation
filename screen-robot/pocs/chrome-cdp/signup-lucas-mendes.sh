#!/usr/bin/env bash
# Chrome Lucas (:9225) + cadastro LI autonomo via CDP.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
CDP_URL="${CDP_URL:-http://127.0.0.1:9225}"

if ! curl -sf "$CDP_URL/json/version" >/dev/null 2>&1; then
  mkdir -p "$HOME/chrome-profiles/lucas-mendes"
  nohup "$DIR/start-lucas-mendes.sh" "https://www.linkedin.com/signup" >/tmp/chrome-lucas-mendes.log 2>&1 &
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
  --email "lucas.mendes@clozzy.com.br" \
  --password "in@12345678" \
  --first "Lucas" \
  --last "Mendes" \
  --job "Especialista em suprimentos e itens corporativos" \
  --company "ConectMax" \
  --location "São Paulo, Brasil" \
  "$@"
