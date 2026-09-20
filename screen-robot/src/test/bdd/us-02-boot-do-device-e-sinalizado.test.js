/**
 * BDD e2e — US-02 Boot do device é sinalizado
 */
import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { provisionEmulator } from "../../lib/provision.js";

const serial = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);

describe("Cenário: US-02 Boot do device é sinalizado", () => {
  /** @type {Awaited<ReturnType<typeof provisionEmulator>>} */
  let handle;

  before(async () => {
    handle = await provisionEmulator({
      provision: { serial, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
  }, { timeout: 300_000 });

  it(
    "Dado serial online; Quando handle.on(boot); Então boot é sinalizado",
    async () => {
      const result = await handle.on("boot", { timeoutMs: 60_000 });
      assert.deepEqual(result, { boot: true });
    },
    { timeout: 120_000 },
  );
});
