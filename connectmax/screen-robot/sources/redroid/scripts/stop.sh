#!/usr/bin/env bash
# Para e remove o container redroid (dados em ./data são preservados).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_docker.sh"

docker compose down
echo "Redroid parado."
