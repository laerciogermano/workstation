/**
 * SC-03 — aguardar sys.boot_completed=1.
 * Usado só por provision.js (não faz parte da API pública).
 */
import { adb, sleep as defaultSleep } from "./adb.js";

function defaultGetBootCompleted(serial) {
  return adb(serial, ["shell", "getprop", "sys.boot_completed"]).stdout.trim();
}

/**
 * @param {string} serial
 * @param {number} timeoutMs
 * @param {number} [started]
 * @param {{ getBootCompleted?: Function, sleep?: Function }} [deps]
 */
export async function waitBootCompleted(
  serial,
  timeoutMs,
  started = Date.now(),
  deps = {},
) {
  const getBootCompleted = deps.getBootCompleted ?? defaultGetBootCompleted;
  const sleep = deps.sleep ?? defaultSleep;

  while (Date.now() - started < timeoutMs) {
    try {
      if (getBootCompleted(serial) === "1") return;
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
