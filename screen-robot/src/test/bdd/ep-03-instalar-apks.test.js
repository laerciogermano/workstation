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
import { installApk } from "../../lib/apks.js";
import { provisionEmulator } from "../../lib/provision.js";

const serial = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const pocsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../pocs",
);
const stopScript = path.join(pocsRoot, "redroid", "scripts", "stop.sh");
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);
const app = {
  package: "com.android.adbkeyboard",
  artifact: "apks/ADBKeyboard.apk",
};

describe("Épico: EP-03 Instalar APKs", () => {
  before(async () => {
    spawnSync("bash", [stopScript], { encoding: "utf8", stdio: "inherit" });
    await provisionEmulator({
      provision: { serial, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
  }, { timeout: 300_000 });

  it(
    "Dado agent e artefato local; Quando installApk; Então pacote instalado e skip idempotente",
    async () => {
      const first = await installApk({ serial, ...app });
      assert.equal(first.package, app.package);
      assert.equal(first.skipped, false);
      assert.ok(first.artifactPath);
      const installed = getInstalledVersion(serial, app.package);
      assert.ok(installed);

      const second = await installApk({
        serial,
        ...app,
        version: installed,
      });
      assert.equal(second.skipped, true);
      assert.equal(second.version, installed);
    },
    { timeout: 180_000 },
  );
});
