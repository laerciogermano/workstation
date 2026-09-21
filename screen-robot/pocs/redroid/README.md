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

No macOS, o `start.sh` instala `linux-modules-extra` na VM do Colima se `binder_linux` faltar (sem isso o ADB fica `offline`).

Parar: `./scripts/stop.sh` · Reset wipe: `./scripts/reset.sh`

## Provision (Node)

```js
await provisionEmulator({ provision: { kind: "redroid" } });
// serial default 127.0.0.1:5555
```

**Antes → depois:** pasta marcada só como legado; agora o `kind=redroid` sobe de novo via `start.sh` e o sample usa redroid. Para voltar ao AVD: `kind: "avd", name: "ConnectMax_Cam"`.
