/**
 * Unitário — session.js (fs stub).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { saveSession, restoreSession, removeSession } from "./session.js";

describe("session (save/restore/remove)", () => {
  it("save / restore / remove", async () => {
    const files = new Map();
    const deps = {
      mkdirSync: () => {},
      writeFileSync: (p, data) => files.set(p, data),
      readFileSync: (p) => files.get(p),
      existsSync: (p) => files.has(p),
      unlinkSync: (p) => files.delete(p),
      resolve: (p) => `/abs/${p}`,
      toIso: () => "t0",
    };
    const path = await saveSession(
      { serial: "s1", kind: "redroid", path: "sess.json", state: { step: "ok" } },
      deps,
    );
    assert.equal(path, "/abs/sess.json");
    const state = await restoreSession({ path: "sess.json" }, deps);
    assert.equal(state.serial, "s1");
    assert.equal(state.kind, "redroid");
    assert.equal(state.step, "ok");
    assert.equal(await removeSession({ path: "sess.json" }, deps), true);
    await assert.rejects(
      () => restoreSession({ path: "sess.json" }, deps),
      (err) => err && err.code === "SESSION_NOT_FOUND",
    );
  });
});
