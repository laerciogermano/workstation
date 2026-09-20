/**
 * BDD e2e — TSK-002 / SC-01
 * Fonte: 5.bdds.md — "SC-01 Agent sobe e fica alcançável"
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
const stopScript = path.join(
  pocsRoot,
  "redroid",
  "scripts",
  "stop.sh",
);

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
      // Dado
      const startScript = defaultStartScript("redroid");
      assert.ok(startScript, "script de start redroid deve existir");
      assert.equal(
        await isRuntimeReachable(serial),
        false,
        "pré-condição: agent ainda não alcançável",
      );

      // Quando
      await startRuntime({
        serial,
        kind: "redroid",
        connectTimeoutMs: Number(process.env.PROVISION_TIMEOUT_MS || 180_000),
        startScript,
      });

      // Então
      assert.equal(
        await isRuntimeReachable(serial),
        true,
        "processo/porta do agent deve estar alcançável",
      );
    },
    { timeout: 240_000 },
  );
});
