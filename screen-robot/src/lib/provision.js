/**
 * Biblioteca de provisionamento do emulador/agent.
 * Público: provisionEmulator · attachEmulator.
 * Handle: on · installApk · operate · extract · session (EP-02..06).
 */
import { createInstallApk as defaultCreateInstallApk } from "./apks.js";
import { attachRuntime as defaultAttachRuntime } from "./attach-runtime.js";
import { createOn as defaultCreateOn } from "./events.js";
import { createExtract as defaultCreateExtract } from "./extract.js";
import { ensureAdbOnline as defaultEnsureAdbOnline } from "./ensure-adb-online.js";
import { createOperate as defaultCreateOperate } from "./operate.js";
import { createSessionApi as defaultCreateSessionApi } from "./session.js";
import { sanitizeAgentName } from "./agent-registry.js";
import { startRuntime as defaultStartRuntime } from "./start-runtime.js";
import { waitBootCompleted as defaultWaitBootCompleted } from "./wait-boot-completed.js";

/**
 * @typedef {object} ProvisionConfig
 * @property {string} [name]
 * @property {string} [device]
 * @property {{ name?: string, kind?: string, host?: string, connectTimeoutMs?: number, startScript?: string }} [provision]
 */

/** @param {ProvisionConfig} cfg */
function resolveCreateConfig(cfg) {
  const name = sanitizeAgentName(cfg.provision?.name || cfg.name);
  return {
    name,
    kind: cfg.provision?.kind || "redroid",
    host: cfg.provision?.host || "127.0.0.1",
    connectTimeoutMs: Number(cfg.provision?.connectTimeoutMs ?? 120_000),
    startScript: cfg.provision?.startScript,
  };
}

function buildHandle(meta, deps, toIso) {
  const createOn = deps.createOn ?? defaultCreateOn;
  const createInstallApk = deps.createInstallApk ?? defaultCreateInstallApk;
  const createOperate = deps.createOperate ?? defaultCreateOperate;
  const createExtract = deps.createExtract ?? defaultCreateExtract;
  const createSessionApi = deps.createSessionApi ?? defaultCreateSessionApi;

  const operate = createOperate(meta.serial);
  const session = createSessionApi({
    serial: meta.serial,
    kind: meta.kind,
    name: meta.name,
  });

  return {
    name: meta.name,
    serial: meta.serial,
    kind: meta.kind,
    provisionedAt: toIso(),
    bootCompleted: true,
    on: createOn(meta.serial),
    installApk: createInstallApk(meta.serial),
    launch: operate.launch,
    tap: operate.tap,
    tapElement: operate.tapElement,
    type: operate.type,
    scroll: operate.scroll,
    screenshot: operate.screenshot,
    matchImage: operate.matchImage,
    extract: createExtract(meta.serial),
    saveSession: session.saveSession,
    removeSession: session.removeSession,
    restoreSession: session.restoreSession,
  };
}

/**
 * US-01 — cria container novo para `name`.
 * @param {ProvisionConfig} cfg
 * @param {object} [deps]
 */
export async function provisionEmulator(cfg, deps = {}) {
  const startRuntime = deps.startRuntime ?? defaultStartRuntime;
  const ensureAdbOnline = deps.ensureAdbOnline ?? defaultEnsureAdbOnline;
  const waitBootCompleted = deps.waitBootCompleted ?? defaultWaitBootCompleted;
  const now = deps.now ?? Date.now;
  const toIso = deps.toIso ?? (() => new Date().toISOString());

  const resolved = resolveCreateConfig(cfg);
  const started = now();

  const runtime = await startRuntime(resolved, deps);
  await ensureAdbOnline(runtime.serial, resolved.connectTimeoutMs, started);
  await waitBootCompleted(runtime.serial, resolved.connectTimeoutMs, started);

  return buildHandle(
    { name: runtime.name, serial: runtime.serial, kind: runtime.kind },
    deps,
    toIso,
  );
}

/**
 * US-20 — resgata agent existente pelo nome (sem criar container).
 * @param {string} name
 * @param {{ connectTimeoutMs?: number }} [opts]
 * @param {object} [deps]
 */
export async function attachEmulator(name, opts = {}, deps = {}) {
  const attachRuntime = deps.attachRuntime ?? defaultAttachRuntime;
  const ensureAdbOnline = deps.ensureAdbOnline ?? defaultEnsureAdbOnline;
  const waitBootCompleted = deps.waitBootCompleted ?? defaultWaitBootCompleted;
  const now = deps.now ?? Date.now;
  const toIso = deps.toIso ?? (() => new Date().toISOString());
  const connectTimeoutMs = Number(opts.connectTimeoutMs ?? 120_000);

  const started = now();
  const runtime = await attachRuntime(name, { connectTimeoutMs }, deps);
  await ensureAdbOnline(runtime.serial, connectTimeoutMs, started);
  await waitBootCompleted(runtime.serial, connectTimeoutMs, started);

  return buildHandle(
    { name: runtime.name, serial: runtime.serial, kind: runtime.kind },
    deps,
    toIso,
  );
}
