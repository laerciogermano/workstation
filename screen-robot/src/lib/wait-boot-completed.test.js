/**
 * Unitário — ao lado de wait-boot-completed.js (deps mock/stub; sem adb real).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { waitBootCompleted } from "./wait-boot-completed.js";

function fakeClock(start = 0) {
  let t = start;
  return {
    now: () => t,
    sleep: async (ms) => {
      t += ms;
    },
  };
}

describe("waitBootCompleted", () => {
  it("retorna quando boot=1", async () => {
    let polls = 0;
    const clock = fakeClock();
    await waitBootCompleted("127.0.0.1:5555", 5_000, 0, {
      getBootCompleted: () => {
        polls += 1;
        return "1";
      },
      sleep: clock.sleep,
      now: clock.now,
    });
    assert.equal(polls, 1);
  });

  it("repete poll até boot=1", async () => {
    let polls = 0;
    const clock = fakeClock();
    await waitBootCompleted("127.0.0.1:5555", 10_000, 0, {
      getBootCompleted: () => {
        polls += 1;
        return polls < 3 ? "0" : "1";
      },
      sleep: clock.sleep,
      now: clock.now,
    });
    assert.equal(polls, 3);
  });

  it("é idempotente quando já booted", async () => {
    let polls = 0;
    const clock = fakeClock();
    const deps = {
      getBootCompleted: () => {
        polls += 1;
        return "1";
      },
      sleep: clock.sleep,
      now: clock.now,
    };
    await waitBootCompleted("127.0.0.1:5555", 1_000, 0, deps);
    await waitBootCompleted("127.0.0.1:5555", 1_000, 0, deps);
    assert.equal(polls, 2);
  });

  it("lança PROVISION_BOOT_TIMEOUT se boot nunca completa", async () => {
    let polls = 0;
    const clock = fakeClock();
    await assert.rejects(
      () =>
        waitBootCompleted("127.0.0.1:59996", 50, 0, {
          getBootCompleted: () => {
            polls += 1;
            return "0";
          },
          sleep: clock.sleep,
          now: clock.now,
        }),
      (err) => err && err.code === "PROVISION_BOOT_TIMEOUT",
    );
    assert.ok(polls >= 1);
  });
});
