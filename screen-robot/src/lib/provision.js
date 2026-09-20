/**
 * Biblioteca de provisionamento do emulador/agent.
 * Superfície pública: apenas `provisionEmulator`.
 * Handle inclui `on` (EP-02) — eventos via handle após provisionar.
 */
import { createOn } from "./events.js";
import { ensureAdbOnline } from "./ensure-adb-online.js";
import { startRuntime } from "./start-runtime.js";
import { waitBootCompleted } from "./wait-boot-completed.js";

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
 * @returns {Promise<AgentHandle>}
 */
export async function provisionEmulator(cfg) {
  const resolved = resolveConfig(cfg);
  const started = Date.now();

  await startRuntime(resolved);
  await ensureAdbOnline(resolved.serial, resolved.connectTimeoutMs, started);
  await waitBootCompleted(resolved.serial, resolved.connectTimeoutMs, started);

  return {
    serial: resolved.serial,
    kind: resolved.kind,
    provisionedAt: new Date().toISOString(),
    bootCompleted: true,
    on: createOn(resolved.serial),
  };
}
