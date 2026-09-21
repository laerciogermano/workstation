/**
 * BDD e2e — US-06 Apps da config ficam instalados na versão definida
 */
import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { getInstalledVersion } from "../../lib/apk-get-installed-version.js";
import { installApk } from "../../lib/apks.js";
import { provisionEmulator } from "../../lib/provision.js";

const serial = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);
const app = {
  package: "com.android.adbkeyboard",
  artifact: "apks/ADBKeyboard.apk",
};

describe("Cenário: US-06 Apps da config ficam instalados na versão definida", () => {
  before(async () => {
    await provisionEmulator({
      provision: { serial, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
  }, { timeout: 300_000 });

  it(
    "Dado agent e app na config; Quando installApk; Então versão instalada",
    async () => {
      const r = await installApk({ serial, ...app });
      assert.equal(r.package, app.package);
      const v = getInstalledVersion(serial, app.package);
      assert.ok(v);
      assert.equal(r.version, v);
    },
    { timeout: 180_000 },
  );
});
