# Redroid (ConnectMax)

Android em container Docker via [redroid](https://github.com/remote-android/redroid-doc), com tela espelhada pelo **scrcpy**.

Usado como runtime do **screen-robot**: a lib sobe **um container por `name`** (multi-agent). Scripts manuais abaixo servem para POC/debug de uma instância.

Projeto irmão (emulador oficial / Android Studio): [`../android-studio`](../android-studio/README.md).

## Multi-agent (contrato com a lib)

| Conceito | Comportamento |
|----------|----------------|
| `name` | Id estável do agent (rótulo do container / compose project) |
| Create | `provisionEmulator` com nome **novo** → container + porta ADB |
| Attach | `provisionEmulator` com nome **já existente** → reconecta; **não** cria |
| Paralelo | Vários nomes ⇒ vários containers (portas distintas em `127.0.0.1`) |

Detalhe de API: [`../../README.md`](../../README.md) · plano: [`../../implementation-plan/EP-01-provisionar-agente.md`](../../implementation-plan/EP-01-provisionar-agente.md).

## Requisitos

| Item | Detalhe |
|------|---------|
| **Host** | **Linux** com módulos `binder_linux` (e `ashmem_linux` se existir) |
| Docker | Docker Engine + Compose v2 |
| Cliente | `adb` (platform-tools) e [scrcpy](https://github.com/Genymobile/scrcpy) |

### macOS / Windows

Neste Mac usamos **Colima** (não Docker Desktop). Os scripts (`start`/`view`/`stop`/`status`) apontam sozinhos para `~/.colima/default/docker.sock` e montam `binderfs` na VM.

```bash
colima start   # se ainda não estiver rodando
./scripts/start.sh   # POC de 1 instância (porta padrão 5555)
./scripts/view.sh
```

## Setup rápido (Linux) — POC 1 instância

```bash
cd screen-robot/pocs/redroid

# 1) módulos do kernel (uma vez por boot, ou persistir via /etc/modules-load.d)
sudo ./scripts/setup-host.sh

# 2) subir o Android (manual; a lib fará o equivalente por nome)
./scripts/start.sh

# 3) ver a tela
./scripts/view.sh
```

Parar:

```bash
./scripts/stop.sh
```

Reset do zero (apaga volume de dados e sobe limpo):

```bash
./scripts/reset.sh
```

A lib chama o mesmo script via `resetInstance(cfg)` ([`../../src/lib/reset-instance.js`](../../src/README.md#1b-reset-do-zero--resetinstancecfg)) — usado pelo piloto LinkedIn.

Status / logs:

```bash
./scripts/status.sh
```

## Configuração

Copie `.env.example` → `.env` (o `start.sh` faz isso se faltar) e ajuste:

- `REDROID_IMAGE` — padrão `redroid/redroid:15.0.0_64only-latest` (15 é mais estável com scrcpy que 16)
- `ADB_HOST` / `ADB_PORT` — ADB só em `127.0.0.1` por padrão; multi-agent usa portas distintas por `name`
- `COMPOSE_PROJECT_NAME` / nome do container — alinhado ao `provision.name` quando a lib sobe a instância
- resolução / DPI / FPS / `REDROID_GPU_MODE` (`guest` = software, `host` = GPU)

Dados persistentes: volume Docker **por agent** (não compartilhar o mesmo volume entre nomes).  
**Não** use bind mount `./data` no Mac/Colima — o virtiofs quebra o `/data` do Android (`SQLITE_CANTOPEN`).

## Segurança

**Não** publique portas ADB na internet. Quem tem ADB tem shell no Android e, com `privileged`, risco alto no host.

## Troubleshooting

| Sintoma | O que fazer |
|---------|-------------|
| Container some na hora | `sudo ./scripts/setup-host.sh` e `dmesg -T` |
| `adb` offline | `adb kill-server && adb connect 127.0.0.1:<porta>`; `./scripts/status.sh` |
| Sem tela | Confirme scrcpy instalado; `docker compose logs -f` |
| Nome já em uso | Chamar `provisionEmulator` de novo com o mesmo `name` (anexa) |
| Estado sujo / AGREE já aceito | `./scripts/reset.sh` ou `resetInstance(cfg)` (wipe do volume) |
| Kernel sem ashmem | Já usamos `androidboot.use_memfd=true` no compose |

Debug oficial do projeto:

```bash
curl -fsSL https://raw.githubusercontent.com/remote-android/redroid-doc/master/debug.sh | sudo bash -s -- connectmax-redroid
```

## Layout

```text
screen-robot/pocs/redroid/
├── docker-compose.yml
├── .env.example
├── scripts/
│   ├── setup-host.sh
│   ├── start.sh
│   ├── stop.sh
│   ├── reset.sh       # down -v + start (instância do zero)
│   ├── view.sh
│   └── status.sh
└── data/          # criado em runtime (POC 1 instância)
```
