# POC — vídeo local como webcam (Chrome CDP, sem OBS)

**Por quê:** provar o caminho OmTV de **selecionar um arquivo de vídeo** e ele aparecer no `getUserMedia` do site, com **label escolhido** (spoof JS) — sem OBS Virtual Camera.

**Stack:** Chrome flags + [`human-cdp`](../../../screen-robot/pocs/chrome-cdp/human-cdp/README.md) + spoof em [`camera-spoof.mjs`](../../../screen-robot/pocs/chrome-cdp/human-cdp/src/camera-spoof.mjs).

## Como funciona

```text
video.mp4 ──ffmpeg──► video.y4m
                         │
                         ▼
Chrome --use-fake-device-for-media-stream
       --use-fake-ui-for-media-stream
       --use-file-for-fake-video-capture=/abs/video.y4m
                         │
                         ▼
getUserMedia (site) ← frames do arquivo (loop)
                         │
                         ▼
spoof label  →  "FaceTime HD Camera" (ou --label)
```

| Peça | Papel |
|------|--------|
| `--use-file-for-fake-video-capture` | Chrome lê `.y4m` / `.mjpeg` como “webcam” |
| `--use-fake-ui-for-media-stream` | libera permissão sem diálogo |
| `cameraLabel` + `applyCameraSpoof` | site vê o nome que você escolheu (não `fake_device_0`) |

## Uso

```bash
cd omtv/pocs/fake-webcam-cdp

# demo com testsrc (gera media/testsrc.y4m) + página local
node run.mjs

# MP4 próprio + nome da câmera
node run.mjs --video /caminho/oferta.mp4 --label "FaceTime HD Camera"

# já em Y4M + site externo
node run.mjs --video /caminho/oferta.y4m --url https://webcamtests.com/

# fechar o Chrome da POC
node run.mjs --stop
```

Converter só o arquivo:

```bash
./to-y4m.sh /caminho/video.mp4 ./media/oferta.y4m
```

## Perfil CDP

- id default: `omtv-fake-cam` · porta `9270` · pasta `~/chrome-profiles/omtv-fake-cam/`
- Trocar vídeo / label / flags → **restart** do Chrome (`run.mjs` já para e sobe de novo)

## Limites (lab)

- Flags `--use-fake-*` geram **infobar amarela** (“sinalizador sem suporte”) — ok para POC; não é caminho “invisível” em site real.
- Formato: **Y4M ou MJPEG**, não MP4 direto (`to-y4m.sh` / `run.mjs` converte).
- Spoof muda só o que a **página** lê (`enumerateDevices` / `track.label`), não o device do SO.
- Alternativa de sistema (sem flags): OBS — [`start-obs-camera.sh`](../../../screen-robot/pocs/android-studio/scripts/start-obs-camera.sh).

## Antes → depois / rollback

**Antes:** só testes ad-hoc em chat + OBS no lab.  
**Depois:** POC versionada em `omtv/pocs/fake-webcam-cdp/` + `cameraLabel` persistido no fingerprint + match `fake`/`y4m` no spoof.

**Rollback:**

```bash
node run.mjs --stop
# opcional: apagar perfil
# node -e "import('…/human-cdp/src/index.mjs').then(m => m.removeCdp('omtv-fake-cam', { deleteProfile: true }))"
```

Remover pasta desta POC; em `camera-spoof.mjs` / `fingerprint.mjs` reverter o match `fake*` e o `cameraLabel` no normalize.
