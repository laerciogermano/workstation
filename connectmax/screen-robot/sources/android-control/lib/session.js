/**
 * Guardar estado de sessão.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function saveSession(path, state) {
  const abs = resolve(path);
  mkdirSync(dirname(abs), { recursive: true });
  const payload = {
    ...state,
    savedAt: new Date().toISOString(),
  };
  writeFileSync(abs, JSON.stringify(payload, null, 2), "utf8");
  return abs;
}

export function loadSession(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) return null;
  return JSON.parse(readFileSync(abs, "utf8"));
}
