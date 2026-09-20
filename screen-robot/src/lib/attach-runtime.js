/**
 * SC-25/26 — anexar a runtime existente pelo nome.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createAgentRegistry,
  sanitizeAgentName,
} from "./agent-registry.js";
import { isRuntimeReachable } from "./start-runtime.js";
import { sleep as defaultSleep } from "./adb.js";

const pocsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../pocs",
);

function defaultEnsureRunning(record) {
  const script = path.join(pocsRoot, "redroid", "scripts", "start.sh");
  const r = spawnSync("bash", [script], {
    encoding: "utf8",
    stdio: "inherit",
    env: {
      ...process.env,
      AGENT_NAME: record.name || path.basename(record.container || "", ""),
      ADB_PORT: String(record.port),
      ADB_HOST: record.host || "127.0.0.1",
      COMPOSE_PROJECT_NAME: `sr-${record.name}`,
      REDROID_CONTAINER_NAME: record.container,
    },
  });
  if (r.status !== 0) {
    const err = new Error(
      `PROVISION_START_FAILED: ensure running exit ${r.status}`,
    );
    err.code = "PROVISION_START_FAILED";
    throw err;
  }
}

/**
 * @param {string} name
 * @param {{ connectTimeoutMs?: number }} [opts]
 * @param {object} [deps]
 * @returns {Promise<{ name: string, serial: string, port: number, kind: string }>}
 */
export async function attachRuntime(name, opts = {}, deps = {}) {
  const id = sanitizeAgentName(name);
  const registry = deps.registry ?? createAgentRegistry();
  const isReachable = deps.isReachable ?? isRuntimeReachable;
  const ensureRunning = deps.ensureRunning ?? defaultEnsureRunning;
  const sleep = deps.sleep ?? defaultSleep;
  const now = deps.now ?? Date.now;
  const timeoutMs = Number(opts.connectTimeoutMs ?? 120_000);

  const record = registry.get(id);
  if (!record) {
    const err = new Error(
      `PROVISION_NAME_NOT_FOUND: agent "${id}" não encontrado`,
    );
    err.code = "PROVISION_NAME_NOT_FOUND";
    throw err;
  }

  const serial = record.serial;
  if (!(await isReachable(serial))) {
    await ensureRunning({ ...record, name: id });
  }

  const started = now();
  while (now() - started < timeoutMs) {
    if (await isReachable(serial)) {
      return {
        name: id,
        serial,
        port: record.port,
        kind: record.kind || "redroid",
      };
    }
    await sleep(500);
  }

  const err = new Error(
    `PROVISION_START_FAILED: ${serial} não ficou alcançável em ${timeoutMs}ms`,
  );
  err.code = "PROVISION_START_FAILED";
  throw err;
}
