/**
 * US-25 / SC-32 — runAgent com stubs (sem device / sem API).
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { executeAction, runAgent, usageKeyFromPrompt } from "./agent-run.js";

describe("agent-run (SC-32)", () => {
  it("usageKeyFromPrompt usa basename do arquivo", () => {
    assert.equal(
      usageKeyFromPrompt({ promptId: "../roteiros/jornada-comprador.md" }),
      "jornada-comprador",
    );
    assert.equal(
      usageKeyFromPrompt({ prompt: "conectar num comprador\nresto" }),
      "conectar-num-comprador",
    );
  });

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
          promptId: "jornada-comprador.md",
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
      assert.ok(result.usagePath.endsWith("jornada-comprador.json"));
      const md = readFileSync(result.logPath, "utf8");
      assert.match(md, /### Decisão/);
      assert.match(md, /### OCR usado na decisão/);
      assert.match(md, /\*\*status:\*\* `done`/);
      // política não hardcoded no motor — prompt genérico
      assert.match(md, /conectar num comprador/);
      const usage = JSON.parse(readFileSync(result.usagePath, "utf8"));
      assert.equal(usage.promptId, "jornada-comprador");
      assert.equal(usage.runs.length, 1);
      assert.equal(usage.runs[0].calls.length, 2);
      assert.equal(usage.totals.promptTokenCount, 22);
      assert.equal(usage.totals.candidatesTokenCount, 7);
      assert.equal(usage.totals.totalTokenCount, 29);
      assert.equal(result.usage.totalTokenCount, 29);
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
});
