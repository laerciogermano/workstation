#!/usr/bin/env bash
# Cria ou atualiza o AVD ConnectMax_Cam (API 30, Google Play, arm64).
# Play Store é necessário para GMS atualizado (Continue with Google / LinkedIn).
set -euo pipefail

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

AVD_NAME="${AVD_NAME:-ConnectMax_Cam}"
PACKAGE="system-images;android-30;google_apis_playstore;arm64-v8a"

if [[ ! -x "$ANDROID_HOME/emulator/emulator" ]]; then
  echo "Erro: emulator não encontrado em $ANDROID_HOME/emulator"
  echo "Instale: sdkmanager --install emulator platform-tools \"$PACKAGE\""
  exit 1
fi

echo "Aceitando licenças (se necessário)..."
yes | sdkmanager --licenses >/dev/null 2>&1 || true

echo "Garantindo pacotes: emulator, platform-tools, $PACKAGE"
sdkmanager --install "emulator" "platform-tools" "$PACKAGE" >/dev/null

if avdmanager list avd 2>/dev/null | grep -q "Name: ${AVD_NAME}"; then
  echo "AVD ${AVD_NAME} já existe — atualizando config (Play Store)."
else
  echo "Criando AVD ${AVD_NAME}..."
  echo no | avdmanager create avd -n "$AVD_NAME" -k "$PACKAGE" -d pixel_4 --force
fi

AVD_DIR="$HOME/.android/avd/${AVD_NAME}.avd"
CONFIG="$AVD_DIR/config.ini"
if [[ ! -f "$CONFIG" ]]; then
  echo "Erro: config.ini não encontrado em $AVD_DIR"
  exit 1
fi

# Se o AVD ainda aponta para google_apis (sem Play), recria com playstore.
if grep -q 'google_apis/arm64' "$CONFIG" 2>/dev/null && ! grep -q 'google_apis_playstore' "$CONFIG"; then
  echo "Migrando ${AVD_NAME} de google_apis → google_apis_playstore…"
  avdmanager delete avd -n "$AVD_NAME" || true
  echo no | avdmanager create avd -n "$AVD_NAME" -k "$PACKAGE" -d pixel_4 --force
fi

python3 - "$CONFIG" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
skip = {
    "hw.ramSize", "hw.cpu.ncore", "vm.heapSize",
    "disk.dataPartition.size", "sdcard.size",
    "hw.lcd.width", "hw.lcd.height", "hw.lcd.density",
    "hw.camera.back", "hw.camera.front",
    "hw.gpu.enabled", "hw.gpu.mode",
    "hw.keyboard", "hw.keyboard.lid", "hw.mainKeys",
    "PlayStore.enabled",
}
lines = []
for line in p.read_text().splitlines():
    key = line.split("=", 1)[0].strip()
    if key in skip:
        continue
    lines.append(line)
lines += [
    # Play Store + GMS pedem mais RAM que o AVD “leve” antigo (384 MB)
    "hw.ramSize=1024",
    "hw.cpu.ncore=2",
    "vm.heapSize=256",
    "disk.dataPartition.size=6442450944",
    "sdcard.size=512M",
    "hw.lcd.width=540",
    "hw.lcd.height=960",
    "hw.lcd.density=240",
    "hw.camera.back=webcam0",
    "hw.camera.front=webcam0",
    "hw.gpu.enabled=yes",
    "hw.gpu.mode=swiftshader_indirect",
    "hw.keyboard=yes",
    "hw.keyboard.lid=no",
    "hw.mainKeys=no",
    "PlayStore.enabled=true",
]
p.write_text("\n".join(lines) + "\n")
print("Config Play aplicada:", p)
PY

echo
echo "Pronto. Suba com: ./scripts/start.sh"
echo "Depois: Settings → Passwords & accounts → Add account → Google (para Continue with Google)."
echo "Ou abra o AVD ${AVD_NAME} no Android Studio → Device Manager."
