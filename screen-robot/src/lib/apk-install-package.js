/**
 * SC-10 — instalar artefato APK/XAPK no agent via adb.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { adb } from "./adb.js";

function fail(msg) {
  const err = new Error(msg);
  err.code = "APK_INSTALL_FAILED";
  throw err;
}

/**
 * @param {string} serial
 * @param {string} artifactPath
 * @param {{ adbInstall?: Function, adbInstallMultiple?: Function, unzipToTemp?: Function }} [deps]
 */
export function installPackage(serial, artifactPath, deps = {}) {
  const adbInstall =
    deps.adbInstall ??
    ((s, path) => {
      try {
        adb(s, ["install", "-r", path], { stdio: "inherit" });
      } catch (e) {
        fail(`APK_INSTALL_FAILED: ${e.message}`);
      }
    });
  const adbInstallMultiple =
    deps.adbInstallMultiple ??
    ((s, splits) => {
      try {
        adb(s, ["install-multiple", "-r", ...splits], { stdio: "inherit" });
      } catch (e) {
        fail(`APK_INSTALL_FAILED: ${e.message}`);
      }
    });

  if (artifactPath.endsWith(".apk")) {
    try {
      adbInstall(serial, artifactPath);
    } catch (e) {
      if (e?.code === "APK_INSTALL_FAILED") throw e;
      fail(`APK_INSTALL_FAILED: ${e.message}`);
    }
    return;
  }

  const unzipToTemp =
    deps.unzipToTemp ??
    ((xapk) => {
      const tmp = mkdtempSync(join(tmpdir(), "sr-apk-"));
      const unzip = spawnSync("unzip", ["-qo", xapk, "*.apk", "-d", tmp], {
        encoding: "utf8",
      });
      if (unzip.status !== 0) {
        rmSync(tmp, { recursive: true, force: true });
        fail(`APK_INSTALL_FAILED: unzip falhou: ${xapk}`);
      }
      const splits = readdirSync(tmp)
        .filter((f) => f.endsWith(".apk"))
        .map((f) => join(tmp, f))
        .sort();
      if (splits.length === 0) {
        rmSync(tmp, { recursive: true, force: true });
        fail(`APK_INSTALL_FAILED: nenhum .apk em ${xapk}`);
      }
      return { tmp, splits };
    });

  const { tmp, splits } = unzipToTemp(artifactPath);
  try {
    try {
      adbInstallMultiple(serial, splits);
    } catch (e) {
      if (e?.code === "APK_INSTALL_FAILED") throw e;
      fail(`APK_INSTALL_FAILED: ${e.message}`);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
