# screen-robot

Agent Android via **Node**: frame → OCR → gestos. Sem dump uiautomator / árvore DOM.

**Libs:** [`src/`](src/README.md) · **IA (npm run):** [`src/lib/README.md`](src/lib/README.md) · **Stories:** [`1.stories.md`](1.stories.md) · **Arquitetura:** [`arquitetura.md`](arquitetura.md) · **Runtime AVD:** [`pocs/android-studio/`](pocs/android-studio/README.md) · **docker-avd (Linux):** [`pocs/docker-avd/`](pocs/docker-avd/README.md)

```js
import { provisionEmulator } from "./src/lib/provision.js";
import { on } from "./src/lib/events.js";
import { installApk } from "./src/lib/apks.js";
import { launch, tap, tapElement, type, scroll, screenshot, matchImage, openScrcpy } from "./src/lib/operate.js";
import { extract, findByText } from "./src/lib/extract.js";
import { decide } from "./src/lib/agent-decide.js";
import { runAgent } from "./src/lib/agent-run.js";
import { saveSession, restoreSession, removeSession } from "./src/lib/session.js";
import { resetInstance } from "./src/lib/reset-instance.js";
```

Pré-requisitos: Node ≥ 18 · `adb` · AVD (`kind: "avd"`, Mac) ou Linux+KVM (`kind: "docker-avd"`) · config [`src/device.config.json`](src/device.config.json).  
Motor Gemini (EP-07): `GEMINI_API_KEY` · modelo default `gemini-3.8-flash`. Fallback: desce até `gpt-4o-mini` (`OPENAI_API_KEY`; `AGENT_FALLBACK_MODELS=off` desliga).

---

## Interfaces

Cada interface: **entrada** · **saída**. Erros tipados em `err.code`.

---

### `provisionEmulator(cfg)`

Cria se `name` novo; anexa se já existir.

**Entrada**

| Campo | Obrig. | Descrição |
|-------|--------|-----------|
| `provision.name` | sim (`avd`/`redroid`/`docker-avd`) | Id do agent / AVD |
| `provision.kind` | | `"avd"` · `"adb"` · `"redroid"` · `"docker-avd"` |
| `provision.serial` | se `adb` | Serial já online |
| `provision.connectTimeoutMs` | | Timeout por fase |

`docker-avd`: Linux + `/dev/kvm`; serial `127.0.0.1:5655+`; ABI guest **x86_64**. Mac → `avd`. Ver [`pocs/docker-avd/`](pocs/docker-avd/README.md).

**Saída**

```json
{
  "serial": "emulator-5554",
  "kind": "avd",
  "bootCompleted": true,
  "provisionedAt": "2026-10-04T14:00:00.000Z"
}
```

```js
const { serial } = await provisionEmulator({
  provision: { name: "agent-a", kind: "avd" },
});

// Linux + KVM (estado em volume Docker; export/import no POC)
// await provisionEmulator({ provision: { name: "agent-a", kind: "docker-avd" } });
```

---

### `resetInstance(cfg)`

Wipe + sobe de novo.

**Entrada**

| Campo | Obrig. | Descrição |
|-------|--------|-----------|
| `provision.serial` / `device` | sim | Serial alvo |
| `provision.kind` | | Script de reset |
| `provision.resetScript` | | Override |
| `provision.connectTimeoutMs` | | Timeout pós-reset |

**Saída**

```json
{
  "serial": "emulator-5554",
  "kind": "avd",
  "resetAt": "2026-10-04T14:01:00.000Z"
}
```

---

### `installApk(cfg)`

**Entrada**

| Campo | Obrig. | Descrição |
|-------|--------|-----------|
| `serial` | sim | Device |
| `package` | sim* | Package |
| `version` | | Skip se igual |
| `artifact` | * | Path local APK/XAPK |
| `source` | * | Ex. `"apk-pure"` |
| `app` | | `{ package, version, artifact?, source? }` |

\* flat ou via `app`.

**Saída**

```json
{
  "package": "com.linkedin.android",
  "version": "4.1.1093",
  "skipped": false,
  "artifactPath": "/abs/path/apks/app.apk"
}
```

```js
await installApk({ serial, package: "com.linkedin.android", artifact: "apks/app.apk" });
```

---

### `on(cfg)`

**Entrada**

| Campo | Obrig. | Descrição |
|-------|--------|-----------|
| `serial` | sim | Device |
| `event` | sim | `boot` · `app_open` · `ui_stable` · `frame_change` |
| `pkg` | `app_open` | Package em foreground |
| `timeoutMs` | | Timeout |
| `stableMs` | | Janela (`ui_stable`) |
| `onEvent` | | Callback |

**Saída** (ex. `ui_stable`)

```json
{ "type": "ui_stable", "attempt": 3, "at": "2026-10-04T14:02:00.000Z" }
```

```js
await on({ serial, event: "ui_stable", timeoutMs: 90_000 });
```

---

### `launch(cfg)`

**Entrada**

| Campo | Obrig. | Descrição |
|-------|--------|-----------|
| `serial` | sim | Device |
| `package` / `pkg` | sim | Package |
| `activity` | | Activity opcional |

**Saída:** `undefined`

```js
await launch({ serial, package: "com.linkedin.android" });
```

---

### `tap(cfg)` / `tapElement(cfg)`

Toque em **x,y**.

**Entrada**

| Campo | Obrig. | Descrição |
|-------|--------|-----------|
| `serial` | sim | Device |
| `x` | sim | X |
| `y` | sim | Y |

**Saída:** `undefined`

```js
tap({ serial, x: 360, y: 640 });
tapElement({ serial, x: hit.x, y: hit.y });
```

---

### `type(cfg)`

- `method: "adb"` (default): `adb shell input text` no campo focado (espaços → `%s`)
- `method: "ocr"`: OCR das teclas → tap por caractere

**Entrada**

| Campo | Obrig. | Descrição |
|-------|--------|-----------|
| `serial` | sim | Device |
| `text` | sim | Texto |
| `method` | | `"adb"` (default) · `"ocr"` |
| `region` | | `{ x, y, width, height }` teclado (só OCR) |
| `delayMs` | | Default `100` (só OCR) |
| `engine` | | `"tesseract"` · `"macos-vision"` · `"rapidocr"` · `"paddleocr"` · `"easyocr"` · `"all"` (merge) |

**Saída:** `undefined`

```js
await type({ serial, text: "Campinas" });
await type({ serial, text: "11999999999", method: "ocr", region: { x: 0, y: 700, width: 720, height: 500 } });
```

**Antes → depois:** default OCR/tap → default `adb input text`. Rollback: `method: "ocr"` ou `AGENT_TYPE_METHOD=ocr`.

---

### `scroll(cfg)`

**Entrada**

| Campo | Obrig. | Descrição |
|-------|--------|-----------|
| `serial` | sim | Device |
| `direction` | | `down` · `up` · `left` · `right` |
| `distance` | | Default ~35% da altura (`wm size`); **antes** 800 |
| `x` / `y` | | Origem do swipe; default centro / ~62% da altura (**antes** 540,1200) |

`down` = ver itens abaixo (dedo sobe). **Antes:** `y2 = y + distance` saía da tela no AVD 720×1280 e a lista não andava. Rollback: `y2 = y + distance`, default `x=540,y=1200,distance=800`.

**Saída:** `undefined`

```js
scroll({ serial, direction: "down", distance: 800 });
```

---

### `screenshot(cfg)`

**Entrada**

| Campo | Obrig. | Descrição |
|-------|--------|-----------|
| `serial` | sim | Device |
| `path` | sim | Destino PNG |

**Saída**

```text
"/abs/path/screenshots/tela.png"
```

```js
const path = screenshot({ serial, path: "./screenshots/tela.png" });
```

---

### `matchImage(cfg)`

**Entrada**

| Campo | Obrig. | Descrição |
|-------|--------|-----------|
| `serial` | sim | Device |
| `templatePath` | sim | PNG template |

**Saída**

```json
{ "x": 360, "y": 640, "confidence": 0.92 }
```

```js
const { x, y, confidence } = await matchImage({ serial, templatePath: "./templates/btn.png" });
```

---

### `openScrcpy(cfg)`

**Entrada**

| Campo | Obrig. | Descrição |
|-------|--------|-----------|
| `serial` | sim | Device |
| `title` | | Título da janela |
| `detached` | | Default `true` |
| `extraArgs` | | Args scrcpy |

**Saída**

```json
{ "pid": 12345, "serial": "emulator-5554" }
```

```js
const { pid } = openScrcpy({ serial, title: `agent ${serial}` });
```

---

### `extract(cfg)`

Frame → OCR + blobs visuais (sem IA) → lista plana.

**Entrada**

| Campo | Obrig. | Descrição |
|-------|--------|-----------|
| `serial` | sim | Device |
| `engine` | | OCR: `tesseract` · `rapidocr` · `macos-vision` · `paddleocr` · `easyocr` · `all` |
| `icons` | | `true` anexa `{ type:"icon", x, y }`. Default `false` |

**Saída** (default, `icons: false`)

```json
[
  { "type": "text", "text": "Sign", "x": 273, "y": 833 }
]
```

Com `icons: true`:

```json
[
  { "type": "text", "text": "Sign", "x": 273, "y": 833 },
  { "type": "icon", "x": 80, "y": 140 }
]
```

`text` tem `text`+`x,y`. `icon` só `x,y` (centro do blob; sem `text`). Blob que já contém um hit OCR é omitido.

CLI: `npm run extract -- --icons true` · `--no-icons`. Env: `SCREEN_ROBOT_ICONS=1`.

**Antes → depois:** ícones sempre on → opt-in `icons: true` (default só OCR). Rollback: omitir a flag / `icons: false`.

```js
const texts = await extract({ serial });
const both = await extract({ serial, icons: true });
```

---

### `findByText(serial, query, opts?)`

OCR interno; elementos lado a lado contidos na query.

**Entrada**

| Campo | Obrig. | Descrição |
|-------|--------|-----------|
| `serial` | sim | Device |
| `query` | sim | Ex. `"Sign in with Email"` |
| `opts.minScore` | | Default `0.75` |

**Saída**

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

```js
const hit = await findByText(serial, "Sign in with Email", { minScore: 0.8 });
if (hit) tapElement({ serial, x: hit.x, y: hit.y });
```

---

### `saveSession(cfg)`

**Entrada:** `serial` · `kind` · `path` · `state?`

**Saída**

```text
"/abs/path/state/session.json"
```

---

### `restoreSession(cfg)`

**Entrada:** `path`

**Saída**

```json
{
  "step": "logged-in",
  "serial": "emulator-5554",
  "kind": "avd",
  "savedAt": "2026-10-04T14:05:00.000Z"
}
```

---

### `removeSession(cfg)`

**Entrada:** `path`

**Saída:** `true` se removeu · `false` se inexistente

```js
await saveSession({ serial, kind, path: "./state/session.json", state: { step: "logged-in" } });
const state = await restoreSession({ path: "./state/session.json" });
await removeSession({ path: "./state/session.json" });
```

---

### `decide(cfg)` — EP-07

Decide a próxima ação via **Gemini 3.8 Flash** a partir do OCR (sem imagem).

**Entrada:** `prompt` · `ocr` (`{ text, x, y }[]`) · `history?` · `model?` · `apiKey?` (`GEMINI_API_KEY`)

**Saída**

```json
{
  "resumo": "lista People com Connect",
  "acao": {
    "type": "tap",
    "x": 458,
    "y": 344,
    "direction": null,
    "text": null,
    "code": null,
    "ms": null,
    "motivo": "Connect"
  }
}
```

`acao.type`: `tap` | `scroll` | `type` | `key` | `sleep` | `done` | `fail`. Coords = escala do device (`extract`).

---

### `runAgent(cfg)` — EP-07

Loop: `extract` (OCR) → `decide` → gesto → log `.md`.

**Entrada:** `serial` · `prompt` · `maxSteps?` (40) · `engine?` (`all` = merge top-5; jornada Campinas: `rapidocr`) · `logDir?` · `usageDir?`

**Saída:** `{ status: "done"|"fail"|"max_steps", steps, logPath, usagePath, usage }`

Créditos: `src/usage/<timestamp>.json` (1 arquivo único por execução). **Antes:** `jornada-comprador.json` agregado. Rollback: agregar por promptId.

```js
const result = await runAgent({
  serial,
  prompt: readFileSync("./roteiros/jornada-comprador.md", "utf8"),
  maxSteps: 40,
});
```

```bash
cd screen-robot/src
export GEMINI_API_KEY=…
npm run agent -- --prompt ../roteiros/jornada-comprador.md
# gpt-4o-mini + RapidOCR (sem engine=all):
npm run agent -- --provider openai --model gpt-4o-mini --no-prompt --engine rapidocr --max-steps 80 --history-steps 1 --prompt ../roteiros/jornada-linkedin-campinas.md
npm run agent:smoke   # 1–2 passos; sem key usa heurística Connect/scroll
```

**Antes → depois:** decisão manual no chat → `runAgent` / `npm run agent`. Rollback: não chamar o motor; operar EP-04/05 + roteiro.

Plano: [`implementation-plan/EP-07-motor-gemini.md`](implementation-plan/EP-07-motor-gemini.md).

---

## Uso rápido

```bash
cd screen-robot/src
npm test
npm run linkedin-login   # piloto
npm run view             # scrcpy
npm run extract          # IA: OCR (engine=all); `--icons true` para blobs
npm run agent -- --prompt ../roteiros/jornada-comprador.md   # GEMINI_API_KEY
```

| Doc | Link |
|-----|------|
| Implementação / testes / CLI | [`src/README.md`](src/README.md) |
| IA: `npm run <acao>` no device | [`src/lib/README.md`](src/lib/README.md) |
| Stories · épicos · BDDs | [`1.stories.md`](1.stories.md) · [`2.epics.md`](2.epics.md) · [`5.bdds.md`](5.bdds.md) |
| Motor Gemini (EP-07) | [`implementation-plan/EP-07-motor-gemini.md`](implementation-plan/EP-07-motor-gemini.md) |
| Jornada comprador (IA + OCR; filtro cidade Campinas após People; digitar tudo e checar valor só no fim; `### Comprador` por Connect; sem script com roteiro preso) | [`roteiros/jornada-comprador.md`](roteiros/jornada-comprador.md) |
| Jornada LinkedIn Campinas (gpt-4o-mini; OCR só RapidOCR; Connect até limite de convites) | [`roteiros/jornada-linkedin-campinas.md`](roteiros/jornada-linkedin-campinas.md) |
| Referência Instagram (ops Android/PT por funcionalidade; Help Center) | [`roteiros/instagram-referencia.md`](roteiros/instagram-referencia.md) |
| OCR backends + merge `all` (5 engines) | [`src/README.md`](src/README.md) · [`src/lib/extract-engines.js`](src/lib/extract-engines.js) · [`src/lib/ocr-merge.js`](src/lib/ocr-merge.js) |
| Ícones no extract (opt-in `icons: true`) | [`src/lib/extract-icons.js`](src/lib/extract-icons.js) · relatório [`src/test/output/linkedin-people-extract-calls.md`](src/test/output/linkedin-people-extract-calls.md) |
| Identidade do aparelho (US-22) | [`pocs/README.md`](pocs/README.md#mascarar-identidade-do-aparelho) |
| Postmortem runtime | [`postmortem.md`](postmortem.md) |
