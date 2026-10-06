/**
 * raw-gpt: um caso por tela (PNG em fixtures) + mesmo prompt + OpenAI real.
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
    "LinkedIn People/Connect → tap Connect",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "linkedin-people-comprador-connect.png",
        prompt: PROMPT + "\nvoce esta no passo 11",
        expected: { type: "tap", x: 455, y: 344 },
      });
    },
  );

  it(
    "LinkedIn tela inicial → passo 1",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "linkedin-tela-inicial.png",
        prompt: PROMPT + "\nvoce esta no passo 1",
        expected: { type: "tap", x: 177, y: 78 },
      });
    },
  );

  it(
    "LinkedIn Search clicked → digitar comprador",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "linkedin-search-clicked.png",
        prompt: PROMPT + "\nvoce esta no passo 2",
        expected: { type: "type", text: "comprador" },
      });
    },
  );

  it(
    "LinkedIn Search comprador + teclado → fechar teclado",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "linkedin-search-comprador-keyboard-open.png",
        prompt: PROMPT + "\nvoce esta no passo 3",
        expected: { type: "key", code: "KEYCODE_BACK" },
      });
    },
  );

  it(
    "LinkedIn Search comprador teclado fechado → Show all results",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "linkedin-search-comprador-keyboard-closed.png",
        prompt: PROMPT + "\nvoce esta no passo 4",
        expected: { type: "tap", x: 270, y: 849 },
      });
    },
  );

  it(
    "LinkedIn Search all results → tap People",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "linkedin-search-comprador-all-results.png",
        prompt: PROMPT + "\nvoce esta no passo 5",
        expected: { type: "tap", x: 62, y: 153 },
      });
    },
  );

  it(
    "LinkedIn People selected → tap Location",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "linkedin-search-comprador-all-results-people-selected.png",
        prompt: PROMPT + "\nvoce esta no passo 6",
        expected: { type: "tap", x: 499, y: 152 },
      });
    },
  );

  it(
    "LinkedIn Location sheet → tap Add a location",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "linkedin-search-comprador-all-results-location-selected.png",
        prompt: PROMPT + "\nvoce esta no passo 7",
        expected: { type: "tap", x: 127, y: 380 },
      });
    },
  );

  it(
    "LinkedIn location search → digitar Campinas",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "linkedin-search-comprador-location-search.png",
        prompt: PROMPT + "\nvoce esta no passo 8",
        expected: { type: "type", text: "Campinas" },
      });
    },
  );

  it(
    "LinkedIn location Campinas → tap primeira sugestão",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "linkedin-search-comprador-location-search-campinas.png",
        prompt: PROMPT + "\nvoce esta no passo 9",
        expected: { type: "tap", x: 174, y: 177 },
      });
    },
  );

  it(
    "LinkedIn Campinas selected → tap Show results",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "linkedin-search-comprador-location-search-campinas-selected.png",
        prompt: PROMPT + "\nvoce esta no passo 10",
        expected: { type: "tap", x: 271, y: 849 },
      });
    },
  );

  it(
    "LinkedIn People+Campinas → Connect ou scroll",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "linkedin-search-comprador-location-search-people-location.png",
        prompt: PROMPT + "\nvoce esta no passo 11",
        expected: { type: "scroll", direction: "down" },
      });
    },
  );

  it(
    "LinkedIn Connect button → tap Connect",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "linkedin-search-comprador-connect-button.png",
        prompt: PROMPT + "\nvoce esta no passo 11",
        expected: { type: "tap", x: 453, y: 243 },
      });
    },
  );

  it(
    "LinkedIn Connect note sheet → tap Skip",
    { timeout: 300_000 },
    async () => {
      await runCase({
        image: "linkedin-search-comprador-connect-skip.png",
        prompt: PROMPT + "\nvoce esta no passo 13",
        expected: { type: "tap", x: 269, y: 816 },
      });
    },
  );
});
