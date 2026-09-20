#!/usr/bin/env bash
# Para e remove o container redroid do AGENT_NAME (volume do projeto preservado).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/_docker.sh"

if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a
  source .env
  set +a
fi

AGENT_NAME="${AGENT_NAME:-${1:-default}}"
export AGENT_NAME
export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-sr-${AGENT_NAME}}"
export REDROID_CONTAINER_NAME="${REDROID_CONTAINER_NAME:-sr-${AGENT_NAME}}"
export ADB_PORT="${ADB_PORT:-5555}"

docker compose down
echo "Redroid parado (agent=${AGENT_NAME})."
