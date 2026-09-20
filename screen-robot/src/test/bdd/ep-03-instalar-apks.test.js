/**
 * BDD e2e — EP-03 Instalar APKs
 * Usa artefato local ADBKeyboard (sem apkeep/rede).
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, it, before } from "node:test";
import { fileURLToPath } from "node:url";
import { getInstalledVersion } from "../../lib/apk-get-installed-version.js";
import { provisionEmulator } from "../../lib/provision.js";

const pocsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../pocs",
);
const stopScript = path.join(pocsRoot, "redroid", "scripts", "stop.sh");
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);
const agentName = process.env.SR_AGENT_NAME || "ep-03-instalar-apks-test";
const app = {
  package: "com.android.adbkeyboard",
  artifact: "apks/ADBKeyboard.apk",
};

describe("Épico: EP-03 Instalar APKs", () => {
  /** @type {Awaited<ReturnType<typeof provisionEmulator>>} */
  let handle;

  before(async () => {
    spawnSync("bash", [stopScript], { encoding: "utf8", stdio: "inherit" });
    handle = await provisionEmulator({
      provision: { name: agentName, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
  }, { timeout: 300_000 });

  it(
    "Dado agent e artefato local; Quando installApk; Então pacote instalado e skip idempotente",
    async () => {
      const first = await handle.installApk(app);
      assert.equal(first.package, app.package);
      assert.equal(first.skipped, false);
      assert.ok(first.artifactPath);
      const installed = getInstalledVersion(handle.serial, app.package);
      assert.ok(installed);

      const second = await handle.installApk({
        ...app,
        version: installed,
      });
      assert.equal(second.skipped, true);
      assert.equal(second.version, installed);
    },
    { timeout: 180_000 },
  );
});
