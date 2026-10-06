/**
 * US-25 / SC-32 — runAgent com stubs (sem device / sem API).
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { describe, it } from "node:test";
import { executeAction, runAgent } from "./agent-run.js";

describe("agent-run (SC-32)", () => {
  it("executeAction tap chama tapElement", async () => {
    const calls = [];
    await executeAction(
      { serial: "s", acao: { type: "tap", x: 10, y: 20 } },
      {
        tapElement: (cfg) => calls.push(cfg),
      },
    );
    assert.deepEqual(calls[0], { serial: "s", x: 10, y: 20 });
  });

  it("executeAction type default injeta via adb", async () => {
    const calls = [];
    const out = await executeAction(
      {
        serial: "s",
        acao: { type: "type", text: "comprador" },
      },
      {
        typeViaAdb: (serial, text) => calls.push([serial, text]),
        type: async () => {
          throw new Error("não deve OCR");
        },
      },
    );
    assert.equal(out, 'type-adb "comprador"');
    assert.deepEqual(calls, [["s", "comprador"]]);
  });

  it("runAgent: extract → decide tap → done (stubs)", async () => {
    const logDir = mkdtempSync(join(tmpdir(), "sr-agent-"));
    const usageDir = mkdtempSync(join(tmpdir(), "sr-usage-"));
    let extracts = 0;
    const taps = [];
    try {
      const result = await runAgent(
        {
          serial: "emulator-5554",
          prompt: "conectar num comprador",
          maxSteps: 5,
          logDir,
          usageDir,
          stepDelayMs: 0,
        },
        {
          sleep: async () => {},
          extract: async () => {
            extracts += 1;
            return [
              { type: "text", text: "Connect", x: 458, y: 344 },
              { type: "text", text: "People", x: 80, y: 150 },
            ];
          },
          decide: async ({ ocr, history, historySteps }) => {
            if (!history?.length) {
              assert.equal(historySteps, 12);
              return {
                resumo: "Connect visível",
                acao: {
                  type: "tap",
                  x: ocr[0].x,
                  y: ocr[0].y,
                  motivo: "Connect",
                },
                usage: { promptTokenCount: 10, candidatesTokenCount: 4, totalTokenCount: 14 },
                requests: [
                  {
                    ok: true,
                    prompt: "PROMPT_COMPLETO_STEP1",
                    system: "SYSTEM_STEP1",
                    response: '{"acao":{"type":"tap"}}',
                    input: {
                      system: "SYSTEM_STEP1",
                      prompt: "PROMPT_COMPLETO_STEP1",
                      body: { contents: [{ role: "user", parts: [{ text: "PROMPT_COMPLETO_STEP1" }] }] },
                    },
                    output: {
                      text: '{"acao":{"type":"tap"}}',
                      raw: { candidates: [] },
                    },
                    usage: { promptTokenCount: 10, candidatesTokenCount: 4, totalTokenCount: 14 },
                  },
                ],
              };
            }
            assert.equal(historySteps, 12);
            assert.equal(history.length, 1);
            assert.equal(history[0].resultado, "tap 458,344");
            assert.deepEqual(history[0].ocr, [
              { text: "Connect", x: 458, y: 344 },
              { text: "People", x: 80, y: 150 },
            ]);
            return {
              resumo: "ok",
              acao: { type: "done", motivo: "conectado" },
              usage: { promptTokenCount: 12, candidatesTokenCount: 3, totalTokenCount: 15 },
              requests: [
                {
                  ok: true,
                  prompt: "PROMPT_COMPLETO_STEP2",
                  system: "SYSTEM_STEP2",
                  response: '{"acao":{"type":"done"}}',
                  usage: { promptTokenCount: 12, candidatesTokenCount: 3, totalTokenCount: 15 },
                },
              ],
            };
          },
          tapElement: (cfg) => taps.push(cfg),
        },
      );

      assert.equal(result.status, "done");
      assert.equal(taps.length, 1);
      assert.equal(taps[0].x, 458);
      assert.ok(extracts >= 2);
      assert.ok(result.logPath);
      assert.ok(result.usageDir);
      assert.equal(result.requestFiles.length, 2);
      assert.ok(result.usagePath);
      assert.match(basename(result.usagePath), /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}(-\d+)?\.json$/);
      const md = readFileSync(result.logPath, "utf8");
      assert.match(md, /### Decisão/);
      assert.match(md, /### OCR usado na decisão/);
      assert.match(md, /\*\*status:\*\* `done`/);
      assert.match(md, /conectar num comprador/);
      assert.match(md, /historySteps: 12/);
      assert.match(md, /usage: in=10 out=4/);
      assert.equal(result.usage.totalTokenCount, 29);
      // flat em usage/: só .json com timestamp, sem pasta filha
      const files = readdirSync(result.usageDir).filter((f) => f.endsWith(".json")).sort();
      assert.equal(files.length, 2);
      for (const f of files) {
        assert.match(f, /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}(-\d+)?\.json$/);
      }
      const req1 = JSON.parse(readFileSync(result.requestFiles[0], "utf8"));
      assert.equal(req1.step, 1);
      assert.equal(req1.usage.promptTokenCount, 10);
      assert.equal(req1.prompt, "PROMPT_COMPLETO_STEP1");
      assert.equal(req1.system, "SYSTEM_STEP1");
      assert.equal(req1.response, '{"acao":{"type":"tap"}}');
      assert.equal(req1.input.prompt, "PROMPT_COMPLETO_STEP1");
      assert.equal(req1.output.text, '{"acao":{"type":"tap"}}');
      assert.equal(req1.roteiro, "conectar num comprador");
      assert.deepEqual(req1.acao, {
        type: "tap",
        x: 458,
        y: 344,
        motivo: "Connect",
      });
      assert.equal(req1.resumo, "Connect visível");
    } finally {
      rmSync(logDir, { recursive: true, force: true });
      rmSync(usageDir, { recursive: true, force: true });
    }
  });

  it("runAgent falha sem serial", async () => {
    await assert.rejects(
      () => runAgent({ prompt: "x" }),
      (e) => e.code === "AGENT_NO_SERIAL",
    );
  });

  it("runAgent não morre em erro decide — continua até done", async () => {
    const logDir = mkdtempSync(join(tmpdir(), "sr-agent-"));
    const usageDir = mkdtempSync(join(tmpdir(), "sr-usage-"));
    let decides = 0;
    try {
      const result = await runAgent(
        {
          serial: "emulator-5554",
          prompt: "x",
          maxSteps: 5,
          logDir,
          usageDir,
          stepDelayMs: 0,
          recoverDelayMs: 0,
        },
        {
          sleep: async () => {},
          extract: async () => [{ type: "text", text: "Connect", x: 1, y: 2 }],
          decide: async () => {
            decides += 1;
            if (decides === 1) {
              const err = new Error("timeout 12000ms");
              err.code = "GEMINI_REQUEST_FAILED";
              throw err;
            }
            return { resumo: "ok", acao: { type: "done", motivo: "ok" } };
          },
        },
      );
      assert.equal(result.status, "done");
      assert.ok(decides >= 2);
      assert.ok(result.steps.some((s) => s.error));
    } finally {
      rmSync(logDir, { recursive: true, force: true });
      rmSync(usageDir, { recursive: true, force: true });
    }
  });

  it("runAgent sense=vision: captura+compress → decide (sem extract)", async () => {
    const logDir = mkdtempSync(join(tmpdir(), "sr-agent-"));
    const usageDir = mkdtempSync(join(tmpdir(), "sr-usage-"));
    let extractCalls = 0;
    let decides = 0;
    let decideCfg;
    const taps = [];
    try {
      const result = await runAgent(
        {
          serial: "emulator-5554",
          prompt: "conectar",
          sense: "vision",
          maxSteps: 5,
          logDir,
          usageDir,
          stepDelayMs: 0,
        },
        {
          sleep: async () => {},
          extract: async () => {
            extractCalls += 1;
            return [];
          },
          captureFrame: async () => "/tmp/fake.png",
          compressFrame: async () => ({
            mimeType: "image/webp",
            base64: "QQ==",
            width: 540,
            height: 960,
            original: { width: 1080, height: 1920 },
            scaleToDevice: 2,
            inputBytes: 1000,
            outputBytes: 200,
          }),
          decide: async (cfg) => {
            decides += 1;
            decideCfg = cfg;
            if (decides === 1) {
              return {
                resumo: "Connect",
                acao: { type: "tap", x: 454, y: 344, motivo: "Connect" },
                sense: "vision",
              };
            }
            return { resumo: "ok", acao: { type: "done", motivo: "ok" }, sense: "vision" };
          },
          tapElement: (cfg) => taps.push(cfg),
        },
      );
      assert.equal(result.status, "done");
      assert.equal(extractCalls, 0);
      assert.equal(decideCfg.sense, "vision");
      assert.ok(decideCfg.image?.data);
      assert.equal(decideCfg.imageMeta.scaleToDevice, 2);
      assert.deepEqual(taps[0], { serial: "emulator-5554", x: 454, y: 344 });
      assert.match(readFileSync(result.logPath, "utf8"), /sense: `vision`/);
    } finally {
      rmSync(logDir, { recursive: true, force: true });
      rmSync(usageDir, { recursive: true, force: true });
    }
  });

  it("runAgent passa historySteps customizado ao decide", async () => {
    const logDir = mkdtempSync(join(tmpdir(), "sr-agent-"));
    const usageDir = mkdtempSync(join(tmpdir(), "sr-usage-"));
    let seen;
    try {
      const result = await runAgent(
        {
          serial: "emulator-5554",
          prompt: "x",
          maxSteps: 2,
          historySteps: 2,
          logDir,
          usageDir,
          stepDelayMs: 0,
        },
        {
          sleep: async () => {},
          extract: async () => [{ type: "text", text: "A", x: 1, y: 2 }],
          decide: async (cfg) => {
            seen = cfg.historySteps;
            return { resumo: "ok", acao: { type: "done", motivo: "ok" } };
          },
        },
      );
      assert.equal(result.status, "done");
      assert.equal(seen, 2);
      assert.match(readFileSync(result.logPath, "utf8"), /historySteps: 2/);
    } finally {
      rmSync(logDir, { recursive: true, force: true });
      rmSync(usageDir, { recursive: true, force: true });
    }
  });
});
