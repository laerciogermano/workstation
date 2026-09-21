# redroid

Android em **Docker/Colima**. Serial ADB padrão: `127.0.0.1:5555`.

Runtime canônico do screen-robot para apps de loja (GMS) continua sendo o **AVD**: [`../android-studio/`](../android-studio/README.md). Use redroid para testes leves / ADB containerizado.

## Subir

```bash
cd screen-robot/pocs/redroid
./scripts/start.sh          # Colima + binder_linux + container
# ou via API:
cd ../../src && npm run sample   # sample.js com kind=redroid
```

No macOS, o `start.sh` instala `linux-modules-extra` na VM do Colima se `binder_linux` faltar (sem isso o ADB fica `offline`). Se o Colima estiver “up” mas o Docker não responder, o `_docker.sh` faz `colima restart` (só `colima start` ignora). O `start.sh` usa `--force-recreate` para recuperar container zombie após restart da VM.

Parar: `./scripts/stop.sh` · Reset wipe: `./scripts/reset.sh`

## Provision (Node)

```js
await provisionEmulator({ provision: { kind: "redroid", name: "agent-a" } });
// name distinto → outro container/porta/volume; mesmo name → anexa
```

Sem `name`: serial legado `127.0.0.1:5555` / container `connectmax-redroid`.

**Antes → depois:** `name` era ignorado (sempre a mesma instância). Agora `REDROID_NAME` + `ADB_PORT` isolam por name. Voltar ao único container legado: omita `name` ou use só `serial: "127.0.0.1:5555"`.
