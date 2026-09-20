#!/usr/bin/env bash
# Espelha a tela Android (scrcpy) para visualizar e operar (tap, digitar, …).
# Uso (a partir de screen-robot/src):
#   ./scripts/view.sh
#   ./scripts/view.sh --device 127.0.0.1:5555
#   npm run view
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG="${SRC_ROOT}/device.config.json"

TARGET="${ANDROID_SERIAL:-}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --device|-s)
      TARGET="${2:-}"
      shift 2
      ;;
    --config)
      CONFIG="${2:-}"
      shift 2
      ;;
    *)
      echo "Uso: $0 [--device HOST:PORT] [--config path]"
      exit 1
      ;;
  esac
done

if [[ -z "${TARGET}" && -f "${CONFIG}" ]]; then
  TARGET="$(
    node -e "
      const c = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
      const s = c.provision?.serial || c.device || '';
      if (!s) process.exit(2);
      process.stdout.write(s);
    " "${CONFIG}" 2>/dev/null || true
  )"
fi

TARGET="${TARGET:-127.0.0.1:5555}"

if ! command -v adb >/dev/null 2>&1; then
  echo "Erro: adb não encontrado. Instale platform-tools do Android SDK."
  exit 1
fi

if ! command -v scrcpy >/dev/null 2>&1; then
  echo "Erro: scrcpy não encontrado."
  echo "  macOS:  brew install scrcpy"
  echo "  Ubuntu: apt install scrcpy"
  exit 1
fi

echo "Conectando ADB em ${TARGET}..."
adb disconnect "${TARGET}" >/dev/null 2>&1 || true
adb connect "${TARGET}" >/dev/null 2>&1 || true

for _ in $(seq 1 30); do
  STATE="$(adb devices | awk -v t="${TARGET}" '$1==t {print $2}')"
  if [[ "${STATE}" == "device" ]]; then
    break
  fi
  sleep 1
done

STATE="$(adb devices | awk -v t="${TARGET}" '$1==t {print $2}')"
if [[ "${STATE}" != "device" ]]; then
  echo "Dispositivo em estado '${STATE:-ausente}' (${TARGET})."
  echo "  Suba o runtime (ex.: pocs/redroid/scripts/start.sh) e tente de novo."
  exit 1
fi

echo "Abrindo scrcpy (mouse + teclado) em ${TARGET}..."
SCRCPY_BIN="$(command -v scrcpy)"
LOG="/tmp/screen-robot-view.log"
PIDFILE="/tmp/screen-robot-scrcpy.pid"
TITLE="screen-robot ${TARGET}"

# No macOS, desacopla do terminal (senão o scrcpy morre ao fechar o shell/agente).
if [[ "$(uname -s)" == "Darwin" && -z "${VIEW_FOREGROUND:-}" ]]; then
  pkill -f "scrcpy -s ${TARGET}" 2>/dev/null || true
  sleep 0.3
  RUNNER="$(mktemp /tmp/screen-robot-view.XXXXXX)"
  cat >"$RUNNER" <<EOF
#!/bin/bash
export PATH="$(dirname "$SCRCPY_BIN"):\$PATH"
"$SCRCPY_BIN" -s "${TARGET}" --no-audio --keyboard=sdk --window-title "${TITLE}" >"${LOG}" 2>&1 &
echo \$! >"${PIDFILE}"
disown
EOF
  chmod +x "$RUNNER"
  osascript -e "do shell script \"${RUNNER}\"" >/dev/null
  rm -f "$RUNNER"
  sleep 1
  if [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    echo "scrcpy rodando (pid $(cat "$PIDFILE"), log ${LOG})"
    exit 0
  fi
  echo "Falha ao iniciar scrcpy desacoplado; log:"
  cat "${LOG}" 2>/dev/null || true
  exit 1
fi

exec "$SCRCPY_BIN" -s "${TARGET}" --no-audio --keyboard=sdk --window-title "${TITLE}"
