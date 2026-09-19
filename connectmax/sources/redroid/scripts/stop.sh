#!/usr/bin/env bash
# Para e remove o container redroid (dados em ./data são preservados).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

docker compose down
echo "Redroid parado."
