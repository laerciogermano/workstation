/**
 * Instalar APKs — baixa (versão na config do device) e instala no agent.
 * Usa apkeep + APKPure quando o artefato local não existe.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { adb, sleep } from "./adb.js";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function versionName(serial, pkg) {
  const out = adb(serial, ["shell", "dumpsys", "package", pkg]).stdout;
  const m = out.match(/versionName=([^\s]+)/);
  return m ? m[1].trim() : null;
}

function ensureApkeep() {
  const r = spawnSync("apkeep", ["--help"], { encoding: "utf8" });
  if (r.error || r.status !== 0) {
    throw new Error(
      "apkeep não encontrado. Instale (brew install apkeep) ou coloque o XAPK em apks/.",
    );
  }
}

function downloadWithApkeep(pkg, apksDir, source = "apk-pure") {
  mkdirSync(apksDir, { recursive: true });
  console.log(`Baixando ${pkg} via apkeep (${source}) → ${apksDir}`);
  const r = spawnSync("apkeep", ["-a", pkg, "-d", source, apksDir], {
    encoding: "utf8",
    stdio: "inherit",
  });
  if (r.status !== 0) throw new Error(`apkeep falhou para ${pkg}`);
}

function findArtifact(apksDir, pkg, artifactHint) {
  if (artifactHint) {
    const abs = resolve(ROOT, artifactHint);
    if (existsSync(abs)) return abs;
  }
  const xapk = join(apksDir, `${pkg}.xapk`);
  if (existsSync(xapk)) return xapk;
  const apk = join(apksDir, `${pkg}.apk`);
  if (existsSync(apk)) return apk;
  const files = existsSync(apksDir) ? readdirSync(apksDir) : [];
  const hit = files.find((f) => f.includes(pkg) && (f.endsWith(".xapk") || f.endsWith(".apk")));
  return hit ? join(apksDir, hit) : null;
}

function installArtifact(serial, artifactPath) {
  if (artifactPath.endsWith(".apk")) {
    adb(serial, ["install", "-r", artifactPath], { stdio: "inherit" });
    return;
  }
  const tmp = mkdtempSync(join(tmpdir(), "sr-apk-"));
  try {
    const unzip = spawnSync("unzip", ["-qo", artifactPath, "*.apk", "-d", tmp], {
      encoding: "utf8",
    });
    if (unzip.status !== 0) throw new Error(`unzip falhou: ${artifactPath}`);
    const splits = readdirSync(tmp)
      .filter((f) => f.endsWith(".apk"))
      .map((f) => join(tmp, f))
      .sort();
    if (splits.length === 0) throw new Error(`nenhum .apk em ${artifactPath}`);
    adb(serial, ["install-multiple", "-r", ...splits], { stdio: "inherit" });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/**
 * @param {string} serial
 * @param {{ package: string, version?: string, source?: string, artifact?: string }} app
 */
export async function installApk(serial, app) {
  const pkg = app.package;
  if (!pkg) throw new Error("installApk: falta package");

  const apksDir = resolve(ROOT, "apks");
  let artifact = findArtifact(apksDir, pkg, app.artifact);

  if (!artifact) {
    ensureApkeep();
    downloadWithApkeep(pkg, apksDir, app.source || "apk-pure");
    artifact = findArtifact(apksDir, pkg, app.artifact);
  }
  if (!artifact) throw new Error(`artefato não encontrado para ${pkg} em ${apksDir}`);

  console.log(`Instalando ${pkg} ← ${artifact}${app.version ? ` (versão alvo: ${app.version})` : ""}`);
  installArtifact(serial, artifact);
  await sleep(1_000);

  const installed = versionName(serial, pkg);
  if (app.version && installed && installed !== app.version) {
    console.warn(
      `Aviso: versionName instalada "${installed}" ≠ config "${app.version}" (pin em device.config).`,
    );
  }
  return { package: pkg, version: installed, artifact, versionTarget: app.version || null };
}
