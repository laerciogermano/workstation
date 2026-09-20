# src — screen-robot

API **Node** do screen-robot sobre ADB: provisionar agent, instalar APKs, eventos, operar, extrair UI, sessão.

Runtimes de POC (redroid / AVD): [`../pocs/`](../pocs/README.md).

## Requisitos

- Node ≥ 18, `adb` no PATH
- Docker/Colima para multi-agent redroid (`provision.name` + `kind: "redroid"`)
- Opcional: [`apkeep`](https://github.com/EFForg/apkeep) para baixar XAPK (`brew install apkeep`)

## Config do dispositivo

[`device.config.json`](device.config.json) — `provision.name` (obrigatório no create), `kind`, apps, paths de sessão/print.

## Funcionalidades (libs)

| Recorte | Módulo |
|---------|--------|
| Provisionar / resgatar (`provisionEmulator` · `attachEmulator`) | [`lib/provision.js`](lib/provision.js) |
| Instalar APKs (`handle.installApk`) | [`lib/apks.js`](lib/apks.js) + `apk-read-spec` · `apk-download` · `apk-install-package` |
| Receber eventos (`handle.on` após provision) | [`lib/events.js`](lib/events.js) + `event-boot` · `event-app-open` · `event-ui-stable` · `event-dump-change` |
| Operar tela (`handle.launch` / `tap` / `type` / `scroll` / `screenshot` / `matchImage`) | [`lib/operate.js`](lib/operate.js) |
| Extrair árvore DOM (`handle.extract`) | [`lib/extract.js`](lib/extract.js) |
| Sessão (`handle.saveSession` / `removeSession` / `restoreSession`) | [`lib/session.js`](lib/session.js) |

Inventário: [`../4.scenarios.md`](../4.scenarios.md)  
BDD: [`../5.bdds.md`](../5.bdds.md)

## Testes automatizados

| O quê | Tipo | Comando |
|-------|------|---------|
| Componentes (`lib/*.js`) | unitário ao lado do arquivo; **deps mock/stub** (sem app/runtime) | `npm test` / `npm run test:unit` |
| **US** / **EP** | BDD e2e (`test/bdd/`) — **app inteira, sem mock/stub** | `npm run test:e2e` |

**SC** não tem suíte própria. Unitário isola o SUT. BDD e2e exercita o caminho real (runtime/ADB).

```bash
cd screen-robot/src
npm test          # unitários isolados (mock/stub)
npm run test:e2e  # BDD e2e US/EP — sistema real (requer runtime Android)
```

## Script inicial — login LinkedIn

```bash
cd screen-robot/src

export LINKEDIN_USER='seu@email.com'
export LINKEDIN_PASSWORD='***'

npm run linkedin-login
```

## CLI legado (JSON de steps)

```bash
node cli.js tap 360 640 --device 127.0.0.1:5555
node cli.js setup-ime
node cli.js type "olá"
node cli.js shot ./screenshots/tela.png
node cli.js launch com.linkedin.android
node cli.js config.example.json
```

> Android 15 / redroid: acentos via [ADBKeyBoard](https://github.com/senzhk/ADBKeyboard) (`apks/ADBKeyboard.apk`).
