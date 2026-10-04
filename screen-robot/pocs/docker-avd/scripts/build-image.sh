#!/usr/bin/env bash
# Pull da imagem Google (Play Store) + tag local screen-robot/docker-avd:playstore.
# API 30 playstore não está no registry público — use EMU_DOCKER_BUILD=1 + emu-docker.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

TAG="${DOCKER_AVD_IMAGE:-screen-robot/docker-avd:playstore}"
BASE="${DOCKER_AVD_BASE:-us-docker.pkg.dev/android-emulator-268719/images/28-playstore-x64-no-metrics:30.1.2}"

if [[ "${EMU_DOCKER_BUILD:-}" == "1" ]]; then
  echo "EMU_DOCKER_BUILD=1: use google/android-emulator-container-scripts:"
  echo "  source configure.sh"
  echo "  emu-docker create stable <sysimg-playstore> --dest ./build"
  echo "  docker build -t ${TAG} ./build"
  echo "Depois: export DOCKER_AVD_IMAGE=${TAG}"
  exit 1
fi

echo "Pull ${BASE}…"
docker pull "$BASE"
echo "Tag → ${TAG}"
docker tag "$BASE" "$TAG"
# Também valida Dockerfile (FROM ARG)
docker build --build-arg "BASE=${BASE}" -t "$TAG" .
echo "OK: ${TAG}"
