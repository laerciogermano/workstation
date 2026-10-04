#!/usr/bin/env bash
# Restaura tar.gz no volume avd-data (substitui estado).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_docker.sh"

ARCHIVE="${1:-}"
if [[ -z "$ARCHIVE" || ! -f "$ARCHIVE" ]]; then
  echo "Uso: DOCKER_AVD_NAME=agent-a ./scripts/import-state.sh artifacts/agent-a-….tar.gz"
  exit 1
fi

_docker_avd_apply_name
VOL="$(_docker_avd_volume_name)"

echo "Parando container…"
docker compose down >/dev/null 2>&1 || true

# Garante volume
docker volume create "$VOL" >/dev/null

ABS="$(cd "$(dirname "$ARCHIVE")" && pwd)/$(basename "$ARCHIVE")"
echo "Import ${ABS} → ${VOL}"
docker run --rm \
  -v "${VOL}:/data" \
  -v "$(dirname "$ABS"):/in:ro" \
  alpine:3.20 \
  sh -c 'rm -rf /data/* /data/.[!.]* 2>/dev/null || true; tar xzf "/in/'"$(basename "$ABS")"'" -C /data'

echo "OK. Suba: DOCKER_AVD_NAME=${DOCKER_AVD_NAME:-} ./scripts/start.sh"
