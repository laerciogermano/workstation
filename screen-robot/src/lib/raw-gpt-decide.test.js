/**
 * raw-gpt: um caso por tela (PNG em fixtures) + mesmo prompt + OpenAI real.
 * Índices dos `it` / fixtures = ordem do cenário em raw-gpt-decide.prompt.txt.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { compactOcr } from "./agent-decide.js";
import { extractFromImage } from "./extract-engines.js";
import { loadEnvFiles } from "./load-env.js";
import { decideRawAction, parseActionTypeXY } from "./raw-gpt-decide.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = join(__dirname, "..");
const FIXTURES = join(SRC_ROOT, "test/fixtures");
loadEnvFiles([join(SRC_ROOT, ".env"), join(SRC_ROOT, ".env.local")]);

const PROMPT = readFileSync(
  join(FIXTURES, "raw-gpt-decide.prompt.txt"),
  "utf8",
).trim();

async function runCase({ image, prompt, expected }) {
  assert.ok(process.env.OPENAI_API_KEY, "falta OPENAI_API_KEY");
  assert.ok(prompt.length >= 1, "prompt vazio");

  const elements = await extractFromImage(join(FIXTURES, image), {
    engine: "all",
    timeoutMs: Number(process.env.OCR_MERGE_TIMEOUT_MS || 180_000),
  });
  const ocr = compactOcr(elements);
  assert.ok(ocr.length >= 1, "OCR vazio");

  const out = await decideRawAction({ prompt, ocr });
  const action = parseActionTypeXY(out.raw);

  console.log({ action });
  assert.deepEqual(action, expected);
}

describe("raw-gpt-decide", () => {
  it(
    "01 clique em Search",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "01-search.png",
        prompt: PROMPT + "\nvoce esta no passo 1",
        expected: { type: "tap", x: 177, y: 78 },
      });
    },
  );

  it(
    "02 digite comprador",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "02-type-comprador.png",
        prompt: PROMPT + "\nvoce esta no passo 2",
        expected: { type: "type", text: "comprador" },
      });
    },
  );

  it(
    "03 feche o teclado",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "03-close-keyboard.png",
        prompt: PROMPT + "\nvoce esta no passo 3",
        expected: { type: "key", code: "KEYCODE_BACK" },
      });
    },
  );

  it(
    "04 clique em Show all results",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "04-show-all-results.png",
        prompt: PROMPT + "\nvoce esta no passo 4",
        expected: { type: "tap", x: 270, y: 849 },
      });
    },
  );

  it(
    "05 clique em People",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "05-people.png",
        prompt: PROMPT + "\nvoce esta no passo 5",
        expected: { type: "tap", x: 62, y: 153 },
      });
    },
  );

  it(
    "06 clique Location",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "06-location.png",
        prompt: PROMPT + "\nvoce esta no passo 6",
        expected: { type: "tap", x: 499, y: 152 },
      });
    },
  );

  it(
    "07 clique em Add a location",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "07-add-a-location.png",
        prompt: PROMPT + "\nvoce esta no passo 7",
        expected: { type: "tap", x: 127, y: 380 },
      });
    },
  );

  it(
    "08 digite campinas",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "08-type-campinas.png",
        prompt: PROMPT + "\nvoce esta no passo 8",
        expected: { type: "type", text: "Campinas" },
      });
    },
  );

  it(
    "09 clique na primeira opção Campinas",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "09-campinas-option.png",
        prompt: PROMPT + "\nvoce esta no passo 9",
        expected: { type: "tap", x: 174, y: 177 },
      });
    },
  );

  it(
    "10 clique em Show results",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "10-show-results.png",
        prompt: PROMPT + "\nvoce esta no passo 10",
        expected: { type: "tap", x: 271, y: 849 },
      });
    },
  );

  it(
    "11 Connect",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "11-connect.png",
        prompt: PROMPT + "\nvoce esta no passo 11",
        expected: { type: "tap", x: 453, y: 243 },
      });
    },
  );

  it(
    "11b Connect (people)",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "11-connect-people.png",
        prompt: PROMPT + "\nvoce esta no passo 11",
        expected: { type: "tap", x: 455, y: 344 },
      });
    },
  );

  it(
    "11c Connect (segundo)",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "linkedin-search-comprador-connected.png",
        prompt: PROMPT + "\nvoce esta no passo 11",
        expected: { type: "tap", x: 454, y: 447 },
      });
    },
  );

  it(
    "12 Sem Connect → scroll down",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "12-scroll.png",
        prompt: PROMPT + "\nvoce esta no passo 12",
        expected: { type: "scroll", direction: "down" },
      });
    },
  );

  it(
    "13 Clicar no botao skip apos conectar",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "13-skip.png",
        prompt: PROMPT + "\nvoce esta no passo 13",
        expected: { type: "tap", x: 269, y: 816 },
      });
    },
  );
});
