/**
 * Unitário — reset-instance.js (deps stub; sem Docker).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultResetScript, resetInstance } from "./reset-instance.js";

describe("defaultResetScript", () => {
  it("aponta redroid para adb e redroid", () => {
    assert.match(defaultResetScript("adb"), /redroid\/scripts\/reset\.sh$/);
    assert.match(defaultResetScript("redroid"), /redroid\/scripts\/reset\.sh$/);
  });
});

describe("resetInstance", () => {
  it("roda resetScript e espera boot", async () => {
    let ran = 0;
    const out = await resetInstance(
      { provision: { serial: "127.0.0.1:5555", kind: "redroid", connectTimeoutMs: 5_000 } },
      {
        runResetScript: async () => {
          ran += 1;
        },
        isReachable: async () => true,
        ensureAdbOnline: async () => {},
        waitBootCompleted: async () => {},
      },
    );
    assert.equal(ran, 1);
    assert.equal(out.serial, "127.0.0.1:5555");
  });

  it("falha sem serial", async () => {
    await assert.rejects(() => resetInstance({}), /RESET_NO_SERIAL/);
  });
});
