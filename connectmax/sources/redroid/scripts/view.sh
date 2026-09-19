#!/usr/bin/env bash
# Conecta via ADB e abre a tela com scrcpy.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a
  source .env
  set +a
fi

HOST="${ADB_HOST:-127.0.0.1}"
PORT="${ADB_PORT:-5555}"
TARGET="${HOST}:${PORT}"

if ! command -v adb >/dev/null 2>&1; then
  echo "Erro: adb não encontrado. Instale platform-tools do Android SDK."
  exit 1
fi

if ! command -v scrcpy >/dev/null 2>&1; then
  echo "Erro: scrcpy não encontrado."
  echo "  macOS:  brew install scrcpy"
  echo "  Ubuntu: apt install scrcpy   (ou baixe em https://github.com/Genymobile/scrcpy)"
  exit 1
fi

if ! docker compose ps --status running --services 2>/dev/null | grep -q redroid; then
  echo "Container não está rodando. Suba com: ./scripts/start.sh"
  exit 1
fi

echo "Conectando ADB em ${TARGET}..."
adb disconnect "${TARGET}" >/dev/null 2>&1 || true
adb connect "${TARGET}"

# Aguarda o device sair de offline
for _ in $(seq 1 30); do
  STATE="$(adb devices | awk -v t="${TARGET}" '$1==t {print $2}')"
  if [[ "${STATE}" == "device" ]]; then
    break
  fi
  sleep 1
done

STATE="$(adb devices | awk -v t="${TARGET}" '$1==t {print $2}')"
if [[ "${STATE}" != "device" ]]; then
  echo "Dispositivo em estado '${STATE:-ausente}'. Tente:"
  echo "  docker compose logs -f redroid"
  echo "  adb kill-server && adb connect ${TARGET}"
  exit 1
fi

echo "Abrindo scrcpy..."
exec scrcpy -s "${TARGET}" --no-audio
