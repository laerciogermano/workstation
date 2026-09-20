/**
 * BDD e2e — US-06 Apps da config ficam instalados na versão definida
 */
import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { getInstalledVersion } from "../../lib/apk-get-installed-version.js";
import { provisionEmulator } from "../../lib/provision.js";

const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);
const agentName = process.env.SR_AGENT_NAME || "us-06-apps-da-config-ficam-instalados-test";
const app = {
  package: "com.android.adbkeyboard",
  artifact: "apks/ADBKeyboard.apk",
};

describe("Cenário: US-06 Apps da config ficam instalados na versão definida", () => {
  /** @type {Awaited<ReturnType<typeof provisionEmulator>>} */
  let handle;

  before(async () => {
    handle = await provisionEmulator({
      provision: { name: agentName, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
  }, { timeout: 300_000 });

  it(
    "Dado agent e app na config; Quando installApk; Então versão instalada",
    async () => {
      const r = await handle.installApk(app);
      assert.equal(r.package, app.package);
      const v = getInstalledVersion(handle.serial, app.package);
      assert.ok(v);
      assert.equal(r.version, v);
    },
    { timeout: 180_000 },
  );
});
