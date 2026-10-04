# src — screen-robot

API **Node** (≥ 18) para controlar Android via ADB: provisionar agents, instalar APKs, eventos de UI, gestos, extração de textos (OCR) e sessão.

Visão do projeto: [`../README.md`](../README.md) · Arquitetura: [`../arquitetura.md`](../arquitetura.md) · Runtimes: [`../pocs/`](../pocs/README.md) · Aceite: [`../5.bdds.md`](../5.bdds.md)

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

**Antes → depois:** `connectTimeoutMs` era um relógio único compartilhado entre start + ADB + boot (start consumia o orçamento do boot). Agora cada fase (`ensureAdbOnline`, `waitBootCompleted`) tem o próprio timeout.

Config de exemplo: [`device.config.json`](device.config.json).  
**US-22** (mascarar identidade): [`../pocs/README.md`](../pocs/README.md#mascarar-identidade-do-aparelho).

---

## Interfaces

Cada seção: **entrada** · **chamada** · **resposta**. Erros tipados em `err.code`.

---

### `provisionEmulator(cfg)`

Cria AVD/agent se `name` for novo; anexa se já existir.

**Entrada**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `provision.name` | sim (`avd`/`redroid`) | Id do agent / nome do AVD |
| `provision.kind` | não | `"avd"` (default) · `"adb"` · `"redroid"` |
| `provision.serial` / `device` | sim se `kind=adb` | Serial ADB já online |
| `provision.connectTimeoutMs` | não | Timeout por fase (ADB / boot) |

| `kind` | Precisa | Comportamento |
|--------|---------|---------------|
| `avd` | `name` | Sobe/anexa AVD; serial sai do `adb` |
| `adb` | `serial` | Só anexa device online |
| `redroid` | `name` ou `serial` | Instância por `name`; sem `name` → `127.0.0.1:5555` |

**Chamada**

```js
const handle = await provisionEmulator({
  provision: { name: "ConnectMax_Cam", kind: "avd" },
});
```

**Resposta**

```json
{
  "serial": "emulator-5554",
  "kind": "avd",
  "bootCompleted": true,
  "provisionedAt": "2026-10-04T14:00:00.000Z"
}
```

Erros: `PROVISION_*` (ex. `PROVISION_NO_SERIAL`, `PROVISION_INVALID_NAME`).

---

### `resetInstance(cfg)`

Wipe + sobe de novo (ADB online + boot).

**Entrada**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `provision.serial` / `device` / `ANDROID_SERIAL` | sim | Serial alvo |
| `provision.kind` | não | Seleciona script de reset |
| `provision.resetScript` | não | Override do script default |
| `provision.connectTimeoutMs` | não | Timeout ADB/boot pós-reset |

**Chamada**

```js
const r = await resetInstance(cfg);
```

**Resposta**

```json
{
  "serial": "emulator-5554",
  "kind": "avd",
  "resetAt": "2026-10-04T14:01:00.000Z"
}
```

Erros: `RESET_NO_SERIAL` · `RESET_FAILED` · `RESET_UNSUPPORTED`.

---

### `installApk(cfg)`

**Entrada**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `serial` | sim | Device |
| `package` | sim* | Package Android |
| `version` | não | Skip se já instalada |
| `artifact` | não* | Path local do APK/XAPK |
| `source` | não* | Ex. `"apk-pure"` — download via apkeep |
| `app` | não | Objeto `{ package, version, artifact?, source? }` (alternativa aos campos flat) |

\* via `cfg` flat ou `cfg.app`.

**Chamada**

```js
const r = await installApk({
  serial,
  package: "com.linkedin.android",
  version: "4.1.1093",
  artifact: "apks/app.apk",
});
// ou: installApk({ serial, app: cfg.apps.linkedin })
```

**Resposta**

```json
{
  "package": "com.linkedin.android",
  "version": "4.1.1093",
  "skipped": false,
  "artifactPath": "/abs/path/apks/app.apk"
}
```

Skip (mesma versão): `{ "package", "version", "skipped": true }`.

Erros: `APK_CONFIG_INVALID` · `APK_NO_SERIAL` · `APK_DOWNLOAD_FAILED` · `APK_INSTALL_FAILED`.

---

### `on(cfg)`

Espera evento de UI.

**Entrada**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `serial` | sim | Device |
| `event` | sim | `boot` · `app_open` · `ui_stable` · `frame_change` |
| `pkg` | `app_open` | Package em foreground |
| `timeoutMs` | não | Timeout da espera |
| `stableMs` | não | Janela estável (`ui_stable`) |
| `onEvent` | não | Callback `(e) => …` |
| `previousFrame` / `previousXml` | não | Baseline (`frame_change`) |

**Chamada**

```js
await on({ serial, event: "boot" });
await on({ serial, event: "app_open", pkg: "com.linkedin.android", timeoutMs: 60_000 });
await on({ serial, event: "ui_stable", timeoutMs: 90_000, stableMs: 800 });
await on({ serial, event: "frame_change", timeoutMs: 30_000 });
```

**Resposta**

Depende do evento (objeto de confirmação / dump). Ex. conceitual:

```json
{ "type": "ui_stable", "attempt": 3, "at": "2026-10-04T14:02:00.000Z" }
```

Erros: `EVENT_NO_SERIAL` · `EVENT_UNKNOWN` · `EVENT_*` (timeout).

---

### `launch(cfg)`

**Entrada**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `serial` | sim | Device |
| `package` / `pkg` | sim | Package |
| `activity` | não | Activity ou `pkg/activity` |

**Chamada**

```js
await launch({ serial, package: "com.linkedin.android" });
```

**Resposta:** `undefined` (side-effect). Erro: `OPERATE_LAUNCH_FAILED` · `OPERATE_NO_SERIAL`.

---

### `tap(cfg)` / `tapElement(cfg)`

Toque em **x,y** (visão/OCR).

**Entrada**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `serial` | sim | Device |
| `x` | sim | Coordenada X |
| `y` | sim | Coordenada Y |

**Chamada**

```js
tap({ serial, x: 360, y: 640 });
tapElement({ serial, x: el.x, y: el.y });
```

**Resposta:** `undefined`. Erro: `OPERATE_TAP_FAILED` · `OPERATE_NO_SERIAL`.

---

### `type(cfg)`

OCR das teclas no frame → tap por caractere (sem `input text` / IME).

**Entrada**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `serial` | sim | Device |
| `text` | sim | String a digitar |
| `region` | não | `{ x, y, width, height }` — ROI do teclado |
| `delayMs` | não | Pausa entre taps (default `100`) |

**Chamada**

```js
await type({
  serial,
  text: "11999999999",
  region: { x: 0, y: 700, width: 720, height: 500 },
});
```

**Resposta:** `undefined`. Erro: `OPERATE_TYPE_FAILED` · `OPERATE_TAP_FAILED`.

---

### `scroll(cfg)`

**Entrada**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `serial` | sim | Device |
| `direction` | não | `down` (default) · `up` · `left` · `right` |
| `distance` | não | Pixels (default `800`) |
| `x` / `y` | não | Origem do swipe (defaults `540` / `1200`) |

**Chamada**

```js
scroll({ serial, direction: "down", distance: 800 });
```

**Resposta:** `undefined`.

---

### `screenshot(cfg)`

**Entrada**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `serial` | sim | Device |
| `path` | sim | Destino do PNG |

**Chamada**

```js
const shot = screenshot({ serial, path: "./screenshots/tela.png" });
```

**Resposta**

```text
"/abs/path/screenshots/tela.png"
```

Erro: `OPERATE_SCREENSHOT_FAILED`.

---

### `matchImage(cfg)`

Template match no frame → ponto **x,y**.

**Entrada**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `serial` | sim | Device |
| `templatePath` | sim | PNG do template |

**Chamada**

```js
const hit = await matchImage({ serial, templatePath: "./templates/btn.png" });
```

**Resposta**

```json
{ "x": 360, "y": 640, "confidence": 0.92 }
```

Erro: `OPERATE_MATCH_NOT_FOUND`.

---

### `openScrcpy(cfg)`

**Entrada**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `serial` | sim | Device |
| `title` | não | Título da janela |
| `detached` | não | Default `true` |
| `extraArgs` | não | Args extras do scrcpy |

**Chamada**

```js
const { pid } = openScrcpy({ serial, title: `agent ${serial}` });
```

**Resposta**

```json
{ "pid": 12345, "serial": "emulator-5554" }
```

Erro: `OPERATE_SCRCPY_FAILED`.

---

### `extract(cfg)`

Frame → OCR → lista plana só `type: "text"` (sem DOM / uiautomator). Cada call = OCR novo.

**Entrada**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `serial` | sim | Device |

**Chamada**

```js
const elements = await extract({ serial });
```

**Resposta**

```json
[
  { "type": "text", "text": "Sign", "x": 273, "y": 833 },
  { "type": "text", "text": "in", "x": 339, "y": 829 },
  { "type": "text", "text": "with", "x": 402, "y": 829 },
  { "type": "text", "text": "Email", "x": 500, "y": 829 }
]
```

**Antes → depois:** `{ text, bounds, center }` → `{ text, x, y }`.

Erros: `EXTRACT_NO_SERIAL` · `EXTRACT_FRAME_FAILED` · `EXTRACT_OCR_FAILED`.

---

### `findByText(serial, query, opts?)`

Encapsula OCR interno; devolve elementos **lado a lado** contidos na query (string maior).

**Entrada**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `serial` | sim | Device (1º arg) |
| `query` | sim | Texto-alvo (ex. `"Sign in with Email"`) |
| `opts.minScore` | não | Limiar (default `0.75`) |

**Chamada**

```js
import { findByText } from "./lib/extract.js";

const hit = await findByText(serial, "Sign in with Email", { minScore: 0.8 });
if (hit) tapElement({ serial, x: hit.x, y: hit.y });
```

**Resposta**

```json
{
  "elements": [
    { "type": "text", "text": "Sign", "x": 273, "y": 833 },
    { "type": "text", "text": "in", "x": 339, "y": 829 },
    { "type": "text", "text": "with", "x": 402, "y": 829 },
    { "type": "text", "text": "Email", "x": 500, "y": 829 }
  ],
  "score": 0.95,
  "text": "sign in with email",
  "x": 386,
  "y": 830
}
```

Sem match: `null`.

---

### `saveSession(cfg)` / `restoreSession(cfg)` / `removeSession(cfg)`

**Entrada**

| Função | Campos |
|--------|--------|
| `saveSession` | `serial` · `kind` · `path` · `state?` (objeto livre) |
| `restoreSession` | `path` |
| `removeSession` | `path` |

**Chamada**

```js
await saveSession({
  serial,
  kind: "avd",
  path: "./state/session.json",
  state: { step: "logged-in" },
});
const state = await restoreSession({ path: "./state/session.json" });
const removed = await removeSession({ path: "./state/session.json" });
```

**Resposta**

`saveSession` → path absoluto:

```text
"/abs/path/state/session.json"
```

`restoreSession` → JSON gravado:

```json
{
  "step": "logged-in",
  "serial": "emulator-5554",
  "kind": "avd",
  "savedAt": "2026-10-04T14:05:00.000Z"
}
```

`removeSession` → `true` se removeu · `false` se arquivo inexistente.

Erros: `SESSION_WRITE_FAILED` · `SESSION_NOT_FOUND` · `SESSION_INVALID`.

---

## Fluxo completo (exemplo)

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

## Mapa de módulos

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

## Testes

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

## Piloto LinkedIn

```bash
cd screen-robot/src
npm run linkedin-login
```

Script [`scripts/linkedin-login.js`](scripts/linkedin-login.js):

1. Limpa `screenshots/`
2. `resetInstance(cfg)`
3. `provisionEmulator` → `openScrcpy` → `installApk` → `launch` → `on("ui_stable")`
4. `01-tela-inicial.png`
5. `findByText(serial, "Sign in with Email")` → `tapElement({ x, y })` → `02-apos-sign-in-email.png`
6. `extract({ serial })` → console da lista de textos OCR + `frame-screen.png` + `elements.json`

Só LinkedIn (sem Instagram). Sem digitar credenciais e sem `saveSession`.

**SC-30:** fixture [`test/fixtures/linkedin-tela-inicial.png`](test/fixtures/linkedin-tela-inicial.png) · BDD [`test/bdd/sc-30-linkedin-sign-in-with-email.test.js`](test/bdd/sc-30-linkedin-sign-in-with-email.test.js).

---

## Ver / operar a tela — `scripts/view.sh`

```bash
cd screen-robot/src
npm run view
# ou: ./scripts/view.sh --device emulator-5554
```

Abre **scrcpy** no serial de `device.config.json` (ou `--device`) para visualizar e controlar o Android (tap, digitar, scroll) enquanto a API Node roda.

---

## Print da tela — `scripts/print.js`

```bash
cd screen-robot/src
npm run print -- -n teste.png
# ou: npm run print -- teste.png
# ou: node scripts/print.js -n tela.png --device emulator-5554
```

Tira screenshot do device online e grava em `screenshots/<nome>.png` (path absoluto ou com `/` grava no caminho dado). Serial: `--device` → `ANDROID_SERIAL` → `device.config.json` → 1º device ADB.

**Antes → depois:** não havia `npm run print`; equivalente antigo: `node cli.js shot ./screenshots/tela.png --device …`. Rollback: remover o script npm `print` e `scripts/print.js`.

---

## 10d. OCR de imagens — `scripts/ocr-image.js`

```bash
cd screen-robot/src
npm run ocr -- screenshots/home.png
npm run ocr -- home.png
npm run ocr -- --all
# testes (um por PNG em screenshots/): node --test lib/screenshots-ocr.test.js
# OCR → screenshots/<nome>.txt
# ícones/imagens (componentes ≠ fundo, sem coords) → screenshots/<nome>/icon-NN.png|image-NN.png
# descritivos (OCR vizinho) → screenshots/<nome>/manifest.json
```

Roda `ocrWords` (tesseract) sobre PNG local e imprime o texto. Sem path → `screenshots/<nome>`. `--all` processa todos os `.png` da pasta. O teste também salva um `.txt` ao lado de cada imagem (`screenshots/home.png` → `screenshots/home.txt`), extrai ícones/imagens para `screenshots/<nome>/` via componentes conectados + `sharp`, e grava `manifest.json` com `{ file, type, bounds, label }` (label = OCR à direita do visual / herdado na mesma linha).

**Antes → depois:** OCR só via `extract({ serial })` (device). Agora dá para OCR de arquivo em `screenshots/` sem ADB; testes gravam `screenshots/<nome>.txt`, crops e `manifest.json` em `screenshots/<nome>/`. Dep: `sharp`. Rollback: remover suite `visuals` / `attachLabels` do teste, dep `sharp`, e as pastas geradas.

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
