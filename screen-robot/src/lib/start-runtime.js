/**
 * SC-01 — subir runtime até processo/porta alcançável.
 * Usado só por provision.js (não faz parte da API pública).
 */
import { spawnSync } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sleep as defaultSleep } from "./adb.js";

const pocsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../pocs",
);

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

function defaultRunStartScript(scriptPath) {
  const r = spawnSync("bash", [scriptPath], {
    encoding: "utf8",
    stdio: "inherit",
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
 * @param {{ serial: string, kind: string, connectTimeoutMs?: number, startScript?: string }} resolved
 * @param {{ isReachable?: Function, runStartScript?: Function, sleep?: Function }} [deps]
 */
export async function startRuntime(resolved, deps = {}) {
  const isReachable = deps.isReachable ?? isRuntimeReachable;
  const runStartScript = deps.runStartScript ?? defaultRunStartScript;
  const sleep = deps.sleep ?? defaultSleep;
  const timeoutMs = Number(resolved.connectTimeoutMs ?? 120_000);

  if (await isReachable(resolved.serial)) return;

  const script =
    resolved.startScript || defaultStartScript(resolved.kind);
  if (!script) {
    const err = new Error(
      `PROVISION_START_FAILED: runtime não alcançável e sem startScript (kind=${resolved.kind})`,
    );
    err.code = "PROVISION_START_FAILED";
    throw err;
  }

  await runStartScript(script);

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await isReachable(resolved.serial)) return;
    await sleep(500);
  }

  const err = new Error(
    `PROVISION_START_FAILED: ${script} rodou mas ${resolved.serial} não ficou alcançável em ${timeoutMs}ms`,
  );
  err.code = "PROVISION_START_FAILED";
  throw err;
}
