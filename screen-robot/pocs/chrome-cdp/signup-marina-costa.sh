#!/usr/bin/env bash
# Sobe Chrome Marina (:9224) se preciso e roda o cadastro LinkedIn via CDP.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
CDP_URL="${CDP_URL:-http://127.0.0.1:9224}"
PORT="${CDP_URL##*:}"

if ! curl -sf "$CDP_URL/json/version" >/dev/null 2>&1; then
  echo "Chrome Marina offline — subindo :$PORT…"
  mkdir -p "$HOME/chrome-profiles/marina-costa"
  nohup "$DIR/start-marina-costa.sh" "https://www.linkedin.com/signup" >/tmp/chrome-marina-costa.log 2>&1 &
  for i in $(seq 1 30); do
    curl -sf "$CDP_URL/json/version" >/dev/null 2>&1 && break
    sleep 0.5
  done
  curl -sf "$CDP_URL/json/version" >/dev/null || {
    echo "falha ao subir Chrome CDP $CDP_URL" >&2
    exit 1
  }
fi

export CDP_URL
export LI_EMAIL="${LI_EMAIL:-marina.costa@clozzy.com.br}"
export LI_PASSWORD="${LI_PASSWORD:-in@12345678}"
export LI_FIRST="${LI_FIRST:-Marina}"
export LI_LAST="${LI_LAST:-Costa}"

exec node "$DIR/linkedin-signup-cdp.mjs" "$@"
