#!/usr/bin/env bash
# Exporta o volume avd-data para artifacts/<name>-<ts>.tar.gz
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_docker.sh"

_docker_avd_apply_name

VOL="$(_docker_avd_volume_name)"
SLUG="$(_docker_avd_slug "${DOCKER_AVD_NAME:-default}")"
TS="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
OUT_DIR="${ROOT}/artifacts"
OUT="${1:-${OUT_DIR}/${SLUG}-${TS}.tar.gz}"
mkdir -p "$(dirname "$OUT")"

if ! docker volume inspect "$VOL" >/dev/null 2>&1; then
  echo "Erro: volume ${VOL} não existe. Suba a instância antes (./scripts/start.sh)."
  exit 1
fi

# Para export consistente: container parado
docker compose stop >/dev/null 2>&1 || true

echo "Export ${VOL} → ${OUT}"
docker run --rm \
  -v "${VOL}:/data:ro" \
  -v "$(cd "$(dirname "$OUT")" && pwd):/out" \
  alpine:3.20 \
  tar czf "/out/$(basename "$OUT")" -C /data .

echo "OK: ${OUT}"
echo "Import: DOCKER_AVD_NAME=${DOCKER_AVD_NAME:-} ./scripts/import-state.sh ${OUT}"
