#!/usr/bin/env bash
# Inicia o emulador Android (janela nativa). Prefere OBS Virtual Camera se existir.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

AVD_NAME="${AVD_NAME:-ConnectMax_Cam}"

if ! command -v emulator >/dev/null 2>&1; then
  echo "Erro: emulator não encontrado. Rode ./scripts/setup-avd.sh ou defina ANDROID_HOME."
  exit 1
fi

if ! avdmanager list avd 2>/dev/null | grep -q "Name: ${AVD_NAME}"; then
  echo "AVD ${AVD_NAME} não existe. Rodando setup..."
  "$ROOT/scripts/setup-avd.sh"
fi

LIST=$(emulator -webcam-list 2>&1 || true)
echo "$LIST"

WEBCAM="webcam0"
if echo "$LIST" | grep -qi 'obs'; then
  WEBCAM=$(echo "$LIST" | grep -i obs | sed -n "s/.*as '\\''\\(webcam[0-9]*\\)\\''.*/\\1/p" | head -1)
fi
WEBCAM="${WEBCAM:-webcam0}"

echo "Usando câmera: ${WEBCAM}"
echo "AVD: ${AVD_NAME} (memory=${EMU_MEMORY:-384} cores=${EMU_CORES:-1})"

AVD_DIR="$HOME/.android/avd/${AVD_NAME}.avd"
if [[ -f "$AVD_DIR/config.ini" ]]; then
  grep -v '^hw.camera.back=' "$AVD_DIR/config.ini" | grep -v '^hw.camera.front=' > "$AVD_DIR/config.ini.tmp" || true
  mv "$AVD_DIR/config.ini.tmp" "$AVD_DIR/config.ini"
  {
    echo "hw.camera.back=${WEBCAM}"
    echo "hw.camera.front=${WEBCAM}"
  } >> "$AVD_DIR/config.ini"
fi

pkill -f "qemu-system.*${AVD_NAME}" 2>/dev/null || true
sleep 1

nohup emulator -avd "$AVD_NAME" \
  -camera-back "$WEBCAM" \
  -camera-front "$WEBCAM" \
  -memory "${EMU_MEMORY:-384}" \
  -cores "${EMU_CORES:-1}" \
  -gpu swiftshader_indirect \
  -no-snapshot \
  -no-boot-anim \
  -no-audio \
  -no-metrics \
  >"$ROOT/emulator.log" 2>&1 &

echo "Emulador iniciando (pid $!). Aguarde o boot..."
echo "Log: $ROOT/emulator.log"
echo "Depois: ./scripts/wait-boot.sh && ./scripts/open-camera.sh"
