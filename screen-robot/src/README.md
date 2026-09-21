# src — screen-robot

API **Node** (≥ 18) para controlar Android via ADB: provisionar agents, instalar APKs, eventos de UI, gestos, extração de textos (OCR) e sessão.

Visão do projeto: [`../README.md`](../README.md) · Runtimes: [`../pocs/`](../pocs/README.md) · Aceite: [`../5.bdds.md`](../5.bdds.md)

Com o runtime no ar, o Android fica **disponível para controle humano**: espelhar a tela e operar (tap, digitar, scroll, …) via scrcpy — [`scripts/view.sh`](scripts/view.sh) (`npm run view`). A API automatiza as mesmas ações por código.

---

## Instalação / entrada

```bash
cd screen-robot/src
# Node ≥ 18, adb no PATH
# Android SDK / Emulator (AVD) — kind=avd; Google APIs/Play
```

Superfície pública (funções puras; `serial` no cfg):

```js
import { provisionEmulator } from "./lib/provision.js";
import { on } from "./lib/events.js";
import { installApk } from "./lib/apks.js";
import { launch, tap, tapElement, type, scroll, screenshot, matchImage, openScrcpy } from "./lib/operate.js";
import { extract } from "./lib/extract.js";
import { saveSession, removeSession, restoreSession } from "./lib/session.js";
import { resetInstance } from "./lib/reset-instance.js";
```

**Antes → depois:** `provisionEmulator` devolve só `{ serial, kind, provisionedAt, bootCompleted }` — sem métodos. Ops usam `fn({ serial, … })` (como `on`).

---

## 1. Provisionar agents — `provisionEmulator(cfg)`

Um único método: **cria** se o `name` for novo; **anexa** se o nome já existir (sem criar outro AVD/emulador).

```js
const { serial, kind, bootCompleted, provisionedAt } = await provisionEmulator({
  provision: {
    name: "ConnectMax_Cam",   // AVD (= AVD_NAME)
    kind: "avd",              // avd | adb | redroid(legado)
    // serial opcional com kind=avd — resolve via adb pelo name
  },
});

// mesmo name de novo → anexa ao AVD já ligado
const again = await provisionEmulator({
  provision: { name: "ConnectMax_Cam", kind: "avd" },
});
// again.serial === serial
```

| `kind` | Precisa | Comportamento |
|--------|---------|---------------|
| `avd` | `name` | Sobe/anexa AVD; serial sai do `adb` |
| `adb` | `serial` / `device` / `ANDROID_SERIAL` | Só anexa device já online |
| `redroid` | `name` **ou** `serial` | Com `name`: container/porta/volume por instância; sem `name`: `127.0.0.1:5555` |

| Caso | Comportamento |
|------|----------------|
| Nome/AVD novo | `start.sh` + setup cria AVD, boot ok |
| AVD já no `adb` | Reconecta serial desse AVD — **não** sobe outro |
| `kind=adb` sem serial | `PROVISION_NO_SERIAL` |
| `kind=redroid` + `name` novo | Container `redroid-<slug>`, porta derivada do name, volume isolado |
| `kind=redroid` + mesmo `name` | Anexa ao container já online — **não** reusa outra instância |
| `kind=redroid` sem name/serial | Usa `127.0.0.1:5555` (legado) |

**Antes → depois:** `kind=redroid` ignorava `name` e sempre usava `127.0.0.1:5555`. Agora `name` distinto sobe outra instância; mesmo `name` anexa. Sem `name` mantém o default legado. AVD canônico (GMS): `kind: "avd"`.

### Vários em paralelo

```js
const a = await provisionEmulator({ provision: { name: "a", kind: "redroid" } });
const b = await provisionEmulator({ provision: { name: "b", kind: "redroid" } });
// a.serial !== b.serial
```

Não é obrigatório rodar `pocs/android-studio/scripts/start.sh` — o create já sobe o AVD.

**US-22:** mascarar identidade no AVD — ver [`../pocs/README.md`](../pocs/README.md#mascarar-identidade-do-aparelho).

Config de exemplo: [`device.config.json`](device.config.json) (`provision.name`, `kind`, apps, paths).

---

## 1b. Reset do zero — `resetInstance(cfg)`

Recria a instância limpa (wipe do AVD e sobe de novo). Usado pelo piloto LinkedIn antes do provision.

```js
import { resetInstance } from "./lib/reset-instance.js";

const { serial, kind, resetAt } = await resetInstance(cfg);
// → ADB online + boot completo
```

| Item | Detalhe |
|------|---------|
| Script default | [`../pocs/android-studio/scripts/reset.sh`](../pocs/android-studio/README.md) (planejado: `-wipe-data` — **gap**/TODO) |
| Override | `cfg.provision.resetScript` |
| Erros | `RESET_NO_SERIAL` · `RESET_FAILED` · `RESET_UNSUPPORTED` |

---

## 2. Instalar APKs — `installApk({ serial, … })`

```js
const r = await installApk({
  serial,
  package: "com.linkedin.android",
  version: "4.1.1093",           // opcional: skip se já instalada
  artifact: "apks/app.apk",      // path local
  // source: "apk-pure",         // download via apkeep se não houver artifact
});
// ou: installApk({ serial, app: cfg.apps.linkedin })
// { package, version, skipped, artifactPath? }
```

**Antes → depois:** `handle.installApk(app)` → `installApk({ serial, …app })`.

Erros: `APK_CONFIG_INVALID` · `APK_NO_SERIAL` · `APK_DOWNLOAD_FAILED` · `APK_INSTALL_FAILED`.

---

## 3. Eventos de UI — `on(cfg)`

```js
import { on } from "./lib/events.js";

await on({ serial, event: "boot" });
await on({
  serial,
  event: "app_open",
  pkg: "com.linkedin.android",
  timeoutMs: 60_000,
});
await on({
  serial,
  event: "ui_stable",
  timeoutMs: 90_000,
  stableMs: 800,
  onEvent: (e) => console.log(e.type, e.attempt),
});
await on({ serial, event: "frame_change", timeoutMs: 30_000 });
```

| Evento | O quê |
|--------|--------|
| `boot` | Sinal de boot do device |
| `app_open` | Package em foreground (`pkg`) |
| `ui_stable` | Frame estável (hash/diff de imagem) |
| `frame_change` | Frame/imagem mudou (hoje via dump legado; alvo = hash visual) |

**Antes → depois:** `handle.on(event, opts)` → `on({ serial, event, … })`. Sem método no provision.

Desconhecido → `EVENT_UNKNOWN`. Sem serial → `EVENT_NO_SERIAL`. Timeout → códigos `EVENT_*`.

---

## 4. Operar tela

```js
await launch({ serial, package: "com.linkedin.android" }); // ou activity
tap({ serial, x: 360, y: 640 });
tapElement({ serial, center: el.center, bounds: el.bounds });
await type({ serial, text: "11999999999", region: { x: 0, y: 700, width: 720, height: 500 } });
scroll({ serial, direction: "down", distance: 800 });
const shot = screenshot({ serial, path: "./screenshots/tela.png" });
const { x, y, confidence } = await matchImage({ serial, templatePath: "./templates/btn.png" });
const { pid } = openScrcpy({ serial, title: `agent ${serial}` });
```

| Função | Erros tipados |
|--------|----------------|
| `launch` | `OPERATE_LAUNCH_FAILED` |
| `type` | `OPERATE_TYPE_FAILED` |
| `screenshot` | `OPERATE_SCREENSHOT_FAILED` |
| `matchImage` | `OPERATE_MATCH_NOT_FOUND` |
| `openScrcpy` | `OPERATE_SCRCPY_FAILED` |

Type: OCR das teclas na **imagem do teclado** (região opcional) e digitação **só com tap** — sem `input text` / ADBKeyboard.

**Antes → depois:** `handle.launch(pkg)` → `launch({ serial, package })` (idem tap/type/…).

---

## 5. Extrair textos — `extract({ serial })`

Pipeline **frame → OCR → lista plana de textos** (sem dump uiautomator, sem árvore DOM). Só elementos `type: "text"`. Cada chamada faz OCR de novo.

**Antes → depois:** `handle.extract()` (cache no handle) → `extract({ serial })` (OCR a cada call).

```js
const elements = await extract({ serial });
// [ { type: "text", text, bounds, center }, … ]

// US-23: findByText — elementos lado a lado contidos na string maior (query)
// const hit = await findByText(serial, "Sign in with Email", { minScore: 0.8 });
```

Fonte do frame: screenshot ADB, stream ou câmera (device real) — mesmo pipeline.  
`vision.js` permanece legado / template match (US-12); **não** tipa o retorno de `extract()`.

Helpers: `findByText` / `extractElements` / `findLoginTarget` / `findEditableFields` em [`lib/extract.js`](lib/extract.js).

---

## 6. Sessão

```js
await saveSession({ serial, kind, path: "./state/session.json", state: { step: "logged-in", apps: […] } });
const state = await restoreSession({ path: "./state/session.json" });
// state inclui serial, kind, savedAt + campos passados
await removeSession({ path: "./state/session.json" }); // true se removeu
```

**Antes → depois:** `handle.saveSession(path, state)` → `saveSession({ serial, kind, path, state })`.

Erros: `SESSION_WRITE_FAILED` · `SESSION_NOT_FOUND` · `SESSION_INVALID`.

---

## 7. Fluxo completo (exemplo)

```js
import { readFileSync } from "node:fs";
import { provisionEmulator } from "./lib/provision.js";
import { on } from "./lib/events.js";
import { installApk } from "./lib/apks.js";
import { launch, screenshot } from "./lib/operate.js";
import { extract } from "./lib/extract.js";
import { resetInstance } from "./lib/reset-instance.js";

const cfg = JSON.parse(readFileSync("./device.config.json", "utf8"));

await resetInstance(cfg); // opcional: instância do zero
const { serial } = await provisionEmulator(cfg);

await installApk({ serial, ...cfg.apps.linkedin });
await launch({ serial, package: cfg.apps.linkedin.package });
await on({ serial, event: "ui_stable", timeoutMs: 90_000 });

screenshot({ serial, path: "./screenshots/01-antes-agree.png" });
const elements = await extract({ serial });
```

---

## 8. Mapa de módulos

| Recorte | Arquivo |
|---------|---------|
| `provisionEmulator` | [`lib/provision.js`](lib/provision.js) |
| `resetInstance` | [`lib/reset-instance.js`](lib/reset-instance.js) |
| AVD / serial / registry | `start-runtime` · `attach-runtime` · `agent-registry` |
| `installApk` | [`lib/apks.js`](lib/apks.js) |
| `on` | [`lib/events.js`](lib/events.js) |
| Gestos / captura | [`lib/operate.js`](lib/operate.js) |
| `extract` | [`lib/extract.js`](lib/extract.js) |
| Sessão | [`lib/session.js`](lib/session.js) |

---

## 9. Testes

| Tipo | Comando |
|------|---------|
| Unitário (mock/stub, ao lado do módulo) | `npm test` |
| BDD e2e US/EP (runtime real) | `npm run test:e2e` |
| **SC-30 LinkedIn** (fixture, sem device) | ver abaixo |
| Piloto LinkedIn ao vivo | `npm run linkedin-login` |
| Exemplo mínimo (provision + scrcpy) | `npm run sample` |

```bash
cd screen-robot/src
npm test
npm run test:e2e   # requer AVD (android-studio) + adb (maioria dos BDDs)

# Só SC-30 / fixture LinkedIn
node --test --test-timeout=120000 test/bdd/sc-30-linkedin-sign-in-with-email.test.js
node --test --test-timeout=120000 lib/find-by-text.fixture.test.js
```

---

## 10. Piloto LinkedIn

```bash
cd screen-robot/src
npm run linkedin-login
```

Script [`scripts/linkedin-login.js`](scripts/linkedin-login.js):

1. Limpa `screenshots/`
2. `resetInstance(cfg)`
3. `provisionEmulator` → `openScrcpy` → `installApk` → `launch` → `on("ui_stable")`
4. `01-tela-inicial.png`
5. `findByText(serial, "Sign in with Email")` → `tapElement` → `02-apos-sign-in-email.png`
6. `extract({ serial })` → console da lista de textos OCR + `frame-screen.png` + `elements.json`

Só LinkedIn (sem Instagram). Sem digitar credenciais e sem `saveSession`.

**SC-30:** fixture [`test/fixtures/linkedin-tela-inicial.png`](test/fixtures/linkedin-tela-inicial.png) · BDD [`test/bdd/sc-30-linkedin-sign-in-with-email.test.js`](test/bdd/sc-30-linkedin-sign-in-with-email.test.js).

---

## 10b. Ver / operar a tela — `scripts/view.sh`

```bash
cd screen-robot/src
npm run view
# ou: ./scripts/view.sh --device emulator-5554
```

Abre **scrcpy** no serial de `device.config.json` (ou `--device`) para visualizar e controlar o Android (tap, digitar, scroll) enquanto a API Node roda.

---

## 11. CLI legado

Steps avulsos (serial explícito; preferir as funções de `lib/`):

```bash
node cli.js tap 360 640 --device emulator-5554
node cli.js setup-ime
node cli.js type "olá"
node cli.js shot ./screenshots/tela.png
node cli.js launch com.linkedin.android
node cli.js config.example.json
```
