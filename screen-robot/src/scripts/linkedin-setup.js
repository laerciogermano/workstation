#!/usr/bin/env node
/**
 * Configuração LinkedIn pós-signup (onboarding).
 *
 * Uso (cwd: screen-robot/src):
 *   npm run linkedin-setup -- --device emulator-5556 \
 *     --job-title 'Especialista em suprimentos e itens corporativos' \
 *     --company ConectMax \
 *     --avatar assets/avatars/conectmax-black.jpg
 *
 * --avatar: path local da foto (default assets/avatars/conectmax-black.jpg).
 *   Omitir --avatar para só job title/company.
 * --avatar-only: só sobe avatar (tela Add photo já aberta).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_AVATAR_PATH,
  linkedinSetupAvatar,
  linkedinSetupJobTitle,
} from "../lib/linkedin-setup.js";
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
  let jobTitle = null;
  let company = "ConectMax";
  let avatar = null;
  let avatarOnly = false;
  let configPath = resolve(ROOT, "device.config.json");
  let noShot = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--device" || a === "-s")
      device = String(argv[++i] || "").trim();
    else if (a === "--job-title" || a === "--jobtitle")
      jobTitle = String(argv[++i] || "").trim();
    else if (a === "--company") company = String(argv[++i] || "").trim();
    else if (a === "--avatar") {
      const next = argv[i + 1];
      if (next && !String(next).startsWith("--")) {
        avatar = resolve(ROOT, String(argv[++i] || "").trim());
      } else {
        avatar = DEFAULT_AVATAR_PATH;
      }
    } else if (a === "--avatar-only") {
      avatarOnly = true;
      if (avatar == null) avatar = DEFAULT_AVATAR_PATH;
    } else if (a === "--config") configPath = resolve(argv[++i]);
    else if (a === "--no-shot") noShot = true;
    else if (a === "--help" || a === "-h") {
      console.log(
        `Uso: npm run linkedin-setup -- --device emulator-5556 --job-title 'Cargo' [--company ConectMax] [--avatar [path]] [--avatar-only]`,
      );
      process.exit(0);
    }
  }
  return {
    device,
    jobTitle,
    company,
    avatar,
    avatarOnly,
    configPath,
    noShot,
  };
}

async function main() {
  const {
    device,
    jobTitle,
    company,
    avatar,
    avatarOnly,
    configPath,
    noShot,
  } = parseArgs(process.argv.slice(2));
  if (!avatarOnly && !jobTitle) throw new Error("passe --job-title ou --avatar-only");
  if (avatar && !existsSync(avatar)) {
    throw new Error(`--avatar não encontrado: ${avatar}`);
  }

  const cfg = loadConfig(configPath);
  if (device) {
    cfg.device = device;
    cfg.provision = { serial: device, kind: "adb" };
  }
  const { serial } = await provisionEmulator(cfg);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = noShot
    ? null
    : resolve(ROOT, "screenshots", "linkedin-setup", stamp);
  if (outDir) mkdirSync(outDir, { recursive: true });

  console.error(
    `serial=${serial} jobTitle=${jobTitle || "-"} company=${company} avatar=${avatar || "-"}`,
  );

  /** @type {Record<string, unknown>} */
  const result = { serial, outDir, company, jobTitle, steps: [] };

  if (!avatarOnly) {
    const setup = await linkedinSetupJobTitle({
      serial,
      jobTitle,
      company,
      outDir,
    });
    result.steps.push(...setup.steps);
  }

  if (avatar) {
    const av = await linkedinSetupAvatar({
      serial,
      avatarPath: avatar,
      outDir,
    });
    result.avatarPath = av.avatarPath;
    result.steps.push(...av.steps);
  }

  if (outDir) {
    writeFileSync(join(outDir, "result.json"), JSON.stringify(result, null, 2));
    console.error(`saida: ${outDir}`);
  }
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err?.stack || err?.message || err);
  process.exit(1);
});
