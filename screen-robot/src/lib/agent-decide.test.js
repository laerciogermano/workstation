/**
 * US-24 / SC-31 — decide com stub Gemini (fixture OCR People + Connect).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  buildSystemPrompt,
  buildSystemPromptVision,
  buildUserPrompt,
  buildUserPromptVision,
  compactOcr,
  decide,
  DEFAULT_HISTORY_STEPS,
  parseActionPayload,
  historyWindow,
  resolveHistorySteps,
  resolveProvider,
  resolveDecideModel,
  resolveSense,
  resolveTapElement,
} from "./agent-decide.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(
  __dirname,
  "../test/fixtures/agent-ocr-people-connect.json",
);

describe("agent-decide (SC-31)", () => {
  it("compactOcr usa id+text+y sem x", () => {
    const ocr = compactOcr([
      { type: "text", text: "Connect", x: 1, y: 2 },
      { type: "icon", x: 80, y: 140 },
    ]);
    assert.deepEqual(ocr, [
      { id: "e0", type: "text", text: "Connect", y: 2 },
      { id: "e1", type: "icon", y: 140 },
    ]);
  });

  it("resolveTapElement por id e por text", () => {
    const ocr = [
      { type: "text", text: "People", x: 80, y: 150 },
      { type: "text", text: "Connect", x: 458, y: 344 },
    ];
    assert.equal(resolveTapElement(ocr, "e1").x, 458);
    assert.equal(resolveTapElement(ocr, "Connect").id, "e1");
    assert.equal(resolveTapElement(ocr, "Comprador"), null);
  });

  it("system prompt OCR/vision não cita apps nem jornadas", () => {
    const ocr = buildSystemPrompt();
    const vision = buildSystemPromptVision({ width: 540, height: 960 });
    const banned =
      /\b(linkedin|instagram|tinder|campinas|connect|settings|calendar|gmail|chrome|comprador|nexus|sdk_gphone)\b/i;
    assert.equal(banned.test(ocr), false, ocr.match(banned)?.[0]);
    assert.equal(banned.test(vision), false, vision.match(banned)?.[0]);
    assert.match(ocr, /acao\.element/);
    assert.match(ocr, /PROIBIDO mandar x,y/);
  });

  it("parseActionPayload valida tap por element", () => {
    const p = parseActionPayload({
      resumo: "lista People",
      acao: { type: "tap", element: "e1", motivo: "Connect" },
    });
    assert.equal(p.acao.type, "tap");
    assert.equal(p.acao.element, "e1");
    assert.equal(p.acao.x, null);
  });

  it("decide OCR: ignora x,y da IA e resolve pelo id", async () => {
    const ocr = [
      { id: "e0", text: "People", x: 80, y: 150 },
      { id: "e1", text: "Connect", x: 458, y: 344 },
    ];
    const stub = async () => ({
      text: JSON.stringify({
        resumo: "Connect",
        acao: {
          type: "tap",
          element: "e1",
          x: 999,
          y: 1,
          motivo: "tap id",
        },
      }),
    });
    const out = await decide(
      { prompt: "conectar", ocr, sense: "ocr" },
      { generateContent: stub },
    );
    assert.equal(out.acao.element, "e1");
    assert.equal(out.acao.x, 458);
    assert.equal(out.acao.y, 344);
  });

  it("decide OCR: tap sem element falha", async () => {
    const stub = async () => ({
      text: JSON.stringify({
        resumo: "coords",
        acao: { type: "tap", x: 10, y: 20, motivo: "sem id" },
      }),
    });
    await assert.rejects(
      () =>
        decide(
          {
            prompt: "x",
            ocr: [{ text: "A", x: 10, y: 20 }],
            sense: "ocr",
          },
          { generateContent: stub },
        ),
      (e) => e.code === "AGENT_BAD_ACTION",
    );
  });

  it("parseActionPayload rejeita type inválido", () => {
    assert.throws(
      () => parseActionPayload({ acao: { type: "swipe" } }),
      (e) => e.code === "AGENT_BAD_ACTION",
    );
  });

  it("resolveHistorySteps default 12; cfg/env; 0 = sem histórico", () => {
    assert.equal(DEFAULT_HISTORY_STEPS, 12);
    assert.equal(resolveHistorySteps({}), 12);
    assert.equal(resolveHistorySteps({ historySteps: 2 }), 2);
    assert.equal(resolveHistorySteps({ historySteps: 0 }), 0);
    assert.equal(resolveHistorySteps({ historySteps: -1 }), 12);
    const w = historyWindow({
      history: [{ step: 1 }, { step: 2 }, { step: 3 }],
      historySteps: 2,
    });
    assert.equal(w.historyCount, 2);
    assert.equal(w.historySteps, 2);
    assert.equal(historyWindow({ history: [{ step: 1 }], historySteps: 0 }).historyCount, 0);
    const prev = process.env.AGENT_HISTORY_STEPS;
    process.env.AGENT_HISTORY_STEPS = "5";
    try {
      assert.equal(resolveHistorySteps({}), 5);
      assert.equal(resolveHistorySteps({ historySteps: 3 }), 3);
      assert.equal(resolveHistorySteps({ historySteps: 0 }), 0);
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

  it("buildUserPrompt com historySteps=0 omite histórico", () => {
    const history = [
      { step: 1, type: "scroll", resultado: "scroll down" },
      { step: 2, type: "tap", resultado: "tap 1,2" },
    ];
    const prompt = buildUserPrompt({
      prompt: "abrir Settings",
      ocr: [{ text: "Settings", x: 10, y: 20 }],
      history,
      historySteps: 0,
    });
    assert.doesNotMatch(prompt, /Histórico recente/);
    assert.doesNotMatch(prompt, /"step":1/);
    assert.doesNotMatch(prompt, /scroll down/);
  });

  it("decide com stub: tap no Connect da fixture", async () => {
    const ocr = JSON.parse(readFileSync(FIXTURE, "utf8"));
    const stub = async () => ({
      text: JSON.stringify({
        resumo: "Lista People com Connect visível",
        elementos: [{ label: "Connect", tipo: "button", x: 458, y: 344 }],
        acao: {
          type: "tap",
          element: "Connect",
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
    assert.equal(out.acao.element, "e7");
    assert.equal(out.acao.x, 458);
    assert.equal(out.acao.y, 344);
    assert.match(out.acao.motivo, /Connect/i);
    assert.ok(out.usage);
    assert.equal(out.historyCount, 0);
    assert.equal(out.historySteps, 12);
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

  it("resolveSense: vision via cfg/env", () => {
    assert.equal(resolveSense({}), "ocr");
    assert.equal(resolveSense({ sense: "vision" }), "vision");
    const prev = process.env.AGENT_SENSE;
    process.env.AGENT_SENSE = "vision";
    try {
      assert.equal(resolveSense({}), "vision");
    } finally {
      if (prev == null) delete process.env.AGENT_SENSE;
      else process.env.AGENT_SENSE = prev;
    }
  });

  it("buildUserPromptVision omite ocr do histórico", () => {
    const p = buildUserPromptVision({
      prompt: "conectar",
      imageMeta: { width: 540, height: 960 },
      history: [
        { step: 1, type: "tap", x: 1, y: 2, ocr: [{ text: "X", x: 1, y: 2 }] },
      ],
      historySteps: 5,
    });
    assert.match(p, /Imagem anexada/);
    assert.doesNotMatch(p, /"ocr"/);
  });

  it("decide vision: escala tap imagem→device e manda images", async () => {
    let seen;
    const stub = async (opts) => {
      seen = opts;
      return {
        text: JSON.stringify({
          resumo: "Connect na imagem",
          elementos: [{ label: "Connect", tipo: "button", x: 227, y: 172 }],
          acao: { type: "tap", x: 227, y: 172, motivo: "Connect" },
        }),
      };
    };
    const out = await decide(
      {
        prompt: "conectar",
        sense: "vision",
        image: { mimeType: "image/webp", data: "AAAA" },
        imageMeta: { width: 540, height: 960, scaleToDevice: 2 },
      },
      { generateContent: stub },
    );
    assert.equal(out.sense, "vision");
    assert.equal(out.acao.x, 454);
    assert.equal(out.acao.y, 344);
    assert.equal(out.elementos[0].x, 454);
    assert.ok(seen.images?.[0]?.data);
    assert.match(String(seen.system || ""), /captura de tela/i);
  });

  it("decide: Gemini falha → gpt-4o-mini", async () => {
    const models = [];
    const stub = async (opts) => {
      models.push(opts.model);
      if (opts.model !== "gpt-4o-mini") {
        const e = new Error("quota");
        e.code = "GEMINI_REQUEST_FAILED";
        throw e;
      }
      return {
        text: JSON.stringify({
          acao: { type: "done", motivo: "ok via mini" },
        }),
        model: opts.model,
      };
    };
    const out = await decide(
      {
        prompt: "x",
        ocr: [{ text: "A", x: 1, y: 2 }],
        model: "gemini-3.8-flash",
        fallbackModels: ["gpt-4o-mini"],
      },
      { generateContent: stub, log: () => {} },
    );
    assert.equal(out.acao.type, "done");
    assert.equal(out.model, "gpt-4o-mini");
    assert.equal(out.provider, "openai");
    assert.deepEqual(models, ["gemini-3.8-flash", "gpt-4o-mini"]);
  });

  it("decide: 1 falha no modelo → próximo da cadeia (retries 0)", async () => {
    const seen = [];
    const stub = async (opts) => {
      seen.push({ model: opts.model, retries: opts.retries });
      if (opts.model === "gemini-3.8-flash") {
        const e = new Error("high demand");
        e.code = "GEMINI_REQUEST_FAILED";
        throw e;
      }
      return {
        text: JSON.stringify({ acao: { type: "done", motivo: "ok" } }),
        model: opts.model,
      };
    };
    const out = await decide(
      {
        prompt: "x",
        ocr: [{ text: "A", x: 1, y: 2 }],
        model: "gemini-3.8-flash",
        fallbackModels: ["gemini-3.5-flash"],
      },
      { generateContent: stub, log: () => {} },
    );
    assert.equal(out.model, "gemini-3.5-flash");
    assert.equal(seen[0].retries, 0);
    assert.deepEqual(
      seen.map((s) => s.model),
      ["gemini-3.8-flash", "gemini-3.5-flash"],
    );
  });

  it("decide: noFallback não desce a escada", async () => {
    const models = [];
    const stub = async (opts) => {
      models.push(opts.model);
      const e = new Error("quota");
      e.code = "GEMINI_REQUEST_FAILED";
      throw e;
    };
    await assert.rejects(
      () =>
        decide(
          {
            prompt: "x",
            ocr: [{ text: "A", x: 1, y: 2 }],
            model: "gemini-2.5-flash",
            noFallback: true,
          },
          { generateContent: stub, log: () => {} },
        ),
      (e) => e.code === "GEMINI_REQUEST_FAILED",
    );
    assert.deepEqual(models, ["gemini-2.5-flash"]);
  });
});
