/**
 * BDD e2e — US-04 Tela estável é confirmada
 */
import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { on } from "../../lib/events.js";
import { provisionEmulator } from "../../lib/provision.js";

const serialEnv = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);

describe("Cenário: US-04 Tela estável é confirmada", () => {
  /** @type {string} */
  let serial;

  before(async () => {
    const handle = await provisionEmulator({
      provision: { serial: serialEnv, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
    serial = handle.serial;
  }, { timeout: 300_000 });

  it(
    "Dado agent pronto; Quando on({ event: ui_stable }); Então tela estável",
    async () => {
      const result = await on({
        serial,
        event: "ui_stable",
        timeoutMs: 90_000,
        stableMs: 800,
        intervalMs: 300,
      });
      assert.deepEqual(result, { stable: true });
    },
    { timeout: 180_000 },
  );
});
