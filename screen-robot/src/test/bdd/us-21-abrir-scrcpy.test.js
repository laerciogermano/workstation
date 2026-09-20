/**
 * BDD e2e — US-21 Abrir scrcpy (SC-27)
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it, before } from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { provisionEmulator } from "../../lib/provision.js";

const serial = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const pocsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../pocs",
);
const stopScript = path.join(pocsRoot, "redroid", "scripts", "stop.sh");
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);

function hasScrcpy() {
  const r = spawnSync("command", ["-v", "scrcpy"], {
    encoding: "utf8",
    shell: true,
  });
  return r.status === 0 && Boolean((r.stdout || "").trim());
}

describe("US-21: Abrir scrcpy (espelhar tela)", () => {
  /** @type {Awaited<ReturnType<typeof provisionEmulator>>} */
  let handle;

  before(async () => {
    if (!hasScrcpy()) return;
    spawnSync("bash", [stopScript], { encoding: "utf8", stdio: "inherit" });
    handle = await provisionEmulator({
      provision: { serial, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
  }, { timeout: 300_000 });

  it(
    "Dado handle; Quando openScrcpy; Então pid no serial",
    async () => {
      if (!hasScrcpy()) {
        console.log("skip: scrcpy ausente no PATH");
        return;
      }
      assert.ok(handle);
      const out = handle.openScrcpy({ title: "us-21-test" });
      assert.equal(out.serial, serial);
      assert.ok(Number.isInteger(out.pid) && out.pid > 0);
      try {
        process.kill(out.pid, "SIGTERM");
      } catch {
        /* já saiu */
      }
    },
    { timeout: 60_000 },
  );
});
