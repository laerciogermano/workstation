#!/usr/bin/env node
/**
 * Jornada criar conta LinkedIn (stop → launch → Join now → First/Last name).
 *
 * Uso (cwd: screen-robot/src):
 *   npm run linkedin-signup -- --device 127.0.0.1:5658 --firstname Ana --lastname Silva
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { linkedinSignupJoinNow } from "../lib/linkedin-signup.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadConfig(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`Config não encontrada: ${abs}`);
  return JSON.parse(readFileSync(abs, "utf8"));
}

function parseArgs(argv) {
  let device = null;
  let firstName = null;
  let lastName = null;
  let configPath = resolve(ROOT, "device.config.json");
  let noShot = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--device" || a === "-s")
      device = String(argv[++i] || "").trim();
    else if (a === "--firstname" || a === "--first-name")
      firstName = String(argv[++i] || "").trim();
    else if (a === "--lastname" || a === "--last-name")
      lastName = String(argv[++i] || "").trim();
    else if (a === "--config") configPath = resolve(argv[++i]);
    else if (a === "--no-shot") noShot = true;
    else if (a === "--help" || a === "-h") {
      console.log(
        `Uso: npm run linkedin-signup -- --device 127.0.0.1:5658 --firstname Ana --lastname Silva`,
      );
      process.exit(0);
    }
  }
  return { device, firstName, lastName, configPath, noShot };
}

async function main() {
  const { device, firstName, lastName, configPath, noShot } = parseArgs(
    process.argv.slice(2),
  );
  if (!firstName || !lastName) {
    throw new Error("passe --firstname e --lastname");
  }

  const cfg = loadConfig(configPath);
  if (device) {
    // Só ADB no serial pedido — não sobe AVD local (kind=avd + name).
    cfg.device = device;
    cfg.provision = { serial: device, kind: "adb" };
  }
  const linkedinPkg = cfg.apps?.linkedin?.package || "com.linkedin.android";
  const { serial } = await provisionEmulator(cfg);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = noShot
    ? null
    : resolve(ROOT, "screenshots", "linkedin-signup", stamp);
  if (outDir) mkdirSync(outDir, { recursive: true });

  console.error(`serial=${serial} firstName=${firstName} lastName=${lastName}`);
  const result = await linkedinSignupJoinNow({
    serial,
    firstName,
    lastName,
    linkedinPackage: linkedinPkg,
    outDir,
  });
  if (outDir) {
    writeFileSync(
      join(outDir, "result.json"),
      JSON.stringify(result, null, 2),
    );
    console.error(`saida: ${outDir}`);
  }
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err?.stack || err?.message || err);
  process.exit(1);
});
