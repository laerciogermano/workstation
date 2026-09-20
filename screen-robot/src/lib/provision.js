/**
 * Biblioteca de provisionamento do emulador/agent.
 * Superfície pública: apenas `provisionEmulator`.
 * Handle: on · installApk · operate · extract · session (EP-02..06).
 */
import { createInstallApk as defaultCreateInstallApk } from "./apks.js";
import { createOn as defaultCreateOn } from "./events.js";
import { createExtract as defaultCreateExtract } from "./extract.js";
import { ensureAdbOnline as defaultEnsureAdbOnline } from "./ensure-adb-online.js";
import { createOperate as defaultCreateOperate } from "./operate.js";
import { createSessionApi as defaultCreateSessionApi } from "./session.js";
import { startRuntime as defaultStartRuntime } from "./start-runtime.js";
import { waitBootCompleted as defaultWaitBootCompleted } from "./wait-boot-completed.js";

/**
 * @typedef {object} ProvisionConfig
 * @property {string} [device]
 * @property {{ serial?: string, kind?: string, connectTimeoutMs?: number, startScript?: string }} [provision]
 */

/** @param {ProvisionConfig} cfg */
function resolveConfig(cfg) {
  const serial =
    cfg.provision?.serial || cfg.device || process.env.ANDROID_SERIAL;
  if (!serial) {
    const err = new Error("PROVISION_NO_SERIAL: falta serial/device na config");
    err.code = "PROVISION_NO_SERIAL";
    throw err;
  }
  return {
    serial,
    kind: cfg.provision?.kind || "adb",
    connectTimeoutMs: Number(cfg.provision?.connectTimeoutMs ?? 120_000),
    startScript: cfg.provision?.startScript,
  };
}

/**
 * @param {ProvisionConfig} cfg
 * @param {object} [deps]
 */
export async function provisionEmulator(cfg, deps = {}) {
  const startRuntime = deps.startRuntime ?? defaultStartRuntime;
  const ensureAdbOnline = deps.ensureAdbOnline ?? defaultEnsureAdbOnline;
  const waitBootCompleted = deps.waitBootCompleted ?? defaultWaitBootCompleted;
  const createOn = deps.createOn ?? defaultCreateOn;
  const createInstallApk = deps.createInstallApk ?? defaultCreateInstallApk;
  const createOperate = deps.createOperate ?? defaultCreateOperate;
  const createExtract = deps.createExtract ?? defaultCreateExtract;
  const createSessionApi = deps.createSessionApi ?? defaultCreateSessionApi;
  const now = deps.now ?? Date.now;
  const toIso = deps.toIso ?? (() => new Date().toISOString());

  const resolved = resolveConfig(cfg);
  const started = now();

  await startRuntime(resolved);
  await ensureAdbOnline(resolved.serial, resolved.connectTimeoutMs, started);
  await waitBootCompleted(resolved.serial, resolved.connectTimeoutMs, started);

  const operate = createOperate(resolved.serial);
  const session = createSessionApi({
    serial: resolved.serial,
    kind: resolved.kind,
  });

  return {
    serial: resolved.serial,
    kind: resolved.kind,
    provisionedAt: toIso(),
    bootCompleted: true,
    on: createOn(resolved.serial),
    installApk: createInstallApk(resolved.serial),
    launch: operate.launch,
    tap: operate.tap,
    tapElement: operate.tapElement,
    type: operate.type,
    scroll: operate.scroll,
    screenshot: operate.screenshot,
    matchImage: operate.matchImage,
    extract: createExtract(resolved.serial),
    saveSession: session.saveSession,
    removeSession: session.removeSession,
    restoreSession: session.restoreSession,
  };
}
