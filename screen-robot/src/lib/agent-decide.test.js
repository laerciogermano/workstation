/**
 * US-24 / SC-31 — decide com stub Gemini (fixture OCR People + Connect).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  buildUserPrompt,
  compactOcr,
  decide,
  DEFAULT_HISTORY_STEPS,
  parseActionPayload,
  resolveHistorySteps,
  resolveProvider,
  resolveDecideModel,
} from "./agent-decide.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(
  __dirname,
  "../test/fixtures/agent-ocr-people-connect.json",
);

describe("agent-decide (SC-31)", () => {
  it("compactOcr mantém text,x,y", () => {
    const ocr = compactOcr([{ type: "text", text: "Connect", x: 1, y: 2 }]);
    assert.deepEqual(ocr, [{ text: "Connect", x: 1, y: 2 }]);
  });

  it("parseActionPayload valida tap", () => {
    const p = parseActionPayload({
      resumo: "lista People",
      acao: { type: "tap", x: 458, y: 344, motivo: "Connect" },
    });
    assert.equal(p.acao.type, "tap");
    assert.equal(p.acao.x, 458);
    assert.equal(p.acao.y, 344);
  });

  it("parseActionPayload rejeita type inválido", () => {
    assert.throws(
      () => parseActionPayload({ acao: { type: "swipe" } }),
      (e) => e.code === "AGENT_BAD_ACTION",
    );
  });

  it("resolveHistorySteps default 12; cfg/env", () => {
    assert.equal(DEFAULT_HISTORY_STEPS, 12);
    assert.equal(resolveHistorySteps({}), 12);
    assert.equal(resolveHistorySteps({ historySteps: 2 }), 2);
    assert.equal(resolveHistorySteps({ historySteps: 0 }), 12);
    const prev = process.env.AGENT_HISTORY_STEPS;
    process.env.AGENT_HISTORY_STEPS = "5";
    try {
      assert.equal(resolveHistorySteps({}), 5);
      assert.equal(resolveHistorySteps({ historySteps: 3 }), 3);
    } finally {
      if (prev == null) delete process.env.AGENT_HISTORY_STEPS;
      else process.env.AGENT_HISTORY_STEPS = prev;
    }
  });

  it("resolveProvider: openai por flag/modelo gpt-", () => {
    assert.equal(resolveProvider({}), "gemini");
    assert.equal(resolveProvider({ provider: "openai" }), "openai");
    assert.equal(resolveProvider({ model: "gpt-4o-mini" }), "openai");
    assert.equal(resolveDecideModel({ provider: "openai" }), "gpt-4o-mini");
  });

  it("buildUserPrompt com historySteps=2 só manda 2 itens", () => {
    const history = [
      { step: 1, type: "scroll", resultado: "scroll down" },
      { step: 2, type: "key", resultado: "key KEYCODE_HOME" },
      { step: 3, type: "tap", resultado: "tap 1,2" },
    ];
    const prompt = buildUserPrompt({
      prompt: "abrir Settings",
      ocr: [{ text: "Settings", x: 10, y: 20 }],
      history,
      historySteps: 2,
    });
    assert.match(prompt, /últimos 2\/2/);
    assert.match(prompt, /"step":2/);
    assert.match(prompt, /"step":3/);
    assert.doesNotMatch(prompt, /"step":1/);
    assert.match(prompt, /key KEYCODE_HOME/);
  });

  it("decide com stub: tap no Connect da fixture", async () => {
    const ocr = JSON.parse(readFileSync(FIXTURE, "utf8"));
    const stub = async () => ({
      text: JSON.stringify({
        resumo: "Lista People com Connect visível",
        elementos: [{ label: "Connect", tipo: "button", x: 458, y: 344 }],
        acao: {
          type: "tap",
          x: 458,
          y: 344,
          motivo: "primeiro Connect OCR",
        },
      }),
      usage: { promptTokenCount: 10, candidatesTokenCount: 20 },
    });

    const out = await decide(
      { prompt: "conectar num comprador", ocr },
      { generateContent: stub },
    );
    assert.equal(out.acao.type, "tap");
    assert.equal(out.acao.x, 458);
    assert.equal(out.acao.y, 344);
    assert.match(out.acao.motivo, /Connect/i);
    assert.ok(out.usage);
  });

  it("decide com stub: scroll quando sem Connect", async () => {
    const ocr = [
      { text: "People", x: 80, y: 150 },
      { text: "Pending", x: 450, y: 400 },
    ];
    const stub = async () => ({
      text: JSON.stringify({
        resumo: "sem Connect",
        acao: { type: "scroll", direction: "down", motivo: "sem Connect" },
      }),
    });
    const out = await decide(
      { prompt: "conectar", ocr },
      { generateContent: stub },
    );
    assert.equal(out.acao.type, "scroll");
    assert.equal(out.acao.direction, "down");
  });
});
