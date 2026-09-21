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

if [[ "$(uname -s)" == "Linux" ]]; then
  if ! lsmod | grep -q binder_linux; then
    echo "Aviso: binder_linux não está carregado."
    echo "Rode: sudo ./scripts/setup-host.sh"
    echo
  fi
elif [[ "$(uname -s)" == "Darwin" ]]; then
  echo "macOS + Colima: garantindo binder_linux + binderfs na VM..."
  colima ssh -- bash -lc '
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
  '
  echo
fi

docker compose up -d
echo
echo "Container iniciado. Conecte a tela com: cd ../../src && npm run view"
docker compose ps
