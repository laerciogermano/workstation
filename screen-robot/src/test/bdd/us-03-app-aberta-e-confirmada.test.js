/**
 * BDD e2e — US-03 App aberta é confirmada
 */
import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { on } from "../../lib/events.js";
import { launch } from "../../lib/operate.js";
import { provisionEmulator } from "../../lib/provision.js";

const serialEnv = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);
const pkg = process.env.EVENT_TEST_PKG || "com.android.settings";

describe("Cenário: US-03 App aberta é confirmada", () => {
  /** @type {string} */
  let serial;

  before(async () => {
    const handle = await provisionEmulator({
      provision: { serial: serialEnv, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
    serial = handle.serial;
    await launch(serial, pkg, ".Settings");
  }, { timeout: 300_000 });

  it(
    "Dado package em foreground; Quando on({ event: app_open }); Então app confirmada",
    async () => {
      const result = await on({
        serial,
        event: "app_open",
        pkg,
        timeoutMs: 60_000,
      });
      assert.equal(result.foreground, true);
      assert.equal(result.package, pkg);
    },
    { timeout: 120_000 },
  );
});
