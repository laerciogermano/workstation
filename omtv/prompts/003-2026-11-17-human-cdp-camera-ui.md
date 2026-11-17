# 003 — Interface de câmera na human-cdp

| Campo | Valor |
|-------|--------|
| Número | 003 |
| Data | 2026-11-17 |
| Origem | Chat no Cursor (workstation) |
| Título | setCamera + UI vídeo/label na human-cdp |

## Prompt original

```
Na Libyuma CDP, deve ter também uma opção lá, uma interface, pra você, selecionar o vídeo que você quer e o nome que você quer da webcam.
```

## Interpretação

Na **human-cdp**: API + interface para escolher o **vídeo local** e o **nome da webcam** (label spoof), integrado ao fluxo CDP — não só na POC OmTV.

## O que foi feito

- `setCamera` / `getCamera` / `clearCamera` + `src/camera.mjs`
- UI `npm run camera-ui` (`http://127.0.0.1:18770/`)
- Fingerprint: `cameraVideo` / `cameraCaptureFile` / `cameraLabel`
- POC OmTV passou a usar `setCamera`
