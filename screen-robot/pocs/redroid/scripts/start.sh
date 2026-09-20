#!/usr/bin/env bash
# Sobe o container redroid (1 instância por AGENT_NAME / ADB_PORT).
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

# shellcheck disable=SC1091
set -a
source .env
set +a

AGENT_NAME="${AGENT_NAME:-${1:-default}}"
export AGENT_NAME
export ADB_HOST="${ADB_HOST:-127.0.0.1}"
export ADB_PORT="${ADB_PORT:-5555}"
export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-sr-${AGENT_NAME}}"
export REDROID_CONTAINER_NAME="${REDROID_CONTAINER_NAME:-sr-${AGENT_NAME}}"

mkdir -p data

if [[ "$(uname -s)" == "Linux" ]]; then
  if ! lsmod | grep -q binder_linux; then
    echo "Aviso: binder_linux não está carregado."
    echo "Rode: sudo ./scripts/setup-host.sh"
    echo
  fi
elif [[ "$(uname -s)" == "Darwin" ]]; then
  echo "macOS + Colima: garantindo binderfs na VM..."
  colima ssh -- sh -c 'sudo modprobe binder_linux devices="binder,hwbinder,vndbinder" 2>/dev/null || true; mountpoint -q /dev/binderfs || sudo mount -t binder binder /dev/binderfs' 2>/dev/null || true
  echo
fi

echo "Agent=${AGENT_NAME} project=${COMPOSE_PROJECT_NAME} adb=${ADB_HOST}:${ADB_PORT} container=${REDROID_CONTAINER_NAME}"
docker compose up -d
echo
echo "Container iniciado. Conecte a tela com: AGENT_NAME=${AGENT_NAME} ADB_PORT=${ADB_PORT} ./scripts/view.sh"
docker compose ps
