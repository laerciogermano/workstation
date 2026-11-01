#!/usr/bin/env bash
# Chrome Pedro (:9227) + cadastro LI so ate confirmar e-mail; depois probe /feed/.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
CDP_URL="${CDP_URL:-http://127.0.0.1:9227}"

if ! curl -sf "$CDP_URL/json/version" >/dev/null 2>&1; then
  mkdir -p "$HOME/chrome-profiles/pedro-almeida"
  nohup "$DIR/start-pedro-almeida.sh" "https://www.linkedin.com/signup" >/tmp/chrome-pedro-almeida.log 2>&1 &
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
exec node "$DIR/linkedin-signup-until-email-cdp.mjs" \
  --email "pedro.almeida@clozzy.com.br" \
  --password "in@12345678" \
  --first "Pedro" \
  --last "Almeida" \
  "$@"
