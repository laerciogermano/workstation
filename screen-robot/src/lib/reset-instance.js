/**
 * Reset da instância do zero (apaga dados persistentes e sobe de novo).
 * Usado pelo piloto LinkedIn / ops locais; não faz parte da superfície do handle.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sleep as defaultSleep } from "./adb.js";
import { ensureAdbOnline as defaultEnsureAdbOnline } from "./ensure-adb-online.js";
import {
  defaultStartScript,
  isRuntimeReachable as defaultIsReachable,
} from "./start-runtime.js";
import { waitBootCompleted as defaultWaitBootCompleted } from "./wait-boot-completed.js";

const pocsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../pocs",
);

/**
 * @param {"adb"|"redroid"|"avd"|string} kind
 * @returns {string|undefined}
 */
export function defaultResetScript(kind) {
  if (kind === "avd") {
    return path.join(pocsRoot, "android-studio", "scripts", "reset.sh");
  }
  if (kind === "redroid" || kind === "adb") {
    return path.join(pocsRoot, "redroid", "scripts", "reset.sh");
  }
  return undefined;
}

function defaultRunResetScript(scriptPath) {
  const r = spawnSync("bash", [scriptPath], {
    encoding: "utf8",
    stdio: "inherit",
  });
  if (r.status !== 0) {
    const err = new Error(
      `RESET_FAILED: ${scriptPath} exit ${r.status}`,
    );
    err.code = "RESET_FAILED";
    throw err;
  }
}

/**
 * @param {{ device?: string, provision?: { serial?: string, kind?: string, connectTimeoutMs?: number, resetScript?: string, startScript?: string } }} cfg
 * @param {object} [deps]
 */
export async function resetInstance(cfg = {}, deps = {}) {
  const serial =
    cfg.provision?.serial || cfg.device || process.env.ANDROID_SERIAL;
  if (!serial) {
    const err = new Error("RESET_NO_SERIAL: falta serial/device na config");
    err.code = "RESET_NO_SERIAL";
    throw err;
  }

  const kind = cfg.provision?.kind || "adb";
  const connectTimeoutMs = Number(cfg.provision?.connectTimeoutMs ?? 180_000);
  const script =
    cfg.provision?.resetScript ||
    defaultResetScript(kind) ||
    cfg.provision?.startScript ||
    defaultStartScript(kind);

  if (!script) {
    const err = new Error(
      `RESET_UNSUPPORTED: sem resetScript para kind=${kind}`,
    );
    err.code = "RESET_UNSUPPORTED";
    throw err;
  }

  const runResetScript = deps.runResetScript ?? defaultRunResetScript;
  const isReachable = deps.isReachable ?? defaultIsReachable;
  const ensureAdbOnline = deps.ensureAdbOnline ?? defaultEnsureAdbOnline;
  const waitBootCompleted = deps.waitBootCompleted ?? defaultWaitBootCompleted;
  const sleep = deps.sleep ?? defaultSleep;
  const now = deps.now ?? Date.now;

  await runResetScript(script);

  const started = now();
  while (now() - started < connectTimeoutMs) {
    if (await isReachable(serial)) break;
    await sleep(500);
  }
  if (!(await isReachable(serial))) {
    const err = new Error(
      `RESET_FAILED: ${serial} não alcançável após reset em ${connectTimeoutMs}ms`,
    );
    err.code = "RESET_FAILED";
    throw err;
  }

  await ensureAdbOnline(serial, connectTimeoutMs, started);
  await waitBootCompleted(serial, connectTimeoutMs, started);
  return { serial, kind, resetAt: new Date().toISOString() };
}
