/**
 * Versão instalada no device (versionName).
 */
import { adb } from "./adb.js";

/**
 * @param {string} serial
 * @param {string} pkg
 * @param {{ dumpsysPackage?: Function }} [deps]
 */
export function getInstalledVersion(serial, pkg, deps = {}) {
  const dumpsys =
    deps.dumpsysPackage ??
    ((s, p) => adb(s, ["shell", "dumpsys", "package", p]).stdout);
  const out = dumpsys(serial, pkg);
  const m = String(out).match(/versionName=([^\s]+)/);
  return m ? m[1].trim() : null;
}
