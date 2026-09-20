/**
 * SC-01 — criar container/runtime nomeado até porta alcançável.
 * Usado só por provision.js (não faz parte da API pública).
 */
import { spawnSync } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createAgentRegistry,
  sanitizeAgentName,
} from "./agent-registry.js";
import { sleep as defaultSleep } from "./adb.js";

const pocsRoot = path.resolve(
  dirnameSafe(),
  "../../pocs",
);

function dirnameSafe() {
  return path.dirname(fileURLToPath(import.meta.url));
}

/** @param {"adb"|"redroid"|"avd"|string} kind */
export function defaultStartScript(kind) {
  if (kind === "redroid") {
    return path.join(pocsRoot, "redroid", "scripts", "start.sh");
  }
  if (kind === "avd") {
    return path.join(pocsRoot, "android-studio", "scripts", "start.sh");
  }
  return undefined;
}

/**
 * Porta/host do serial TCP (ex. 127.0.0.1:5555) respondendo.
 * @param {string} serial
 * @param {number} [timeoutMs]
 */
export function isRuntimeReachable(serial, timeoutMs = 1_000) {
  const m = String(serial).match(/^(localhost|\d+\.\d+\.\d+\.\d+):(\d+)$/i);
  if (!m) return Promise.resolve(false);
  const host = m[1].toLowerCase() === "localhost" ? "127.0.0.1" : m[1];
  const port = Number(m[2]);
  return new Promise((resolve) => {
    const socket = net.connect({ host, port }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.setTimeout(timeoutMs, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function isPortFree(host, port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

/**
 * @param {string} host
 * @param {number} [from]
 * @param {number} [to]
 * @param {{ isPortFree?: Function }} [deps]
 */
export async function allocateAdbPort(host = "127.0.0.1", from = 5555, to = 5655, deps = {}) {
  const free = deps.isPortFree ?? isPortFree;
  for (let port = from; port <= to; port++) {
    if (await free(host, port)) return port;
  }
  const err = new Error(
    `PROVISION_START_FAILED: nenhuma porta ADB livre em ${host}:${from}-${to}`,
  );
  err.code = "PROVISION_START_FAILED";
  throw err;
}

function defaultRunStartScript(scriptPath, env = {}) {
  const r = spawnSync("bash", [scriptPath], {
    encoding: "utf8",
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (r.status !== 0) {
    const err = new Error(
      `PROVISION_START_FAILED: ${scriptPath} exit ${r.status}`,
    );
    err.code = "PROVISION_START_FAILED";
    throw err;
  }
}

/**
 * Cria container **novo** para `name`. Falha se nome já registrado.
 * @param {{ name: string, kind: string, connectTimeoutMs?: number, host?: string, startScript?: string }} resolved
 * @param {object} [deps]
 * @returns {Promise<{ name: string, serial: string, port: number, kind: string }>}
 */
export async function startRuntime(resolved, deps = {}) {
  const name = sanitizeAgentName(resolved.name);
  const kind = resolved.kind || "redroid";
  const host = resolved.host || "127.0.0.1";
  const timeoutMs = Number(resolved.connectTimeoutMs ?? 120_000);
  const registry = deps.registry ?? createAgentRegistry();
  const isReachable = deps.isReachable ?? isRuntimeReachable;
  const runStartScript = deps.runStartScript ?? defaultRunStartScript;
  const allocPort = deps.allocateAdbPort ?? allocateAdbPort;
  const sleep = deps.sleep ?? defaultSleep;
  const now = deps.now ?? Date.now;

  if (registry.has(name)) {
    const err = new Error(
      `PROVISION_NAME_TAKEN: agent "${name}" já existe — use attachEmulator`,
    );
    err.code = "PROVISION_NAME_TAKEN";
    throw err;
  }

  const script = resolved.startScript || defaultStartScript(kind);
  if (!script) {
    const err = new Error(
      `PROVISION_START_FAILED: sem startScript (kind=${kind})`,
    );
    err.code = "PROVISION_START_FAILED";
    throw err;
  }

  const port = await allocPort(host);
  const serial = `${host}:${port}`;
  const container = `sr-${name}`;

  await runStartScript(script, {
    AGENT_NAME: name,
    ADB_PORT: String(port),
    ADB_HOST: host,
    COMPOSE_PROJECT_NAME: `sr-${name}`,
    REDROID_CONTAINER_NAME: container,
  });

  const started = now();
  while (now() - started < timeoutMs) {
    if (await isReachable(serial)) {
      registry.set(name, {
        serial,
        port,
        kind,
        container,
        host,
        createdAt: new Date(now()).toISOString(),
      });
      return { name, serial, port, kind };
    }
    await sleep(500);
  }

  const err = new Error(
    `PROVISION_START_FAILED: ${script} rodou mas ${serial} não ficou alcançável em ${timeoutMs}ms`,
  );
  err.code = "PROVISION_START_FAILED";
  throw err;
}
