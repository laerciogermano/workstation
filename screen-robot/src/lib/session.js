/**
 * EP-06 — sessão (internos do handle).
 * Caller: handle.saveSession / removeSession / restoreSession.
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
 * @param {{ serial: string, kind: string }} handleMeta
 * @param {object} [deps]
 */
export function createSessionApi(handleMeta, deps = {}) {
  const mkdir = deps.mkdirSync ?? mkdirSync;
  const write = deps.writeFileSync ?? writeFileSync;
  const read = deps.readFileSync ?? readFileSync;
  const exists = deps.existsSync ?? existsSync;
  const unlink = deps.unlinkSync ?? unlinkSync;
  const resolvePath = deps.resolve ?? resolve;
  const toIso = deps.toIso ?? (() => new Date().toISOString());

  async function saveSession(path, state = {}) {
    try {
      const abs = resolvePath(path);
      mkdir(dirname(abs), { recursive: true });
      const payload = {
        ...state,
        serial: handleMeta.serial,
        kind: handleMeta.kind,
        savedAt: toIso(),
      };
      write(abs, JSON.stringify(payload, null, 2), "utf8");
      return abs;
    } catch (e) {
      fail("SESSION_WRITE_FAILED", e.message);
    }
  }

  async function removeSession(path) {
    const abs = resolvePath(path);
    if (!exists(abs)) return false;
    unlink(abs);
    return true;
  }

  async function restoreSession(path) {
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

  return { saveSession, removeSession, restoreSession };
}

/** @deprecated Preferir handle.saveSession */
export function saveSession(path, state) {
  const abs = resolve(path);
  mkdirSync(dirname(abs), { recursive: true });
  const payload = { ...state, savedAt: new Date().toISOString() };
  writeFileSync(abs, JSON.stringify(payload, null, 2), "utf8");
  return abs;
}

export function loadSession(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) return null;
  return JSON.parse(readFileSync(abs, "utf8"));
}
