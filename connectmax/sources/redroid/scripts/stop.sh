#!/usr/bin/env bash
# Para e remove o container redroid (dados em ./data são preservados).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$(dirname "$0")/_docker.sh"

docker compose down
echo "Redroid parado."
