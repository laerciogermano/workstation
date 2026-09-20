/**
 * BDD e2e — US-07 Abrir aplicativo
 */
import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { adbOk } from "../../lib/adb.js";
import { provisionEmulator } from "../../lib/provision.js";

const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);
const agentName = process.env.SR_AGENT_NAME || "us-07-abrir-aplicativo-test";
const pkg = "com.android.settings";

describe("Cenário: US-07 Abrir aplicativo", () => {
  /** @type {Awaited<ReturnType<typeof provisionEmulator>>} */
  let handle;

  before(async () => {
    handle = await provisionEmulator({
      provision: { name: agentName, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
  }, { timeout: 300_000 });

  it(
    "Dado agent; Quando launch Settings; Então package em foreground",
    async () => {
      await handle.launch(pkg, ".Settings");
      assert.ok(adbOk(handle.serial, ["shell", "pidof", pkg]));
    },
    { timeout: 120_000 },
  );
});
