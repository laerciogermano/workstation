/**
 * Helpers ADB (sync).
 */
import { spawnSync } from "node:child_process";

export function adb(serial, args, opts = {}) {
  const r = spawnSync("adb", ["-s", serial, ...args], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    ...opts,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    const err = (r.stderr || r.stdout || "").trim() || `adb exit ${r.status}`;
    throw new Error(err);
  }
  return r;
}

export function adbOk(serial, args) {
  const r = spawnSync("adb", ["-s", serial, ...args], { encoding: "utf8" });
  return r.status === 0;
}

export function connectIfTcp(serial) {
  if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(serial) || serial.includes("localhost")) {
    spawnSync("adb", ["connect", serial], { encoding: "utf8" });
  }
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
