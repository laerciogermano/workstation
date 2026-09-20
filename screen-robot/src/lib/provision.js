/**
 * Biblioteca de provisionamento do emulador/agent.
 * Superfície pública: apenas `provisionEmulator`.
 * Handle inclui `on` (EP-02) — eventos via handle após provisionar.
 */
import { adb, sleep } from "./adb.js";
import { createOn } from "./events.js";
import { ensureAdbOnline } from "./ensure-adb-online.js";
import { startRuntime } from "./start-runtime.js";

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

/** SC-03 — sys.boot_completed=1. */
async function waitBootCompleted(serial, timeoutMs, started) {
  while (Date.now() - started < timeoutMs) {
    try {
      const boot = adb(serial, ["shell", "getprop", "sys.boot_completed"])
        .stdout.trim();
      if (boot === "1") return;
    } catch {
      /* retry */
    }
    await sleep(2_000);
  }
  const err = new Error(
    `PROVISION_BOOT_TIMEOUT: boot não completou em ${timeoutMs}ms (${serial})`,
  );
  err.code = "PROVISION_BOOT_TIMEOUT";
  throw err;
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
