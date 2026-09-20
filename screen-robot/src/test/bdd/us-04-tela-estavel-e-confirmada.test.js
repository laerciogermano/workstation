/**
 * BDD e2e — US-04 Tela estável é confirmada
 */
import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { provisionEmulator } from "../../lib/provision.js";

const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);
const agentName = process.env.SR_AGENT_NAME || "us-04-tela-estavel-e-confirmada-test";

describe("Cenário: US-04 Tela estável é confirmada", () => {
  /** @type {Awaited<ReturnType<typeof provisionEmulator>>} */
  let handle;

  before(async () => {
    handle = await provisionEmulator({
      provision: { name: agentName, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
  }, { timeout: 300_000 });

  it(
    "Dado agent pronto; Quando handle.on(ui_stable); Então tela estável",
    async () => {
      const result = await handle.on("ui_stable", {
        timeoutMs: 90_000,
        stableMs: 800,
        intervalMs: 300,
      });
      assert.deepEqual(result, { stable: true });
    },
    { timeout: 180_000 },
  );
});
