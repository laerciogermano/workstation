/**
 * Instalar APKs — internos do AgentHandle (`handle.installApk`).
 * Encapsula SC-08 → SC-09 → SC-10. Caller não passa serial.
 */
import { sleep as defaultSleep } from "./adb.js";
import { ensureApkArtifact } from "./apk-download.js";
import { getInstalledVersion } from "./apk-get-installed-version.js";
import { installPackage } from "./apk-install-package.js";
import { readAppSpec } from "./apk-read-spec.js";

/**
 * @param {string} serial
 * @param {{ readAppSpec?: Function, getInstalledVersion?: Function, ensureApkArtifact?: Function, installPackage?: Function, sleep?: Function }} [deps]
 */
export function createInstallApk(serial, deps = {}) {
  const readSpec = deps.readAppSpec ?? readAppSpec;
  const getVersion = deps.getInstalledVersion ?? getInstalledVersion;
  const ensureArtifact = deps.ensureApkArtifact ?? ensureApkArtifact;
  const install = deps.installPackage ?? installPackage;
  const sleep = deps.sleep ?? defaultSleep;

  /**
   * @param {{ package: string, version?: string, source?: string, artifact?: string }} app
   */
  return async function installApk(app) {
    const spec = readSpec(app);
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
      const err = new Error(
        `APK_INSTALL_FAILED: versionName "${installed}" ≠ alvo "${spec.version}"`,
      );
      err.code = "APK_INSTALL_FAILED";
      throw err;
    }

    return {
      package: spec.package,
      version: installed || spec.version || "",
      skipped: false,
      artifactPath,
    };
  };
}

/**
 * @deprecated Preferir handle.installApk via provisionEmulator.
 * Mantido para scripts legados que ainda passam serial.
 */
export async function installApk(serial, app) {
  return createInstallApk(serial)(app);
}
