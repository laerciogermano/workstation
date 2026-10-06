/**
 * Dispatcher CLI da lib: uma ação por chamada (extract / tap / type / …).
 * A IA opera o device com `npm run <acao>` — sem adb direto e sem script JS.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { sleep as defaultSleep } from "./adb.js";
import { extract, findByText } from "./extract.js";
import { parseIconsFlag } from "./extract-icons.js";
import { key, launch, scroll, tap, type } from "./operate.js";

export const ACTIONS = [
  "extract",
  "find",
  "tap",
  "type",
  "scroll",
  "launch",
  "key",
  "wait",
];

function fail(code, msg) {
  const err = new Error(msg);
  err.code = code;
  throw err;
}

function firstOnlineSerial(deps = {}) {
  const spawn = deps.spawnSync ?? spawnSync;
  const out = spawn("adb", ["devices"], { encoding: "utf8" }).stdout || "";
  const line = String(out)
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("List") && /\bdevice\b/.test(l));
  return line ? line.split(/\s+/)[0] : null;
}

export function loadDeviceConfig(path, deps = {}) {
  const exists = deps.existsSync ?? existsSync;
  const read = deps.readFileSync ?? readFileSync;
  if (!path || !exists(path)) return null;
  return JSON.parse(read(path, "utf8"));
}

/**
 * Serial: --device → ANDROID_SERIAL → device.config.json → 1º ADB online.
 */
export function resolveSerial(cfg = {}, deps = {}) {
  if (cfg.serial) return cfg.serial;
  if (process.env.ANDROID_SERIAL) return process.env.ANDROID_SERIAL;
  const config = cfg.config ?? loadDeviceConfig(cfg.configPath, deps);
  const fromCfg = config?.provision?.serial || config?.device;
  if (fromCfg) return fromCfg;
  const online = firstOnlineSerial(deps);
  if (online) return online;
  fail(
    "RUN_NO_SERIAL",
    "Nenhum device. Suba o emulador ou passe --device SERIAL.",
  );
}

function resolvePackage(cfg, config) {
  const raw = cfg.package ?? cfg.pkg;
  if (!raw) return null;
  const apps = config?.apps || {};
  if (apps[raw]?.package) return apps[raw].package;
  return raw;
}

export function parseRunArgs(argv) {
  const out = {
    action: null,
    serial: null,
    engine: "all",
    icons: false,
    method: "adb",
    configPath: null,
    positional: [],
    x: null,
    y: null,
    text: null,
    query: null,
    direction: null,
    distance: null,
    package: null,
    activity: null,
    code: null,
    ms: null,
  };
  const args = [...argv];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--device" || a === "-s") {
      out.serial = args[++i];
      continue;
    }
    if (a === "--engine") {
      out.engine = args[++i];
      continue;
    }
    if (a === "--no-icons") {
      out.icons = false;
      continue;
    }
    if (a === "--icons") {
      const next = args[i + 1];
      const parsed = parseIconsFlag(next);
      if (parsed != null) {
        i += 1;
        out.icons = parsed;
      } else {
        out.icons = true;
      }
      continue;
    }
    if (a === "--method") {
      out.method = args[++i];
      continue;
    }
    if (a === "--config") {
      out.configPath = args[++i];
      continue;
    }
    if (a === "--help" || a === "-h") {
      out.help = true;
      continue;
    }
    if (a.startsWith("-")) fail("RUN_BAD_ARGS", `flag desconhecida: ${a}`);
    out.positional.push(a);
  }
  if (out.positional.length && ACTIONS.includes(out.positional[0])) {
    out.action = out.positional.shift();
  }
  const p = out.positional;
  if (out.action === "tap" && p.length >= 2) {
    out.x = Number(p[0]);
    out.y = Number(p[1]);
  } else if (out.action === "type") {
    out.text = p.join(" ");
  } else if (out.action === "find") {
    out.query = p.join(" ");
  } else if (out.action === "scroll") {
    out.direction = p[0] || "down";
    if (p[1] != null) out.distance = Number(p[1]);
  } else if (out.action === "launch") {
    out.package = p[0];
    out.activity = p[1];
  } else if (out.action === "key") {
    out.code = p[0];
  } else if (out.action === "wait") {
    out.ms = Number(p[0] ?? 1000);
  }
  return out;
}

/**
 * Executa uma ação da lib.
 * @returns {Promise<{ ok: true, action: string, serial: string, result?: unknown }>}
 */
export async function runAction(cfg = {}, deps = {}) {
  const action = String(cfg.action || "").toLowerCase();
  if (!ACTIONS.includes(action)) {
    fail("RUN_BAD_ACTION", `ação desconhecida: ${action || "(vazia)"}`);
  }
  const config = cfg.config ?? loadDeviceConfig(cfg.configPath, deps);
  const serial = resolveSerial({ ...cfg, config }, deps);
  const engine = cfg.engine || "all";
  const icons = parseIconsFlag(cfg.icons) ?? false;

  if (action === "extract") {
    const doExtract = deps.extract ?? extract;
    const result = await doExtract({ serial, engine, icons }, deps);
    return { ok: true, action, serial, engine, icons, result };
  }
  if (action === "find") {
    const query = cfg.query;
    if (!query) fail("RUN_BAD_ARGS", "find: falta query");
    const doFind = deps.findByText ?? findByText;
    const result = await doFind(serial, query, { engine, minScore: cfg.minScore });
    return { ok: true, action, serial, engine, query, result };
  }
  if (action === "tap") {
    const x = Number(cfg.x);
    const y = Number(cfg.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      fail("RUN_BAD_ARGS", "tap: falta x y");
    }
    const doTap = deps.tap ?? tap;
    doTap({ serial, x, y }, deps);
    return { ok: true, action, serial, result: { x, y } };
  }
  if (action === "type") {
    const text = cfg.text;
    if (text == null || String(text).length === 0) {
      fail("RUN_BAD_ARGS", "type: falta texto");
    }
    const doType = deps.type ?? type;
    await doType(
      { serial, text: String(text), method: cfg.method || "adb", engine },
      deps,
    );
    return { ok: true, action, serial, result: { text: String(text) } };
  }
  if (action === "scroll") {
    const direction = cfg.direction || "down";
    const doScroll = deps.scroll ?? scroll;
    doScroll(
      { serial, direction, distance: cfg.distance },
      deps,
    );
    return { ok: true, action, serial, result: { direction } };
  }
  if (action === "launch") {
    const pkg = resolvePackage(cfg, config);
    if (!pkg) fail("RUN_BAD_ARGS", "launch: falta package");
    const doLaunch = deps.launch ?? launch;
    await doLaunch(
      { serial, package: pkg, activity: cfg.activity },
      deps,
    );
    return { ok: true, action, serial, result: { package: pkg } };
  }
  if (action === "key") {
    if (cfg.code == null) fail("RUN_BAD_ARGS", "key: falta code");
    const doKey = deps.key ?? key;
    doKey({ serial, code: cfg.code }, deps);
    return { ok: true, action, serial, result: { code: String(cfg.code) } };
  }
  if (action === "wait") {
    const ms = Number(cfg.ms ?? 1000);
    const sleep = deps.sleep ?? defaultSleep;
    await sleep(ms);
    return { ok: true, action, serial, result: { ms } };
  }
  fail("RUN_BAD_ACTION", `ação não implementada: ${action}`);
}

export function defaultConfigPath(cwd = process.cwd()) {
  return resolve(cwd, "device.config.json");
}
