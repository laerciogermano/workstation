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
| `decide` / `runAgent` (EP-07) | [`lib/agent-decide.js`](lib/agent-decide.js) · [`lib/agent-run.js`](lib/agent-run.js) · [`lib/gemini.js`](lib/gemini.js) · [`lib/openai.js`](lib/openai.js) · [`lib/vision-frame.js`](lib/vision-frame.js) (`sense=vision`) |
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

# Merge engine=all nas fixtures LinkedIn (People/Connect + tela inicial)
node --test --test-timeout=180000 lib/extract.linkedin-fixtures.test.js
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

**Merge LinkedIn (prints existentes):** [`lib/extract.linkedin-fixtures.test.js`](lib/extract.linkedin-fixtures.test.js) — `engine: "all"` em People (`Connect` + `People` + `comprador` + Campinas/Brazil) e tela inicial (`Sign in` / `Join`). Saída: `test/output/linkedin-people-merge.json` e `linkedin-tela-inicial-merge.json`.

**OCR backends (Connect):** [`lib/extract-engines.js`](lib/extract-engines.js) + `extract({ engine })` / `findByText(..., { engine })`.

Engines: `tesseract` · `macos-vision` · `rapidocr` · `paddleocr` · `easyocr` · **`all`** (merge paralelo das 5).

- **`engine: "all"`** (default do agent): 1 frame → 5 OCR em paralelo → une hits comuns (texto+posição) e soma diferenças ([`lib/ocr-merge.js`](lib/ocr-merge.js)). Engine que falha **ou passa de `OCR_MERGE_TIMEOUT_MS` (default 4000)** é ignorado — extract não espera RapidOCR/Paddle (~20s).
- Pré: `pip3 install --user rapidocr-onnxruntime paddleocr paddlepaddle easyocr pytesseract` · macOS Vision (Swift) · `brew install tesseract` (opcional pytesseract).
- Env: `SCREEN_ROBOT_OCR=all|rapidocr|…` · `OCR_MERGE_DIST_PX` (default 48) · `OCR_MERGE_TIMEOUT_MS=4000` (`0` = sem timeout).
- Comparativo: [`lib/extract.ocr-backends.fixture.test.js`](lib/extract.ocr-backends.fixture.test.js).
- Regressão merge nas prints: [`lib/extract.linkedin-fixtures.test.js`](lib/extract.linkedin-fixtures.test.js).

Antes: um engine por extract (jornada `rapidocr`). Depois: merge top-5. Rollback: `extract({ engine: "rapidocr" })` / `SCREEN_ROBOT_OCR=rapidocr` / agent `engine: "rapidocr"`. Timeout off: `OCR_MERGE_TIMEOUT_MS=0`.

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

Loop genérico: **sense=ocr** (default) extract OCR → decide → operate; ou **sense=vision** print → WebP → decide multimodal → operate. Log em `logs/agent/` e `usage/<timestamp>.json`. Prompt/roteiro entram como **input**.

```bash
cd screen-robot/src
# keys: export … ou arquivo local .env (gitignored; modelo em .env.example)
# cp .env.example .env   # depois preencha OPENAI_API_KEY / GEMINI_API_KEY
export GEMINI_API_KEY=…          # obrigatório para decide Gemini (se não estiver no .env)
# modelo ÚNICO = valor do export (sem fallback automático)
export GEMINI_MODEL=gemini-3.5-flash-lite
# opcional: export GEMINI_FALLBACK_MODELS=gemini-3.1-flash-lite
# opcional: export GEMINI_MAX_PROMPT_CHARS=6000
# opcional: export AGENT_HISTORY_STEPS=12   # janela de passos no prompt (default 12)
# type: default adb; OCR do teclado: export AGENT_TYPE_METHOD=ocr
# fallback OCR→adb se method=ocr falhar (default on): AGENT_TYPE_ADB_FALLBACK=0 para desligar
# OpenAI (gpt-4o-mini):
#   export OPENAI_API_KEY=…   # ou OPENAI_API_KEY=… no .env
#   export AGENT_PROVIDER=openai
#   # ou: --provider openai --model gpt-4o-mini
# retry/indisponível: GEMINI_RETRY_MS=2000 · OPENAI_RETRY_MS=2000 · GEMINI_CHAIN_ROUNDS=30
# 429: espera max(try again in da API, piso×attempt). 0 no env volta ao piso 2s em 429.

npm run agent -- --prompt ../roteiros/jornada-comprador.md
npm run agent -- --prompt ../roteiros/abrir-settings.md
npm run agent -- --prompt ../roteiros/abrir-settings.md --history-steps 16
npm run agent -- --prompt ../roteiros/jornada-completa.md --history-steps 0  # sem histórico no prompt
npm run agent -- --provider openai --model gpt-4o-mini --prompt ../roteiros/abrir-settings.md
npm run agent -- --prompt "abra o LinkedIn e mostre as últimas 10 conexões"
npm run agent -- --prompt ../roteiros/jornada-completa.md --all-models
npm run agent -- --prompt ../roteiros/jornada-completa.md --no-prompt   # sem menu (env/default)
# Vision (sem OCR): print → WebP → modelo multimodal → comandos
npm run agent -- --sense vision --prompt ../roteiros/teste.md --no-prompt
npm run agent -- --vision --provider openai --model gpt-4o-mini --prompt ../roteiros/teste.md
npm run agent:smoke              # 1–2 passos no device; sem key = heurística Connect/scroll
```

**Setup CLI (modelos):** em TTY, sem `--model` / `--no-prompt`, o agent lista o catálogo ([`lib/agent-models.js`](lib/agent-models.js)) e pede a escolha (`1`, `1,3`, `a`=todos, ou id). Vários modelos → roda em sequência, log em `logs/agent/<model>/`. Rollback: `--model <id>` ou `--no-prompt`.

**Antes → depois (id Gemini 3 Flash):** catálogo usava `gemini-3-flash` (HTTP 404 na API) → `gemini-3-flash-preview`. Rollback: só se a API voltar a expor `gemini-3-flash`.

Stdout: `[agent]` / `[decide]` / `[gemini]` ou `[openai]`. Provider default `gemini`; `AGENT_PROVIDER=openai` ou modelo `gpt-*` usa OpenAI. Fallback Gemini só se `GEMINI_FALLBACK_MODELS` estiver setado.

**Antes → depois (.env local):** keys só via export → também `src/.env` / `.env.local` (gitignored), carregados por `run-agent` via [`lib/load-env.js`](lib/load-env.js). Modelo: [`.env.example`](.env.example). Rollback: apagar `.env` e exportar no shell.

**Antes → depois (OpenAI):** só Gemini → também `gpt-4o-mini` via [`lib/openai.js`](lib/openai.js) (`OPENAI_API_KEY`, `--provider openai --model gpt-4o-mini`). Usage OpenAI normalizado para `promptTokenCount`/`candidatesTokenCount`. Rollback: omitir provider/openai e usar só Gemini.

**Antes → depois (extract no stdout):** após cada `extract`, além de `text@x,y`, imprime o JSON completo (`extract return:`). Rollback: só o loop compacto em `dumpOcrStdout`.

**Antes → depois (screencap):** `adb shell screencap` + pull podia travar no AVD → `adb exec-out screencap -p` em [`lib/frame.js`](lib/frame.js) / `screenshot`. Fallback shell+pull se exec-out falhar. Rollback: só shell+pull.

**Antes → depois (OCR no histórico):** cada item de `history` inclui `ocr` compacto (`text,x,y`) da tela daquele passo, além de `resultado`/ação. Aumenta tokens no prompt. Rollback: omitir `ocr` no `history.push`.

**Antes → depois (histórico configurável):** `history.slice(-8)` fixo → janela `historySteps` (default **12**), via `runAgent({ historySteps })` · `AGENT_HISTORY_STEPS` · `--history-steps`. Cada passo grava também `resultado` (ex. `scroll up`) no histórico enviado ao modelo. Rollback: `slice(-8)` sem `resultado`.

**Antes → depois (`--history-steps 0`):** `0` era tratado como inválido e voltava ao default 12 (e `slice(-0)` mandaria o histórico inteiro). Agora **0 = sem bloco “Histórico recente” no prompt**. Rollback: `n < 1 → DEFAULT_HISTORY_STEPS`.

**Antes → depois (`AGENT_TYPE_METHOD`):** default OCR/tap → default **adb** (`adb shell input text`). OCR: `AGENT_TYPE_METHOD=ocr` ou `runAgent({ typeMethod: "ocr" })`. Rollback: `AGENT_TYPE_METHOD=ocr`.

**Antes → depois (home/Settings no system prompt):** lite fazia `scroll up` na home e reabria o shade; agora o system de `decide` manda shade→`KEYCODE_BACK`/`HOME`, gaveta→`scroll down`, tap em `Settings`. Roteiro: [`roteiros/abrir-settings.md`](../roteiros/abrir-settings.md). Rollback: remover o bloco “Home / Settings” de `buildSystemPrompt`.

**Antes → depois (scroll após Search):** com teclado aberto o OCR às vezes só traz a hora; o modelo tratava como home e fazia `scroll down`, digitando lixo (`ty`/`tyl`) no campo. Agora: (1) system prompt: histórico com tap `y<120` + OCR só hora ≠ home — proibido scroll; (2) guard em `runAgent` troca esse `scroll` por `type` (texto do roteiro `type "…"`) ou `KEYCODE_BACK`. Rollback: remover a EXCEÇÃO em `buildSystemPrompt` e o bloco `lastWasSearchTap` em `agent-run.js`.

**Antes → depois (sense vision):** só OCR → também `--sense vision` / `--vision` / `AGENT_SENSE=vision`: `captureFrame` → [`lib/vision-frame.js`](lib/vision-frame.js) WebP (default width 540 q60; `VISION_WIDTH` / `VISION_QUALITY` / `--vision-width` / `--vision-quality`) → Gemini/OpenAI com imagem → JSON de ação; coords da IA × `scaleToDevice` antes do tap. Sem `extract`/OCR. Logs omitem base64. Rollback: `--sense ocr` (default).

**Antes → depois (modelo):** `gemini-2.5-flash-lite` (404 new users) → `gemini-3.5-flash-lite` (recomendado pela API). Rollback: `export GEMINI_MODEL=gemini-3.1-flash-lite`.

**Antes → depois (retry saturado):** espera `GEMINI_CHAIN_WAIT_MS×round` (800) / `GEMINI_RETRY_MS` (250) → **0ms** (retry imediato) e **30** rounds. Rollback: `export GEMINI_CHAIN_WAIT_MS=800 GEMINI_RETRY_MS=250 GEMINI_CHAIN_ROUNDS=2`.

**Antes → depois (retry 429 / TPM):** retry imediato (0ms) estourava rate limit (`try again in 728ms`). Agora piso **2000ms** (`OPENAI_RETRY_MS` / `GEMINI_RETRY_MS`) e, se a API informar `try again in …`, usa o maior entre esse valor e o piso. [`lib/retry-wait.js`](lib/retry-wait.js). Rollback: `export OPENAI_RETRY_MS=0 GEMINI_RETRY_MS=0 GEMINI_CHAIN_WAIT_MS=0` (429 ainda espera 2s).

**Antes → depois (não morrer):** timeout/503/`fail` da API abortava a run → agora só registra e tenta o próximo passo até `done` ou `maxSteps`.

**Antes → depois (sem espera):** `AGENT_RECOVER_MS` 1500 / `stepDelayMs` 600 / loading 800ms / request timeout 30s → defaults **0** (retry na hora; request sem abort). Rollback: `export AGENT_RECOVER_MS=1500 AGENT_STEP_DELAY_MS=600 GEMINI_TIMEOUT_MS=30000`.

**Antes → depois (recover device offline):** extract falhava (`device not found`) e reentrava em 0ms até `maxSteps`. Default `AGENT_RECOVER_MS=2000`. Rollback: `export AGENT_RECOVER_MS=0`.

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

Testes: `node --test lib/gemini.test.js lib/openai.test.js lib/agent-decide.test.js lib/agent-run.test.js`.  
Plano: [`../implementation-plan/EP-07-motor-gemini.md`](../implementation-plan/EP-07-motor-gemini.md).  
POC custo/visão: [`test/output/poc-vision/custos-por-agente.md`](test/output/poc-vision/custos-por-agente.md).

Cada `runAgent` grava em `usage/` (sem subpasta): **1 arquivo `<ISO-stamp-com-ms>.json` por request HTTP ao chat**. Colisão no mesmo ms → sufixo `-2`, `-3`….

### Relatório HTML de tokens

```bash
cd screen-robot/src
npm run usage:report
# abre usage/dashboard.html no browser
```

Gera [`usage/dashboard.html`](usage/dashboard.html) com **todos** os `usage/*.json` (inclusive falhas sem `usageMetadata`), cards, barras por request, acumulado e tabela. Filtro: Todos ou por `run`.

**Antes → depois:** usage só em JSON solto → relatório visual regenerável. Rollback: `rm usage/dashboard.html scripts/build-usage-dashboard.js` e remover script `usage:report` do `package.json`.

**Antes → depois (todos os arquivos):** o gerador filtrava `totalTokenCount > 0` e omitia requests com erro (ex. 503). Agora inclui 100% dos `.json` em `usage/`. Rollback: `.filter((r) => r.total > 0)`.

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
