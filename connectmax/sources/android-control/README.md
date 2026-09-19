# android-control

Executa ações no Android (redroid / emulador) via **ADB**, a partir de um JSON ou da linha de comando.

## Requisitos

- `adb` no PATH
- Device online (`adb devices`) — redroid: `127.0.0.1:5555`

## Uso rápido

```bash
cd connectmax/sources/android-control

# Um comando
node cli.js tap 360 640 --device 127.0.0.1:5555
node cli.js setup-ime              # uma vez por device (acentos)
node cli.js type "olá"
node cli.js shot ./screenshots/tela.png
node cli.js swipe 100 800 100 200 300
node cli.js key KEYCODE_BACK
node cli.js launch com.instagram.android

# Sequência configurável
cp config.example.json meu-fluxo.json   # edite
node cli.js meu-fluxo.json
```

> No Android 15 / redroid, `adb shell input text` dá NPE com acentos. O CLI usa [ADBKeyBoard](https://github.com/senzhk/ADBKeyBoard) (`apks/ADBKeyboard.apk`). Foque um campo de texto antes de `type`.

## Config JSON

| `action` | Campos | Efeito |
|----------|--------|--------|
| `tap` / `click` | `x`, `y` | Clique |
| `type` / `text` | `text`, `method?` | Digita. Unicode → ADBKeyBoard; ASCII tenta `input text` |
| `setup-ime` | — | Instala/ativa ADBKeyBoard |
| `swipe` | `x1`,`y1`,`x2`,`y2`,`ms?` | Arrasta |
| `key` | `code` | Ex.: `KEYCODE_BACK`, `KEYCODE_HOME`, `66` (Enter) |
| `wait` | `ms` | Pausa |
| `screenshot` | `path?` | Print PNG |
| `launch` | `package`, `activity?` | Abre app |
| `shell` | `cmd` | `adb shell …` |

Device: campo `device` no JSON, `--device`, ou env `ANDROID_SERIAL` (padrão `127.0.0.1:5555`).

## Coordenadas

Origem no canto superior esquerdo. Redroid padrão: **720×1280**. Ative *Pointer location* nas opções de desenvolvedor para ver X/Y ao tocar.
