#!/usr/bin/env bash
# Chrome Bruno (:9237) + cadastro LI autonomo via CDP (fingerprint Mac130 Fortaleza).
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
CDP_URL="${CDP_URL:-http://127.0.0.1:9237}"
HC="$DIR/human-cdp"

if ! curl -sf "$CDP_URL/json/version" >/dev/null 2>&1; then
  (cd "$HC" && node --input-type=module -e "import { startCdp } from './src/index.mjs'; await startCdp('bruno-nunes', { url: 'https://www.linkedin.com/signup' });") \
    >/tmp/chrome-bruno-nunes.log 2>&1
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
  --email "bruno.nunes@clozzy.com.br" \
  --password "in@12345678" \
  --first "Bruno" \
  --last "Nunes" \
  --job "Especialista em suprimentos e itens corporativos" \
  --company "ConectMax" \
  --location "Fortaleza, Brasil" \
  "$@"
