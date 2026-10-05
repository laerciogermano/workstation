# Implementation plan — EP-07 Motor de decisão (Gemini)

**Por quê:** plano técnico do épico (contratos · fluxo · como utilizar · árvore).  
**Épico:** [`2.epics.md`](../2.epics.md).  
**US:** US-24 · US-25 · [`1.stories.md`](../1.stories.md) · [`4.scenarios.md#ep-07--motor-de-decisão-gemini`](../4.scenarios.md#ep-07--motor-de-decisão-gemini) · [`5.bdds.md#ep-07--motor-de-decisão-gemini`](../5.bdds.md#ep-07--motor-de-decisão-gemini).  
**API:** `decide` · `runAgent` em [`../src/lib/agent-decide.js`](../src/lib/agent-decide.js) / [`../src/lib/agent-run.js`](../src/lib/agent-run.js).  
**Pré-requisito:** EP-04 · EP-05 · `GEMINI_API_KEY`.  
**POC:** [`../src/test/output/poc-vision/`](../src/test/output/poc-vision/custos-por-agente.md) (Gemini 3.8 Flash aprovado; v1 = OCR only).

**Antes → depois:** decisão manual (chat Cursor + `extract`) → `runAgent({ serial, prompt })` com Gemini.  
**Rollback:** não chamar `runAgent`; operar pelas interfaces EP-04/05 + roteiro em linguagem natural.

---

## Escopo

| ID | Item | Status |
|----|------|--------|
| US-24 | Decidir próxima ação (Gemini + OCR) | Ativo |
| US-25 | Loop do agente | Ativo |
| SC-31 | decide a partir de OCR | Ativo |
| SC-32 | runAgent loop | Ativo |
| Visão multimodal (WebP) | Fallback fase 2 | Fora do v1 |

**Princípio:** percepção runtime = **OCR RapidOCR** → Gemini texto → gesto. Sem decisão por imagem no caminho feliz. Prompt/roteiro = input; motor **não** hardcodar jornada.

---

## Como utilizar

```js
import { readFileSync } from "node:fs";
import { decide } from "../src/lib/agent-decide.js";
import { runAgent } from "../src/lib/agent-run.js";
import { extract } from "../src/lib/extract.js";

// 1) Decisão pura (testável / sem device)
const ocr = await extract({ serial, engine: "rapidocr" });
const { resumo, acao } = await decide({
  prompt: "conectar num comprador na lista People",
  ocr,
});
// → { resumo, acao: { type: "tap"|"scroll"|…, x, y, direction, text, code, ms, motivo } }

// 2) Loop no device
const prompt = readFileSync("../roteiros/jornada-comprador.md", "utf8");
const result = await runAgent({
  serial,
  prompt,
  maxSteps: 40,
  engine: "rapidocr",
});
// → { status: "done"|"fail"|"max_steps", steps, logPath }
```

CLI:

```bash
cd screen-robot/src
export GEMINI_API_KEY=…
npm run agent -- --prompt ../roteiros/jornada-comprador.md
# ou: npm run agent -- --prompt "abra o LinkedIn e mostre as últimas 10 conexões"
```

Env: `GEMINI_API_KEY` · `GEMINI_MODEL` (default `gemini-3.1-flash-lite`, **fixo único**) · `GEMINI_FALLBACK_MODELS` (opcional) · `GEMINI_MAX_PROMPT_CHARS`.  
Stdout: `[gemini]` — usa só o modelo do export; fallback só se `GEMINI_FALLBACK_MODELS` estiver definido.

---

## Árvore de arquivos

```text
src/
├── lib/
│   ├── gemini.js              # cliente generateContent (JSON)
│   ├── agent-decide.js        # decide({ prompt, ocr, history })
│   ├── agent-run.js           # runAgent loop + log md
│   ├── agent-decide.test.js   # SC-31 stub
│   └── agent-run.test.js      # SC-32 stub (sem device)
├── scripts/
│   └── run-agent.js           # CLI fino
└── test/fixtures/
    └── agent-ocr-people-connect.json
```

---

## Contrato

### `decide(cfg) → Promise<{ resumo, acao, usage? }>`

| Campo | Obrig. | Descrição |
|-------|--------|-----------|
| `prompt` | sim | Objetivo / roteiro (texto) |
| `ocr` | sim | Lista `{ text, x, y }` (ou `{ type, text, x, y }`) |
| `history` | | Passos anteriores (resumo curto) |
| `model` | | Default `gemini-3.8-flash` |
| `apiKey` | | Default `process.env.GEMINI_API_KEY` |

`acao.type`: `tap` | `scroll` | `type` | `key` | `sleep` | `done` | `fail`.

- `tap`: `x`,`y` na escala do **device** (= extract)
- `scroll`: `direction` (`down`/`up`/…)
- `type`: `text`
- `key`: `code` (ex. `KEYCODE_BACK`)
- `sleep`: `ms`
- `done` / `fail`: `motivo`

### `runAgent(cfg) → Promise<{ status, steps, logPath }>`

| Campo | Obrig. | Descrição |
|-------|--------|-----------|
| `serial` | sim | Device |
| `prompt` | sim | Texto do objetivo |
| `maxSteps` | | Default 40 |
| `engine` | | Default `rapidocr` |
| `logDir` | | Default `logs/agent/` |
| `usageDir` | | Default `usage/` — `usage/<timestamp>.json` por execução |

Saída: `{ status, steps, logPath, usagePath, usage }`.

Fluxo por passo: extract → dump OCR stdout → decide → execute → append log → flush usage → se não terminal, repeat. Sem `ui_stable`.

**Antes → depois:** arquivo agregado por roteiro → de novo 1 JSON por execução (timestamp). Rollback: agregar por promptId.

---

## Sequência

1. Caller passa `prompt` (+ serial para `runAgent`).
2. `extract({ serial, engine: "rapidocr" })`.
3. `decide` monta system+user → Gemini `responseMimeType: application/json`.
4. Parse/valida `acao`; despacha operate.
5. Log `## Passo N` · Decisão · OCR · Resultado.
6. Para em `done` / `fail` / `maxSteps`.
