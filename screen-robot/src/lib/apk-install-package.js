/**
 * SC-10 — instalar artefato APK/XAPK no agent via adb.
 * Em XAPK, filtra splits de ABI incompatíveis com o device.
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

function deviceAbis(serial, runAdb) {
  try {
    const r = runAdb(serial, ["shell", "getprop", "ro.product.cpu.abilist"]);
    const list = String(r.stdout || "")
      .trim()
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length) return list;
  } catch {
    /* fallthrough */
  }
  return ["arm64-v8a"];
}

/** config.armeabi_v7a.apk → armeabi-v7a */
function abiFromSplitName(name) {
  const m = String(name).match(/config\.([^.]+)\.apk$/i);
  if (!m) return null;
  const raw = m[1].toLowerCase().replace(/_/g, "-");
  if (
    raw === "armeabi-v7a" ||
    raw === "arm64-v8a" ||
    raw === "x86" ||
    raw === "x86-64"
  ) {
    return raw === "x86-64" ? "x86_64" : raw;
  }
  if (raw === "armeabi") return "armeabi";
  return null; // density / locale split
}

function filterSplitsForDevice(splits, abis) {
  const abiSet = new Set(abis.map((a) => a.toLowerCase()));
  const kept = [];
  let sawAbiSplit = false;
  let keptAbi = false;
  for (const path of splits) {
    const base = path.split("/").pop() || path;
    const abi = abiFromSplitName(base);
    if (!abi) {
      kept.push(path);
      continue;
    }
    sawAbiSplit = true;
    if (abiSet.has(abi)) {
      kept.push(path);
      keptAbi = true;
    }
  }
  if (sawAbiSplit && !keptAbi) {
    fail(
      `APK_INSTALL_FAILED: XAPK sem ABI compatível (device=${[...abiSet].join(",")}; precisa arm64-v8a ou runtime multi-ABI)`,
    );
  }
  return kept;
}

/**
 * @param {string} serial
 * @param {string} artifactPath
 * @param {{ adbInstall?: Function, adbInstallMultiple?: Function, unzipToTemp?: Function, adb?: Function }} [deps]
 */
export function installPackage(serial, artifactPath, deps = {}) {
  const runAdb = deps.adb ?? adb;
  const adbInstall =
    deps.adbInstall ??
    ((s, path) => {
      try {
        runAdb(s, ["install", "-r", path], { stdio: "inherit" });
      } catch (e) {
        fail(`APK_INSTALL_FAILED: ${e.message}`);
      }
    });
  const adbInstallMultiple =
    deps.adbInstallMultiple ??
    ((s, splits) => {
      try {
        runAdb(s, ["install-multiple", "-r", ...splits], { stdio: "inherit" });
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
    const abis = deviceAbis(serial, runAdb);
    const filtered = filterSplitsForDevice(splits, abis);
    try {
      adbInstallMultiple(serial, filtered);
    } catch (e) {
      if (e?.code === "APK_INSTALL_FAILED") throw e;
      fail(`APK_INSTALL_FAILED: ${e.message}`);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
