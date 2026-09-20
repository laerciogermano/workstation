/**
 * Unitário — ao lado de provision.js (orquestração com deps stub; sem app/runtime).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { provisionEmulator } from "./provision.js";

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

  it("orquestra start → adb → boot e devolve AgentHandle Booted", async () => {
    const calls = [];
    const onFn = async () => ({});
    const handle = await provisionEmulator(
      {
        provision: {
          serial: "127.0.0.1:5555",
          kind: "redroid",
          connectTimeoutMs: 1_000,
        },
      },
      {
        startRuntime: async (resolved) => {
          calls.push(["start", resolved.serial]);
        },
        ensureAdbOnline: async (serial) => {
          calls.push(["adb", serial]);
        },
        waitBootCompleted: async (serial) => {
          calls.push(["boot", serial]);
        },
        createOn: (serial) => {
          calls.push(["on", serial]);
          return onFn;
        },
        now: () => 1_700_000_000_000,
        toIso: () => "2026-01-01T00:00:00.000Z",
      },
    );

    assert.deepEqual(calls, [
      ["start", "127.0.0.1:5555"],
      ["adb", "127.0.0.1:5555"],
      ["boot", "127.0.0.1:5555"],
      ["on", "127.0.0.1:5555"],
    ]);
    assert.equal(handle.serial, "127.0.0.1:5555");
    assert.equal(handle.kind, "redroid");
    assert.equal(handle.bootCompleted, true);
    assert.equal(handle.provisionedAt, "2026-01-01T00:00:00.000Z");
    assert.equal(handle.on, onFn);
  });
});
