#!/usr/bin/env node
/**
 * Configuração LinkedIn pós-signup (onboarding + perfil).
 *
 * Defaults: [`assets/profile-defaults.json`](../assets/profile-defaults.json)
 * (company, jobTitle, avatar, banner, about, profileUrl=/me).
 *
 * Uso (cwd: screen-robot/src):
 *   npm run linkedin-setup -- --device emulator-5556 --defaults
 *   npm run linkedin-setup-post -- --device emulator-5564
 *   npm run linkedin-setup -- --device emulator-5556 --banner-only
 *   npm run linkedin-setup -- --device emulator-5556 --about-only
 *   npm run linkedin-setup -- --device emulator-5556 --avatar-only
 *   npm run linkedin-setup -- --device emulator-5556 --privacy-only
 *   npm run linkedin-setup -- --device emulator-5556 --job-title '…' --company ConectMax
 *
 * `--defaults` / `linkedin-setup-post`: avatar + banner + about + privacy e-mail
 * (Only visible to me). Não reabre onboarding de job.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_ABOUT,
  DEFAULT_AVATAR_PATH,
  DEFAULT_BANNER_PATH,
  DEFAULT_JOB_TITLE,
  loadProfileDefaults,
  linkedinSetupAbout,
  linkedinSetupAvatar,
  linkedinSetupBanner,
  linkedinSetupJobTitle,
  linkedinSetupPrivacyEmail,
} from "../lib/linkedin-setup.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadConfig(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`Config não encontrada: ${abs}`);
  return JSON.parse(readFileSync(abs, "utf8"));
}

function parseOptionalPath(argv, i, fallback) {
  const next = argv[i + 1];
  if (next && !String(next).startsWith("--")) {
    return { value: resolve(ROOT, String(argv[i + 1]).trim()), consumed: 1 };
  }
  return { value: fallback, consumed: 0 };
}

function parseArgs(argv) {
  const d = loadProfileDefaults();
  let device = null;
  let jobTitle = null;
  let company = d.company;
  let avatar = null;
  let banner = null;
  let about = null;
  let privacy = false;
  let mode = "mixed"; // mixed | avatar-only | banner-only | about-only | privacy-only
  let useDefaults = false;
  let configPath = resolve(ROOT, "device.config.json");
  let noShot = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--device" || a === "-s")
      device = String(argv[++i] || "").trim();
    else if (a === "--job-title" || a === "--jobtitle")
      jobTitle = String(argv[++i] || "").trim();
    else if (a === "--company") company = String(argv[++i] || "").trim();
    else if (a === "--defaults") {
      // Pós-cadastro via /me: avatar + banner + about + privacy e-mail.
      useDefaults = true;
      privacy = true;
      company = company || d.company;
      jobTitle = jobTitle || d.jobTitle || DEFAULT_JOB_TITLE;
      avatar = avatar ?? d.avatar ?? DEFAULT_AVATAR_PATH;
      banner = banner ?? d.banner ?? DEFAULT_BANNER_PATH;
      about = about ?? d.about ?? DEFAULT_ABOUT;
    } else if (a === "--avatar") {
      const p = parseOptionalPath(argv, i, d.avatar || DEFAULT_AVATAR_PATH);
      avatar = p.value;
      i += p.consumed;
    } else if (a === "--avatar-only") {
      mode = "avatar-only";
      avatar = avatar ?? d.avatar ?? DEFAULT_AVATAR_PATH;
    } else if (a === "--banner") {
      const p = parseOptionalPath(argv, i, d.banner || DEFAULT_BANNER_PATH);
      banner = p.value;
      i += p.consumed;
    } else if (a === "--banner-only") {
      mode = "banner-only";
      banner = banner ?? d.banner ?? DEFAULT_BANNER_PATH;
    } else if (a === "--about") {
      const next = argv[i + 1];
      if (next && !String(next).startsWith("--")) about = String(argv[++i]);
      else about = d.about || DEFAULT_ABOUT;
    } else if (a === "--about-only") {
      mode = "about-only";
      about = about ?? d.about ?? DEFAULT_ABOUT;
    } else if (a === "--privacy" || a === "--privacy-email") {
      privacy = true;
    } else if (a === "--privacy-only") {
      mode = "privacy-only";
      privacy = true;
    } else if (a === "--no-privacy") {
      privacy = false;
    } else if (a === "--config") configPath = resolve(argv[++i]);
    else if (a === "--no-shot") noShot = true;
    else if (a === "--help" || a === "-h") {
      console.log(
        `Uso: npm run linkedin-setup -- --device emulator-5556 [--defaults|--privacy-only] [--job-title …] [--company ConectMax] [--avatar [path]] [--banner [path]] [--about [texto]] [--privacy] [--avatar-only|--banner-only|--about-only]
Pós-cadastro: npm run linkedin-setup-post -- --device emulator-5564`,
      );
      process.exit(0);
    }
  }
  return {
    device,
    jobTitle,
    company,
    avatar,
    banner,
    about,
    privacy,
    mode,
    useDefaults,
    configPath,
    noShot,
    profileUrl: d.profileUrl,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (
    args.mode === "mixed" &&
    !args.jobTitle &&
    !args.useDefaults &&
    !args.banner &&
    !args.about &&
    !args.avatar &&
    !args.privacy
  ) {
    throw new Error(
      "passe --job-title, --defaults, --avatar/--banner/--about/--privacy ou *-only",
    );
  }
  for (const [label, path] of [
    ["--avatar", args.avatar],
    ["--banner", args.banner],
  ]) {
    if (path && !existsSync(path)) {
      throw new Error(`${label} não encontrado: ${path}`);
    }
  }

  const cfg = loadConfig(args.configPath);
  if (args.device) {
    cfg.device = args.device;
    cfg.provision = { serial: args.device, kind: "adb" };
  }
  const linkedinPkg = cfg.apps?.linkedin?.package || "com.linkedin.android";
  const { serial } = await provisionEmulator(cfg);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = args.noShot
    ? null
    : resolve(ROOT, "screenshots", "linkedin-setup", stamp);
  if (outDir) mkdirSync(outDir, { recursive: true });

  console.error(
    `serial=${serial} mode=${args.mode} jobTitle=${args.jobTitle || "-"} company=${args.company} avatar=${args.avatar || "-"} banner=${args.banner || "-"} about=${args.about ? "yes" : "-"} privacy=${args.privacy ? "yes" : "-"}`,
  );

  /** @type {Record<string, unknown>} */
  const result = {
    serial,
    outDir,
    company: args.company,
    jobTitle: args.jobTitle,
    steps: [],
  };

  if (args.mode === "avatar-only") {
    const av = await linkedinSetupAvatar({
      serial,
      avatarPath: args.avatar,
      profileUrl: args.profileUrl,
      linkedinPackage: linkedinPkg,
      outDir,
    });
    result.avatarPath = av.avatarPath;
    result.steps.push(...av.steps);
  } else if (args.mode === "banner-only") {
    const bn = await linkedinSetupBanner({
      serial,
      bannerPath: args.banner,
      profileUrl: args.profileUrl,
      linkedinPackage: linkedinPkg,
      outDir,
    });
    result.bannerPath = bn.bannerPath;
    result.steps.push(...bn.steps);
  } else if (args.mode === "about-only") {
    const ab = await linkedinSetupAbout({
      serial,
      about: args.about,
      profileUrl: args.profileUrl,
      linkedinPackage: linkedinPkg,
      outDir,
    });
    result.about = ab.about;
    result.steps.push(...ab.steps);
  } else if (args.mode === "privacy-only") {
    const pr = await linkedinSetupPrivacyEmail({
      serial,
      linkedinPackage: linkedinPkg,
      outDir,
    });
    result.privacy = {
      emailVisibility: pr.emailVisibility,
      exportEmails: pr.exportEmails,
    };
    result.steps.push(...pr.steps);
  } else {
    // --defaults: avatar+banner+about+privacy via /me (não reabre onboarding de job)
    const runJob = Boolean(args.jobTitle) && !args.useDefaults;
    if (runJob) {
      const setup = await linkedinSetupJobTitle({
        serial,
        jobTitle: args.jobTitle,
        company: args.company,
        outDir,
      });
      result.steps.push(...setup.steps);
    }
    if (args.avatar) {
      const av = await linkedinSetupAvatar({
        serial,
        avatarPath: args.avatar,
        profileUrl: args.profileUrl,
        linkedinPackage: linkedinPkg,
        outDir,
      });
      result.avatarPath = av.avatarPath;
      result.steps.push(...av.steps);
    }
    if (args.banner) {
      const bn = await linkedinSetupBanner({
        serial,
        bannerPath: args.banner,
        profileUrl: args.profileUrl,
        linkedinPackage: linkedinPkg,
        outDir,
      });
      result.bannerPath = bn.bannerPath;
      result.steps.push(...bn.steps);
    }
    if (args.about) {
      const ab = await linkedinSetupAbout({
        serial,
        about: args.about,
        profileUrl: args.profileUrl,
        linkedinPackage: linkedinPkg,
        outDir,
      });
      result.about = ab.about;
      result.steps.push(...ab.steps);
    }
    if (args.privacy) {
      const pr = await linkedinSetupPrivacyEmail({
        serial,
        linkedinPackage: linkedinPkg,
        outDir,
      });
      result.privacy = {
        emailVisibility: pr.emailVisibility,
        exportEmails: pr.exportEmails,
      };
      result.steps.push(...pr.steps);
    }
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
