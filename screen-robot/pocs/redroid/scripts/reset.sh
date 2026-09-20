#!/usr/bin/env bash
# Para o container, apaga o volume de dados e sobe de novo (instância do zero).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_docker.sh"

echo "Reset redroid: docker compose down -v…"
docker compose down -v
echo "Subindo instância limpa…"
exec "$SCRIPT_DIR/start.sh"
