#!/usr/bin/env bash
# Espera o emulador bootar (sys.boot_completed=1).
set -euo pipefail

export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

echo "Aguardando boot..."
for i in $(seq 1 60); do
  if ! pgrep -f 'qemu-system' >/dev/null 2>&1; then
    echo "Emulador não está rodando."
    exit 1
  fi
  BOOT=$(adb -e shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)
  if [[ "$BOOT" == "1" ]]; then
    echo "Boot completo (${i} tentativas)."
    adb -e devices -l
    exit 0
  fi
  sleep 2
done

echo "Timeout esperando boot."
exit 1
