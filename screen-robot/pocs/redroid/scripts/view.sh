#!/usr/bin/env bash
# Conecta via ADB e abre a tela com scrcpy.
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

echo "Abrindo scrcpy (mouse + teclado sdk)..."
# uhid no redroid 15: InputManager NPE — use sdk (não o default uhid)
SCRCPY_BIN="$(command -v scrcpy)"
LOG="/tmp/redroid-view.log"
PIDFILE="/tmp/redroid-scrcpy.pid"

# No macOS, desacopla do terminal (senão o scrcpy morre ao fechar o shell/agente).
if [[ "$(uname -s)" == "Darwin" && -z "${VIEW_FOREGROUND:-}" ]]; then
  pkill -f "scrcpy -s ${TARGET}" 2>/dev/null || true
  sleep 0.3
  RUNNER="$(mktemp /tmp/redroid-view.XXXXXX)"
  cat >"$RUNNER" <<EOF
#!/bin/bash
export PATH="$(dirname "$SCRCPY_BIN"):\$PATH"
"$SCRCPY_BIN" -s "${TARGET}" --no-audio --keyboard=sdk --window-title "ConnectMax Redroid" >"${LOG}" 2>&1 &
echo \$! >"${PIDFILE}"
disown
EOF
  chmod +x "$RUNNER"
  # Evita expansão de $! no bash atual (set -u)
  osascript -e "do shell script \"${RUNNER}\"" >/dev/null
  rm -f "$RUNNER"
  sleep 1
  if [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    echo "scrcpy rodando (pid $(cat "$PIDFILE"), log ${LOG})"
    exit 0
  fi
  echo "Falha ao iniciar scrcpy desacoplado; log:"
  cat "$LOG" 2>/dev/null || true
  exit 1
fi

exec "$SCRCPY_BIN" -s "${TARGET}" --no-audio --keyboard=sdk --window-title "ConnectMax Redroid"
