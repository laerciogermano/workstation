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

  it("devolve só dados (sem métodos)", async () => {
    const handle = await provisionEmulator(
      { provision: { serial: "127.0.0.1:5555", kind: "redroid" } },
      stubDeps,
    );
    assert.equal(handle.serial, "127.0.0.1:5555");
    assert.equal(handle.kind, "redroid");
    assert.equal(handle.bootCompleted, true);
    assert.equal(handle.provisionedAt, "t");
    assert.equal(handle.on, undefined);
    assert.equal(handle.installApk, undefined);
    assert.equal(handle.launch, undefined);
    assert.equal(handle.extract, undefined);
    assert.equal(handle.saveSession, undefined);
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
      },
    );
    assert.equal(handle.serial, "127.0.0.1:5601");
  });
});
