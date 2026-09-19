# Sources — screen-robot

Runtimes Android do robô de tela. São **projetos independentes** — escolha um por máquina/sessão.

| Projeto | Quando usar | Como ver a tela |
|---------|-------------|-----------------|
| [redroid](redroid/) | Linux/Colima com `binder` — Android em Docker | `./scripts/view.sh` (scrcpy) |
| [android-studio](android-studio/) | macOS / SDK oficial — emulador Android Studio | janela do Emulator (+ OBS opcional para câmera) |
| [android-control](android-control/) | Automação ADB (tap, digitar, print) via Node | — |

```bash
# Redroid
cd screen-robot/sources/redroid && ./scripts/start.sh && ./scripts/view.sh

# Emulador (Android Studio / SDK)
cd screen-robot/sources/android-studio && ./scripts/setup-avd.sh && ./scripts/start.sh
```
