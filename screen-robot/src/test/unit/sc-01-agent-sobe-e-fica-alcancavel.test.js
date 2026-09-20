/**
 * Unitário — SC-01 Agent sobe e fica alcançável
 * Fonte: 5.bdds.md · TSK-002
 */
import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import {
  defaultStartScript,
  startRuntime,
} from "../../lib/start-runtime.js";

describe("Cenário: SC-01 Agent sobe e fica alcançável (unit)", () => {
  it("Dado já alcançável; Quando startRuntime; Então não executa startScript", async () => {
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

  it("Dado host/script; Quando sobe e fica alcançável; Então Reachable", async () => {
    let reachable = false;
    let runs = 0;
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
        sleep: async () => {},
      },
    );
    assert.equal(runs, 1);
    assert.equal(reachable, true);
  });

  it("Dado já Reachable após start; Quando startRuntime de novo; Então idempotente", async () => {
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
});

describe("Cenário: SC-01 falha tipica PROVISION_START_FAILED (unit)", () => {
  it("Dado script que falha; Quando tenta subir; Então PROVISION_START_FAILED", async () => {
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

  it("Dado kind=adb sem startScript e inacessivel; Quando sobe; Então PROVISION_START_FAILED", async () => {
    await assert.rejects(
      () =>
        startRuntime(
          { serial: "127.0.0.1:59998", kind: "adb", connectTimeoutMs: 1_000 },
          { isReachable: async () => false },
        ),
      (err) => err && err.code === "PROVISION_START_FAILED",
    );
  });

  it("Dado script ok mas nunca Reachable; Quando timeout; Então PROVISION_START_FAILED", async () => {
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
            sleep: async () => {},
          },
        ),
      (err) => err && err.code === "PROVISION_START_FAILED",
    );
  });
});

describe("defaultStartScript (unit)", () => {
  it("resolve paths redroid e avd; adb sem script", () => {
    const redroid = defaultStartScript("redroid");
    const avd = defaultStartScript("avd");
    assert.ok(redroid && redroid.endsWith(path.join("redroid", "scripts", "start.sh")));
    assert.ok(avd && avd.endsWith(path.join("android-studio", "scripts", "start.sh")));
    assert.equal(defaultStartScript("adb"), undefined);
  });
});
