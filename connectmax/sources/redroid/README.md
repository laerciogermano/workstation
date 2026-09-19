# Redroid (ConnectMax)

Android em container Docker via [redroid](https://github.com/remote-android/redroid-doc), com tela espelhada pelo **scrcpy**.

Usado como runtime do motor de prospecção LinkedIn do ConnectMax (ambiente Android controlado).

Projeto irmão (emulador oficial / Android Studio): [`../android-studio`](../android-studio/).

## Requisitos

| Item | Detalhe |
|------|---------|
| **Host** | **Linux** com módulos `binder_linux` (e `ashmem_linux` se existir) |
| Docker | Docker Engine + Compose v2 |
| Cliente | `adb` (platform-tools) e [scrcpy](https://github.com/Genymobile/scrcpy) |

### macOS / Windows

O Docker Desktop **não** oferece o kernel Linux com binder. Neste Mac, use uma **VM Linux** (UTM, Multipass, cloud) e rode o projeto **dentro** dela; no Mac só o scrcpy apontando para o IP da VM.

## Setup rápido (Linux)

```bash
cd sources/redroid

# 1) módulos do kernel (uma vez por boot, ou persistir via /etc/modules-load.d)
sudo ./scripts/setup-host.sh

# 2) subir o Android
./scripts/start.sh

# 3) ver a tela
./scripts/view.sh
```

Parar:

```bash
./scripts/stop.sh
```

Status / logs:

```bash
./scripts/status.sh
```

## Configuração

Copie `.env.example` → `.env` (o `start.sh` faz isso se faltar) e ajuste:

- `REDROID_IMAGE` — padrão `redroid/redroid:15.0.0_64only-latest` (15 é mais estável com scrcpy que 16)
- `ADB_HOST` / `ADB_PORT` — ADB só em `127.0.0.1` por padrão
- resolução / DPI / FPS / `REDROID_GPU_MODE` (`guest` = software, `host` = GPU)

Dados persistentes ficam no volume Docker `redroid-data` (filesystem Linux nativo).  
**Não** use bind mount `./data` no Mac/Colima — o virtiofs quebra o `/data` do Android (`SQLITE_CANTOPEN`).

## Segurança

**Não** publique a porta ADB (`5555`) na internet. Quem tem ADB tem shell no Android e, com `privileged`, risco alto no host.

## Troubleshooting

| Sintoma | O que fazer |
|---------|-------------|
| Container some na hora | `sudo ./scripts/setup-host.sh` e `dmesg -T` |
| `adb` offline | `adb kill-server && adb connect 127.0.0.1:5555`; `./scripts/status.sh` |
| Sem tela | Confirme scrcpy instalado; `docker compose logs -f redroid` |
| Kernel sem ashmem | Já usamos `androidboot.use_memfd=true` no compose |

Debug oficial do projeto:

```bash
curl -fsSL https://raw.githubusercontent.com/remote-android/redroid-doc/master/debug.sh | sudo bash -s -- connectmax-redroid
```

## Layout

```text
sources/redroid/
├── docker-compose.yml
├── .env.example
├── scripts/
│   ├── setup-host.sh
│   ├── start.sh
│   ├── stop.sh
│   ├── view.sh
│   └── status.sh
└── data/          # criado em runtime
```
