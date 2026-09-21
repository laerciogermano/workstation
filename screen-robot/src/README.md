# src — screen-robot

API **Node** (≥ 18) para controlar Android via ADB: provisionar agents, instalar APKs, eventos de UI, gestos, extração de elementos (lista) e sessão.

Visão do projeto: [`../README.md`](../README.md) · Runtimes: [`../pocs/`](../pocs/README.md) · Aceite: [`../5.bdds.md`](../5.bdds.md)

Com o runtime no ar, o Android fica **disponível para controle humano**: espelhar a tela e operar (tap, digitar, scroll, …) via scrcpy — [`scripts/view.sh`](scripts/view.sh) (`npm run view`). A API do handle automatiza as mesmas ações por código.

---

## Instalação / entrada

```bash
cd screen-robot/src
# Node ≥ 18, adb no PATH
# Android SDK / Emulator (AVD) — kind=avd; Google APIs/Play
```

Superfície pública:

```js
import { provisionEmulator } from "./lib/provision.js";
import { resetInstance } from "./lib/reset-instance.js"; // ops — fora do handle
```

Tudo o mais (gestos, APKs, eventos, extract, sessão) vem no **handle** retornado. Não passe `serial` nas operações — ele está no handle. `resetInstance` é export ops (wipe + boot); não é método do handle.

---

## 1. Provisionar agents — `provisionEmulator(cfg)`

Um único método: **cria** se o `name` for novo; **anexa** se o nome já existir (sem criar outro AVD/emulador).

```js
const handle = await provisionEmulator({
  provision: {
    name: "ConnectMax_Cam",   // AVD (= AVD_NAME)
    kind: "avd",              // avd | adb | redroid(legado)
    // serial opcional com kind=avd — resolve via adb pelo name
  },
});
// handle.serial · handle.kind · handle.bootCompleted · handle.provisionedAt

// mesmo name de novo → anexa ao AVD já ligado
const again = await provisionEmulator({
  provision: { name: "ConnectMax_Cam", kind: "avd" },
});
// again.serial === handle.serial
```

| `kind` | Precisa | Comportamento |
|--------|---------|---------------|
| `avd` | `name` | Sobe/anexa AVD; serial sai do `adb` |
| `adb` | `serial` / `device` / `ANDROID_SERIAL` | Só anexa device já online |
| `redroid` | (opcional) `serial` — default `127.0.0.1:5555` | Sobe Docker/Colima via `pocs/redroid/scripts/start.sh` |

| Caso | Comportamento |
|------|----------------|
| Nome/AVD novo | `start.sh` + setup cria AVD, boot ok |
| AVD já no `adb` | Reconecta serial desse AVD — **não** sobe outro |
| `kind=adb` sem serial | `PROVISION_NO_SERIAL` |
| `kind=redroid` sem serial | Usa `127.0.0.1:5555` e sobe o container |

**Antes → depois:** serial era sempre obrigatório e `name` era ignorado no start; agora `kind=avd` + `name` basta (serial resolvido), e `kind=redroid` defaulta o serial TCP. Para AVD canônico (GMS/apps de loja): `kind: "avd"`. Redroid = Android em container (sem GMS completo — ver postmortem).

### Vários em paralelo

```js
const a = await provisionEmulator({ provision: { name: "a", kind: "avd" } });
const b = await provisionEmulator({ provision: { name: "b", kind: "avd" } });
// a.serial !== b.serial — limitação: vários AVDs pesam mais RAM
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

## 2. Instalar APKs — `handle.installApk(app)`

```js
const r = await handle.installApk({
  package: "com.linkedin.android",
  version: "4.1.1093",           // opcional: skip se já instalada
  artifact: "apks/app.apk",      // path local
  // source: "apk-pure",         // download via apkeep se não houver artifact
});
// { package, version, skipped, artifactPath? }
```

Erros: `APK_CONFIG_INVALID` · `APK_DOWNLOAD_FAILED` · `APK_INSTALL_FAILED`.

---

## 3. Eventos de UI — `handle.on(event, opts?, onEvent?)`

```js
await handle.on("boot");
await handle.on("app_open", { pkg: "com.linkedin.android", timeoutMs: 60_000 });
await handle.on("ui_stable", { timeoutMs: 90_000, stableMs: 800 }, (e) => {
  console.log(e.type, e.attempt);
});
await handle.on("frame_change", { timeoutMs: 30_000 });
```

| Evento | O quê |
|--------|--------|
| `boot` | Sinal de boot do device |
| `app_open` | Package em foreground (`opts.pkg`) |
| `ui_stable` | Frame estável (hash/diff de imagem) |
| `frame_change` | Frame/imagem mudou (hash/diff visual) |

Desconhecido → `EVENT_UNKNOWN`. Timeout → códigos `EVENT_*` / timeout do listener.

---

## 4. Operar tela

```js
await handle.launch("com.linkedin.android");           // ou launch(pkg, ".MainActivity")
handle.tap(360, 640);                                  // coords de visão/OCR sobre o frame
handle.tapElement(el);                                 // el.center ou el.bounds (OCR/visão)
handle.type("11999999999", { region: { x: 0, y: 700, width: 720, height: 500 } }); // OCR teclado → tap
handle.scroll({ direction: "down", distance: 800 });   // up|down|left|right; x/y opcionais
const shot = handle.screenshot("./screenshots/tela.png"); // capturar frame (ADB; futuro: câmera)
const { x, y, confidence } = await handle.matchImage("./templates/btn.png");
await handle.openScrcpy(); // { pid, serial } — janela para ver/operar
```

| Método | Erros tipados |
|--------|----------------|
| `launch` | `OPERATE_LAUNCH_FAILED` |
| `type` | `OPERATE_TYPE_FAILED` |
| `screenshot` | `OPERATE_SCREENSHOT_FAILED` |
| `matchImage` | `OPERATE_MATCH_NOT_FOUND` |
| `openScrcpy` | `OPERATE_SCRCPY_FAILED` |

Type: OCR das teclas na **imagem do teclado** (região opcional) e digitação **só com tap** — sem `input text` / ADBKeyboard.

```js
const { pid, serial } = handle.openScrcpy(); // scrcpy no serial do handle
```

---

## 5. Extrair UI — `handle.extract()`

Percepção por **frame → OCR/visão → lista plana** (sem dump uiautomator, sem árvore DOM). Sem parâmetros. Cada chamada **acrescenta elementos** na mesma lista:

```js
const e1 = await handle.extract(); // OCR: textos + bounds
const e2 = await handle.extract(); // lista enriquecida (visão + OCR)
const e3 = await handle.extract(); // ícones (visão)
const e4 = await handle.extract(); // listas (visão + OCR)
const e5 = await handle.extract(); // imagens (visão)
// [ { type: "text"|"icon"|"list"|"image", text?, bounds, center? }, … ]

// US-23: findByText — elementos lado a lado contidos na string maior (query)
// const hit = await findByText(handle.serial, "Sign in with Email", { minScore: 0.8 });
// // → elements: Sign, in, with, Email
```

Fonte do frame: screenshot ADB, stream ou câmera (device real) — mesmo pipeline.

Helpers: `findByText` (encapsula OCR; só vizinhos dentro da query) / `extractElements` / `findLoginTarget` / `findEditableFields` em [`lib/extract.js`](lib/extract.js).

---

## 6. Sessão

```js
await handle.saveSession("./state/session.json", { step: "logged-in", apps: […] });
const state = await handle.restoreSession("./state/session.json");
// state inclui serial, kind, savedAt + campos passados
await handle.removeSession("./state/session.json"); // true se removeu
```

Erros: `SESSION_WRITE_FAILED` · `SESSION_NOT_FOUND` · `SESSION_INVALID`.

---

## 7. Fluxo completo (exemplo)

```js
import { readFileSync } from "node:fs";
import { provisionEmulator } from "./lib/provision.js";
import { resetInstance } from "./lib/reset-instance.js";

const cfg = JSON.parse(readFileSync("./device.config.json", "utf8"));

await resetInstance(cfg); // opcional: instância do zero
const handle = await provisionEmulator(cfg);

await handle.installApk(cfg.apps.linkedin);
await handle.launch(cfg.apps.linkedin.package);
await handle.on("ui_stable", { timeoutMs: 90_000 });

handle.screenshot("./screenshots/01-antes-agree.png");
const elements = await handle.extract();
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
3. `provisionEmulator` → `openScrcpy` → `installApk(linkedin)` → `launch` → `on("ui_stable")`
4. `01-tela-inicial.png`
5. `findByText(serial, "Sign in with Email")` → tap `center` → `02-apos-sign-in-email.png`
6. `extract()` ×5 → console da lista + `frame-screen.png` + `elements.json`

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

Steps avulsos (serial explícito; preferir o handle):

```bash
node cli.js tap 360 640 --device emulator-5554
node cli.js setup-ime
node cli.js type "olá"
node cli.js shot ./screenshots/tela.png
node cli.js launch com.linkedin.android
node cli.js config.example.json
```
