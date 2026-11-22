#!/bin/bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
STAMP=$(cat "$DIR/CURRENT_STAMP")
LOG="$DIR/mitmdump-$STAMP.log"
echo "watching $LOG  (Ctrl+C só sai do tail; mitm continua)"
exec stdbuf -oL -eL tail -n 80 -F "$LOG"
