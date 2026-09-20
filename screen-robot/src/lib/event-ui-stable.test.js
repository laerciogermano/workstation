/**
 * Unitário — event-ui-stable.js (dump stub; sem uiautomator).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { waitUiStable } from "./event-ui-stable.js";

function fakeClock(start = 0) {
  let t = start;
  return {
    now: () => t,
    sleep: async (ms) => {
      t += ms;
    },
  };
}

const bigXml = `<hierarchy>${"x".repeat(120)}</hierarchy>`;

describe("waitUiStable", () => {
  it("resolve quando hash estável por stableMs", async () => {
    const clock = fakeClock();
    const result = await waitUiStable(
      "s",
      { timeoutMs: 10_000, intervalMs: 100, stableMs: 300 },
      {
        dumpUiXml: () => bigXml,
        sleep: clock.sleep,
        now: clock.now,
        toIso: () => "t",
      },
    );
    assert.deepEqual(result, { stable: true });
  });

  it("lança EVENT_STABLE_TIMEOUT se dump muda sempre", async () => {
    let n = 0;
    const clock = fakeClock();
    await assert.rejects(
      () =>
        waitUiStable(
          "s",
          { timeoutMs: 200, intervalMs: 50, stableMs: 500 },
          {
            dumpUiXml: () => `<hierarchy>${n++}${"y".repeat(120)}</hierarchy>`,
            sleep: clock.sleep,
            now: clock.now,
          },
        ),
      (err) => err && err.code === "EVENT_STABLE_TIMEOUT",
    );
  });
});
