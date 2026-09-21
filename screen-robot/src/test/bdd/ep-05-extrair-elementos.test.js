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
    "Dado agent; Quando extract(); Então lista só com textos",
    async () => {
      const t1 = await handle.extract();
      assert.ok(Array.isArray(t1));
      assert.ok(t1.every((e) => e.type === "text"));
      assert.ok(t1.every((e) => e.children === undefined));

      const t2 = await handle.extract();
      assert.equal(t2.length, t1.length);
      assert.ok(t2.every((e) => e.type === "text"));
    },
    { timeout: 180_000 },
  );
});

// SC-30 vive em sc-30-linkedin-sign-in-with-email.test.js (fixture, sem device)
