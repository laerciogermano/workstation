/**
 * Unitário — session.js (fs stub).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSessionApi } from "./session.js";

describe("createSessionApi", () => {
  it("save / restore / remove", async () => {
    const files = new Map();
    const api = createSessionApi(
      { serial: "s1", kind: "redroid" },
      {
        mkdirSync: () => {},
        writeFileSync: (p, data) => files.set(p, data),
        readFileSync: (p) => files.get(p),
        existsSync: (p) => files.has(p),
        unlinkSync: (p) => files.delete(p),
        resolve: (p) => `/abs/${p}`,
        toIso: () => "t0",
      },
    );
    const path = await api.saveSession("sess.json", { step: "ok" });
    assert.equal(path, "/abs/sess.json");
    const state = await api.restoreSession("sess.json");
    assert.equal(state.serial, "s1");
    assert.equal(state.kind, "redroid");
    assert.equal(state.step, "ok");
    assert.equal(await api.removeSession("sess.json"), true);
    await assert.rejects(
      () => api.restoreSession("sess.json"),
      (err) => err && err.code === "SESSION_NOT_FOUND",
    );
  });
});
