/**
 * BDD e2e — TSK-002 / SC-01
 * Fonte: 5.bdds.md · tasks/.../TSK-002-subir-e-conectar
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, before } from "node:test";
import { fileURLToPath } from "node:url";
import {
  defaultStartScript,
  isRuntimeReachable,
  startRuntime,
} from "../../lib/start-runtime.js";

const serial = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const pocsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../pocs",
);
const stopScript = path.join(pocsRoot, "redroid", "scripts", "stop.sh");
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);

describe("Cenário: SC-01 Agent sobe e fica alcançável", () => {
  before(() => {
    spawnSync("bash", [stopScript], {
      encoding: "utf8",
      stdio: "inherit",
    });
  });

  it(
    "Dado host, imagem/runtime e script de start; Quando o agent é iniciado; Então fica alcançável",
    async () => {
      const startScript = defaultStartScript("redroid");
      assert.ok(startScript && fs.existsSync(startScript));
      assert.equal(await isRuntimeReachable(serial), false);

      await startRuntime({
        serial,
        kind: "redroid",
        connectTimeoutMs: timeoutMs,
        startScript,
      });

      assert.equal(await isRuntimeReachable(serial), true);
    },
    { timeout: 240_000 },
  );

  it(
    "Dado agent já alcançável; Quando startRuntime roda de novo; Então permanece alcançável sem falhar",
    async () => {
      assert.equal(await isRuntimeReachable(serial), true);
      await startRuntime({
        serial,
        kind: "redroid",
        connectTimeoutMs: 5_000,
      });
      assert.equal(await isRuntimeReachable(serial), true);
    },
    { timeout: 30_000 },
  );
});

describe("Cenário: SC-01 falha tipica PROVISION_START_FAILED", () => {
  it(
    "Dado script de start que falha; Quando tenta subir; Então lança PROVISION_START_FAILED",
    async () => {
      const failScript = path.join(os.tmpdir(), `sr-fail-${Date.now()}.sh`);
      fs.writeFileSync(failScript, "#!/usr/bin/env bash\nexit 1\n", {
        mode: 0o755,
      });

      await assert.rejects(
        () =>
          startRuntime({
            serial: "127.0.0.1:59999",
            kind: "redroid",
            connectTimeoutMs: 2_000,
            startScript: failScript,
          }),
        (err) => err && err.code === "PROVISION_START_FAILED",
      );

      fs.unlinkSync(failScript);
    },
    { timeout: 15_000 },
  );

  it(
    "Dado kind=adb sem startScript e porta inacessivel; Quando tenta subir; Então lança PROVISION_START_FAILED",
    async () => {
      await assert.rejects(
        () =>
          startRuntime({
            serial: "127.0.0.1:59998",
            kind: "adb",
            connectTimeoutMs: 1_000,
          }),
        (err) => err && err.code === "PROVISION_START_FAILED",
      );
    },
    { timeout: 15_000 },
  );
});
