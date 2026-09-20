#!/usr/bin/env bash
# Compat: delega para o view canônico em screen-robot/src/scripts.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_docker.sh"

if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a
  source .env
  set +a
fi

HOST="${ADB_HOST:-127.0.0.1}"
PORT="${ADB_PORT:-5555}"
export ANDROID_SERIAL="${ANDROID_SERIAL:-${HOST}:${PORT}}"

VIEW_SRC="$(cd "$SCRIPT_DIR/../../../src/scripts" && pwd)/view.sh"
if [[ ! -x "$VIEW_SRC" ]]; then
  echo "Erro: view canônico não encontrado: ${VIEW_SRC}"
  exit 1
fi

if ! docker compose ps --status running --services 2>/dev/null | grep -q redroid; then
  echo "Aviso: container redroid não listado como running. Tentando scrcpy mesmo assim…"
fi

exec "$VIEW_SRC" --device "${ANDROID_SERIAL}"
