#!/usr/bin/env bash
# Cria ou atualiza o AVD ConnectMax_Cam (API 30, Google APIs, arm64, leve).
set -euo pipefail

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

AVD_NAME="${AVD_NAME:-ConnectMax_Cam}"
PACKAGE="system-images;android-30;google_apis;arm64-v8a"

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
  echo "AVD ${AVD_NAME} já existe — atualizando config leve."
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
}
lines = []
for line in p.read_text().splitlines():
    key = line.split("=", 1)[0].strip()
    if key in skip:
        continue
    lines.append(line)
lines += [
    "hw.ramSize=384",
    "hw.cpu.ncore=1",
    "vm.heapSize=32",
    "disk.dataPartition.size=2147483648",
    "sdcard.size=128M",
    "hw.lcd.width=540",
    "hw.lcd.height=960",
    "hw.lcd.density=240",
    "hw.camera.back=webcam0",
    "hw.camera.front=webcam0",
    "hw.gpu.enabled=yes",
    "hw.gpu.mode=swiftshader_indirect",
]
p.write_text("\n".join(lines) + "\n")
print("Config leve aplicada:", p)
PY

echo
echo "Pronto. Suba com: ./scripts/start.sh"
echo "Ou abra o AVD ${AVD_NAME} no Android Studio → Device Manager."
