/**
 * BDD e2e — EP-01 Provisionar agente
 * Fonte: 5.bdds.md · EP-01 (aceite do épico via provisionEmulator)
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, it, before } from "node:test";
import { fileURLToPath } from "node:url";
import { adb } from "../../lib/adb.js";
import { provisionEmulator } from "../../lib/provision.js";

const serial = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const pocsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../pocs",
);
const stopScript = path.join(pocsRoot, "redroid", "scripts", "stop.sh");
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);

describe("Épico: EP-01 Provisionar agente", () => {
  before(() => {
    spawnSync("bash", [stopScript], {
      encoding: "utf8",
      stdio: "inherit",
    });
  });

  it(
    "Dado runtime disponivel; Quando provisiona o agent (SC-01..03); Então AgentHandle Booted",
    async () => {
      const handle = await provisionEmulator({
        provision: {
          serial,
          kind: "redroid",
          connectTimeoutMs: timeoutMs,
        },
      });

      assert.equal(handle.bootCompleted, true);
      assert.equal(handle.serial, serial);
      assert.equal(adb(serial, ["get-state"]).stdout.trim(), "device");
      assert.equal(
        adb(serial, ["shell", "getprop", "sys.boot_completed"]).stdout.trim(),
        "1",
      );
    },
    { timeout: 300_000 },
  );
});
