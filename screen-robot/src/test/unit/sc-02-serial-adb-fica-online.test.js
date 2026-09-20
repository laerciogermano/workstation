/**
 * Unitário — SC-02 Serial ADB fica online
 * Fonte: 5.bdds.md · TSK-003
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ensureAdbOnline } from "../../lib/ensure-adb-online.js";

describe("Cenário: SC-02 Serial ADB fica online (unit)", () => {
  it("Dado serial esperado; Quando wait-for-device ok; Então AdbOnline", async () => {
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

  it("Dado falha temporaria; Quando retry; Então fica online", async () => {
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

  it("Dado já online; Quando ensureAdbOnline de novo; Então idempotente", async () => {
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
});

describe("Cenário: SC-02 falha tipica PROVISION_ADB_TIMEOUT (unit)", () => {
  it("Dado serial inacessivel; Quando timeout; Então PROVISION_ADB_TIMEOUT", async () => {
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
