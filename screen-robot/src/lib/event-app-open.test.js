/**
 * Unitário — event-app-open.js (mock/stub; sem adb).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { waitAppOpen } from "./event-app-open.js";

function fakeClock(start = 0) {
  let t = start;
  return {
    now: () => t,
    sleep: async (ms) => {
      t += ms;
    },
  };
}

describe("waitAppOpen", () => {
  it("exige opts.pkg", async () => {
    await assert.rejects(
      () => waitAppOpen("s", {}),
      (err) => err && err.code === "EVENT_UNKNOWN",
    );
  });

  it("resolve quando package em foreground", async () => {
    const clock = fakeClock();
    const result = await waitAppOpen(
      "s",
      { pkg: "com.example.app", activity: ".Main", timeoutMs: 5_000 },
      {
        isForeground: () => true,
        sleep: clock.sleep,
        now: clock.now,
        toIso: () => "t",
      },
    );
    assert.deepEqual(result, {
      foreground: true,
      package: "com.example.app",
      activity: ".Main",
    });
  });

  it("repete até foreground", async () => {
    let n = 0;
    const clock = fakeClock();
    await waitAppOpen(
      "s",
      { pkg: "com.x", timeoutMs: 10_000, intervalMs: 10 },
      {
        isForeground: () => {
          n += 1;
          return n >= 2;
        },
        sleep: clock.sleep,
        now: clock.now,
      },
    );
    assert.equal(n, 2);
  });

  it("lança EVENT_APP_TIMEOUT", async () => {
    const clock = fakeClock();
    await assert.rejects(
      () =>
        waitAppOpen(
          "s",
          { pkg: "com.x", timeoutMs: 50, intervalMs: 20 },
          {
            isForeground: () => false,
            sleep: clock.sleep,
            now: clock.now,
          },
        ),
      (err) => err && err.code === "EVENT_APP_TIMEOUT",
    );
  });
});
