/**
 * Unitário — provision.js (deps stub).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { provisionEmulator } from "./provision.js";

const stubDeps = {
  startRuntime: async () => {},
  ensureAdbOnline: async () => {},
  waitBootCompleted: async () => {},
  createInstallApk: () => async () => ({ skipped: true }),
  createOperate: () => ({
    launch: async () => {},
    tap: () => {},
    tapElement: () => {},
    type: () => {},
    scroll: () => {},
    screenshot: () => "/x.png",
    matchImage: async () => ({ x: 1, y: 2, confidence: 1 }),
    openScrcpy: () => ({ pid: 1, serial: "127.0.0.1:5555" }),
  }),
  createExtract: () => async () => [],
  createSessionApi: () => ({
    saveSession: async () => "/s.json",
    removeSession: async () => true,
    restoreSession: async () => ({}),
  }),
  toIso: () => "t",
};

describe("provisionEmulator", () => {
  it("lança PROVISION_NO_SERIAL sem serial", async () => {
    const prev = process.env.ANDROID_SERIAL;
    delete process.env.ANDROID_SERIAL;
    try {
      await assert.rejects(
        () => provisionEmulator({}),
        (err) => err && err.code === "PROVISION_NO_SERIAL",
      );
    } finally {
      if (prev !== undefined) process.env.ANDROID_SERIAL = prev;
    }
  });

  it("anexa installApk, operate, extract e session (sem on)", async () => {
    const handle = await provisionEmulator(
      { provision: { serial: "127.0.0.1:5555", kind: "redroid" } },
      stubDeps,
    );
    assert.equal(handle.on, undefined);
    assert.equal(typeof handle.installApk, "function");
    assert.equal(typeof handle.launch, "function");
    assert.equal(typeof handle.tap, "function");
    assert.equal(typeof handle.type, "function");
    assert.equal(typeof handle.scroll, "function");
    assert.equal(typeof handle.screenshot, "function");
    assert.equal(typeof handle.matchImage, "function");
    assert.equal(typeof handle.openScrcpy, "function");
    assert.equal(typeof handle.extract, "function");
    assert.equal(typeof handle.saveSession, "function");
    assert.equal(typeof handle.removeSession, "function");
    assert.equal(typeof handle.restoreSession, "function");
  });

  it("kind=redroid defaulta serial 127.0.0.1:5555", async () => {
    const handle = await provisionEmulator(
      { provision: { kind: "redroid" } },
      {
        ...stubDeps,
        startRuntime: async (r) => {
          assert.equal(r.serial, "127.0.0.1:5555");
          assert.equal(r.kind, "redroid");
          return { serial: r.serial };
        },
      },
    );
    assert.equal(handle.serial, "127.0.0.1:5555");
  });

  it("kind=redroid + name não força 5555 (serial sai do startRuntime)", async () => {
    const handle = await provisionEmulator(
      { provision: { kind: "redroid", name: "agent-b" } },
      {
        ...stubDeps,
        startRuntime: async (r) => {
          assert.equal(r.name, "agent-b");
          assert.equal(r.serial, undefined);
          return { serial: "127.0.0.1:5601" };
        },
        createOperate: () => ({
          ...stubDeps.createOperate(),
          openScrcpy: () => ({ pid: 1, serial: "127.0.0.1:5601" }),
        }),
      },
    );
    assert.equal(handle.serial, "127.0.0.1:5601");
  });
});
