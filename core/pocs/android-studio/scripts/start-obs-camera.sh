#!/usr/bin/env bash
# Sobe OBS com o vídeo em loop + Virtual Camera.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VIDEO="${1:-$ROOT/media/sample.mp4}"
OBS="/Applications/OBS.app/Contents/MacOS/OBS"
SCENE_DIR="$HOME/Library/Application Support/obs-studio/basic/scenes"
SCENE_FILE="$SCENE_DIR/ConnectMax.json"

if [[ ! -x "$OBS" ]]; then
  echo "OBS não encontrado em /Applications/OBS.app"
  echo "Instale: https://obsproject.com/"
  exit 1
fi

if [[ ! -f "$VIDEO" ]]; then
  echo "Vídeo não encontrado: $VIDEO"
  exit 1
fi

mkdir -p "$SCENE_DIR"

# cria/atualiza scene collection mínima
python3 - "$VIDEO" "$SCENE_FILE" <<'PY'
import json, sys, os
video, path = sys.argv[1], sys.argv[2]
if os.path.isfile(path):
    with open(path) as f:
        data = json.load(f)
else:
    data = {
        "current_scene": "CameraFeed",
        "current_program_scene": "CameraFeed",
        "scene_order": [{"name": "CameraFeed"}],
        "name": "ConnectMax",
        "sources": [],
        "version": 2,
    }

sources = data.setdefault("sources", [])
# scene
if not any(s.get("name") == "CameraFeed" and s.get("id") == "scene" for s in sources):
    sources.append({
        "id": "scene",
        "name": "CameraFeed",
        "uuid": "aaaaaaaa-bbbb-cccc-dddd-000000000001",
        "versioned_id": "scene",
        "settings": {
            "id_counter": 1,
            "items": [{
                "name": "VideoLoop",
                "source_uuid": "aaaaaaaa-bbbb-cccc-dddd-000000000002",
                "visible": True,
            }],
        },
    })

found = False
for s in sources:
    if s.get("name") == "VideoLoop" and s.get("id") == "ffmpeg_source":
        s.setdefault("settings", {})
        s["settings"]["local_file"] = video
        s["settings"]["is_local_file"] = True
        s["settings"]["looping"] = True
        found = True
        break
if not found:
    sources.append({
        "id": "ffmpeg_source",
        "name": "VideoLoop",
        "uuid": "aaaaaaaa-bbbb-cccc-dddd-000000000002",
        "versioned_id": "ffmpeg_source",
        "settings": {
            "local_file": video,
            "is_local_file": True,
            "looping": True,
        },
    })

with open(path, "w") as f:
    json.dump(data, f, indent=2)
print("OBS scene VideoLoop ->", video)
PY

pkill -x OBS 2>/dev/null || true
sleep 1

open -a OBS --args \
  --collection ConnectMax \
  --scene CameraFeed \
  --startvirtualcam \
  --minimize-to-tray \
  --disable-missing-files-check \
  --disable-updater

echo "Aguardando Virtual Camera do OBS..."
sleep 8

export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export PATH="$ANDROID_HOME/emulator:$PATH"
echo "Webcams disponíveis:"
emulator -webcam-list 2>&1 | grep -i camera || true
echo
echo "Se OBS Virtual Camera não listar: Ajustes → Extensões de Câmera → ative OBS."
echo "Depois: ./scripts/start.sh"
