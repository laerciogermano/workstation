/**
 * Biblioteca de provisionamento do emulador/agent.
 * Superfície pública: apenas `provisionEmulator`.
 * Handle: `on` (EP-02) · `installApk` (EP-03).
 */
import { createInstallApk as defaultCreateInstallApk } from "./apks.js";
import { createOn as defaultCreateOn } from "./events.js";
import { ensureAdbOnline as defaultEnsureAdbOnline } from "./ensure-adb-online.js";
import { startRuntime as defaultStartRuntime } from "./start-runtime.js";
import { waitBootCompleted as defaultWaitBootCompleted } from "./wait-boot-completed.js";

/**
 * @typedef {object} ProvisionConfig
 * @property {string} [device]
 * @property {{ serial?: string, kind?: string, connectTimeoutMs?: number, startScript?: string }} [provision]
 */

/**
 * @typedef {object} AgentHandle
 * @property {string} serial
 * @property {string} kind
 * @property {string} provisionedAt
 * @property {true} bootCompleted
 * @property {(event: string, opts?: object, onEvent?: Function) => Promise<object>} on
 * @property {(app: object) => Promise<object>} installApk
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
 * Único método público: provisiona o emulador (SC-01→SC-03).
 * @param {ProvisionConfig} cfg
 * @param {object} [deps]
 * @returns {Promise<AgentHandle>}
 */
export async function provisionEmulator(cfg, deps = {}) {
  const startRuntime = deps.startRuntime ?? defaultStartRuntime;
  const ensureAdbOnline = deps.ensureAdbOnline ?? defaultEnsureAdbOnline;
  const waitBootCompleted = deps.waitBootCompleted ?? defaultWaitBootCompleted;
  const createOn = deps.createOn ?? defaultCreateOn;
  const createInstallApk = deps.createInstallApk ?? defaultCreateInstallApk;
  const now = deps.now ?? Date.now;
  const toIso = deps.toIso ?? (() => new Date().toISOString());

  const resolved = resolveConfig(cfg);
  const started = now();

  await startRuntime(resolved);
  await ensureAdbOnline(resolved.serial, resolved.connectTimeoutMs, started);
  await waitBootCompleted(resolved.serial, resolved.connectTimeoutMs, started);

  return {
    serial: resolved.serial,
    kind: resolved.kind,
    provisionedAt: toIso(),
    bootCompleted: true,
    on: createOn(resolved.serial),
    installApk: createInstallApk(resolved.serial),
  };
}
