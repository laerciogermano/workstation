/**
 * BDD e2e — US-13 Extrair árvore DOM com textos
 */
import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { provisionEmulator } from "../../lib/provision.js";

const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);
const agentName = process.env.SR_AGENT_NAME || "us-13-extrair-arvore-dom-test";

describe("Cenário: US-13 Extrair árvore DOM com textos", () => {
  /** @type {Awaited<ReturnType<typeof provisionEmulator>>} */
  let handle;

  before(async () => {
    handle = await provisionEmulator({
      provision: { name: agentName, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
  }, { timeout: 300_000 });

  it(
    "Dado agent; Quando extract(); Então raiz com children",
    async () => {
      const tree = await handle.extract();
      assert.equal(tree.type, "root");
      assert.ok(Array.isArray(tree.children));
    },
    { timeout: 120_000 },
  );
});
