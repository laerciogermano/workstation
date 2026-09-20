/**
 * BDD e2e — US-05 Dump atualizado fica disponível
 */
import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { provisionEmulator } from "../../lib/provision.js";

const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);
const agentName = process.env.SR_AGENT_NAME || "us-05-dump-atualizado-fica-disponivel-test";

describe("Cenário: US-05 Dump atualizado fica disponível", () => {
  /** @type {Awaited<ReturnType<typeof provisionEmulator>>} */
  let handle;

  before(async () => {
    handle = await provisionEmulator({
      provision: { name: agentName, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
  }, { timeout: 300_000 });

  it(
    "Dado dump anterior; Quando handle.on(dump_change); Então dump atualizado",
    async () => {
      const result = await handle.on("dump_change", {
        previousXml: "<hierarchy/>",
        timeoutMs: 60_000,
      });
      assert.equal(result.changed, true);
      assert.ok(result.xml.length > 10);
    },
    { timeout: 120_000 },
  );
});
