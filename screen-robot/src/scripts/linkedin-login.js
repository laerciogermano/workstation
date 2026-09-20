#!/usr/bin/env node
/**
 * Cenário: baixar Instagram (versão na config) → provisionar Android →
 * abrir LinkedIn → prints por etapa → achar login → digitar user/senha → Entrar → salvar sessão.
 *
 * Uso:
 *   LINKEDIN_USER=... LINKEDIN_PASSWORD=... node scripts/linkedin-login.js
 *   node scripts/linkedin-login.js --config ./device.config.json
 *
 * Prints: screen-robot/src/screenshots/NN-descricao.png
 */
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { provisionEmulator } from "../lib/provision.js";
import {
  extractElements,
  findLoginTarget,
  findEditableFields,
} from "../lib/extract.js";
import { sleep } from "../lib/adb.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadConfig(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`Config não encontrada: ${abs}`);
  return JSON.parse(readFileSync(abs, "utf8"));
}

function creds(cfg) {
  const c = cfg.credentials?.linkedin || {};
  const user = process.env[c.userEnv || "LINKEDIN_USER"];
  const password = process.env[c.passwordEnv || "LINKEDIN_PASSWORD"];
  if (!user || !password) {
    throw new Error(
      `Defina ${c.userEnv || "LINKEDIN_USER"} e ${c.passwordEnv || "LINKEDIN_PASSWORD"}`,
    );
  }
  return { user, password };
}

function shotDirFromConfig(cfg) {
  const sample = resolve(
    ROOT,
    cfg.screenshot?.path || "./screenshots/linkedin-before-login.png",
  );
  const dir = dirname(sample);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function makeShot(handle, dir, shots) {
  let n = 0;
  return (label) => {
    n += 1;
    const file = `${String(n).padStart(2, "0")}-${label}.png`;
    const path = resolve(dir, file);
    handle.screenshot(path);
    shots.push(path);
    console.log(`   📷 ${path}`);
    return path;
  };
}

async function main() {
  const argv = process.argv.slice(2);
  let configPath = resolve(ROOT, "device.config.json");
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--config") configPath = resolve(argv[++i]);
  }

  const cfg = loadConfig(configPath);
  const { user, password } = creds(cfg);
  const events = [];
  const shots = [];
  const shotDir = shotDirFromConfig(cfg);

  console.log("1) Provisionar agente…");
  const handle = await provisionEmulator(cfg);
  const serial = handle.serial;
  const shot = makeShot(handle, shotDir, shots);
  console.log(`   OK ${serial}`);
  shot("01-apos-provisionar");

  console.log("2) Instalar Instagram (versão na config)…");
  const ig = await handle.installApk(cfg.apps.instagram);
  console.log(`   OK ${ig.package} ${ig.version || "?"}${ig.skipped ? " (skip)" : ""}`);
  shot("02-apos-instalar-instagram");

  console.log("3) Instalar LinkedIn…");
  const li = await handle.installApk(cfg.apps.linkedin);
  console.log(`   OK ${li.package} ${li.version || "?"}${li.skipped ? " (skip)" : ""}`);
  shot("03-apos-instalar-linkedin");

  console.log("4) Abrir LinkedIn…");
  await handle.launch(cfg.apps.linkedin.package);
  shot("04-apos-abrir-linkedin");

  console.log("5) Receber eventos (UI estável)…");
  await handle.on(
    "ui_stable",
    { timeoutMs: 90_000 },
    (e) => {
      events.push(e);
      if (e.type === "ui_stable") console.log(`   evento ${e.type} (tentativa ${e.attempt})`);
    },
  );
  shot("05-ui-estavel");

  console.log("6) Extrair elementos…");
  let { elements } = extractElements(serial);
  let target = findLoginTarget(elements);
  console.log(
    `   elementos=${elements.length} alreadyOnLogin=${target.alreadyOnLoginScreen} btn=${target.loginButton?.label || "-"}`,
  );
  shot("06-antes-login");

  if (!target.alreadyOnLoginScreen && target.loginButton) {
    console.log("7) Tocar botão de login…");
    handle.tapElement(target.loginButton);
    await sleep(2_000);
    await handle.on("ui_stable", { timeoutMs: 30_000 }, (e) => events.push(e));
    shot("07-apos-tap-login");
    ({ elements } = extractElements(serial));
    target = findLoginTarget(elements);
  } else if (!target.alreadyOnLoginScreen && !target.loginButton) {
    shot("07-erro-sem-botao-login");
    throw new Error(
      "Não achei botão de login nem tela de login. Veja os prints em screenshots/.",
    );
  } else {
    console.log("7) Já na tela de login — segue digitação");
    shot("07-ja-na-tela-login");
  }

  const fields = findEditableFields(elements);
  if (!fields.user?.center) {
    shot("08-erro-sem-campo-usuario");
    throw new Error("Campo de usuário não encontrado na extração");
  }
  if (!fields.password?.center) {
    shot("08-erro-sem-campo-senha");
    throw new Error("Campo de senha não encontrado na extração");
  }

  console.log("8) Digitar usuário…");
  handle.tapElement(fields.user);
  await sleep(400);
  handle.type(user);
  await sleep(400);
  shot("08-apos-digitar-usuario");

  console.log("9) Digitar senha…");
  handle.tapElement(fields.password);
  await sleep(400);
  handle.type(password);
  await sleep(400);
  shot("09-apos-digitar-senha");

  ({ elements } = extractElements(serial));
  const enter =
    findLoginTarget(elements).loginButton ||
    elements.find((el) =>
      /entrar|sign in|log in|continue|continuar|agree/i.test(el.label || ""),
    );
  if (!enter?.center) {
    shot("10-erro-sem-botao-entrar");
    throw new Error("Botão Entrar não encontrado");
  }

  console.log(`10) Clicar em Entrar (${enter.label})…`);
  handle.tapElement(enter);
  await sleep(2_000);
  shot("10-apos-clicar-entrar");

  await handle.on("ui_stable", { timeoutMs: 30_000 }, (e) => events.push(e)).catch(() => {});
  shot("11-apos-submit-ui-estavel");

  const sessionPath = resolve(ROOT, cfg.session?.path || "./state/session.json");
  console.log("11) Guardar estado de sessão…");
  await handle.saveSession(sessionPath, {
    stage: "login_submitted",
    apps: { instagram: ig, linkedin: li },
    screenshots: shots,
    events: events.slice(-20),
    elementCount: elements.length,
  });
  console.log(`   → ${sessionPath}`);
  console.log(`OK — ${shots.length} prints em ${shotDir}`);
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
