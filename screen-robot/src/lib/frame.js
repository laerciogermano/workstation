/**
 * Captura de frame (screenshot ADB). Abstrai câmera via deps.captureFrame.
 *
 * Preferência: `adb exec-out screencap -p` (rápido; não trava).
 * Fallback: shell screencap + pull (em alguns AVDs o `shell screencap` não retorna).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { adb } from "./adb.js";

/**
 * @param {string} serial
 * @param {string[]} args
 * @param {object} [opts]
 */
function adbBuf(serial, args, opts = {}) {
  const r = spawnSync("adb", ["-s", serial, ...args], {
    encoding: null,
    maxBuffer: 32 * 1024 * 1024,
    ...opts,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    const err =
      (r.stderr && r.stderr.toString("utf8").trim()) ||
      `adb exit ${r.status}`;
    throw new Error(err);
  }
  return r.stdout || Buffer.alloc(0);
}

/**
 * @param {string} serial
 * @param {{ adb?: Function, outPath?: string, captureFrame?: Function }} [deps]
 * @returns {Promise<string>} path absoluto do PNG
 */
export async function captureFrame(serial, deps = {}) {
  if (typeof deps.captureFrame === "function") {
    return deps.captureFrame(serial, deps);
  }
  const runAdb = deps.adb ?? adb;
  const outPath =
    deps.outPath ||
    resolve(
      tmpdir(),
      `sr-frame-${serial.replace(/[^a-zA-Z0-9._-]/g, "_")}-${Date.now()}.png`,
    );
  mkdirSync(dirname(outPath), { recursive: true });

  try {
    const png = adbBuf(serial, ["exec-out", "screencap", "-p"]);
    if (!png.length || png[0] !== 0x89) {
      throw new Error("exec-out screencap: PNG inválido/vazio");
    }
    writeFileSync(outPath, png);
    return outPath;
  } catch (e1) {
    // fallback legado
    const remote = "/sdcard/sr-frame.png";
    try {
      runAdb(serial, ["shell", "screencap", "-p", remote]);
      runAdb(serial, ["pull", remote, outPath]);
      runAdb(serial, ["shell", "rm", "-f", remote]);
      return outPath;
    } catch (e2) {
      const err = new Error(
        `EXTRACT_FRAME_FAILED: ${e1.message || e1}; fallback: ${e2.message || e2}`,
      );
      err.code = "EXTRACT_FRAME_FAILED";
      throw err;
    }
  }
}
