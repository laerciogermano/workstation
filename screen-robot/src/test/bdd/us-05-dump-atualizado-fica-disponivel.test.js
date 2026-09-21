/**
 * BDD e2e — US-05 Frame atualizado fica disponível
 */
import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { on } from "../../lib/events.js";
import { provisionEmulator } from "../../lib/provision.js";

const serialEnv = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);

describe("Cenário: US-05 Frame atualizado fica disponível", () => {
  /** @type {string} */
  let serial;

  before(async () => {
    const handle = await provisionEmulator({
      provision: { serial: serialEnv, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
    serial = handle.serial;
  }, { timeout: 300_000 });

  it(
    "Dado frame/dump anterior; Quando on({ event: frame_change }); Então mudou",
    async () => {
      const result = await on({
        serial,
        event: "frame_change",
        previousFrame: "<hierarchy/>",
        timeoutMs: 60_000,
      });
      assert.equal(result.changed, true);
      assert.ok(result.xml.length > 10);
    },
    { timeout: 120_000 },
  );
});
