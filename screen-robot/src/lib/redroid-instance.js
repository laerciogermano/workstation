/**
 * Instâncias redroid nomeadas: slug, porta ADB e serial TCP.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

/** @param {string} name */
export function slugifyRedroidName(name) {
  const s = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "default";
}

/** Porta host estável a partir do name (5555–5654). */
export function portForRedroidName(name) {
  const s = String(name || "default");
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0;
  }
  return 5555 + (h % 100);
}

/** @param {string} name */
export function serialForRedroidName(name) {
  return `127.0.0.1:${portForRedroidName(name)}`;
}

/** @param {string} name */
export function containerNameForRedroid(name) {
  return `redroid-${slugifyRedroidName(name)}`;
}

function dockerEnv() {
  if (process.env.DOCKER_HOST) return process.env;
  const sock = path.join(homedir(), ".colima", "default", "docker.sock");
  if (process.platform === "darwin" && existsSync(sock)) {
    return { ...process.env, DOCKER_HOST: `unix://${sock}` };
  }
  const legacy = path.join(homedir(), ".colima", "docker.sock");
  if (process.platform === "darwin" && existsSync(legacy)) {
    return { ...process.env, DOCKER_HOST: `unix://${legacy}` };
  }
  return process.env;
}

/**
 * Serial do container já criado para este name, ou null.
 * @param {string} name
 * @param {{ dockerInspectPort?: (container: string) => string|null }} [deps]
 */
export function findSerialForRedroid(name, deps = {}) {
  const container = containerNameForRedroid(name);
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
        { encoding: "utf8", env: dockerEnv(), timeout: 8_000 },
      );
      if (r.status !== 0) return null;
      const port = String(r.stdout || "").trim();
      return /^\d+$/.test(port) ? port : null;
    });
  const port = inspect(container);
  return port ? `127.0.0.1:${port}` : null;
}
