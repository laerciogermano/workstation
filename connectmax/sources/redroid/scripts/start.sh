#!/usr/bin/env bash
# Sobe o container redroid.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

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
else
  echo "Aviso: host é $(uname -s). Redroid exige Linux; o container pode falhar no Docker Desktop (macOS/Windows)."
  echo
fi

docker compose up -d
echo
echo "Container iniciado. Conecte a tela com: ./scripts/view.sh"
docker compose ps
