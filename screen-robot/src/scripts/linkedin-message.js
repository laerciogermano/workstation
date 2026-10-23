#!/usr/bin/env node
/**
 * Envia mensagem LinkedIn pela URL do perfil.
 *
 * Uso (cwd: screen-robot/src):
 *   npm run linkedin-message -- --url 'https://www.linkedin.com/in/laerciogermano' --text 'Oi!'
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeLinkedInProfileUrl } from "../lib/linkedin-connect.js";
import { sendLinkedInMessage } from "../lib/linkedin-message.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadConfig(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`Config não encontrada: ${abs}`);
  return JSON.parse(readFileSync(abs, "utf8"));
}

function parseArgs(argv) {
  let url = null;
  let text = null;
  let device = null;
  let configPath = resolve(ROOT, "device.config.json");
  let dryRun = false;
  let noShot = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--url") url = String(argv[++i] || "").trim();
    else if (a === "--text" || a === "-t") text = String(argv[++i] || "");
    else if (a === "--device" || a === "-s") device = String(argv[++i] || "").trim();
    else if (a === "--config") configPath = resolve(argv[++i]);
    else if (a === "--dry-run") dryRun = true;
    else if (a === "--no-shot") noShot = true;
    else if (a === "--help" || a === "-h") {
      console.log(
        `Uso: npm run linkedin-message -- --url <linkedin.com/in/…> --text "mensagem"`,
      );
      process.exit(0);
    }
  }
  return { url, text, device, configPath, dryRun, noShot };
}

async function main() {
  const { url: rawUrl, text, device, configPath, dryRun, noShot } = parseArgs(
    process.argv.slice(2),
  );
  if (!rawUrl || !normalizeLinkedInProfileUrl(rawUrl)) {
    throw new Error("passe --url https://www.linkedin.com/in/…");
  }
  if (!String(text || "").trim()) {
    throw new Error('passe --text "mensagem"');
  }

  const cfg = loadConfig(configPath);
  if (device) {
    cfg.device = device;
    cfg.provision = { ...(cfg.provision || {}), serial: device };
  }
  const linkedinPkg = cfg.apps?.linkedin?.package || "com.linkedin.android";
  const { serial } = await provisionEmulator(cfg);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = noShot
    ? null
    : resolve(ROOT, "screenshots", "linkedin-message", stamp);
  if (outDir) mkdirSync(outDir, { recursive: true });

  console.error(`serial=${serial} url=${normalizeLinkedInProfileUrl(rawUrl)}`);
  const result = await sendLinkedInMessage({
    serial,
    linkedinPackage: linkedinPkg,
    url: rawUrl,
    text,
    outDir,
    dryRun,
  });
  if (outDir) {
    writeFileSync(join(outDir, "result.json"), JSON.stringify(result, null, 2));
    console.error(`saida: ${outDir}`);
  }
  console.log(JSON.stringify(result));
  if (!result.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
