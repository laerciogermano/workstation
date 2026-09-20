/**
 * BDD e2e — US-01 Agent fica pronto para ADB
 * Fonte: 5.bdds.md · EP-01 / US-01
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

describe("Cenário: US-01 Agent fica pronto para ADB", () => {
  before(() => {
    spawnSync("bash", [stopScript], {
      encoding: "utf8",
      stdio: "inherit",
    });
  });

  it(
    "Dado config e runtime Android; Quando provisionEmulator; Então serial online e boot ok",
    async () => {
      const handle = await provisionEmulator({
        provision: {
          serial,
          kind: "redroid",
          connectTimeoutMs: timeoutMs,
        },
      });

      assert.equal(handle.serial, serial);
      assert.equal(handle.kind, "redroid");
      assert.equal(handle.bootCompleted, true);
      assert.ok(handle.provisionedAt);
      assert.equal(typeof handle.on, "function");
      assert.equal(adb(serial, ["get-state"]).stdout.trim(), "device");
      assert.equal(
        adb(serial, ["shell", "getprop", "sys.boot_completed"]).stdout.trim(),
        "1",
      );
    },
    { timeout: 300_000 },
  );
});
