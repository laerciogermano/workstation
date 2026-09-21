/**
 * SC-07 / US-05 — aguardar mudança no dump de UI (legado; alvo = frame hash).
 * Interno; caller usa on({ event: "frame_change"|"dump_change", … }).
 */
import { createHash } from "node:crypto";
import { sleep as defaultSleep } from "./adb.js";
import { dumpUiXml as defaultDumpUiXml } from "./extract.js";

function timedOut(msg) {
  const err = new Error(msg);
  err.code = "EVENT_DUMP_TIMEOUT";
  throw err;
}

function hashDump(xml) {
  return createHash("sha1").update(xml).digest("hex");
}

/**
 * @param {string} serial
 * @param {{ timeoutMs?: number, intervalMs?: number, previousXml?: string, onEvent?: Function }} [opts]
 * @param {{ dumpUiXml?: Function, sleep?: Function, now?: Function, toIso?: Function }} [deps]
 */
export async function waitDumpChange(serial, opts = {}, deps = {}) {
  const timeoutMs = Number(opts.timeoutMs ?? 20_000);
  const intervalMs = Number(opts.intervalMs ?? 500);
  const onEvent = opts.onEvent;
  const previousXml = opts.previousXml ?? "";
  const baseHash = hashDump(previousXml);
  const dumpUiXml = deps.dumpUiXml ?? defaultDumpUiXml;
  const sleep = deps.sleep ?? defaultSleep;
  const now = deps.now ?? Date.now;
  const toIso = deps.toIso ?? (() => new Date().toISOString());
  const started = now();
  let attempt = 0;

  while (now() - started < timeoutMs) {
    attempt += 1;
    try {
      const xml = dumpUiXml(serial);
      const h = hashDump(xml);
      const changed = h !== baseHash;
      if (typeof onEvent === "function") {
        onEvent({ type: "dump_poll", attempt, changed, at: toIso() });
      }
      if (changed) {
        if (typeof onEvent === "function") {
          onEvent({ type: "dump_change", attempt, at: toIso() });
        }
        return { xml, changed: true };
      }
    } catch {
      /* retry */
    }
    await sleep(intervalMs);
  }
  timedOut(`eventos: timeout ${timeoutMs}ms aguardando dump_change`);
}
