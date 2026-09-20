/**
 * BDD e2e — TSK-003 / SC-02
 * Fonte: 5.bdds.md · tasks/.../TSK-003-serial-adb-online
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, it, before } from "node:test";
import { fileURLToPath } from "node:url";
import { adb } from "../../lib/adb.js";
import { ensureAdbOnline } from "../../lib/ensure-adb-online.js";
import {
  defaultStartScript,
  startRuntime,
} from "../../lib/start-runtime.js";

const serial = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const pocsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../pocs",
);
const stopScript = path.join(pocsRoot, "redroid", "scripts", "stop.sh");
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);

function adbState(s) {
  return adb(s, ["get-state"]).stdout.trim();
}

describe("Cenário: SC-02 Serial ADB fica online", () => {
  before(async () => {
    spawnSync("bash", [stopScript], {
      encoding: "utf8",
      stdio: "inherit",
    });
    await startRuntime({
      serial,
      kind: "redroid",
      connectTimeoutMs: timeoutMs,
      startScript: defaultStartScript("redroid"),
    });
  });

  it(
    "Dado o agent alcançável e o serial esperado; Quando adb connect/listagem; Então serial fica device",
    async () => {
      await ensureAdbOnline(serial, timeoutMs, Date.now());
      assert.equal(adbState(serial), "device");
    },
    { timeout: 240_000 },
  );

  it(
    "Dado serial já device; Quando ensureAdbOnline roda de novo; Então permanece online",
    async () => {
      assert.equal(adbState(serial), "device");
      await ensureAdbOnline(serial, 5_000, Date.now());
      assert.equal(adbState(serial), "device");
    },
    { timeout: 30_000 },
  );
});

describe("Cenário: SC-02 falha tipica PROVISION_ADB_TIMEOUT", () => {
  it(
    "Dado serial inacessivel; Quando o timeout esgota; Então lança PROVISION_ADB_TIMEOUT",
    async () => {
      let waits = 0;
      await assert.rejects(
        () =>
          ensureAdbOnline("127.0.0.1:59997", 50, Date.now(), {
            connectIfTcp: () => {},
            waitForDevice: () => {
              waits += 1;
              throw new Error("offline");
            },
            sleep: async () => {},
          }),
        (err) => err && err.code === "PROVISION_ADB_TIMEOUT",
      );
      assert.ok(waits >= 1);
    },
    { timeout: 15_000 },
  );
});
