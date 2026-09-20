/**
 * Unitário — ao lado de ensure-adb-online.js (deps mock/stub; sem adb real).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ensureAdbOnline } from "./ensure-adb-online.js";

function fakeClock(start = 0) {
  let t = start;
  return {
    now: () => t,
    sleep: async (ms) => {
      t += ms;
    },
  };
}

describe("ensureAdbOnline", () => {
  it("retorna quando wait-for-device ok", async () => {
    let connects = 0;
    let waits = 0;
    const clock = fakeClock();
    await ensureAdbOnline("127.0.0.1:5555", 5_000, 0, {
      connectIfTcp: () => {
        connects += 1;
      },
      waitForDevice: () => {
        waits += 1;
      },
      sleep: clock.sleep,
      now: clock.now,
    });
    assert.ok(connects >= 1);
    assert.equal(waits, 1);
  });

  it("repete até device após falha temporária", async () => {
    let attempts = 0;
    const clock = fakeClock();
    await ensureAdbOnline("127.0.0.1:5555", 10_000, 0, {
      connectIfTcp: () => {},
      waitForDevice: () => {
        attempts += 1;
        if (attempts < 2) throw new Error("offline");
      },
      sleep: clock.sleep,
      now: clock.now,
    });
    assert.equal(attempts, 2);
  });

  it("é idempotente quando já online", async () => {
    let waits = 0;
    const clock = fakeClock();
    const deps = {
      connectIfTcp: () => {},
      waitForDevice: () => {
        waits += 1;
      },
      sleep: clock.sleep,
      now: clock.now,
    };
    await ensureAdbOnline("127.0.0.1:5555", 1_000, 0, deps);
    await ensureAdbOnline("127.0.0.1:5555", 1_000, 0, deps);
    assert.equal(waits, 2);
  });

  it("lança PROVISION_ADB_TIMEOUT se o serial não fica device", async () => {
    let waits = 0;
    const clock = fakeClock();
    await assert.rejects(
      () =>
        ensureAdbOnline("127.0.0.1:59997", 50, 0, {
          connectIfTcp: () => {},
          waitForDevice: () => {
            waits += 1;
            throw new Error("offline");
          },
          sleep: clock.sleep,
          now: clock.now,
        }),
      (err) => err && err.code === "PROVISION_ADB_TIMEOUT",
    );
    assert.ok(waits >= 1);
  });
});
