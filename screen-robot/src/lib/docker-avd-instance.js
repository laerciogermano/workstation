/**
 * Instâncias docker-avd nomeadas: slug, porta ADB e serial TCP.
 * Portas 5655–5754 (evita colisão com redroid 5555–5654).
 */
import { spawnSync } from "node:child_process";

/** @param {string} name */
export function slugifyDockerAvdName(name) {
  const s = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "default";
}

/** Porta host estável a partir do name (5655–5754). */
export function portForDockerAvdName(name) {
  const s = String(name || "default");
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0;
  }
  return 5655 + (h % 100);
}

/** @param {string} name */
export function serialForDockerAvdName(name) {
  return `127.0.0.1:${portForDockerAvdName(name)}`;
}

/** @param {string} name */
export function containerNameForDockerAvd(name) {
  return `docker-avd-${slugifyDockerAvdName(name)}`;
}

/**
 * Serial do container já criado para este name, ou null.
 * @param {string} name
 * @param {{ dockerInspectPort?: (container: string) => string|null }} [deps]
 */
export function findSerialForDockerAvd(name, deps = {}) {
  const container = containerNameForDockerAvd(name);
  const inspect =
    deps.dockerInspectPort ||
    ((c) => {
      const r = spawnSync(
        "docker",
        [
          "inspect",
          "-f",
          '{{(index (index .NetworkSettings.Ports "5555/tcp") 0).HostPort}}',
          c,
        ],
        { encoding: "utf8", timeout: 8_000 },
      );
      if (r.status !== 0) return null;
      const port = String(r.stdout || "").trim();
      return /^\d+$/.test(port) ? port : null;
    });
  const port = inspect(container);
  return port ? `127.0.0.1:${port}` : null;
}
