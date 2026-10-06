import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { spawnCaptured } from "./spawn-captured.js";

describe("spawnCaptured", () => {
  it("stdout de comando rápido", async () => {
    const r = await spawnCaptured("printf", ["ok"]);
    assert.equal(r.status, 0);
    assert.equal(r.stdout, "ok");
  });

  it("dois sleep em paralelo < soma", async () => {
    const t0 = Date.now();
    await Promise.all([
      spawnCaptured("sleep", ["0.25"]),
      spawnCaptured("sleep", ["0.25"]),
    ]);
    const ms = Date.now() - t0;
    assert.ok(ms < 400, `esperado <400ms, foi ${ms}ms`);
  });

  it("timeout mata o filho (OCR_TIMEOUT)", async () => {
    const t0 = Date.now();
    await assert.rejects(
      () => spawnCaptured("sleep", ["2"], { timeoutMs: 80 }),
      (e) => e.code === "OCR_TIMEOUT",
    );
    assert.ok(Date.now() - t0 < 500);
  });
});
