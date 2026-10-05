# src — screen-robot

API **Node** (≥ 18) para controlar Android via ADB: provisionar agents, instalar APKs, eventos de UI, gestos, extração de textos (OCR) e sessão.

Visão do projeto: [`../README.md`](../README.md) · Arquitetura: [`../arquitetura.md`](../arquitetura.md) · Runtimes: [`../pocs/`](../pocs/README.md) · Aceite: [`../5.bdds.md`](../5.bdds.md)

Com o runtime no ar, o Android fica **disponível para controle humano**: espelhar a tela e operar (tap, digitar, scroll, …) via scrcpy — [`scripts/view.sh`](scripts/view.sh) (`npm run view`). A API automatiza as mesmas ações por código.

---

## Instalação / entrada

```bash
cd screen-robot/src
# Node ≥ 18, adb no PATH
# Mac: Android SDK / Emulator — kind=avd (Google APIs/Play)
# Linux+KVM: kind=docker-avd — ver ../pocs/docker-avd/README.md (ABI x86_64)
```

Superfície pública (funções puras; `serial` no cfg):

```js
import { provisionEmulator } from "./lib/provision.js";
import { on } from "./lib/events.js";
import { installApk } from "./lib/apks.js";
import { launch, tap, tapElement, type, scroll, screenshot, matchImage, openScrcpy } from "./lib/operate.js";
import { extract } from "./lib/extract.js";
import { decide } from "./lib/agent-decide.js";
import { runAgent } from "./lib/agent-run.js";
import { saveSession, removeSession, restoreSession } from "./lib/session.js";
import { resetInstance } from "./lib/reset-instance.js";
```

**Antes → depois:** `connectTimeoutMs` era um relógio único compartilhado entre start + ADB + boot (start consumia o orçamento do boot). Agora cada fase (`ensureAdbOnline`, `waitBootCompleted`) tem o próprio timeout.

Config de exemplo: [`device.config.json`](device.config.json).  
**US-22** (mascarar identidade): [`../pocs/README.md`](../pocs/README.md#mascarar-identidade-do-aparelho).

---

## Interfaces (entrada / saída)

Contrato canônico: [`../README.md#interfaces`](../README.md#interfaces) — uma seção por função com **entrada** e **saída** exemplo (`extract` / `findByText` / `tap` = **x,y**).

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
| `decide` / `runAgent` (EP-07 Gemini) | [`lib/agent-decide.js`](lib/agent-decide.js) · [`lib/agent-run.js`](lib/agent-run.js) · [`lib/gemini.js`](lib/gemini.js) |
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

# OCR People/comprador (fixture com Connect na UI; imprime retorno no console)
node --test --test-timeout=120000 lib/extract.people-comprador.fixture.test.js

# Comparar backends OCR na mesma fixture (quem vê Connect?)
# Pré: darwin para macos-vision; `pip3 install --user rapidocr-onnxruntime` para rapidocr
node --test --test-timeout=180000 lib/extract.ocr-backends.fixture.test.js
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

**People/comprador OCR:** fixture [`test/fixtures/linkedin-people-comprador-connect.png`](test/fixtures/linkedin-people-comprador-connect.png) · teste [`lib/extract.people-comprador.fixture.test.js`](lib/extract.people-comprador.fixture.test.js) — print no console e grava [`test/output/linkedin-people-comprador-connect.ocr.json`](test/output/linkedin-people-comprador-connect.ocr.json) (+ `.txt`).

**OCR backends (Connect):** [`lib/extract-engines.js`](lib/extract-engines.js) + `extract({ engine })` / `findByText(..., { engine })` — `tesseract` (default se omitido) · `macos-vision` · `rapidocr`. Jornada comprador usa **`engine: "rapidocr"`** ([`roteiros/jornada-comprador.md`](../roteiros/jornada-comprador.md)). Pré RapidOCR: `pip3 install --user rapidocr-onnxruntime`. Comparativo: [`lib/extract.ocr-backends.fixture.test.js`](lib/extract.ocr-backends.fixture.test.js). Antes: jornada no tesseract (Connect invisível); depois: RapidOCR no roteiro. Rollback: tirar `engine: "rapidocr"` do roteiro / voltar tesseract.

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

## Motor Gemini (EP-07) — `decide` / `runAgent`

Loop genérico: OCR RapidOCR → Gemini 3.8 Flash → `tap`/`scroll`/`type`/`key` → log em `logs/agent/` e créditos em `usage/<timestamp>.json` (**1 arquivo por request**, flat). Prompt/roteiro entram como **input** (não hardcodar jornada).

```bash
cd screen-robot/src
export GEMINI_API_KEY=…          # obrigatório para decide real
# modelo ÚNICO = valor do export (sem fallback automático)
export GEMINI_MODEL=gemini-3.5-flash-lite
# opcional: export GEMINI_FALLBACK_MODELS=gemini-3.1-flash-lite
# opcional: export GEMINI_MAX_PROMPT_CHARS=6000
# opcional: export AGENT_HISTORY_STEPS=12   # janela de passos no prompt (default 12)
# retry/indisponível: GEMINI_RETRY_MS=0 · GEMINI_CHAIN_WAIT_MS=0 · GEMINI_CHAIN_ROUNDS=30
# (saturado → reenvia na hora, sem backoff; até N rounds)

npm run agent -- --prompt ../roteiros/jornada-comprador.md
npm run agent -- --prompt ../roteiros/abrir-settings.md
npm run agent -- --prompt ../roteiros/abrir-settings.md --history-steps 16
npm run agent -- --prompt "abra o LinkedIn e mostre as últimas 10 conexões"
npm run agent:smoke              # 1–2 passos no device; sem key = heurística Connect/scroll
```

Stdout: `[agent]` / `[decide]` / `[gemini]`. Usa **só** `GEMINI_MODEL` (default código `gemini-3.5-flash-lite`). Fallback só se `GEMINI_FALLBACK_MODELS` estiver setado.

**Antes → depois (histórico configurável):** `history.slice(-8)` fixo → janela `historySteps` (default **12**), via `runAgent({ historySteps })` · `AGENT_HISTORY_STEPS` · `--history-steps`. Cada passo grava também `resultado` (ex. `scroll up`) no histórico enviado ao modelo. Rollback: `slice(-8)` sem `resultado`.

**Antes → depois (home/Settings no system prompt):** lite fazia `scroll up` na home e reabria o shade; agora o system de `decide` manda shade→`KEYCODE_BACK`/`HOME`, gaveta→`scroll down`, tap em `Settings`. Roteiro: [`roteiros/abrir-settings.md`](../roteiros/abrir-settings.md). Rollback: remover o bloco “Home / Settings” de `buildSystemPrompt`.

**Antes → depois (modelo):** `gemini-2.5-flash-lite` (404 new users) → `gemini-3.5-flash-lite` (recomendado pela API). Rollback: `export GEMINI_MODEL=gemini-3.1-flash-lite`.

**Antes → depois (retry saturado):** espera `GEMINI_CHAIN_WAIT_MS×round` (800) / `GEMINI_RETRY_MS` (250) → **0ms** (retry imediato) e **30** rounds. Rollback: `export GEMINI_CHAIN_WAIT_MS=800 GEMINI_RETRY_MS=250 GEMINI_CHAIN_ROUNDS=2`.

**Antes → depois (não morrer):** timeout/503/`fail` da API abortava a run → agora só registra, espera (`AGENT_RECOVER_MS` default 1500) e tenta o próximo passo até `done` ou `maxSteps`. Timeout request default **30s** (antes 12s). Rollback: restaurar `break` no catch do `decide`.

```js
import { decide } from "./lib/agent-decide.js";
import { runAgent } from "./lib/agent-run.js";

const { acao } = await decide({ prompt, ocr, history, historySteps: 12 });
const { status, logPath, usagePath, usage } = await runAgent({
  serial,
  prompt,
  maxSteps: 40,
  historySteps: 12,
});
```

Testes: `node --test lib/gemini.test.js lib/agent-decide.test.js lib/agent-run.test.js`.  
Plano: [`../implementation-plan/EP-07-motor-gemini.md`](../implementation-plan/EP-07-motor-gemini.md).  
POC custo/visão: [`test/output/poc-vision/custos-por-agente.md`](test/output/poc-vision/custos-por-agente.md).

Cada `runAgent` grava em `usage/` (sem subpasta): **1 arquivo `<ISO-stamp-com-ms>.json` por request HTTP ao chat**. Colisão no mesmo ms → sufixo `-2`, `-3`….

Abort (Ctrl+C) mantém os arquivos já gravados. Status mid-run: `running` no log.

**Antes → depois (usage):** só gravava passo com `usageMetadata`; stamp sem ms podia sobrescrever; Ctrl+C perdia flush. Rollback: stamp `.slice(0,19)` e push só se `decision.usage`.

**Antes → depois (1 arquivo/request flat):** pasta `usage/<stamp>/req-NNN.json` → `usage/<timestamp>.json` direto sob `usage/`. Rollback: estrutura com subpasta + `run.json`.

**Antes → depois (prompt no usage):** só `promptChars`/`systemChars` → grava `prompt`, `system` e `response` completos em cada `usage/<timestamp>.json`. Rollback: omitir esses campos.

**Antes → depois (input/output):** além de `system`/`prompt`/`response`, grava `input` (system + prompt + body HTTP) e `output` (text + raw da API) + `roteiro` original completo. Rollback: só campos textuais.

**Antes → depois (acao no usage):** `acao` era só a string do `type` (`"scroll"`); agora grava o objeto parseado completo (`type`, `x`, `y`, `direction`, `motivo`, …) + `resumo` + `elementos`. A ação completa também continua em `response`/`output.text` (JSON string). Rollback: `acao: decision.acao?.type`.

**Antes → depois:** `scroll down` somava y (lista People não andava no AVD); `type` tocava teclas até falhar e o fallback ADB concatenava (`cccomprador`). Agora `down` = dedo sobe; teclas resolvidas antes de tap; tecla QWERTY ausente interpolada; fallback ADB limpa o campo. Rollback: `y2 = y + distance` e type sem interpolação/limpeza.

**Antes → depois:** IA no chat Cursor chama `extract`/`tap` à mão → `runAgent` + `GEMINI_API_KEY`. Rollback: não usar `npm run agent`; voltar ao fluxo manual do roteiro.

---

## POC visão comprimida — `scripts/poc-vision-compress.js`

```bash
cd screen-robot/src
npm run poc:vision
# ou: node scripts/poc-vision-compress.js --input test/fixtures/linkedin-tela-inicial.png
# flags: --width 540 --quality 60 --out test/output/poc-vision
```

Pega um PNG LinkedIn de fixture, reduz para largura 540 + WebP q60 e gera artefatos para colar numa IA multimodal (sem chamar API):

| Arquivo | Uso |
|---------|-----|
| `test/output/poc-vision/compressed.webp` | Anexar na IA |
| `test/output/poc-vision/prompt.md` | Colar como texto |
| `test/output/poc-vision/meta.json` | Bytes, escala device, estimativa de tiles/tokens |
| `test/output/poc-vision/compressed-20kb.webp` | Variante ~20 KB (1 tile) |
| [`test/output/poc-vision/custos-por-agente.md`](test/output/poc-vision/custos-por-agente.md) | Custo US$/mês por agente — OCR com tokens medidos em `usage/` · imagem ainda estimativa POC |

Default input: `test/fixtures/linkedin-people-comprador-connect.png`. Coordenadas da IA estão na escala da WebP; para o AVD multiplique por `scaleToDevice` do `meta.json`.

**Antes → depois:** não havia POC de compressão+prompt; só OCR/texto via `extract` / `npm run ocr`. Custo era só em canvas Cursor → agora MD versionado em `custos-por-agente.md`. Rollback: remover `scripts/poc-vision-compress.js`, script npm `poc:vision` e pasta `test/output/poc-vision/`.

**Antes → depois (custos):** OCR in/out estimados 894/120 → **2.657/373** (média `usageMetadata` em `usage/`, 66 ops). Custo 3.8 Flash OCR /mês US$ 1,34 → **US$ 4,07**. Imagem ~20 KB segue estimativa POC até haver usage agent. Rollback: valores estimados na revisão anterior de `custos-por-agente.md`.

---

## OCR de imagens — `scripts/ocr-image.js`

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

## CLI legado

Steps avulsos (serial explícito; preferir as funções de `lib/`):

```bash
node cli.js tap 360 640 --device emulator-5554
node cli.js setup-ime
node cli.js type "olá"
node cli.js shot ./screenshots/tela.png
node cli.js launch com.linkedin.android
node cli.js config.example.json
```
