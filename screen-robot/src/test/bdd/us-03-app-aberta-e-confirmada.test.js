/**
 * BDD e2e — US-03 App aberta é confirmada
 */
import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { launch } from "../../lib/operate.js";
import { provisionEmulator } from "../../lib/provision.js";

const serial = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);
const pkg = process.env.EVENT_TEST_PKG || "com.android.settings";

describe("Cenário: US-03 App aberta é confirmada", () => {
  /** @type {Awaited<ReturnType<typeof provisionEmulator>>} */
  let handle;

  before(async () => {
    handle = await provisionEmulator({
      provision: { serial, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
    await launch(serial, pkg, ".Settings");
  }, { timeout: 300_000 });

  it(
    "Dado package em foreground; Quando handle.on(app_open); Então app confirmada",
    async () => {
      const result = await handle.on("app_open", { pkg, timeoutMs: 60_000 });
      assert.equal(result.foreground, true);
      assert.equal(result.package, pkg);
    },
    { timeout: 120_000 },
  );
});
