#!/usr/bin/env node
/**
 * Extract (lib) num PNG LinkedIn → chat.completions cru (system = agente + JSON action).
 *
 *   npm run raw-gpt
 *   npm run raw-gpt -- --image test/fixtures/linkedin-people-comprador-connect.png
 *   npm run raw-gpt -- --engine all --prompt "conecte no comprador"
 */
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFiles } from "../lib/load-env.js";
import { compactOcr } from "../lib/agent-decide.js";
import { extractFromImage } from "../lib/extract-engines.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dirname, "..");
loadEnvFiles([join(SRC_ROOT, ".env"), join(SRC_ROOT, ".env.local")]);

const DEFAULT_IMAGE = join(
  SRC_ROOT,
  "test/fixtures/linkedin-people-comprador-connect.png",
);
const DEFAULT_PROMPT =
  "Na tela People do LinkedIn, encontre o comprador e toque em Connect.";

const SYSTEM_PROMPT = `Você é uma IA agente autônoma que controla um smartphone Android.
Você recebe: (1) a jornada/objetivo e (2) o OCR da tela atual (lista extract: type, text, x, y).
Decida UMA próxima ação e responda APENAS um JSON válido (sem markdown, sem texto fora do JSON).

Formato único:
{
  "action": {
    "type": "tap|scroll|type|key|sleep|done|fail",
    "x": null,
    "y": null,
    "direction": null,
    "text": null,
    "code": null,
    "ms": null,
    "motivo": "passo em curso — ..."
  }
}

Tipos (lib screen-robot):
- tap: obrigatório x e y numéricos do OCR desta tela (centro do alvo)
- scroll: direction up|down|left|right
- type: text a digitar
- key: code (ex. KEYCODE_BACK, KEYCODE_ENTER)
- sleep: ms
- done: jornada concluída
- fail: só se impossível seguir

Regras:
- tap.x / tap.y = EXCLUSIVAMENTE de um hit do OCR atual; proibido inventar ou reusar coords de outro contexto
- Cada item do OCR (text/icon) é clicável
- Sem alvo do passo → sleep ou scroll; evite fail
- Um único objeto JSON na resposta`;

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("falta OPENAI_API_KEY");
  process.exit(1);
}

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return null;
}

const prompt = argValue("--prompt") || DEFAULT_PROMPT;
const imagePath = resolve(argValue("--image") || DEFAULT_IMAGE);
const engine = argValue("--engine") || process.env.SCREEN_ROBOT_OCR || "all";
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (!existsSync(imagePath)) {
  console.error(`PNG não encontrado: ${imagePath}`);
  process.exit(1);
}

const elements = await extractFromImage(imagePath, {
  engine,
  timeoutMs: Number(process.env.OCR_MERGE_TIMEOUT_MS || 180_000),
});
const ocr = compactOcr(elements);
console.log({ imagePath, engine, hits: elements.length, ocr });

const userText = `Jornada:
${prompt}

OCR atual (JSON):
${JSON.stringify(ocr)}

Defina a próxima action.`;

const payload = {
  model,
  response_format: { type: "json_object" },
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userText },
  ],
};
console.log(payload);

const res = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const data = await res.json();
if (!res.ok) {
  console.error(data?.error?.message || JSON.stringify(data));
  process.exit(1);
}

process.stdout.write(String(data.choices?.[0]?.message?.content ?? ""));
