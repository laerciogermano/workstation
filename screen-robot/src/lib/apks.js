/**
 * Instalar APKs — `installApk({ serial, package, version?, source?, artifact? })`
 * ou `installApk({ serial, app })`. Encapsula SC-08 → SC-09 → SC-10.
 */
import { sleep as defaultSleep } from "./adb.js";
import { ensureApkArtifact } from "./apk-download.js";
import { getInstalledVersion } from "./apk-get-installed-version.js";
import { installPackage } from "./apk-install-package.js";
import { readAppSpec } from "./apk-read-spec.js";

function fail(code, msg) {
  const err = new Error(msg);
  err.code = code;
  throw err;
}

/**
 * @param {{ serial?: string, app?: object, package?: string, version?: string, source?: string, artifact?: string }} cfg
 * @param {{ readAppSpec?: Function, getInstalledVersion?: Function, ensureApkArtifact?: Function, installPackage?: Function, sleep?: Function }} [deps]
 */
export async function installApk(cfg, deps = {}) {
  const serial = cfg?.serial;
  if (!serial) fail("APK_NO_SERIAL", "installApk: falta serial");

  const readSpec = deps.readAppSpec ?? readAppSpec;
  const getVersion = deps.getInstalledVersion ?? getInstalledVersion;
  const ensureArtifact = deps.ensureApkArtifact ?? ensureApkArtifact;
  const install = deps.installPackage ?? installPackage;
  const sleep = deps.sleep ?? defaultSleep;

  const specInput = cfg.app ?? cfg;
  const spec = readSpec(specInput);
  const current = getVersion(serial, spec.package);

  if (spec.version && current && current === spec.version) {
    return {
      package: spec.package,
      version: current,
      skipped: true,
    };
  }

  const artifactPath = ensureArtifact(spec);
  install(serial, artifactPath);
  await sleep(1_000);

  const installed = getVersion(serial, spec.package);
  if (spec.version && installed && installed !== spec.version) {
    const remote = Boolean(spec.source);
    if (remote) {
      console.warn(
        `Aviso: versionName instalada "${installed}" ≠ config "${spec.version}" (pin em device.config).`,
      );
    } else {
      fail(
        "APK_INSTALL_FAILED",
        `APK_INSTALL_FAILED: versionName "${installed}" ≠ alvo "${spec.version}"`,
      );
    }
  }

  return {
    package: spec.package,
    version: installed || spec.version || "",
    skipped: false,
    artifactPath,
  };
}
