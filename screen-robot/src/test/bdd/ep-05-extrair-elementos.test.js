/**
 * BDD e2e — EP-05 Extrair elementos
 */
import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { provisionEmulator } from "../../lib/provision.js";

const serial = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);

describe("Épico: EP-05 Extrair elementos", () => {
  /** @type {Awaited<ReturnType<typeof provisionEmulator>>} */
  let handle;

  before(async () => {
    handle = await provisionEmulator({
      provision: { serial, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
  }, { timeout: 300_000 });

  it(
    "Dado agent; Quando extract() repetido; Então lista enriquece",
    async () => {
      const t1 = await handle.extract();
      assert.ok(Array.isArray(t1));

      const t2 = await handle.extract();
      assert.ok(Array.isArray(t2));
      assert.ok(t2.length >= t1.length);

      await handle.extract();
      await handle.extract();
      const t5 = await handle.extract();
      assert.ok(Array.isArray(t5));
      assert.ok(t5.length >= 0);
      assert.ok(t5.every((e) => e.children === undefined));
    },
    { timeout: 180_000 },
  );
});

// SC-30 vive em sc-30-linkedin-sign-in-with-email.test.js (fixture, sem device)
