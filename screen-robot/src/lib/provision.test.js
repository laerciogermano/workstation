/**
 * Unitário — provision.js (deps stub).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { provisionEmulator } from "./provision.js";

const handleDeps = {
  ensureAdbOnline: async () => {},
  waitBootCompleted: async () => {},
  createOn: () => async () => ({}),
  createInstallApk: () => async () => ({ skipped: true }),
  createOperate: () => ({
    launch: async () => {},
    tap: () => {},
    tapElement: () => {},
    type: () => {},
    scroll: () => {},
    screenshot: () => "/x.png",
    matchImage: async () => ({ x: 1, y: 2, confidence: 1 }),
  }),
  createExtract: () => async () => ({ type: "root", children: [] }),
  createSessionApi: () => ({
    saveSession: async () => "/s.json",
    removeSession: async () => true,
    restoreSession: async () => ({}),
  }),
  toIso: () => "t",
};

function memoryRegistry(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    has: (n) => map.has(n),
    get: (n) => map.get(n) || null,
    set: (n, r) => map.set(n, r),
    remove: (n) => map.delete(n),
  };
}

describe("provisionEmulator", () => {
  it("lança PROVISION_INVALID_NAME sem name", async () => {
    await assert.rejects(
      () => provisionEmulator({}),
      (err) => err && err.code === "PROVISION_INVALID_NAME",
    );
  });

  it("cria quando nome é novo", async () => {
    let started = 0;
    let attached = 0;
    const handle = await provisionEmulator(
      { provision: { name: "agent-a", kind: "redroid" } },
      {
        ...handleDeps,
        registry: memoryRegistry(),
        startRuntime: async () => {
          started += 1;
          return {
            name: "agent-a",
            serial: "127.0.0.1:5555",
            port: 5555,
            kind: "redroid",
          };
        },
        attachRuntime: async () => {
          attached += 1;
          return {
            name: "agent-a",
            serial: "127.0.0.1:5555",
            port: 5555,
            kind: "redroid",
          };
        },
      },
    );
    assert.equal(started, 1);
    assert.equal(attached, 0);
    assert.equal(handle.name, "agent-a");
    assert.equal(handle.serial, "127.0.0.1:5555");
    assert.equal(handle.bootCompleted, true);
  });

  it("anexa quando nome já existe", async () => {
    let started = 0;
    let attached = 0;
    const handle = await provisionEmulator(
      { provision: { name: "agent-a", kind: "redroid" } },
      {
        ...handleDeps,
        registry: memoryRegistry({
          "agent-a": { serial: "127.0.0.1:5555", port: 5555 },
        }),
        startRuntime: async () => {
          started += 1;
          throw new Error("não deve criar");
        },
        attachRuntime: async () => {
          attached += 1;
          return {
            name: "agent-a",
            serial: "127.0.0.1:5555",
            port: 5555,
            kind: "redroid",
          };
        },
      },
    );
    assert.equal(started, 0);
    assert.equal(attached, 1);
    assert.equal(handle.name, "agent-a");
  });
});
