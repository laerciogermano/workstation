#!/bin/bash
adb shell settings put global http_proxy :0
adb reverse --remove-all
pkill -f 'mitmdump --listen-host' || true
echo "proxy off"
