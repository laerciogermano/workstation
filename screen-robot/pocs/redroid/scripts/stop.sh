#!/usr/bin/env bash
# Para e remove o container redroid (dados em ./data são preservados).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_docker.sh"

REDROID_NAME="${REDROID_NAME:-}"
if [[ -n "$REDROID_NAME" ]]; then
  SLUG="$(echo "$REDROID_NAME" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/^$/default/')"
  export COMPOSE_PROJECT_NAME="redroid-${SLUG}"
  export REDROID_CONTAINER_NAME="redroid-${SLUG}"
  export REDROID_NAME
fi

docker compose down
echo "Redroid parado${REDROID_NAME:+ (name=$REDROID_NAME)}."
