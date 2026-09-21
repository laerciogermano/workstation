/**
 * BDD e2e — US-13 Extrair elementos (lista plana)
 */
import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { provisionEmulator } from "../../lib/provision.js";

const serial = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);

describe("Cenário: US-13 Extrair elementos (lista plana)", () => {
  /** @type {Awaited<ReturnType<typeof provisionEmulator>>} */
  let handle;

  before(async () => {
    handle = await provisionEmulator({
      provision: { serial, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
  }, { timeout: 300_000 });

  it(
    "Dado agent; Quando extract(); Então devolve só textos (sem children)",
    async () => {
      const list = await handle.extract();
      assert.ok(Array.isArray(list));
      assert.ok(list.every((e) => e.type === "text"));
      assert.ok(list.every((e) => e.children === undefined));
    },
    { timeout: 120_000 },
  );
});
