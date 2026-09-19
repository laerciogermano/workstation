# Sources

Runtimes Android usados pelo ConnectMax. São **dois projetos independentes** — escolha um por máquina/sessão (não rode os dois juntos se a RAM for apertada).

| Projeto | Quando usar | Como ver a tela |
|---------|-------------|-----------------|
| [redroid](redroid/) | Linux/Colima com `binder` — Android em Docker | `./scripts/view.sh` (scrcpy) |
| [android-studio](android-studio/) | macOS / SDK oficial — emulador Android Studio | janela do Emulator (+ OBS opcional para câmera) |
| [android-control](android-control/) | Automação ADB (tap, digitar, print) via Node | — |

```bash
# Redroid
cd sources/redroid && ./scripts/start.sh && ./scripts/view.sh

# Emulador (Android Studio / SDK)
cd sources/android-studio && ./scripts/setup-avd.sh && ./scripts/start.sh
```
