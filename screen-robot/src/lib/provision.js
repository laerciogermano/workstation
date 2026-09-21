/**
 * Biblioteca de provisionamento do emulador/agent.
 * Superfície pública: apenas `provisionEmulator` — devolve dados (sem métodos).
 * Ops: installApk · operate · extract · session (imports separados).
 * Eventos UI: `on(cfg)` em events.js (EP-02).
 */
import { ensureAdbOnline as defaultEnsureAdbOnline } from "./ensure-adb-online.js";
import { startRuntime as defaultStartRuntime } from "./start-runtime.js";
import { waitBootCompleted as defaultWaitBootCompleted } from "./wait-boot-completed.js";

/**
 * @typedef {object} ProvisionConfig
 * @property {string} [device]
 * @property {{ name?: string, serial?: string, kind?: string, connectTimeoutMs?: number, startScript?: string }} [provision]
 */

/** @param {ProvisionConfig} cfg */
function resolveConfig(cfg) {
  const name = cfg.provision?.name;
  let serial =
    cfg.provision?.serial || cfg.device || process.env.ANDROID_SERIAL;
  const kind = cfg.provision?.kind || "adb";
  // redroid sem name: serial legado 127.0.0.1:5555; com name: porta deriva do name
  if (!serial && kind === "redroid" && !name) {
    serial = "127.0.0.1:5555";
  }
  if (!serial && !(name && (kind === "avd" || kind === "redroid"))) {
    const tip =
      kind === "avd"
        ? "com kind=avd informe provision.name (AVD)"
        : kind === "redroid"
          ? "com kind=redroid informe provision.name ou serial (default 127.0.0.1:5555)"
          : "informe provision.serial/device, ou use kind=avd|redroid + name";
    const err = new Error(`PROVISION_NO_SERIAL: falta serial/device (${tip})`);
    err.code = "PROVISION_NO_SERIAL";
    throw err;
  }
  return {
    name,
    serial,
    kind,
    connectTimeoutMs: Number(cfg.provision?.connectTimeoutMs ?? 120_000),
    startScript: cfg.provision?.startScript,
  };
}

/**
 * @param {ProvisionConfig} cfg
 * @param {object} [deps]
 * @returns {Promise<{ serial: string, kind: string, provisionedAt: string, bootCompleted: true }>}
 */
export async function provisionEmulator(cfg, deps = {}) {
  const startRuntime = deps.startRuntime ?? defaultStartRuntime;
  const ensureAdbOnline = deps.ensureAdbOnline ?? defaultEnsureAdbOnline;
  const waitBootCompleted = deps.waitBootCompleted ?? defaultWaitBootCompleted;
  const now = deps.now ?? Date.now;
  const toIso = deps.toIso ?? (() => new Date().toISOString());

  const resolved = resolveConfig(cfg);
  const started = now();

  const runtime = await startRuntime(resolved);
  const serial = runtime?.serial || resolved.serial;
  await ensureAdbOnline(serial, resolved.connectTimeoutMs, started);
  await waitBootCompleted(serial, resolved.connectTimeoutMs, started);

  return {
    serial,
    kind: resolved.kind,
    provisionedAt: toIso(),
    bootCompleted: true,
  };
}
