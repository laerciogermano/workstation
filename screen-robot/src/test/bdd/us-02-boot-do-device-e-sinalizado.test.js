/**
 * BDD e2e — US-02 Boot do device é sinalizado
 */
import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { on } from "../../lib/events.js";
import { provisionEmulator } from "../../lib/provision.js";

const serialEnv = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);

describe("Cenário: US-02 Boot do device é sinalizado", () => {
  /** @type {string} */
  let serial;

  before(async () => {
    const handle = await provisionEmulator({
      provision: { serial: serialEnv, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
    serial = handle.serial;
  }, { timeout: 300_000 });

  it(
    "Dado serial online; Quando on({ event: boot }); Então boot é sinalizado",
    async () => {
      const result = await on({ serial, event: "boot", timeoutMs: 60_000 });
      assert.deepEqual(result, { boot: true });
    },
    { timeout: 120_000 },
  );
});
