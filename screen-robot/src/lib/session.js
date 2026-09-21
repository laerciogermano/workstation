/**
 * EP-06 — sessão: saveSession / removeSession / restoreSession (funções puras).
 */
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  unlinkSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

function fail(code, msg) {
  const err = new Error(msg);
  err.code = code;
  throw err;
}

/**
 * @param {{ serial: string, kind: string, path: string, state?: object }} cfg
 * @param {object} [deps]
 */
export async function saveSession(cfg, deps = {}) {
  const mkdir = deps.mkdirSync ?? mkdirSync;
  const write = deps.writeFileSync ?? writeFileSync;
  const resolvePath = deps.resolve ?? resolve;
  const toIso = deps.toIso ?? (() => new Date().toISOString());

  const serial = cfg?.serial;
  const kind = cfg?.kind;
  const path = cfg?.path;
  if (!serial) fail("SESSION_WRITE_FAILED", "saveSession: falta serial");
  if (!kind) fail("SESSION_WRITE_FAILED", "saveSession: falta kind");
  if (!path) fail("SESSION_WRITE_FAILED", "saveSession: falta path");

  try {
    const abs = resolvePath(path);
    mkdir(dirname(abs), { recursive: true });
    const payload = {
      ...(cfg.state || {}),
      serial,
      kind,
      savedAt: toIso(),
    };
    write(abs, JSON.stringify(payload, null, 2), "utf8");
    return abs;
  } catch (e) {
    if (e?.code === "SESSION_WRITE_FAILED") throw e;
    fail("SESSION_WRITE_FAILED", e.message);
  }
}

/**
 * @param {{ path: string }} cfg
 * @param {object} [deps]
 */
export async function removeSession(cfg, deps = {}) {
  const exists = deps.existsSync ?? existsSync;
  const unlink = deps.unlinkSync ?? unlinkSync;
  const resolvePath = deps.resolve ?? resolve;

  const path = cfg?.path;
  if (!path) fail("SESSION_NOT_FOUND", "removeSession: falta path");

  const abs = resolvePath(path);
  if (!exists(abs)) return false;
  unlink(abs);
  return true;
}

/**
 * @param {{ path: string }} cfg
 * @param {object} [deps]
 */
export async function restoreSession(cfg, deps = {}) {
  const read = deps.readFileSync ?? readFileSync;
  const exists = deps.existsSync ?? existsSync;
  const resolvePath = deps.resolve ?? resolve;

  const path = cfg?.path;
  if (!path) fail("SESSION_NOT_FOUND", "restoreSession: falta path");

  const abs = resolvePath(path);
  if (!exists(abs)) {
    fail("SESSION_NOT_FOUND", `sessão não encontrada: ${abs}`);
  }
  try {
    const raw = read(abs, "utf8");
    const state = JSON.parse(raw);
    if (!state || typeof state !== "object") {
      fail("SESSION_INVALID", "JSON de sessão inválido");
    }
    return state;
  } catch (e) {
    if (e.code === "SESSION_NOT_FOUND" || e.code === "SESSION_INVALID") throw e;
    fail("SESSION_INVALID", e.message);
  }
}

/** @deprecated Preferir restoreSession({ path }) */
export function loadSession(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) return null;
  return JSON.parse(readFileSync(abs, "utf8"));
}
