/**
 * SC-09 — garantir artefato APK/XAPK no disco (local ou download).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function fail(msg) {
  const err = new Error(msg);
  err.code = "APK_DOWNLOAD_FAILED";
  throw err;
}

/**
 * @param {string} apksDir
 * @param {string} pkg
 * @param {string} [artifactHint]
 * @param {{ root?: string, existsSync?: Function, readdirSync?: Function }} [deps]
 */
export function findArtifact(apksDir, pkg, artifactHint, deps = {}) {
  const root = deps.root ?? DEFAULT_ROOT;
  const exists = deps.existsSync ?? existsSync;
  const readdir = deps.readdirSync ?? readdirSync;

  if (artifactHint) {
    const abs = resolve(root, artifactHint);
    if (exists(abs)) return abs;
  }
  const xapk = join(apksDir, `${pkg}.xapk`);
  if (exists(xapk)) return xapk;
  const apk = join(apksDir, `${pkg}.apk`);
  if (exists(apk)) return apk;
  const files = exists(apksDir) ? readdir(apksDir) : [];
  const hit = files.find(
    (f) => f.includes(pkg) && (f.endsWith(".xapk") || f.endsWith(".apk")),
  );
  return hit ? join(apksDir, hit) : null;
}

/**
 * @param {{ package: string, source?: string, artifact?: string }} spec
 * @param {{ apksDir?: string, root?: string, findArtifact?: Function, ensureApkeep?: Function, download?: Function, mkdirSync?: Function, existsSync?: Function, readdirSync?: Function }} [deps]
 */
export function ensureApkArtifact(spec, deps = {}) {
  const root = deps.root ?? DEFAULT_ROOT;
  const apksDir = deps.apksDir ?? resolve(root, "apks");
  const find = deps.findArtifact ?? findArtifact;
  const mkdir = deps.mkdirSync ?? mkdirSync;

  let artifact = find(apksDir, spec.package, spec.artifact, {
    root,
    existsSync: deps.existsSync,
    readdirSync: deps.readdirSync,
  });
  if (artifact) return artifact;

  const ensureApkeep =
    deps.ensureApkeep ??
    (() => {
      const r = spawnSync("apkeep", ["--help"], { encoding: "utf8" });
      if (r.error || r.status !== 0) {
        fail(
          "APK_DOWNLOAD_FAILED: apkeep não encontrado (brew install apkeep) ou coloque o artefato em apks/",
        );
      }
    });
  const download =
    deps.download ??
    ((pkg, dir, source) => {
      mkdir(dir, { recursive: true });
      const r = spawnSync("apkeep", ["-a", pkg, "-d", source, dir], {
        encoding: "utf8",
        stdio: "inherit",
      });
      if (r.status !== 0) fail(`APK_DOWNLOAD_FAILED: apkeep falhou para ${pkg}`);
    });

  ensureApkeep();
  download(spec.package, apksDir, spec.source || "apk-pure");
  artifact = find(apksDir, spec.package, spec.artifact, {
    root,
    existsSync: deps.existsSync,
    readdirSync: deps.readdirSync,
  });
  if (!artifact) {
    fail(`APK_DOWNLOAD_FAILED: artefato não encontrado para ${spec.package}`);
  }
  return artifact;
}
