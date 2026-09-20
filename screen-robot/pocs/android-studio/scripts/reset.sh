#!/usr/bin/env bash
# Wipe do AVD (-wipe-data) + sobe de novo + espera boot.
# Usado por resetInstance(cfg) — default em device.config.json.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

AVD_NAME="${AVD_NAME:-ConnectMax_Cam}"
LOG="$ROOT/emulator.log"

free_gb() {
  df -g /Users 2>/dev/null | awk 'NR==2 {print $4}'
}

echo "Reset AVD: ${AVD_NAME} (wipe-data)…"
FREE="$(free_gb || echo "?")"
echo "Espaço livre em /Users: ${FREE} GB"
if [[ "$FREE" =~ ^[0-9]+$ ]] && (( FREE < 4 )); then
  echo "Erro: disco insuficiente para o AVD (livre=${FREE} GB; precisa ~4+ GB)."
  echo "Libere espaço (ex.: ~/.android/avd antigos, apks grandes) e tente de novo."
  exit 1
fi
if [[ "$FREE" =~ ^[0-9]+$ ]] && (( FREE < 8 )); then
  echo "Aviso: pouco espaço (${FREE} GB). Wipe pode falhar; ideal ≥8 GB."
fi

"$ROOT/scripts/stop.sh"
sleep 1

if ! avdmanager list avd 2>/dev/null | grep -q "Name: ${AVD_NAME}"; then
  echo "AVD ${AVD_NAME} não existe. Rodando setup..."
  "$ROOT/scripts/setup-avd.sh"
fi

LIST=$(emulator -webcam-list 2>&1 || true)
WEBCAM="webcam0"
if echo "$LIST" | grep -qi 'obs'; then
  WEBCAM=$(echo "$LIST" | grep -i obs | sed -n "s/.*as '\\''\\(webcam[0-9]*\\)\\''.*/\\1/p" | head -1)
fi
WEBCAM="${WEBCAM:-webcam0}"

: >"$LOG"
nohup emulator -avd "$AVD_NAME" \
  -wipe-data \
  -camera-back "$WEBCAM" \
  -camera-front "$WEBCAM" \
  -memory "${EMU_MEMORY:-384}" \
  -cores "${EMU_CORES:-1}" \
  -gpu swiftshader_indirect \
  -no-snapshot \
  -no-boot-anim \
  -no-audio \
  -no-metrics \
  >"$LOG" 2>&1 &
EMU_PID=$!

echo "Emulador iniciando com wipe (pid ${EMU_PID}). Log: $LOG"
sleep 3
if ! kill -0 "$EMU_PID" 2>/dev/null; then
  echo "Erro: emulador encerrou na subida."
  rg -n "FATAL|Error:|does not have enough disk" "$LOG" || tail -30 "$LOG"
  exit 1
fi

"$ROOT/scripts/wait-boot.sh" || {
  echo "--- trecho do log ---"
  rg -n "FATAL|Error:|does not have enough disk" "$LOG" || tail -40 "$LOG"
  exit 1
}
echo "Reset OK — AVD ${AVD_NAME} boot completo."
