/**
 * Biblioteca de provisionamento do emulador/agent.
 * Superfície pública: apenas `provisionEmulator`.
 * Internamente encapsula SC-01→SC-03 (start · ADB online · boot completo).
 */
import { spawnSync } from "node:child_process";
import { adb, connectIfTcp, sleep } from "./adb.js";

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

/** SC-01 — sobe runtime se startScript informado e serial ainda não online. */
function startRuntime(resolved) {
  if (!resolved.startScript) return;
  try {
    connectIfTcp(resolved.serial);
    adb(resolved.serial, ["get-state"], { timeout: 3_000 });
    return; // já reachable
  } catch {
    /* precisa start */
  }
  const r = spawnSync("bash", [resolved.startScript], {
    encoding: "utf8",
    stdio: "inherit",
  });
  if (r.status !== 0) {
    const err = new Error(
      `PROVISION_START_FAILED: ${resolved.startScript} exit ${r.status}`,
    );
    err.code = "PROVISION_START_FAILED";
    throw err;
  }
}

/** SC-02 — serial ADB em estado device. */
async function ensureAdbOnline(serial, timeoutMs, started) {
  connectIfTcp(serial);
  while (Date.now() - started < timeoutMs) {
    try {
      adb(serial, ["wait-for-device"], { timeout: 5_000 });
      return;
    } catch {
      connectIfTcp(serial);
      await sleep(2_000);
    }
  }
  const err = new Error(
    `PROVISION_ADB_TIMEOUT: serial ${serial} não ficou device em ${timeoutMs}ms`,
  );
  err.code = "PROVISION_ADB_TIMEOUT";
  throw err;
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

  startRuntime(resolved);
  await ensureAdbOnline(resolved.serial, resolved.connectTimeoutMs, started);
  await waitBootCompleted(resolved.serial, resolved.connectTimeoutMs, started);

  return {
    serial: resolved.serial,
    kind: resolved.kind,
    provisionedAt: new Date().toISOString(),
    bootCompleted: true,
  };
}
