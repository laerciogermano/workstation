#!/bin/bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
STAMP=$(cat "$DIR/CURRENT_STAMP")
LOG="$DIR/mitmdump-$STAMP.log"
echo "watching $LOG  (Ctrl+C só sai do tail; mitm continua)"
exec tail -n 80 -F "$LOG"
