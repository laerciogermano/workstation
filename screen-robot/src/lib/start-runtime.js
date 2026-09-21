/**
 * SC-01 — subir runtime até processo/porta alcançável.
 * Usado só por provision.js (não faz parte da API pública).
 */
import { spawnSync } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sleep as defaultSleep } from "./adb.js";
import {
  findSerialForRedroid as defaultFindSerialForRedroid,
  serialForRedroidName,
} from "./redroid-instance.js";

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
 * Runtime alcançável: TCP (127.0.0.1:5555) ou serial local no `adb devices` (emulator-5554).
 * Para host:port, exige também `adb get-state` = device (porta aberta ≠ ADB online).
 * @param {string} serial
 * @param {number} [timeoutMs]
 * @param {{ adbDevices?: () => string, adbGetState?: (serial: string) => string }} [deps]
 */
export function isRuntimeReachable(serial, timeoutMs = 1_000, deps = {}) {
  const s = String(serial || "");
  const m = s.match(/^(localhost|\d+\.\d+\.\d+\.\d+):(\d+)$/i);
  if (m) {
    const host = m[1].toLowerCase() === "localhost" ? "127.0.0.1" : m[1];
    const port = Number(m[2]);
    return new Promise((resolve) => {
      const socket = net.connect({ host, port }, () => {
        socket.destroy();
        const state =
          typeof deps.adbGetState === "function"
            ? deps.adbGetState(s)
            : String(
                spawnSync("adb", ["-s", s, "get-state"], { encoding: "utf8" })
                  .stdout || "",
              ).trim();
        resolve(state === "device");
      });
      socket.on("error", () => resolve(false));
      socket.setTimeout(timeoutMs, () => {
        socket.destroy();
        resolve(false);
      });
    });
  }
  if (!s) return Promise.resolve(false);
  const list =
    typeof deps.adbDevices === "function"
      ? deps.adbDevices()
      : spawnSync("adb", ["devices"], { encoding: "utf8" }).stdout || "";
  const line = String(list)
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith(`${s}\t`) || l.startsWith(`${s} `));
  return Promise.resolve(Boolean(line && /\bdevice\b/.test(line)));
}

/** Serial `emulator-*` cujo `adb emu avd name` bate com `name`. */
export function findSerialForAvd(name, deps = {}) {
  const list =
    typeof deps.adbDevices === "function"
      ? deps.adbDevices()
      : spawnSync("adb", ["devices"], { encoding: "utf8" }).stdout || "";
  const serials = String(list)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("emulator-") && /\bdevice\b/.test(l))
    .map((l) => l.split(/\s+/)[0]);
  const avdName =
    deps.avdNameOf ||
    ((serial) => {
      const r = spawnSync("adb", ["-s", serial, "emu", "avd", "name"], {
        encoding: "utf8",
      });
      return String(r.stdout || "")
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l && l !== "OK") || "";
    });
  for (const serial of serials) {
    if (avdName(serial) === name) return serial;
  }
  return null;
}

function defaultRunStartScript(scriptPath, env = {}) {
  const r = spawnSync("bash", [scriptPath], {
    encoding: "utf8",
    stdio: "inherit",
    env: { ...process.env, ...env },
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
 * @param {{ serial?: string, name?: string, kind: string, connectTimeoutMs?: number, startScript?: string }} resolved
 * @param {{ isReachable?: Function, runStartScript?: Function, findSerialForAvd?: Function, findSerialForRedroid?: Function, sleep?: Function, now?: Function }} [deps]
 */
export async function startRuntime(resolved, deps = {}) {
  const isReachable = deps.isReachable ?? isRuntimeReachable;
  const runStartScript = deps.runStartScript ?? defaultRunStartScript;
  const lookupAvd = deps.findSerialForAvd ?? findSerialForAvd;
  const lookupRedroid =
    deps.findSerialForRedroid ?? defaultFindSerialForRedroid;
  const sleep = deps.sleep ?? defaultSleep;
  const now = deps.now ?? Date.now;
  const timeoutMs = Number(resolved.connectTimeoutMs ?? 120_000);

  let serial = resolved.serial;
  if (resolved.kind === "redroid" && resolved.name && !serial) {
    serial = serialForRedroidName(resolved.name);
  }

  if (resolved.kind === "avd" && resolved.name) {
    const already = lookupAvd(resolved.name);
    if (already) return { serial: already };
  } else if (resolved.kind === "redroid" && resolved.name) {
    const already = lookupRedroid(resolved.name);
    if (already && (await isReachable(already))) return { serial: already };
  } else if (serial && (await isReachable(serial))) {
    return { serial };
  }

  const script =
    resolved.startScript || defaultStartScript(resolved.kind);
  if (!script) {
    const err = new Error(
      `PROVISION_START_FAILED: runtime não alcançável e sem startScript (kind=${resolved.kind})`,
    );
    err.code = "PROVISION_START_FAILED";
    throw err;
  }

  /** @type {Record<string, string>} */
  const env = {};
  if (resolved.kind === "avd" && resolved.name) {
    env.AVD_NAME = resolved.name;
  }
  if (resolved.kind === "redroid" && resolved.name) {
    env.REDROID_NAME = resolved.name;
    const port = String(serial).split(":")[1] || "5555";
    env.ADB_PORT = port;
  }
  await runStartScript(script, env);

  const started = now();
  while (now() - started < timeoutMs) {
    if (resolved.kind === "avd" && resolved.name) {
      const found = lookupAvd(resolved.name);
      if (found) return { serial: found };
    } else if (resolved.kind === "redroid" && resolved.name) {
      const found = lookupRedroid(resolved.name) || serial;
      if (found && (await isReachable(found))) return { serial: found };
    } else if (serial && (await isReachable(serial))) {
      return { serial };
    }
    await sleep(500);
  }

  const who = resolved.name || serial;
  const err = new Error(
    `PROVISION_START_FAILED: ${script} rodou mas ${who} não ficou alcançável em ${timeoutMs}ms`,
  );
  err.code = "PROVISION_START_FAILED";
  throw err;
}
