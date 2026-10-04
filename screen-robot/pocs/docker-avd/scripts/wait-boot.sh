#!/usr/bin/env bash
# Espera ADB device + sys.boot_completed=1.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_docker.sh"

_docker_avd_apply_name

SERIAL="${ANDROID_SERIAL:-127.0.0.1:${ADB_PORT}}"
TIMEOUT_MS="${CONNECT_TIMEOUT_MS:-180000}"
DEADLINE=$(( $(date +%s) + TIMEOUT_MS / 1000 ))

echo "Aguardando ADB ${SERIAL}…"
while (( $(date +%s) < DEADLINE )); do
  adb connect "$SERIAL" >/dev/null 2>&1 || true
  state="$(adb -s "$SERIAL" get-state 2>/dev/null | tr -d '\r' || true)"
  if [[ "$state" == "device" ]]; then
    boot="$(adb -s "$SERIAL" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)"
    if [[ "$boot" == "1" ]]; then
      echo "Boot completo: ${SERIAL}"
      exit 0
    fi
  fi
  sleep 2
done

echo "Erro: timeout esperando boot em ${SERIAL}"
exit 1
