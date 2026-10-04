#!/usr/bin/env bash
# Para o container (volume avd-data preservado).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_docker.sh"

_docker_avd_apply_name

docker compose down
echo "docker-avd parado${DOCKER_AVD_NAME:+ (name=$DOCKER_AVD_NAME)} — volume preservado."
