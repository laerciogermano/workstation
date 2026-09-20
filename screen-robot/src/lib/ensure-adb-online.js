/**
 * SC-02 — garantir serial ADB em estado device.
 * Usado só por provision.js (não faz parte da API pública).
 */
import { adb, connectIfTcp as defaultConnectIfTcp, sleep as defaultSleep } from "./adb.js";

function defaultWaitForDevice(serial) {
  adb(serial, ["wait-for-device"], { timeout: 5_000 });
}

/**
 * @param {string} serial
 * @param {number} timeoutMs
 * @param {number} [started]
 * @param {{ connectIfTcp?: Function, waitForDevice?: Function, sleep?: Function, now?: Function }} [deps]
 */
export async function ensureAdbOnline(
  serial,
  timeoutMs,
  started,
  deps = {},
) {
  const connectIfTcp = deps.connectIfTcp ?? defaultConnectIfTcp;
  const waitForDevice = deps.waitForDevice ?? defaultWaitForDevice;
  const sleep = deps.sleep ?? defaultSleep;
  const now = deps.now ?? Date.now;
  const t0 = started ?? now();

  connectIfTcp(serial);
  while (now() - t0 < timeoutMs) {
    try {
      waitForDevice(serial);
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
