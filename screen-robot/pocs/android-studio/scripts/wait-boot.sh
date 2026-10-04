#!/usr/bin/env bash
# Espera o emulador bootar (sys.boot_completed=1).
set -euo pipefail

export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="${EMU_LOG:-$ROOT/emulator.log}"

echo "Aguardando boot..."
for i in $(seq 1 60); do
  if [[ -f "$LOG" ]] && grep -q 'enough disk space\|FATAL' "$LOG" 2>/dev/null; then
    echo "Emulador falhou (veja $LOG)."
    grep -E 'FATAL|enough disk space|Error:' "$LOG" | tail -5 || true
    exit 1
  fi
  if ! pgrep -f 'qemu-system' >/dev/null 2>&1; then
    echo "Emulador não está rodando."
    [[ -f "$LOG" ]] && tail -15 "$LOG" || true
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
[[ -f "$LOG" ]] && tail -20 "$LOG" || true
exit 1
