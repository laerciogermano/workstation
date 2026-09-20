/**
 * Captura de frame (screenshot ADB). Abstrai câmera via deps.captureFrame.
 */
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { adb } from "./adb.js";

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
    resolve(tmpdir(), `sr-frame-${serial.replace(/[^a-zA-Z0-9._-]/g, "_")}-${Date.now()}.png`);
  mkdirSync(dirname(outPath), { recursive: true });
  const remote = "/sdcard/sr-frame.png";
  try {
    runAdb(serial, ["shell", "screencap", "-p", remote]);
    runAdb(serial, ["pull", remote, outPath]);
    runAdb(serial, ["shell", "rm", "-f", remote]);
  } catch (e) {
    const err = new Error(`EXTRACT_FRAME_FAILED: ${e.message || e}`);
    err.code = "EXTRACT_FRAME_FAILED";
    throw err;
  }
  return outPath;
}
