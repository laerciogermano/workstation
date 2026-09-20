/**
 * BDD e2e — EP-01 Provisionar agente (create-or-attach por nome)
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, it, before, after } from "node:test";
import { fileURLToPath } from "node:url";
import { adb } from "../../lib/adb.js";
import { createAgentRegistry } from "../../lib/agent-registry.js";
import { provisionEmulator } from "../../lib/provision.js";

const pocsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../pocs",
);
const stopScript = path.join(pocsRoot, "redroid", "scripts", "stop.sh");
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);
const nameA = `e2e-a-${Date.now().toString(36)}`;
const nameB = `e2e-b-${Date.now().toString(36)}`;

function stopAgent(name) {
  const rec = createAgentRegistry().get(name);
  spawnSync("bash", [stopScript, name], {
    encoding: "utf8",
    stdio: "inherit",
    env: {
      ...process.env,
      AGENT_NAME: name,
      ...(rec
        ? {
            ADB_PORT: String(rec.port),
            COMPOSE_PROJECT_NAME: `sr-${name}`,
            REDROID_CONTAINER_NAME: rec.container || `sr-${name}`,
          }
        : {}),
    },
  });
  createAgentRegistry().remove(name);
}

describe("Épico: EP-01 Provisionar agente", () => {
  before(() => {
    stopAgent(nameA);
    stopAgent(nameB);
  });

  after(() => {
    stopAgent(nameA);
    stopAgent(nameB);
  });

  it(
    "Dado nomes distintos; Quando provisiona A/B e reprovisiona A; Então seriais distintos e A reanexa",
    async () => {
      const a = await provisionEmulator({
        provision: { name: nameA, kind: "redroid", connectTimeoutMs: timeoutMs },
      });
      assert.equal(a.name, nameA);
      assert.equal(a.bootCompleted, true);
      assert.equal(adb(a.serial, ["get-state"]).stdout.trim(), "device");
      assert.equal(
        adb(a.serial, ["shell", "getprop", "sys.boot_completed"]).stdout.trim(),
        "1",
      );

      const b = await provisionEmulator({
        provision: { name: nameB, kind: "redroid", connectTimeoutMs: timeoutMs },
      });
      assert.equal(b.name, nameB);
      assert.notEqual(a.serial, b.serial);

      const again = await provisionEmulator({
        provision: { name: nameA, kind: "redroid", connectTimeoutMs: timeoutMs },
      });
      assert.equal(again.name, nameA);
      assert.equal(again.serial, a.serial);
      assert.equal(again.bootCompleted, true);
    },
    { timeout: 600_000 },
  );
});
