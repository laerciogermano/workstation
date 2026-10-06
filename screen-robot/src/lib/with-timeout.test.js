import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  it("resolve se cabe no prazo", async () => {
    const out = await withTimeout(Promise.resolve(["ok"]), 200, "fast");
    assert.deepEqual(out, ["ok"]);
  });

  it("rejeita OCR_TIMEOUT se passar do prazo", async () => {
    await assert.rejects(
      () =>
        withTimeout(
          new Promise((r) => setTimeout(() => r("late"), 80)),
          20,
          "slow",
        ),
      (e) => e.code === "OCR_TIMEOUT" && /slow/.test(e.message),
    );
  });
});
