/**
 * Unitário — ao lado de start-runtime.js
 */
import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import {
  defaultStartScript,
  startRuntime,
} from "./start-runtime.js";

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
