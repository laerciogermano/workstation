/**
 * SC-06 / US-04 — aguardar UI estável (dump hash estável).
 * Interno; caller usa handle.on("ui_stable", …).
 */
import { createHash } from "node:crypto";
import { sleep as defaultSleep } from "./adb.js";
import { dumpUiXml as defaultDumpUiXml } from "./extract.js";

function timedOut(msg) {
  const err = new Error(msg);
  err.code = "EVENT_STABLE_TIMEOUT";
  throw err;
}

function hashDump(xml) {
  return createHash("sha1").update(xml).digest("hex");
}

/**
 * @param {string} serial
 * @param {{ timeoutMs?: number, intervalMs?: number, stableMs?: number, contains?: string, onEvent?: Function }} [opts]
 * @param {{ dumpUiXml?: Function, sleep?: Function, now?: Function, toIso?: Function }} [deps]
 */
export async function waitUiStable(serial, opts = {}, deps = {}) {
  const timeoutMs = Number(opts.timeoutMs ?? 60_000);
  const intervalMs = Number(opts.intervalMs ?? 400);
  const stableMs = Number(opts.stableMs ?? 1_200);
  const contains = opts.contains ? String(opts.contains).toLowerCase() : null;
  const onEvent = opts.onEvent;
  const dumpUiXml = deps.dumpUiXml ?? defaultDumpUiXml;
  const sleep = deps.sleep ?? defaultSleep;
  const now = deps.now ?? Date.now;
  const toIso = deps.toIso ?? (() => new Date().toISOString());
  const started = now();
  let attempt = 0;
  let lastHash = null;
  let stableSince = null;

  while (now() - started < timeoutMs) {
    attempt += 1;
    try {
      const xml = dumpUiXml(serial);
      const okSize = xml.length > 100;
      const okText = !contains || xml.toLowerCase().includes(contains);
      const h = hashDump(xml);
      const same = lastHash !== null && h === lastHash;
      if (same && okSize && okText) {
        if (!stableSince) stableSince = now();
      } else {
        stableSince = null;
        lastHash = h;
      }
      if (typeof onEvent === "function") {
        onEvent({
          type: "ui_stable_poll",
          attempt,
          hash: h,
          same,
          at: toIso(),
        });
      }
      if (stableSince && now() - stableSince >= stableMs) {
        if (typeof onEvent === "function") {
          onEvent({ type: "ui_stable", attempt, at: toIso() });
        }
        return { stable: true };
      }
    } catch (e) {
      stableSince = null;
      if (typeof onEvent === "function") {
        onEvent({
          type: "ui_stable_poll",
          attempt,
          error: e.message,
          at: toIso(),
        });
      }
    }
    await sleep(intervalMs);
  }
  timedOut(`eventos: timeout ${timeoutMs}ms aguardando ui_stable`);
}
