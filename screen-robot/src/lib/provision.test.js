/**
 * Unitário — provision.js (deps stub).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { attachEmulator, provisionEmulator } from "./provision.js";

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

describe("provisionEmulator", () => {
  it("lança PROVISION_INVALID_NAME sem name", async () => {
    await assert.rejects(
      () => provisionEmulator({}),
      (err) => err && err.code === "PROVISION_INVALID_NAME",
    );
  });

  it("cria handle com name e serial alocado", async () => {
    const handle = await provisionEmulator(
      { provision: { name: "agent-a", kind: "redroid" } },
      {
        ...handleDeps,
        startRuntime: async () => ({
          name: "agent-a",
          serial: "127.0.0.1:5555",
          port: 5555,
          kind: "redroid",
        }),
      },
    );
    assert.equal(handle.name, "agent-a");
    assert.equal(handle.serial, "127.0.0.1:5555");
    assert.equal(handle.bootCompleted, true);
    assert.equal(typeof handle.on, "function");
    assert.equal(typeof handle.installApk, "function");
    assert.equal(typeof handle.launch, "function");
    assert.equal(typeof handle.extract, "function");
    assert.equal(typeof handle.saveSession, "function");
  });
});

describe("attachEmulator", () => {
  it("anexa handle pelo nome", async () => {
    const handle = await attachEmulator(
      "agent-a",
      {},
      {
        ...handleDeps,
        attachRuntime: async () => ({
          name: "agent-a",
          serial: "127.0.0.1:5555",
          port: 5555,
          kind: "redroid",
        }),
      },
    );
    assert.equal(handle.name, "agent-a");
    assert.equal(handle.serial, "127.0.0.1:5555");
  });
});
