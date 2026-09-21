/**
 * Biblioteca de provisionamento do emulador/agent.
 * Superfície pública: apenas `provisionEmulator`.
 * Handle: installApk · operate · extract · session (EP-03..06).
 * Eventos UI: `on(cfg)` em events.js (EP-02) — não anexado ao handle.
 */
import { createInstallApk as defaultCreateInstallApk } from "./apks.js";
import { createExtract as defaultCreateExtract } from "./extract.js";
import { ensureAdbOnline as defaultEnsureAdbOnline } from "./ensure-adb-online.js";
import { createOperate as defaultCreateOperate } from "./operate.js";
import { createSessionApi as defaultCreateSessionApi } from "./session.js";
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
 */
export async function provisionEmulator(cfg, deps = {}) {
  const startRuntime = deps.startRuntime ?? defaultStartRuntime;
  const ensureAdbOnline = deps.ensureAdbOnline ?? defaultEnsureAdbOnline;
  const waitBootCompleted = deps.waitBootCompleted ?? defaultWaitBootCompleted;
  const createInstallApk = deps.createInstallApk ?? defaultCreateInstallApk;
  const createOperate = deps.createOperate ?? defaultCreateOperate;
  const createExtract = deps.createExtract ?? defaultCreateExtract;
  const createSessionApi = deps.createSessionApi ?? defaultCreateSessionApi;
  const now = deps.now ?? Date.now;
  const toIso = deps.toIso ?? (() => new Date().toISOString());

  const resolved = resolveConfig(cfg);
  const started = now();

  const runtime = await startRuntime(resolved);
  const serial = runtime?.serial || resolved.serial;
  await ensureAdbOnline(serial, resolved.connectTimeoutMs, started);
  await waitBootCompleted(serial, resolved.connectTimeoutMs, started);

  const operate = createOperate(serial);
  const session = createSessionApi({
    serial,
    kind: resolved.kind,
  });

  return {
    serial,
    kind: resolved.kind,
    provisionedAt: toIso(),
    bootCompleted: true,
    installApk: createInstallApk(serial),
    launch: operate.launch,
    tap: operate.tap,
    tapElement: operate.tapElement,
    type: operate.type,
    scroll: operate.scroll,
    screenshot: operate.screenshot,
    matchImage: operate.matchImage,
    openScrcpy: operate.openScrcpy,
    extract: createExtract(serial),
    saveSession: session.saveSession,
    removeSession: session.removeSession,
    restoreSession: session.restoreSession,
  };
}
