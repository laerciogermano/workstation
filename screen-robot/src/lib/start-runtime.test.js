/**
 * Unitário — ao lado de start-runtime.js (deps mock/stub; sem runtime real).
 */
import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import {
  defaultStartScript,
  isRuntimeReachable,
  startRuntime,
} from "./start-runtime.js";
import { serialForRedroidName } from "./redroid-instance.js";
function fakeClock(start = 0) {
  let t = start;
  return {
    now: () => t,
    sleep: async (ms) => {
      t += ms;
    },
  };
}

describe("startRuntime", () => {
  it("não executa startScript se já alcançável", async () => {
    let runs = 0;
    await startRuntime(
      { serial: "127.0.0.1:5555", kind: "redroid", connectTimeoutMs: 1_000 },
      {
        isReachable: async () => true,
        runStartScript: async () => {
          runs += 1;
        },
      },
    );
    assert.equal(runs, 0);
  });

  it("executa startScript e retorna quando fica alcançável", async () => {
    let reachable = false;
    let runs = 0;
    const clock = fakeClock();
    await startRuntime(
      {
        serial: "127.0.0.1:5555",
        kind: "redroid",
        connectTimeoutMs: 5_000,
        startScript: "/tmp/fake-start.sh",
      },
      {
        isReachable: async () => reachable,
        runStartScript: async () => {
          runs += 1;
          reachable = true;
        },
        sleep: clock.sleep,
        now: clock.now,
      },
    );
    assert.equal(runs, 1);
    assert.equal(reachable, true);
  });

  it("kind avd usa o name (AVD_NAME), ignora serial já online de outro AVD", async () => {
    let env;
    let runs = 0;
    let lookups = 0;
    const clock = fakeClock();
    const out = await startRuntime(
      {
        name: "Outro_Cam",
        kind: "avd",
        serial: "emulator-5554",
        connectTimeoutMs: 5_000,
        startScript: "/tmp/start.sh",
      },
      {
        isReachable: async () => true,
        findSerialForAvd: () => {
          lookups += 1;
          return lookups > 1 ? "emulator-5556" : null;
        },
        runStartScript: async (_script, e) => {
          runs += 1;
          env = e;
        },
        sleep: clock.sleep,
        now: clock.now,
      },
    );
    assert.equal(runs, 1);
    assert.equal(env.AVD_NAME, "Outro_Cam");
    assert.equal(out.serial, "emulator-5556");
  });

  it("kind avd não sobe de novo se o name já está no adb", async () => {
    let runs = 0;
    const out = await startRuntime(
      { name: "ConnectMax_Cam", kind: "avd", serial: "emulator-5554" },
      {
        isReachable: async () => true,
        findSerialForAvd: () => "emulator-5558",
        runStartScript: async () => {
          runs += 1;
        },
      },
    );
    assert.equal(runs, 0);
    assert.equal(out.serial, "emulator-5558");
  });

  it("kind redroid + name sobe outra porta e não anexa 5555 alheio", async () => {
    let env;
    let runs = 0;
    const clock = fakeClock();
    const expected = serialForRedroidName("agent-b");
    const out = await startRuntime(
      {
        name: "agent-b",
        kind: "redroid",
        connectTimeoutMs: 5_000,
        startScript: "/tmp/start.sh",
      },
      {
        isReachable: async (serial) => {
          // 5555 “alheio” online não deve impedir create da instância agent-b
          if (serial === "127.0.0.1:5555") return true;
          return serial === expected;
        },
        findSerialForRedroid: () => null,
        runStartScript: async (_script, e) => {
          runs += 1;
          env = e;
        },
        sleep: clock.sleep,
        now: clock.now,
      },
    );
    assert.equal(runs, 1);
    assert.equal(env.REDROID_NAME, "agent-b");
    assert.equal(env.ADB_PORT, expected.split(":")[1]);
    assert.equal(out.serial, expected);
    assert.notEqual(out.serial, "127.0.0.1:5555");
  });

  it("kind redroid + name anexa instância já online do mesmo name", async () => {
    let runs = 0;
    const out = await startRuntime(
      { name: "agent-a", kind: "redroid" },
      {
        isReachable: async () => true,
        findSerialForRedroid: () => "127.0.0.1:5610",
        runStartScript: async () => {
          runs += 1;
        },
      },
    );
    assert.equal(runs, 0);
    assert.equal(out.serial, "127.0.0.1:5610");
  });

  it("é idempotente quando já alcançável", async () => {
    let runs = 0;
    const deps = {
      isReachable: async () => true,
      runStartScript: async () => {
        runs += 1;
      },
    };
    await startRuntime(
      { serial: "127.0.0.1:5555", kind: "redroid", connectTimeoutMs: 1_000 },
      deps,
    );
    await startRuntime(
      { serial: "127.0.0.1:5555", kind: "redroid", connectTimeoutMs: 1_000 },
      deps,
    );
    assert.equal(runs, 0);
  });

  it("lança PROVISION_START_FAILED se o script falha", async () => {
    await assert.rejects(
      () =>
        startRuntime(
          {
            serial: "127.0.0.1:59999",
            kind: "redroid",
            connectTimeoutMs: 1_000,
            startScript: "/tmp/fail.sh",
          },
          {
            isReachable: async () => false,
            runStartScript: async () => {
              const err = new Error("PROVISION_START_FAILED: exit 1");
              err.code = "PROVISION_START_FAILED";
              throw err;
            },
          },
        ),
      (err) => err && err.code === "PROVISION_START_FAILED",
    );
  });

  it("lança PROVISION_START_FAILED sem startScript e inacessível", async () => {
    await assert.rejects(
      () =>
        startRuntime(
          { serial: "127.0.0.1:59998", kind: "adb", connectTimeoutMs: 1_000 },
          { isReachable: async () => false },
        ),
      (err) => err && err.code === "PROVISION_START_FAILED",
    );
  });

  it("lança PROVISION_START_FAILED se nunca fica alcançável", async () => {
    const clock = fakeClock();
    await assert.rejects(
      () =>
        startRuntime(
          {
            serial: "127.0.0.1:59997",
            kind: "redroid",
            connectTimeoutMs: 50,
            startScript: "/tmp/ok.sh",
          },
          {
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

describe("isRuntimeReachable", () => {
  it("aceita emulator-* via adb devices", async () => {
    const ok = await isRuntimeReachable("emulator-5554", 100, {
      adbDevices: () => "List of devices attached\nemulator-5554\tdevice\n",
    });
    assert.equal(ok, true);
  });

  it("recusa emulator offline", async () => {
    const ok = await isRuntimeReachable("emulator-5554", 100, {
      adbDevices: () => "List of devices attached\nemulator-5554\toffline\n",
    });
    assert.equal(ok, false);
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
