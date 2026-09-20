#!/usr/bin/env bash
# Mostra status do container e dispositivos ADB.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_docker.sh"

echo "== docker compose =="
docker compose ps || true
echo
echo "== logs recentes =="
docker compose logs --tail=40 redroid 2>/dev/null || true
echo
if command -v adb >/dev/null 2>&1; then
  echo "== adb devices =="
  adb devices -l || true
fi
