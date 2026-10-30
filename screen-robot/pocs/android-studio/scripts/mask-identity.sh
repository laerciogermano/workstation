#!/usr/bin/env bash
# Mascarar identidade do AVD (US-22 / SC-28): cópia local da system image
# google_apis_playstore + patch binário de ro.product.* → Pixel 4 (flame).
# Não altera a imagem compartilhada; só o AVD apontado por AVD_NAME.
#
# Uso:
#   AVD_NAME=Alex_Romao ./scripts/mask-identity.sh
#
# Depois: subir o AVD (sem wipe). Validar:
#   adb -s emulator-PORT shell getprop ro.product.model   # → Pixel 4
#
# Rollback: restaurar image.sysdir.1 no config.ini para
#   system-images/android-30/google_apis_playstore/arm64-v8a/
# (a cópia pixel4 pode ficar no SDK; não afeta outros AVDs).
set -euo pipefail

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

AVD_NAME="${AVD_NAME:?defina AVD_NAME}"
SRC_REL="system-images/android-30/google_apis_playstore/arm64-v8a"
DST_REL="system-images/android-30/google_apis_playstore_pixel4/arm64-v8a"
SRC="$ANDROID_HOME/$SRC_REL"
DST="$ANDROID_HOME/$DST_REL"
AVD_DIR="$HOME/.android/avd/${AVD_NAME}.avd"
CONFIG="$AVD_DIR/config.ini"

if [[ ! -d "$AVD_DIR" || ! -f "$CONFIG" ]]; then
  echo "Erro: AVD ${AVD_NAME} não encontrado em $AVD_DIR"
  exit 1
fi
if [[ ! -f "$SRC/system.img" ]]; then
  echo "Erro: imagem fonte ausente: $SRC"
  exit 1
fi

if pgrep -f "qemu-system.*${AVD_NAME}" >/dev/null 2>&1; then
  echo "Erro: ${AVD_NAME} está rodando — pare só esse AVD antes (não mate os outros)."
  exit 1
fi

mkdir -p "$DST"
if [[ ! -f "$DST/system.img" ]]; then
  echo "Copiando system image → $DST_REL (~2.6G)…"
  rsync -a "$SRC/" "$DST/"
else
  echo "Cópia já existe — reaplicando patch a partir da fonte limpa…"
  rsync -a "$SRC/system.img" "$SRC/vendor.img" "$SRC/build.prop" "$DST/"
fi

python3 - "$DST" <<'PY'
from pathlib import Path
import sys

def pad_replace(data: bytes, old: bytes, new: bytes):
    if len(new) > len(old):
        raise ValueError(f"new longer than old: {new!r} vs {old!r}")
    new = new + b" " * (len(old) - len(new))
    return data.replace(old, new), data.count(old)

# Específicos primeiro; genéricos (mesmo comprimento) por último.
replacements = [
    (b"ro.product.product.model=sdk_gphone_arm64", b"ro.product.product.model=Pixel 4"),
    (b"ro.product.product.name=sdk_gphone_arm64", b"ro.product.product.name=flame"),
    (b"ro.product.product.device=emulator_arm64", b"ro.product.product.device=flame"),
    (b"ro.product.vendor.model=sdk_gphone_arm64", b"ro.product.vendor.model=Pixel 4"),
    (b"ro.product.vendor.name=sdk_gphone_arm64", b"ro.product.vendor.name=flame"),
    (b"ro.product.vendor.device=emulator_arm64", b"ro.product.vendor.device=flame"),
    (b"ro.product.odm.model=sdk_gphone_arm64", b"ro.product.odm.model=Pixel 4"),
    (b"ro.product.odm.name=sdk_gphone_arm64", b"ro.product.odm.name=flame"),
    (b"ro.product.system_ext.model=sdk_gphone_arm64", b"ro.product.system_ext.model=Pixel 4"),
    (b"ro.product.system_ext.name=sdk_gphone_arm64", b"ro.product.system_ext.name=flame"),
    (b"ro.build.characteristics=emulator", b"ro.build.characteristics=nosdcard"),
    (b"sdk_gphone_arm64", b"flame"),
    (b"emulator_arm64", b"flame"),
]

dst = Path(sys.argv[1])
for name in ("system.img", "vendor.img"):
    p = dst / name
    data = p.read_bytes()
    for old, new in replacements:
        data, n = pad_replace(data, old, new)
        if n:
            print(f"{name}: {n}x {old.decode(errors='replace')[:56]}")
    p.write_bytes(data)

bp = dst / "build.prop"
t = bp.read_text()
bp.write_text(t.replace("sdk_gphone_arm64", "flame").replace("emulator_arm64", "flame"))
data = (dst / "system.img").read_bytes()
assert b"ro.product.product.model=Pixel 4" in data
assert b"ro.product.product.model=sdk_gphone_arm64" not in data
print("patch ok")
PY

python3 - "$CONFIG" "$DST_REL" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
rel = sys.argv[2].rstrip("/") + "/"
lines = []
for line in p.read_text().splitlines():
    if line.startswith("image.sysdir.1="):
        lines.append(f"image.sysdir.1={rel}")
    else:
        lines.append(line)
p.write_text("\n".join(lines) + "\n")
print("config.ini → image.sysdir.1=" + rel)
PY

echo
echo "Pronto: ${AVD_NAME} → Pixel 4 (flame)."
echo "Suba o AVD e confira: adb shell getprop ro.product.model"
echo "Rollback: image.sysdir.1=${SRC_REL}/"
