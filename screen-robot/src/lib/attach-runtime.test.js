/**
 * Unitário — attach-runtime.js (deps stub).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { attachRuntime } from "./attach-runtime.js";

function memoryRegistry(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    has: (n) => map.has(n),
    get: (n) => map.get(n) || null,
    set: (n, r) => map.set(n, r),
    remove: (n) => map.delete(n),
  };
}

describe("attachRuntime", () => {
  it("retorna serial do registro se alcançável", async () => {
    const r = await attachRuntime(
      "agent-a",
      { connectTimeoutMs: 1_000 },
      {
        registry: memoryRegistry({
          "agent-a": {
            serial: "127.0.0.1:5555",
            port: 5555,
            kind: "redroid",
            container: "sr-agent-a",
          },
        }),
        isReachable: async () => true,
      },
    );
    assert.equal(r.name, "agent-a");
    assert.equal(r.serial, "127.0.0.1:5555");
  });

  it("lança PROVISION_NAME_NOT_FOUND", async () => {
    await assert.rejects(
      () => attachRuntime("missing", {}, { registry: memoryRegistry() }),
      (err) => err && err.code === "PROVISION_NAME_NOT_FOUND",
    );
  });

  it("chama ensureRunning se porta caía", async () => {
    let ensured = 0;
    let reachable = false;
    const r = await attachRuntime(
      "agent-a",
      { connectTimeoutMs: 5_000 },
      {
        registry: memoryRegistry({
          "agent-a": {
            serial: "127.0.0.1:5555",
            port: 5555,
            kind: "redroid",
            container: "sr-agent-a",
            host: "127.0.0.1",
          },
        }),
        isReachable: async () => reachable,
        ensureRunning: async () => {
          ensured += 1;
          reachable = true;
        },
        sleep: async () => {},
        now: (() => {
          let t = 0;
          return () => t++;
        })(),
      },
    );
    assert.equal(ensured, 1);
    assert.equal(r.serial, "127.0.0.1:5555");
  });
});
