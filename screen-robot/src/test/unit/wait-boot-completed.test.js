/**
 * Unitário — lib/wait-boot-completed.js
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { waitBootCompleted } from "../../lib/wait-boot-completed.js";

describe("waitBootCompleted", () => {
  it("retorna quando boot=1", async () => {
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

  it("repete poll até boot=1", async () => {
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

  it("é idempotente quando já booted", async () => {
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

  it("lança PROVISION_BOOT_TIMEOUT se boot nunca completa", async () => {
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
