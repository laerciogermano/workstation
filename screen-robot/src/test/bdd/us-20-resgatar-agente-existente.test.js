/**
 * BDD e2e — US-20 Resgatar agente existente (via provisionEmulator)
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, it, before, after } from "node:test";
import { fileURLToPath } from "node:url";
import { createAgentRegistry } from "../../lib/agent-registry.js";
import { provisionEmulator } from "../../lib/provision.js";

const pocsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../pocs",
);
const stopScript = path.join(pocsRoot, "redroid", "scripts", "stop.sh");
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);
const name = `us20-${Date.now().toString(36)}`;

function stopAgent(n) {
  const rec = createAgentRegistry().get(n);
  spawnSync("bash", [stopScript, n], {
    encoding: "utf8",
    stdio: "inherit",
    env: {
      ...process.env,
      AGENT_NAME: n,
      ...(rec
        ? {
            ADB_PORT: String(rec.port),
            COMPOSE_PROJECT_NAME: `sr-${n}`,
            REDROID_CONTAINER_NAME: rec.container || `sr-${n}`,
          }
        : {}),
    },
  });
  createAgentRegistry().remove(n);
}

describe("Cenário: US-20 Agent existente é resgatado pelo nome", () => {
  before(() => stopAgent(name));
  after(() => stopAgent(name));

  it(
    "Dado agent provisionado; Quando provisionEmulator com o mesmo nome; Então mesmo serial sem criar outro",
    async () => {
      const created = await provisionEmulator({
        provision: { name, kind: "redroid", connectTimeoutMs: timeoutMs },
      });
      const attached = await provisionEmulator({
        provision: { name, kind: "redroid", connectTimeoutMs: timeoutMs },
      });
      assert.equal(attached.name, name);
      assert.equal(attached.serial, created.serial);
      assert.equal(attached.bootCompleted, true);
    },
    { timeout: 300_000 },
  );
});
