/**
 * Unitário — event-dump-change.js (dump stub; sem uiautomator).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { waitDumpChange } from "./event-dump-change.js";

function fakeClock(start = 0) {
  let t = start;
  return {
    now: () => t,
    sleep: async (ms) => {
      t += ms;
    },
  };
}

describe("waitDumpChange", () => {
  it("resolve quando dump muda em relação a previousXml", async () => {
    const clock = fakeClock();
    const result = await waitDumpChange(
      "s",
      { previousXml: "<old/>", timeoutMs: 5_000, intervalMs: 10 },
      {
        dumpUiXml: () => "<new/>",
        sleep: clock.sleep,
        now: clock.now,
        toIso: () => "t",
      },
    );
    assert.equal(result.changed, true);
    assert.equal(result.xml, "<new/>");
  });

  it("lança EVENT_DUMP_TIMEOUT se dump não muda", async () => {
    const clock = fakeClock();
    const xml = "<same/>";
    await assert.rejects(
      () =>
        waitDumpChange(
          "s",
          { previousXml: xml, timeoutMs: 50, intervalMs: 20 },
          {
            dumpUiXml: () => xml,
            sleep: clock.sleep,
            now: clock.now,
          },
        ),
      (err) => err && err.code === "EVENT_DUMP_TIMEOUT",
    );
  });
});
