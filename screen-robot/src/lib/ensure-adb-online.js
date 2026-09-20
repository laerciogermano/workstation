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
 * @param {{ connectIfTcp?: Function, waitForDevice?: Function, sleep?: Function }} [deps]
 */
export async function ensureAdbOnline(
  serial,
  timeoutMs,
  started = Date.now(),
  deps = {},
) {
  const connectIfTcp = deps.connectIfTcp ?? defaultConnectIfTcp;
  const waitForDevice = deps.waitForDevice ?? defaultWaitForDevice;
  const sleep = deps.sleep ?? defaultSleep;

  connectIfTcp(serial);
  while (Date.now() - started < timeoutMs) {
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
