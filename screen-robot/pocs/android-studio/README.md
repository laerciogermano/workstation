# Android Studio / Emulator (ConnectMax)

Android via **emulador oficial** (SDK / Android Studio), com janela nativa do emulator.

Usado quando o redroid (Docker) não cabe no host — por exemplo macOS sem binder — ou quando precisa de **câmera virtual** (OBS) com vídeo de teste.

Projeto irmão: [`../redroid`](../redroid/README.md) (Android em container).

## Requisitos

| Item | Detalhe |
|------|---------|
| macOS / Linux | Host com RAM livre (o AVD leve usa ~384–768 MB guest; o processo host consome bem mais) |
| SDK | `ANDROID_HOME` apontando para command-line tools ou Android Studio SDK |
| Ferramentas | `emulator`, `adb`, `avdmanager`, `sdkmanager` |
| Opcional | [Android Studio](https://developer.android.com/studio), [OBS](https://obsproject.com/) (Virtual Camera) |

Neste Mac o SDK costuma estar em:

```text
/opt/homebrew/share/android-commandlinetools
```

## Setup rápido

```bash
cd screen-robot/pocs/android-studio

# 1) cria/atualiza o AVD ConnectMax_Cam (API 30, arm64, leve)
./scripts/setup-avd.sh

# 2) sobe o emulador (janela do Android Emulator)
./scripts/start.sh

# 3) espera boot
./scripts/wait-boot.sh

# 4) (opcional) Instagram — XAPK em apks/ (gitignored) ou baixa com apkeep
./scripts/install-instagram.sh

# 5) (opcional) abre o app Camera
./scripts/open-camera.sh
```

Instagram: última do APKPure compatível com API 28+ (AVD = API 30). Binário em `apks/` — **não** vai no git (copyright Meta); `brew install apkeep` na primeira máquina.

Parar:

```bash
./scripts/stop.sh
```

### Pelo Android Studio

1. Instale o Android Studio e abra **Device Manager**.
2. Crie um AVD (API 30+, Google APIs, arm64 no Apple Silicon) com o nome `ConnectMax_Cam`, **ou** use o criado por `./scripts/setup-avd.sh`.
3. Rode o AVD pelo Studio **ou** pelos scripts acima (mesma pasta `~/.android/avd`).

## Câmera com vídeo (OBS)

Para o app Camera ver um vídeo em loop (não a webcam física):

```bash
# 1) OBS com Virtual Camera + sample.mp4
./scripts/start-obs-camera.sh

# 2) No macOS: Ajustes → Geral → Itens de Início e Extensões → Extensões de Câmera
#    → ative "OBS Virtual Camera" (só na primeira vez)

# 3) Suba o emulador (ele escolhe a webcam OBS se aparecer na lista)
./scripts/start.sh
./scripts/wait-boot.sh
./scripts/open-camera.sh
```

Vídeo padrão: `media/sample.mp4`. Pode passar outro:

```bash
./scripts/start-obs-camera.sh /caminho/para/video.mp4
```

## Aplicar mascaramento neste vendor

Requisito geral (qualquer vendor): [`../README.md`](../README.md#mascarar-identidade-do-aparelho) · US-22 / SC-28.

Neste POC (AVD), use um **device definition / skin** de aparelho de mercado no `avdmanager`/`setup-avd.sh` (não um perfil genérico “emulator” óbvio) e revise `ro.product.*` no `config.ini` / build props do AVD quando necessário. Apps devem ver marca/modelo de aparelho comum, não o fingerprint do vendor de automação.

## Variáveis

| Variável | Padrão | Efeito |
|----------|--------|--------|
| `ANDROID_HOME` | `/opt/homebrew/share/android-commandlinetools` | SDK |
| `JAVA_HOME` | OpenJDK Homebrew | Java do sdkmanager/emulator |
| `AVD_NAME` | `ConnectMax_Cam` | Nome do AVD |
| `EMU_MEMORY` | `384` | RAM guest (MB) — aumente se o host tiver folga |
| `EMU_CORES` | `1` | CPUs guest |

## Layout

```text
screen-robot/pocs/android-studio/
├── README.md
├── .gitignore
├── apks/                 # local only (gitignored) — Instagram XAPK
├── media/
│   └── sample.mp4
└── scripts/
    ├── setup-avd.sh
    ├── start.sh
    ├── stop.sh
    ├── wait-boot.sh
    ├── install-instagram.sh
    ├── open-camera.sh
    └── start-obs-camera.sh
```

## Troubleshooting

| Sintoma | O que fazer |
|---------|-------------|
| Emulador sobe e morre | Falta de RAM no host; feche apps, baixe `EMU_MEMORY`, não rode Colima+redroid ao mesmo tempo |
| Não digita no emulador | `hw.keyboard=yes` no AVD (o `setup-avd.sh` já aplica); reinicie o emulador e clique na janela antes de digitar |
| Camera preta / placeholder | OBS Virtual Camera não aprovada no macOS, ou emulador usando a webcam errada (`emulator -webcam-list`) |
| `emulator: command not found` | Exporte `ANDROID_HOME` e `PATH` (veja `start.sh`) |
| Disco cheio | AVD e system images pesam vários GB; limpe `~/.android` / imagens antigas |
