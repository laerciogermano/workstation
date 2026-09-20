/**
 * BDD e2e — TSK-004 / SC-03
 * Fonte: 5.bdds.md · tasks/.../TSK-004-boot-completo
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
import { waitBootCompleted } from "../../lib/wait-boot-completed.js";

const serial = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const pocsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../pocs",
);
const stopScript = path.join(pocsRoot, "redroid", "scripts", "stop.sh");
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);

function bootProp() {
  return adb(serial, ["shell", "getprop", "sys.boot_completed"]).stdout.trim();
}

describe("Cenário: SC-03 Boot completo no device", () => {
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
    await ensureAdbOnline(serial, timeoutMs, Date.now());
  });

  it(
    "Dado serial ADB online; Quando poll de boot; Então device reporta boot completo",
    async () => {
      await waitBootCompleted(serial, timeoutMs, Date.now());
      assert.equal(bootProp(), "1");
    },
    { timeout: 240_000 },
  );

  it(
    "Dado boot já completo; Quando waitBootCompleted roda de novo; Então permanece ok",
    async () => {
      assert.equal(bootProp(), "1");
      await waitBootCompleted(serial, 5_000, Date.now());
      assert.equal(bootProp(), "1");
    },
    { timeout: 30_000 },
  );
});

describe("Cenário: SC-03 falha tipica PROVISION_BOOT_TIMEOUT", () => {
  it(
    "Dado boot que nunca completa; Quando o timeout esgota; Então lança PROVISION_BOOT_TIMEOUT",
    async () => {
      let polls = 0;
      await assert.rejects(
        () =>
          waitBootCompleted("127.0.0.1:59996", 50, Date.now(), {
            getBootCompleted: () => {
              polls += 1;
              return "0";
            },
            sleep: async () => {},
          }),
        (err) => err && err.code === "PROVISION_BOOT_TIMEOUT",
      );
      assert.ok(polls >= 1);
    },
    { timeout: 15_000 },
  );
});
