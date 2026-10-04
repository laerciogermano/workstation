#!/usr/bin/env bash
# Sobe o emulador oficial em Docker (Linux + KVM).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_docker.sh"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Criado .env a partir de .env.example"
fi

_docker_avd_apply_name

# Garante imagem local (tag) se ainda não existir
if ! docker image inspect "${DOCKER_AVD_IMAGE:-screen-robot/docker-avd:playstore}" >/dev/null 2>&1; then
  echo "Imagem ausente — rodando ./scripts/build-image.sh (pull + tag)…"
  "$SCRIPT_DIR/build-image.sh"
fi

echo "Instância docker-avd name=${DOCKER_AVD_NAME:-default} container=${DOCKER_AVD_CONTAINER_NAME} port=${ADB_PORT}"

docker compose up -d --force-recreate || {
  echo "force-recreate falhou — removendo órfão e tentando de novo…"
  docker rm -f "${DOCKER_AVD_CONTAINER_NAME}" 2>/dev/null || true
  docker compose up -d --force-recreate
}

echo
echo "Container iniciado. ADB: adb connect 127.0.0.1:${ADB_PORT}"
echo "Espere boot: ./scripts/wait-boot.sh"
docker compose ps
