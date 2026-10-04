#!/usr/bin/env node
/**
 * Provisiona um emulador oficial em Docker (kind=docker-avd).
 * Host: Linux + /dev/kvm. No Mac falha cedo (use kind=avd).
 *
 *   npm run docker-avd
 *   npm run docker-avd -- agent-a
 *   DOCKER_AVD_NAME=agent-a npm run docker-avd
 *   npm run docker-avd -- agent-a --view   # abre scrcpy
 */
import { provisionEmulator } from "../lib/provision.js";
import { openScrcpy } from "../lib/operate.js";

const args = process.argv.slice(2).filter((a) => a !== "--");
const wantView = args.includes("--view");
const nameArg = args.find((a) => !a.startsWith("--"));
const name = nameArg || process.env.DOCKER_AVD_NAME || "agent-a";

const { serial, kind, bootCompleted, provisionedAt } = await provisionEmulator({
  provision: {
    name,
    kind: "docker-avd",
    connectTimeoutMs: Number(process.env.CONNECT_TIMEOUT_MS || 180_000),
  },
});

console.log(
  JSON.stringify(
    { name, serial, kind, bootCompleted, provisionedAt },
    null,
    2,
  ),
);

if (wantView) {
  const view = openScrcpy({ serial, title: `docker-avd ${name}` });
  console.log(`scrcpy pid=${view.pid}`);
}
