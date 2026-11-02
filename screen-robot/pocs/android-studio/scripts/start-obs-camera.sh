#!/usr/bin/env bash
# Sobe OBS com vídeo em loop + Virtual Camera ativa (cena ConnectMax / CameraFeed).
# Uso:
#   ./scripts/start-obs-camera.sh
#   ./scripts/start-obs-camera.sh /caminho/video.mp4
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -n "${1:-}" ]]; then
  VIDEO="$1"
elif [[ -f "$ROOT/media/loop-preview.mp4" ]]; then
  VIDEO="$ROOT/media/loop-preview.mp4"
else
  VIDEO="$ROOT/media/sample.mp4"
fi
OBS="/Applications/OBS.app/Contents/MacOS/OBS"
SCENE_DIR="$HOME/Library/Application Support/obs-studio/basic/scenes"
SCENE_FILE="$SCENE_DIR/ConnectMax.json"
WS_CFG="$HOME/Library/Application Support/obs-studio/plugin_config/obs-websocket/config.json"

if [[ ! -x "$OBS" ]]; then
  echo "OBS não encontrado em /Applications/OBS.app"
  echo "Instale: https://obsproject.com/"
  exit 1
fi

if [[ ! -f "$VIDEO" ]]; then
  echo "Vídeo não encontrado: $VIDEO"
  exit 1
fi

mkdir -p "$SCENE_DIR" "$(dirname "$WS_CFG")"

# Cena limpa: só VideoLoop (evita captura de monitor / logo OBS).
python3 - "$VIDEO" "$SCENE_DIR" <<'PY'
import json, os, sys
video, scene_dir = sys.argv[1], sys.argv[2]
scene_uuid = "aaaaaaaa-bbbb-cccc-dddd-000000000001"
video_uuid = "aaaaaaaa-bbbb-cccc-dddd-000000000002"
data = {
    "current_scene": "CameraFeed",
    "current_program_scene": "CameraFeed",
    "scene_order": [{"name": "CameraFeed"}],
    "name": "ConnectMax",
    "version": 2,
    "sources": [
        {
            "prev_ver": 520093698,
            "name": "CameraFeed",
            "uuid": scene_uuid,
            "id": "scene",
            "versioned_id": "scene",
            "settings": {
                "id_counter": 1,
                "items": [
                    {
                        "name": "VideoLoop",
                        "source_uuid": video_uuid,
                        "visible": True,
                        "locked": False,
                        "rot": 0.0,
                        "pos": {"x": 0.0, "y": 0.0},
                        "scale": {"x": 1.5, "y": 1.5},
                        "scale_ref": {"x": 1280.0, "y": 720.0},
                        "align": 5,
                        "bounds_type": 2,
                        "bounds_align": 0,
                        "bounds": {"x": 1920.0, "y": 1080.0},
                        "crop_left": 0,
                        "crop_top": 0,
                        "crop_right": 0,
                        "crop_bottom": 0,
                        "id": 1,
                        "group_item_backup": False,
                        "private_settings": {},
                    }
                ],
            },
            "mixers": 0,
            "volume": 1.0,
            "balance": 0.5,
            "enabled": True,
            "muted": False,
            "flags": 0,
        },
        {
            "prev_ver": 520093698,
            "name": "VideoLoop",
            "uuid": video_uuid,
            "id": "ffmpeg_source",
            "versioned_id": "ffmpeg_source",
            "settings": {
                "is_local_file": True,
                "local_file": video,
                "looping": True,
                "clear_on_media_end": False,
                "restart_on_activate": True,
                "close_when_inactive": False,
                "hw_decode": False,
                "speed_percent": 100,
            },
            "mixers": 255,
            "volume": 1.0,
            "balance": 0.5,
            "enabled": True,
            "muted": False,
            "flags": 0,
        },
    ],
}
for name in ("ConnectMax.json", "ConnectMax.json.bak"):
    path = os.path.join(scene_dir, name)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
print("OBS scene VideoLoop ->", video)
PY

# Habilita obs-websocket (StartVirtualCam de verdade; --startvirtualcam sozinho deixa logo).
python3 - "$WS_CFG" <<'PY'
import json, os, secrets, sys
path = sys.argv[1]
os.makedirs(os.path.dirname(path), exist_ok=True)
data = {}
if os.path.isfile(path):
    with open(path) as f:
        data = json.load(f)
data["server_enabled"] = True
data["server_port"] = int(data.get("server_port") or 4455)
data["auth_required"] = True
data["alerts_enabled"] = False
data["first_load"] = False
if not data.get("server_password"):
    data["server_password"] = secrets.token_urlsafe(12)
with open(path, "w") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
print("obs-websocket :%s" % data["server_port"])
PY

pkill -x OBS 2>/dev/null || true
sleep 1

open -a OBS --args \
  --collection ConnectMax \
  --scene CameraFeed \
  --startvirtualcam \
  --disable-missing-files-check \
  --disable-updater

echo "Aguardando OBS + websocket..."
for i in $(seq 1 40); do
  if lsof -iTCP:4455 -sTCP:LISTEN >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done
sleep 2

# Liga Virtual Camera via websocket (garante outputActive=true).
python3 - "$WS_CFG" "$VIDEO" <<'PY'
import asyncio, base64, hashlib, json, sys

cfg_path, video = sys.argv[1], sys.argv[2]
cfg = json.load(open(cfg_path))
pwd = cfg.get("server_password") or ""
port = int(cfg.get("server_port") or 4455)

try:
    import websockets
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets", "-q"])
    import websockets


async def main():
    uri = f"ws://127.0.0.1:{port}"
    async with websockets.connect(uri, max_size=10_000_000) as ws:
        hello = json.loads(await ws.recv())
        d = hello.get("d") or {}
        auth = None
        if d.get("authentication"):
            salt = d["authentication"]["salt"]
            challenge = d["authentication"]["challenge"]
            secret = base64.b64encode(hashlib.sha256((pwd + salt).encode()).digest())
            auth = base64.b64encode(hashlib.sha256(secret + challenge.encode()).digest()).decode()
        identify = {"op": 1, "d": {"rpcVersion": 1}}
        if auth:
            identify["d"]["authentication"] = auth
        await ws.send(json.dumps(identify))
        json.loads(await ws.recv())

        async def req(typ, data=None):
            payload = {"op": 6, "d": {"requestType": typ, "requestId": typ}}
            if data:
                payload["d"]["requestData"] = data
            await ws.send(json.dumps(payload))
            while True:
                msg = json.loads(await ws.recv())
                if msg.get("op") == 7 and msg.get("d", {}).get("requestType") == typ:
                    return msg["d"]

        await req(
            "SetInputSettings",
            {
                "inputName": "VideoLoop",
                "overlay": True,
                "inputSettings": {
                    "local_file": video,
                    "is_local_file": True,
                    "looping": True,
                    "clear_on_media_end": False,
                    "restart_on_activate": True,
                },
            },
        )
        await req(
            "TriggerMediaInputAction",
            {
                "inputName": "VideoLoop",
                "mediaAction": "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART",
            },
        )
        st = await req("GetVirtualCamStatus")
        active = (st.get("responseData") or {}).get("outputActive")
        # No macOS, StartVirtualCam frequentemente não liga o output (fica a logo).
        # Toggle false→true é o que realmente ativa.
        if not active:
            await req("StartVirtualCam")
            st = await req("GetVirtualCamStatus")
            active = (st.get("responseData") or {}).get("outputActive")
        for _ in range(4):
            if active:
                break
            t = await req("ToggleVirtualCam")
            active = (t.get("responseData") or {}).get("outputActive")
            if active is None:
                st = await req("GetVirtualCamStatus")
                active = (st.get("responseData") or {}).get("outputActive")
            if not active:
                import time

                time.sleep(1.0)
                st = await req("GetVirtualCamStatus")
                active = (st.get("responseData") or {}).get("outputActive")
        print("virtual_cam_active=", active)


asyncio.run(main())
PY

export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export PATH="$ANDROID_HOME/emulator:$PATH"
echo "Webcams:"
emulator -webcam-list 2>&1 | grep -i camera || true
echo
echo "OK. Video: $VIDEO"
echo "Se OBS Virtual Camera não listar: Ajustes → Extensões de Câmera → ative OBS."
