/**
 * Unitário — lib/ensure-adb-online.js
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ensureAdbOnline } from "../../lib/ensure-adb-online.js";

describe("ensureAdbOnline", () => {
  it("retorna quando wait-for-device ok", async () => {
    let connects = 0;
    let waits = 0;
    await ensureAdbOnline("127.0.0.1:5555", 5_000, Date.now(), {
      connectIfTcp: () => {
        connects += 1;
      },
      waitForDevice: () => {
        waits += 1;
      },
      sleep: async () => {},
    });
    assert.ok(connects >= 1);
    assert.equal(waits, 1);
  });

  it("repete até device após falha temporária", async () => {
    let attempts = 0;
    await ensureAdbOnline("127.0.0.1:5555", 10_000, Date.now(), {
      connectIfTcp: () => {},
      waitForDevice: () => {
        attempts += 1;
        if (attempts < 2) throw new Error("offline");
      },
      sleep: async () => {},
    });
    assert.equal(attempts, 2);
  });

  it("é idempotente quando já online", async () => {
    let waits = 0;
    const deps = {
      connectIfTcp: () => {},
      waitForDevice: () => {
        waits += 1;
      },
      sleep: async () => {},
    };
    await ensureAdbOnline("127.0.0.1:5555", 1_000, Date.now(), deps);
    await ensureAdbOnline("127.0.0.1:5555", 1_000, Date.now(), deps);
    assert.equal(waits, 2);
  });

  it("lança PROVISION_ADB_TIMEOUT se o serial não fica device", async () => {
    let waits = 0;
    await assert.rejects(
      () =>
        ensureAdbOnline("127.0.0.1:59997", 50, Date.now(), {
          connectIfTcp: () => {},
          waitForDevice: () => {
            waits += 1;
            throw new Error("offline");
          },
          sleep: async () => {},
        }),
      (err) => err && err.code === "PROVISION_ADB_TIMEOUT",
    );
    assert.ok(waits >= 1);
  });
});
