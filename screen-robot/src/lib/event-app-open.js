/**
 * SC-05 / US-03 — aguardar app em foreground.
 * Interno; caller usa handle.on("app_open", { pkg }, …).
 */
import { adbOk, sleep as defaultSleep } from "./adb.js";

function timedOut(msg) {
  const err = new Error(msg);
  err.code = "EVENT_APP_TIMEOUT";
  throw err;
}

function defaultIsForeground(serial, pkg) {
  return adbOk(serial, ["shell", "pidof", pkg]);
}

/**
 * @param {string} serial
 * @param {{ pkg?: string, activity?: string, timeoutMs?: number, intervalMs?: number, onEvent?: Function }} [opts]
 * @param {{ isForeground?: Function, sleep?: Function, now?: Function, toIso?: Function }} [deps]
 */
export async function waitAppOpen(serial, opts = {}, deps = {}) {
  const pkg = opts.pkg;
  if (!pkg) {
    const err = new Error("EVENT_UNKNOWN: app_open exige opts.pkg");
    err.code = "EVENT_UNKNOWN";
    throw err;
  }
  const timeoutMs = Number(opts.timeoutMs ?? 30_000);
  const intervalMs = Number(opts.intervalMs ?? 1_500);
  const onEvent = opts.onEvent;
  const isForeground = deps.isForeground ?? defaultIsForeground;
  const sleep = deps.sleep ?? defaultSleep;
  const now = deps.now ?? Date.now;
  const toIso = deps.toIso ?? (() => new Date().toISOString());
  const started = now();
  let attempt = 0;

  while (now() - started < timeoutMs) {
    attempt += 1;
    const foreground = isForeground(serial, pkg);
    if (typeof onEvent === "function") {
      onEvent({
        type: "app_poll",
        attempt,
        package: pkg,
        foreground,
        at: toIso(),
      });
    }
    if (foreground) {
      if (typeof onEvent === "function") {
        onEvent({
          type: "app_open",
          attempt,
          package: pkg,
          at: toIso(),
        });
      }
      return {
        foreground: true,
        package: pkg,
        ...(opts.activity ? { activity: opts.activity } : {}),
      };
    }
    await sleep(intervalMs);
  }
  timedOut(`eventos: timeout ${timeoutMs}ms aguardando app_open ${pkg}`);
}
