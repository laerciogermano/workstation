#!/usr/bin/env bash
# Abre o app Camera no emulador.
set -euo pipefail

export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

adb -e wait-for-device
adb -e shell pm grant com.android.camera2 android.permission.CAMERA 2>/dev/null || true
adb -e shell am start -n com.android.camera2/com.android.camera.CameraLauncher \
  || adb -e shell am start -a android.media.action.STILL_IMAGE_CAMERA
echo "Camera aberta."
