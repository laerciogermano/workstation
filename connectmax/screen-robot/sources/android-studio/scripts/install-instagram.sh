#!/usr/bin/env bash
# Instala Instagram no emulador a partir de apks/ (XAPK local) ou baixa com apkeep.
# O APK é proprietário da Meta — NÃO versionar no git (veja .gitignore).
set -euo pipefail

export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APKS_DIR="${APKS_DIR:-$ROOT/apks}"
PKG="com.instagram.android"
XAPK="$APKS_DIR/${PKG}.xapk"
# minSdk 28 (Android 9+); AVD ConnectMax_Cam = API 30 → OK
SERIAL="${ANDROID_SERIAL:-}"

pick_device() {
  if [[ -n "$SERIAL" ]]; then
    echo "$SERIAL"
    return
  fi
  local emu
  emu="$(adb devices | awk '/^emulator-/{print $1; exit}')"
  if [[ -n "$emu" ]]; then
    echo "$emu"
    return
  fi
  adb devices | awk '/\tdevice$/{print $1; exit}'
}

ensure_xapk() {
  mkdir -p "$APKS_DIR"
  if [[ -f "$XAPK" ]]; then
    echo "Usando XAPK local: $XAPK"
    return
  fi
  if ! command -v apkeep >/dev/null 2>&1; then
    echo "Erro: falta $XAPK e apkeep não está instalado."
    echo "  brew install apkeep"
    echo "  ou coloque o XAPK em $XAPK"
    exit 1
  fi
  echo "Baixando ${PKG} (última no APKPure) → $APKS_DIR"
  apkeep -a "$PKG" -d apk-pure "$APKS_DIR"
  if [[ ! -f "$XAPK" ]]; then
    echo "Erro: download não gerou $XAPK"
    ls -la "$APKS_DIR" || true
    exit 1
  fi
}

DEV="$(pick_device)"
if [[ -z "$DEV" ]]; then
  echo "Erro: nenhum device adb. Suba o emulador: ./scripts/start.sh"
  exit 1
fi

echo "Device: $DEV"
adb -s "$DEV" wait-for-device
ensure_xapk

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
unzip -qo "$XAPK" '*.apk' -d "$TMP"
# bash 3 (macOS): sem mapfile
SPLITS=()
while IFS= read -r f; do
  SPLITS+=("$f")
done <<EOF
$(find "$TMP" -name '*.apk' | sort)
EOF
if [[ ${#SPLITS[@]} -eq 0 ]]; then
  echo "Erro: nenhum .apk dentro de $XAPK"
  exit 1
fi

echo "Instalando ${#SPLITS[@]} split(s)..."
adb -s "$DEV" install-multiple -r "${SPLITS[@]}"
VER="$(adb -s "$DEV" shell dumpsys package "$PKG" | awk -F= '/versionName=/{print $2; exit}' | tr -d '\r')"
echo "Instagram instalado${VER:+: $VER}"
