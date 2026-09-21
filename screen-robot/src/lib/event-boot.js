/**
 * SC-04 / US-02 — aguardar sinal de boot (evento UI).
 * Interno; caller usa on({ event: "boot", … }).
 */
import { adb, sleep as defaultSleep } from "./adb.js";

function timedOut(msg) {
  const err = new Error(msg);
  err.code = "EVENT_BOOT_TIMEOUT";
  throw err;
}

function defaultGetBoot(serial) {
  return adb(serial, ["shell", "getprop", "sys.boot_completed"]).stdout.trim();
}

/**
 * @param {string} serial
 * @param {{ timeoutMs?: number, intervalMs?: number, onEvent?: Function }} [opts]
 * @param {{ getBoot?: Function, sleep?: Function, now?: Function, toIso?: Function }} [deps]
 */
export async function waitBoot(serial, opts = {}, deps = {}) {
  const timeoutMs = Number(opts.timeoutMs ?? 60_000);
  const intervalMs = Number(opts.intervalMs ?? 1_500);
  const onEvent = opts.onEvent;
  const getBoot = deps.getBoot ?? defaultGetBoot;
  const sleep = deps.sleep ?? defaultSleep;
  const now = deps.now ?? Date.now;
  const toIso = deps.toIso ?? (() => new Date().toISOString());
  const started = now();
  let attempt = 0;

  while (now() - started < timeoutMs) {
    attempt += 1;
    try {
      const value = getBoot(serial);
      if (typeof onEvent === "function") {
        onEvent({ type: "boot_poll", attempt, value, at: toIso() });
      }
      if (value === "1") {
        if (typeof onEvent === "function") {
          onEvent({ type: "boot", attempt, at: toIso() });
        }
        return { boot: true };
      }
    } catch {
      /* retry */
    }
    await sleep(intervalMs);
  }
  timedOut(`eventos: timeout ${timeoutMs}ms aguardando boot (${serial})`);
}
