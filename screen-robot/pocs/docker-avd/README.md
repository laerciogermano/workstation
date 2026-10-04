# docker-avd — emulador oficial em Docker (Linux + KVM)

Runtime **opcional** para Linux/CI: Android Emulator Google com **Play Store** (imagem hospedada) e estado em volume Docker.

| Host | Runtime |
|------|---------|
| **macOS** | Continua canônico: [`../android-studio/`](../android-studio/README.md) · `kind: "avd"` |
| **Linux + `/dev/kvm`** | Este POC · `kind: "docker-avd"` |

**Não** é redroid ([`../redroid/`](../redroid/README.md) — legado sem GMS útil). budtmo free não tem Play Store.

## Pré-requisitos

- Linux (bare-metal ou VM com nested virt)
- Docker Engine + Compose v2
- `/dev/kvm` acessível ao usuário
- `adb` no PATH
- APKs/XAPK com ABI **x86_64** (guest ≠ arm64 do AVD Mac)

## Setup rápido

Via Node (create-or-attach + ADB + boot):

```bash
cd screen-robot/src
# uma vez no Linux: ../pocs/docker-avd/scripts/build-image.sh
npm run docker-avd                 # name=agent-a
npm run docker-avd -- meu-agent    # outro name
npm run docker-avd -- agent-a --view
```

Via shell do POC:

```bash
cd screen-robot/pocs/docker-avd
./scripts/build-image.sh          # pull Google + tag local
DOCKER_AVD_NAME=agent-a ./scripts/start.sh
./scripts/wait-boot.sh            # adb connect + boot_completed
```

Parar (preserva estado): `./scripts/stop.sh`  
Wipe: `./scripts/reset.sh`  
Smoke (Linux): `./scripts/smoke-check.sh` — no Mac imprime SKIP e sai 0.

## Imagem

Default: API **28** `google_apis_playstore` x86_64 (única Play no Artifact Registry público).

```text
us-docker.pkg.dev/android-emulator-268719/images/28-playstore-x64-no-metrics:30.1.2
→ tag local screen-robot/docker-avd:playstore
```

- API 30 **sem** Play Store: `DOCKER_AVD_IMAGE=us-docker.pkg.dev/android-emulator-268719/images/30-google-x64-no-metrics:30.1.2`
- API 30 **com** Play: gerar via [emu-docker](https://github.com/google/android-emulator-container-scripts) (`EMU_DOCKER_BUILD=1 ./scripts/build-image.sh` mostra o fluxo)

## Estado — salvar e replicar

Volume compose: `<project>_avd-data` (`COMPOSE_PROJECT_NAME=docker-avd-<slug>`).

```bash
DOCKER_AVD_NAME=agent-a ./scripts/export-state.sh
# → artifacts/agent-a-<ts>.tar.gz

DOCKER_AVD_NAME=agent-a ./scripts/import-state.sh artifacts/agent-a-….tar.gz
DOCKER_AVD_NAME=agent-a ./scripts/start.sh
```

**Caminho inverso:** `docker compose down -v` (ou `./scripts/reset.sh`) apaga o volume. No Mac, ignore este POC e use `kind: "avd"`.

## Provision (Node)

Script: [`../../src/scripts/docker-avd-provision.js`](../../src/scripts/docker-avd-provision.js) · `npm run docker-avd`.

```js
await provisionEmulator({
  provision: { kind: "docker-avd", name: "agent-a" },
});
// serial → 127.0.0.1:<5655+(hash%100)>
```

Portas **5655–5754** (não colidem com redroid 5555–5654).

**Antes → depois:** só scripts shell do POC → agora `npm run docker-avd` sobe/anexa via `provisionEmulator`. Rollback: use `./scripts/start.sh` + `wait-boot.sh`.

## Gate GMS / LinkedIn

1. `pm path com.google.android.gms` não vazio  
2. Instalar LinkedIn **x86_64** — UI não branca  
3. `stop` → `start` no mesmo volume → apps/sessão  
4. `export` → volume novo → `import` → mesmo estado  

Se falhar no Linux, kind permanece experimental; Mac fica em `avd`.

## Rollback (Mac / default do repo)

```json
"provision": { "name": "ConnectMax_Cam", "kind": "avd" }
```

Antes → depois: só AVD host → `docker-avd` opcional no Linux; default [`src/device.config.json`](../../src/device.config.json) **não** muda.

## Layout

```text
docker-avd/
  Dockerfile
  docker-compose.yml
  .env.example
  artifacts/          # gitignored — tar de estado
  scripts/
    _docker.sh
    build-image.sh
    start.sh | stop.sh | wait-boot.sh | reset.sh
    export-state.sh | import-state.sh
    smoke-check.sh
```
