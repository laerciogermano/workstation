/**
 * US-25 / SC-32 — runAgent com stubs (sem device / sem API).
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
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
          decide: async ({ ocr, history }) => {
            if (!history?.length) {
              return {
                resumo: "Connect visível",
                acao: {
                  type: "tap",
                  x: ocr[0].x,
                  y: ocr[0].y,
                  motivo: "Connect",
                },
                usage: { promptTokenCount: 10, candidatesTokenCount: 4, totalTokenCount: 14 },
              };
            }
            return {
              resumo: "ok",
              acao: { type: "done", motivo: "conectado" },
              usage: { promptTokenCount: 12, candidatesTokenCount: 3, totalTokenCount: 15 },
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
      assert.ok(result.usagePath);
      assert.match(basename(result.usagePath), /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}\.json$/);
      const md = readFileSync(result.logPath, "utf8");
      assert.match(md, /### Decisão/);
      assert.match(md, /### OCR usado na decisão/);
      assert.match(md, /\*\*status:\*\* `done`/);
      // política não hardcoded no motor — prompt genérico
      assert.match(md, /conectar num comprador/);
      const usage = JSON.parse(readFileSync(result.usagePath, "utf8"));
      assert.equal(usage.calls.length, 2);
      assert.equal(usage.totals.promptTokenCount, 22);
      assert.equal(usage.totals.candidatesTokenCount, 7);
      assert.equal(usage.totals.totalTokenCount, 29);
      assert.equal(result.usage.totalTokenCount, 29);
      // usage legível: totals/calls antes; prompt só preview
      assert.ok(usage.totals);
      assert.ok(!("prompt" in usage));
      assert.equal(typeof usage.promptChars, "number");
      assert.match(usage.promptPreview, /conectar/);
      assert.match(md, /usage: in=10 out=4/);
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
});
