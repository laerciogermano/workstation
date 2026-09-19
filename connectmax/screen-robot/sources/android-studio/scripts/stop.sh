#!/usr/bin/env bash
# Para o emulador ConnectMax_Cam.
set -euo pipefail

AVD_NAME="${AVD_NAME:-ConnectMax_Cam}"
pkill -f "qemu-system.*${AVD_NAME}" 2>/dev/null || true
pkill -f "emulator -avd ${AVD_NAME}" 2>/dev/null || true
echo "Emulador ${AVD_NAME} parado."
