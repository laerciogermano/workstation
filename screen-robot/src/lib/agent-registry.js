/**
 * Registro local name → { serial, port, kind, container }.
 * Interno do provisionamento (não exportar na API pública).
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../pocs/redroid/.agents-registry.json",
);

/**
 * @param {object} [deps]
 */
export function createAgentRegistry(deps = {}) {
  const path = deps.path ?? defaultPath;
  const read = deps.readFileSync ?? readFileSync;
  const write = deps.writeFileSync ?? writeFileSync;
  const exists = deps.existsSync ?? existsSync;
  const mkdir = deps.mkdirSync ?? mkdirSync;

  function load() {
    if (!exists(path)) return {};
    try {
      return JSON.parse(read(path, "utf8"));
    } catch {
      return {};
    }
  }

  function save(data) {
    mkdir(dirname(path), { recursive: true });
    write(path, JSON.stringify(data, null, 2), "utf8");
  }

  return {
    path,
    has(name) {
      return Boolean(load()[name]);
    },
    get(name) {
      return load()[name] || null;
    },
    set(name, record) {
      const data = load();
      data[name] = record;
      save(data);
    },
    remove(name) {
      const data = load();
      if (!(name in data)) return false;
      delete data[name];
      save(data);
      return true;
    },
  };
}

export function sanitizeAgentName(name) {
  const s = String(name || "").trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,62}$/.test(s)) {
    const err = new Error(
      `PROVISION_INVALID_NAME: nome inválido "${name}" (use [a-zA-Z0-9_-], 1–63 chars)`,
    );
    err.code = "PROVISION_INVALID_NAME";
    throw err;
  }
  return s;
}
