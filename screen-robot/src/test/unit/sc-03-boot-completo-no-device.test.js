/**
 * Unitário — SC-03 Boot completo no device
 * Fonte: 5.bdds.md · TSK-004
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { waitBootCompleted } from "../../lib/wait-boot-completed.js";

describe("Cenário: SC-03 Boot completo no device (unit)", () => {
  it("Dado serial online; Quando boot=1; Então Booted", async () => {
    let polls = 0;
    await waitBootCompleted("127.0.0.1:5555", 5_000, Date.now(), {
      getBootCompleted: () => {
        polls += 1;
        return "1";
      },
      sleep: async () => {},
    });
    assert.equal(polls, 1);
  });

  it("Dado boot pendente; Quando poll até 1; Então Booted", async () => {
    let polls = 0;
    await waitBootCompleted("127.0.0.1:5555", 10_000, Date.now(), {
      getBootCompleted: () => {
        polls += 1;
        return polls < 3 ? "0" : "1";
      },
      sleep: async () => {},
    });
    assert.equal(polls, 3);
  });

  it("Dado já Booted; Quando waitBootCompleted de novo; Então idempotente", async () => {
    let polls = 0;
    const deps = {
      getBootCompleted: () => {
        polls += 1;
        return "1";
      },
      sleep: async () => {},
    };
    await waitBootCompleted("127.0.0.1:5555", 1_000, Date.now(), deps);
    await waitBootCompleted("127.0.0.1:5555", 1_000, Date.now(), deps);
    assert.equal(polls, 2);
  });
});

describe("Cenário: SC-03 falha tipica PROVISION_BOOT_TIMEOUT (unit)", () => {
  it("Dado boot que nunca completa; Quando timeout; Então PROVISION_BOOT_TIMEOUT", async () => {
    let polls = 0;
    await assert.rejects(
      () =>
        waitBootCompleted("127.0.0.1:59996", 50, Date.now(), {
          getBootCompleted: () => {
            polls += 1;
            return "0";
          },
          sleep: async () => {},
        }),
      (err) => err && err.code === "PROVISION_BOOT_TIMEOUT",
    );
    assert.ok(polls >= 1);
  });
});
