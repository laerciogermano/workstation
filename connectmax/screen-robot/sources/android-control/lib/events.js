/**
 * Eventos de UI — internos do AgentHandle (`handle.on`).
 * Caller: provisionEmulator → handle.on(event, opts). Não exportar `on` solto.
 */
import { createHash } from "node:crypto";
import { adb, adbOk, sleep } from "./adb.js";
import { dumpUiXml } from "./extract.js";

function emit(onEvent, payload) {
  if (typeof onEvent === "function") onEvent(payload);
}

function timedOut(code, msg) {
  const err = new Error(msg);
  err.code = code;
  throw err;
}

async function waitBoot(serial, opts = {}) {
  const timeoutMs = Number(opts.timeoutMs ?? 60_000);
  const intervalMs = Number(opts.intervalMs ?? 1_500);
  const onEvent = opts.onEvent;
  const started = Date.now();
  let attempt = 0;

  while (Date.now() - started < timeoutMs) {
    attempt += 1;
    try {
      const value = adb(serial, ["shell", "getprop", "sys.boot_completed"])
        .stdout.trim();
      emit(onEvent, {
        type: "boot_poll",
        attempt,
        value,
        at: new Date().toISOString(),
      });
      if (value === "1") {
        emit(onEvent, { type: "boot", attempt, at: new Date().toISOString() });
        return { boot: true };
      }
    } catch {
      /* retry */
    }
    await sleep(intervalMs);
  }
  timedOut(
    "EVENT_BOOT_TIMEOUT",
    `eventos: timeout ${timeoutMs}ms aguardando boot (${serial})`,
  );
}

async function waitAppOpen(serial, opts = {}) {
  const pkg = opts.pkg;
  if (!pkg) throw new Error("EVENT_UNKNOWN: app_open exige opts.pkg");
  const timeoutMs = Number(opts.timeoutMs ?? 30_000);
  const intervalMs = Number(opts.intervalMs ?? 1_500);
  const onEvent = opts.onEvent;
  const started = Date.now();
  let attempt = 0;

  while (Date.now() - started < timeoutMs) {
    attempt += 1;
    const foreground = adbOk(serial, ["shell", "pidof", pkg]);
    emit(onEvent, {
      type: "app_poll",
      attempt,
      package: pkg,
      foreground,
      at: new Date().toISOString(),
    });
    if (foreground) {
      emit(onEvent, {
        type: "app_open",
        attempt,
        package: pkg,
        at: new Date().toISOString(),
      });
      return {
        foreground: true,
        package: pkg,
        ...(opts.activity ? { activity: opts.activity } : {}),
      };
    }
    await sleep(intervalMs);
  }
  timedOut(
    "EVENT_APP_TIMEOUT",
    `eventos: timeout ${timeoutMs}ms aguardando app_open ${pkg}`,
  );
}

function hashDump(xml) {
  return createHash("sha1").update(xml).digest("hex");
}

async function waitUiStable(serial, opts = {}) {
  const timeoutMs = Number(opts.timeoutMs ?? 60_000);
  const intervalMs = Number(opts.intervalMs ?? 400);
  const stableMs = Number(opts.stableMs ?? 1_200);
  const contains = opts.contains ? String(opts.contains).toLowerCase() : null;
  const onEvent = opts.onEvent;
  const started = Date.now();
  let attempt = 0;
  let lastHash = null;
  let stableSince = null;

  while (Date.now() - started < timeoutMs) {
    attempt += 1;
    try {
      const xml = dumpUiXml(serial);
      const okSize = xml.length > 100;
      const okText = !contains || xml.toLowerCase().includes(contains);
      const h = hashDump(xml);
      const same = lastHash !== null && h === lastHash;
      if (same && okSize && okText) {
        if (!stableSince) stableSince = Date.now();
      } else {
        stableSince = null;
        lastHash = h;
      }
      emit(onEvent, {
        type: "ui_stable_poll",
        attempt,
        hash: h,
        same,
        at: new Date().toISOString(),
      });
      if (stableSince && Date.now() - stableSince >= stableMs) {
        emit(onEvent, {
          type: "ui_stable",
          attempt,
          at: new Date().toISOString(),
        });
        return { stable: true };
      }
    } catch (e) {
      stableSince = null;
      emit(onEvent, {
        type: "ui_stable_poll",
        attempt,
        error: e.message,
        at: new Date().toISOString(),
      });
    }
    await sleep(intervalMs);
  }
  timedOut(
    "EVENT_STABLE_TIMEOUT",
    `eventos: timeout ${timeoutMs}ms aguardando ui_stable`,
  );
}

async function waitDumpChange(serial, opts = {}) {
  const timeoutMs = Number(opts.timeoutMs ?? 20_000);
  const intervalMs = Number(opts.intervalMs ?? 500);
  const onEvent = opts.onEvent;
  const previousXml = opts.previousXml ?? "";
  const baseHash = hashDump(previousXml);
  const started = Date.now();
  let attempt = 0;

  while (Date.now() - started < timeoutMs) {
    attempt += 1;
    try {
      const xml = dumpUiXml(serial);
      const h = hashDump(xml);
      const changed = h !== baseHash;
      emit(onEvent, {
        type: "dump_poll",
        attempt,
        changed,
        at: new Date().toISOString(),
      });
      if (changed) {
        emit(onEvent, {
          type: "dump_change",
          attempt,
          at: new Date().toISOString(),
        });
        return { xml, changed: true };
      }
    } catch {
      /* retry */
    }
    await sleep(intervalMs);
  }
  timedOut(
    "EVENT_DUMP_TIMEOUT",
    `eventos: timeout ${timeoutMs}ms aguardando dump_change`,
  );
}

/**
 * Liga `on` ao serial do handle (usado só por provisionEmulator).
 * Assinatura: on(event, opts?, onEvent?)
 * @param {string} serial
 */
export function createOn(serial) {
  return async function on(event, opts = {}, onEvent) {
    const full = { ...opts, serial, onEvent };
    switch (event) {
      case "boot":
        return waitBoot(serial, full);
      case "app_open":
        return waitAppOpen(serial, full);
      case "ui_stable":
        return waitUiStable(serial, full);
      case "dump_change":
        return waitDumpChange(serial, full);
      default: {
        const err = new Error(`EVENT_UNKNOWN: evento "${event}"`);
        err.code = "EVENT_UNKNOWN";
        throw err;
      }
    }
  };
}
