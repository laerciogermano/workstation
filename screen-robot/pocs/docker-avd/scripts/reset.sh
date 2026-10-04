#!/usr/bin/env bash
# Apaga volume de estado e sobe de novo.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_docker.sh"

_docker_avd_apply_name

echo "Reset docker-avd${DOCKER_AVD_NAME:+ (name=$DOCKER_AVD_NAME)}: docker compose down -v…"
docker compose down -v
echo "Subindo instância limpa…"
exec "$SCRIPT_DIR/start.sh"
