# src — screen-robot

API **Node** do screen-robot sobre ADB: provisionar agent, instalar APKs, eventos, operar, extrair UI, sessão.

Runtimes de POC (redroid / AVD): [`../pocs/`](../pocs/README.md).

## Requisitos

- Node ≥ 18, `adb` no PATH
- Device online (redroid `127.0.0.1:5555` ou emulador)
- Opcional: [`apkeep`](https://github.com/EFForg/apkeep) para baixar XAPK (`brew install apkeep`)

## Config do dispositivo

[`device.config.json`](device.config.json) — serial, versões de apps (ex. Instagram), paths de sessão/print.

## Funcionalidades (libs)

| Recorte | Módulo |
|---------|--------|
| Provisionar emulador (`provisionEmulator`) | [`lib/provision.js`](lib/provision.js) |
| Instalar APKs | [`lib/apks.js`](lib/apks.js) |
| Receber eventos (`handle.on` após provision) | [`lib/events.js`](lib/events.js) (via handle) |
| Executar operações | [`lib/operate.js`](lib/operate.js) |
| Extrair elementos | [`lib/extract.js`](lib/extract.js) |
| Guardar sessão | [`lib/session.js`](lib/session.js) |

Inventário: [`../4.scenarios.md`](../4.scenarios.md)  
BDD: [`../5.bdds.md`](../5.bdds.md)

## Testes automatizados

```bash
cd screen-robot/src
npm test        # BDD e2e (SC-01..SC-03)
npm run test:e2e
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
