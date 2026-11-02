#!/usr/bin/env bash
# Chrome Helena (:9235 via human-cdp) + cadastro LI autonomo via CDP.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
CDP_URL="${CDP_URL:-http://127.0.0.1:9235}"
ID=helena-duarte

if ! curl -sf "$CDP_URL/json/version" >/dev/null 2>&1; then
  (
    cd "$DIR/human-cdp"
    node --input-type=module -e "import { startCdp } from './src/index.mjs'; const s=await startCdp('$ID',{url:'https://www.linkedin.com/signup'}); console.log(JSON.stringify(s));"
  ) >/tmp/chrome-helena-duarte.log 2>&1
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
  --email "helena.duarte@clozzy.com.br" \
  --password "in@12345678" \
  --first "Helena" \
  --last "Duarte" \
  --job "Especialista em suprimentos e itens corporativos" \
  --company "ConectMax" \
  --location "Salvador, Brasil" \
  "$@"
