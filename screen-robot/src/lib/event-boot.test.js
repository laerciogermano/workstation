/**
 * Unitário — event-boot.js (mock/stub; sem adb).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { waitBoot } from "./event-boot.js";

function fakeClock(start = 0) {
  let t = start;
  return {
    now: () => t,
    sleep: async (ms) => {
      t += ms;
    },
  };
}

describe("waitBoot", () => {
  it("resolve quando boot=1", async () => {
    const clock = fakeClock();
    const polls = [];
    const result = await waitBoot(
      "127.0.0.1:5555",
      {
        timeoutMs: 5_000,
        intervalMs: 100,
        onEvent: (p) => polls.push(p.type),
      },
      {
        getBoot: () => "1",
        sleep: clock.sleep,
        now: clock.now,
        toIso: () => "t",
      },
    );
    assert.deepEqual(result, { boot: true });
    assert.ok(polls.includes("boot_poll"));
    assert.ok(polls.includes("boot"));
  });

  it("repete até boot=1", async () => {
    let n = 0;
    const clock = fakeClock();
    await waitBoot(
      "s",
      { timeoutMs: 10_000, intervalMs: 50 },
      {
        getBoot: () => {
          n += 1;
          return n < 3 ? "0" : "1";
        },
        sleep: clock.sleep,
        now: clock.now,
      },
    );
    assert.equal(n, 3);
  });

  it("lança EVENT_BOOT_TIMEOUT", async () => {
    const clock = fakeClock();
    await assert.rejects(
      () =>
        waitBoot(
          "s",
          { timeoutMs: 50, intervalMs: 20 },
          {
            getBoot: () => "0",
            sleep: clock.sleep,
            now: clock.now,
          },
        ),
      (err) => err && err.code === "EVENT_BOOT_TIMEOUT",
    );
  });
});
