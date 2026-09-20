#!/usr/bin/env bash
# Wipe do AVD (-wipe-data) + sobe de novo + espera boot.
# Usado por resetInstance(cfg) — default em device.config.json.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

AVD_NAME="${AVD_NAME:-ConnectMax_Cam}"

echo "Reset AVD: ${AVD_NAME} (wipe-data)…"
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
  >"$ROOT/emulator.log" 2>&1 &

echo "Emulador iniciando com wipe (pid $!). Log: $ROOT/emulator.log"
"$ROOT/scripts/wait-boot.sh"
echo "Reset OK — AVD ${AVD_NAME} boot completo."
