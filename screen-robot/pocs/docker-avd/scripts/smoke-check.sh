#!/usr/bin/env bash
# Gate local: Linux+KVM → boot ADB; caso contrário SKIP (exit 0) com mensagem.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

if [[ "$(uname -s)" != "Linux" ]] || [[ ! -e /dev/kvm ]]; then
  echo "SKIP smoke docker-avd: host sem Linux+/dev/kvm (canônico neste Mac = kind=avd)."
  echo "  No Linux: ./scripts/build-image.sh && DOCKER_AVD_NAME=smoke ./scripts/start.sh && ./scripts/wait-boot.sh"
  echo "  Depois: GMS (pm path com.google.android.gms), LinkedIn x86_64, stop/start, export/import."
  exit 0
fi

# shellcheck disable=SC1091
source "$SCRIPT_DIR/_docker.sh"

export DOCKER_AVD_NAME="${DOCKER_AVD_NAME:-smoke}"
_docker_avd_apply_name

"$SCRIPT_DIR/start.sh"
"$SCRIPT_DIR/wait-boot.sh"

SERIAL="127.0.0.1:${ADB_PORT}"
GMS="$(adb -s "$SERIAL" shell pm path com.google.android.gms 2>/dev/null | tr -d '\r' || true)"
if [[ -z "$GMS" ]]; then
  echo "FAIL: GMS ausente (${SERIAL})"
  exit 1
fi
echo "OK GMS: ${GMS}"

"$SCRIPT_DIR/stop.sh"
"$SCRIPT_DIR/start.sh"
"$SCRIPT_DIR/wait-boot.sh"
echo "OK persistência stop/start"

ART="$("$SCRIPT_DIR/export-state.sh" | tee /dev/stderr | awk '/^OK:/{print $2}')"
if [[ -n "$ART" && -f "$ART" ]]; then
  docker compose down -v >/dev/null 2>&1 || true
  "$SCRIPT_DIR/import-state.sh" "$ART"
  "$SCRIPT_DIR/start.sh"
  "$SCRIPT_DIR/wait-boot.sh"
  echo "OK export/import"
fi

echo "SMOKE PASS docker-avd name=${DOCKER_AVD_NAME} serial=${SERIAL}"
