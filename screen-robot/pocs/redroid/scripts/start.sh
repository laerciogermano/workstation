#!/usr/bin/env bash
# Sobe o container redroid.
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

mkdir -p data

# Instância por name: REDROID_NAME → projeto/container/porta isolados
REDROID_NAME="${REDROID_NAME:-}"
if [[ -n "$REDROID_NAME" ]]; then
  SLUG="$(echo "$REDROID_NAME" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/^$/default/')"
  export COMPOSE_PROJECT_NAME="redroid-${SLUG}"
  export REDROID_CONTAINER_NAME="redroid-${SLUG}"
  export REDROID_NAME
  export ADB_PORT="${ADB_PORT:-5555}"
  echo "Instância redroid name=${REDROID_NAME} container=${REDROID_CONTAINER_NAME} port=${ADB_PORT}"
fi

if [[ "$(uname -s)" == "Linux" ]]; then
  if ! lsmod | grep -q binder_linux; then
    echo "Aviso: binder_linux não está carregado."
    echo "Rode: sudo ./scripts/setup-host.sh"
    echo
  fi
elif [[ "$(uname -s)" == "Darwin" ]]; then
  echo "macOS + Colima: garantindo binder_linux + binderfs na VM..."
  # alarm evita hang infinito se a VM/ssh estiver zumbi
  perl -e 'alarm shift; exec @ARGV' 90 colima ssh -- bash -lc '
    set -e
    if ! lsmod | grep -q binder_linux; then
      K=$(uname -r)
      if ! modprobe binder_linux devices="binder,hwbinder,vndbinder" 2>/dev/null; then
        echo "Instalando linux-modules-extra-$K (binder)..."
        sudo apt-get update -qq
        sudo DEBIAN_FRONTEND=noninteractive apt-get install -y "linux-modules-extra-$K"
        sudo modprobe binder_linux devices="binder,hwbinder,vndbinder"
      fi
    fi
    sudo mkdir -p /dev/binderfs
    mountpoint -q /dev/binderfs || sudo mount -t binder binder /dev/binderfs
  ' || echo "Aviso: timeout/falha ao preparar binder na VM (tente: colima restart)"
  echo
fi

docker compose up -d --force-recreate || {
  # Compose às vezes deixa container órfão com nome prefixado após recreate falho
  echo "force-recreate falhou — removendo container órfão e tentando de novo..."
  docker rm -f "${REDROID_CONTAINER_NAME:-redroid}" 2>/dev/null || true
  while read -r id; do
    [[ -n "$id" ]] && docker rm -f "$id" 2>/dev/null || true
  done < <(docker ps -aq --filter "name=${REDROID_CONTAINER_NAME:-redroid}" 2>/dev/null)
  docker compose up -d --force-recreate
}

# Aviso: muitas instâncias no Colima 2GiB → boot/ADB offline
n_up="$(docker ps --filter ancestor=redroid/redroid --format '{{.ID}}' 2>/dev/null | wc -l | tr -d ' ')"
if [[ "${n_up:-0}" -gt 1 ]]; then
  echo "Aviso: ${n_up} containers redroid up — em Colima ~2GiB o ADB pode ficar offline / boot timeout."
  echo "  Pare extras: docker stop \$(docker ps -q --filter ancestor=redroid/redroid)"
fi

echo
echo "Container iniciado. Conecte a tela com: cd ../../src && npm run view"
docker compose ps
