/**
 * US-25 / SC-32 — runAgent com stubs (sem device / sem API).
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
    let extracts = 0;
    const taps = [];
    try {
      const result = await runAgent(
        {
          serial: "emulator-5554",
          prompt: "conectar num comprador",
          maxSteps: 5,
          logDir,
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
              };
            }
            return {
              resumo: "ok",
              acao: { type: "done", motivo: "conectado" },
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
      const md = readFileSync(result.logPath, "utf8");
      assert.match(md, /### Decisão/);
      assert.match(md, /### OCR usado na decisão/);
      assert.match(md, /\*\*status:\*\* `done`/);
      // política não hardcoded no motor — prompt genérico
      assert.match(md, /conectar num comprador/);
    } finally {
      rmSync(logDir, { recursive: true, force: true });
    }
  });

  it("runAgent falha sem serial", async () => {
    await assert.rejects(
      () => runAgent({ prompt: "x" }),
      (e) => e.code === "AGENT_NO_SERIAL",
    );
  });
});
