#!/usr/bin/env bash
# Converte MP4/qualquer input ffmpeg → Y4M (Chrome --use-file-for-fake-video-capture).
# Uso:
#   ./to-y4m.sh video.mp4
#   ./to-y4m.sh video.mp4 /tmp/out.y4m
#   ./to-y4m.sh video.mp4 /tmp/out.y4m 640x360
set -euo pipefail

IN="${1:?uso: ./to-y4m.sh <video> [saida.y4m] [WxH]}"
OUT="${2:-}"
SIZE="${3:-640x360}"

if [[ -z "$OUT" ]]; then
  base="${IN%.*}"
  OUT="${base}.y4m"
fi

if [[ ! -f "$IN" ]]; then
  echo "arquivo não encontrado: $IN" >&2
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg não encontrado" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT")"
ffmpeg -y -i "$IN" -an -pix_fmt yuv420p -vf "scale=${SIZE}" "$OUT"
echo "$OUT"
