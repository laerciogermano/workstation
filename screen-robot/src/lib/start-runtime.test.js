/**
 * Unitário — ao lado de start-runtime.js (deps mock/stub; sem runtime real).
 */
import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import {
  allocateAdbPort,
  defaultStartScript,
  startRuntime,
} from "./start-runtime.js";

function fakeClock(start = 0) {
  let t = start;
  return {
    now: () => t,
    sleep: async (ms) => {
      t += ms;
    },
  };
}

function memoryRegistry() {
  const map = new Map();
  return {
    has: (n) => map.has(n),
    get: (n) => map.get(n) || null,
    set: (n, r) => map.set(n, r),
    remove: (n) => map.delete(n),
  };
}

describe("allocateAdbPort", () => {
  it("escolhe primeira porta livre", async () => {
    const port = await allocateAdbPort("127.0.0.1", 5555, 5557, {
      isPortFree: async (_h, p) => p === 5556,
    });
    assert.equal(port, 5556);
  });
});

describe("startRuntime", () => {
  it("cria agent novo e registra serial", async () => {
    const registry = memoryRegistry();
    let envSeen;
    const clock = fakeClock();
    let reachable = false;
    const r = await startRuntime(
      { name: "agent-a", kind: "redroid", connectTimeoutMs: 5_000 },
      {
        registry,
        allocateAdbPort: async () => 5555,
        isReachable: async () => reachable,
        runStartScript: async (_s, env) => {
          envSeen = env;
          reachable = true;
        },
        sleep: clock.sleep,
        now: clock.now,
      },
    );
    assert.equal(r.name, "agent-a");
    assert.equal(r.serial, "127.0.0.1:5555");
    assert.equal(envSeen.AGENT_NAME, "agent-a");
    assert.equal(envSeen.ADB_PORT, "5555");
    assert.equal(registry.get("agent-a").serial, "127.0.0.1:5555");
  });

  it("lança PROVISION_NAME_TAKEN se nome existe", async () => {
    const registry = memoryRegistry();
    registry.set("agent-a", { serial: "127.0.0.1:5555", port: 5555 });
    await assert.rejects(
      () =>
        startRuntime(
          { name: "agent-a", kind: "redroid" },
          { registry, allocateAdbPort: async () => 5556 },
        ),
      (err) => err && err.code === "PROVISION_NAME_TAKEN",
    );
  });

  it("lança PROVISION_START_FAILED se nunca fica alcançável", async () => {
    const clock = fakeClock();
    await assert.rejects(
      () =>
        startRuntime(
          {
            name: "x",
            kind: "redroid",
            connectTimeoutMs: 50,
            startScript: "/tmp/ok.sh",
          },
          {
            registry: memoryRegistry(),
            allocateAdbPort: async () => 5555,
            isReachable: async () => false,
            runStartScript: async () => {},
            sleep: clock.sleep,
            now: clock.now,
          },
        ),
      (err) => err && err.code === "PROVISION_START_FAILED",
    );
  });
});

describe("defaultStartScript", () => {
  it("resolve paths redroid e avd; adb sem script", () => {
    const redroid = defaultStartScript("redroid");
    const avd = defaultStartScript("avd");
    assert.ok(
      redroid && redroid.endsWith(path.join("redroid", "scripts", "start.sh")),
    );
    assert.ok(
      avd && avd.endsWith(path.join("android-studio", "scripts", "start.sh")),
    );
    assert.equal(defaultStartScript("adb"), undefined);
  });
});
