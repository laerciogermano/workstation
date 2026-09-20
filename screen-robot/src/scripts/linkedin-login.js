#!/usr/bin/env node
/**
 * Cenário: baixar Instagram (versão na config) → provisionar Android →
 * abrir LinkedIn → print → achar login → digitar user/senha → Entrar → salvar sessão.
 *
 * Uso:
 *   LINKEDIN_USER=... LINKEDIN_PASSWORD=... node scripts/linkedin-login.js
 *   node scripts/linkedin-login.js --config ./device.config.json
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { provisionEmulator } from "../lib/provision.js";
import {
  extractElements,
  findLoginTarget,
  findEditableFields,
} from "../lib/extract.js";
import * as operate from "../lib/operate.js";
import { saveSession } from "../lib/session.js";
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

async function main() {
  const argv = process.argv.slice(2);
  let configPath = resolve(ROOT, "device.config.json");
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--config") configPath = resolve(argv[++i]);
  }

  const cfg = loadConfig(configPath);
  const { user, password } = creds(cfg);
  const events = [];

  console.log("1) Provisionar agente…");
  const handle = await provisionEmulator(cfg);
  const serial = handle.serial;
  console.log(`   OK ${serial}`);

  console.log("2) Instalar Instagram (versão na config)…");
  const ig = await handle.installApk(cfg.apps.instagram);
  console.log(`   OK ${ig.package} ${ig.version || "?"}${ig.skipped ? " (skip)" : ""}`);

  console.log("3) Instalar LinkedIn…");
  const li = await handle.installApk(cfg.apps.linkedin);
  console.log(`   OK ${li.package} ${li.version || "?"}${li.skipped ? " (skip)" : ""}`);

  console.log("4) Abrir LinkedIn…");
  await operate.launch(serial, cfg.apps.linkedin.package);

  console.log("5) Receber eventos (UI estável)…");
  await handle.on(
    "ui_stable",
    { timeoutMs: 90_000 },
    (e) => {
      events.push(e);
      if (e.type === "ui_stable") console.log(`   evento ${e.type} (tentativa ${e.attempt})`);
    },
  );

  const shotPath = resolve(ROOT, cfg.screenshot?.path || "./screenshots/linkedin-before-login.png");
  console.log("6) Print da tela…");
  operate.screenshot(serial, shotPath);
  console.log(`   → ${shotPath}`);

  console.log("7) Extrair elementos…");
  let { elements } = extractElements(serial);
  let target = findLoginTarget(elements);
  console.log(
    `   elementos=${elements.length} alreadyOnLogin=${target.alreadyOnLoginScreen} btn=${target.loginButton?.label || "-"}`,
  );

  if (!target.alreadyOnLoginScreen && target.loginButton) {
    console.log("8) Tocar botão de login…");
    operate.tapElement(serial, target.loginButton);
    await sleep(2_000);
    await handle.on("ui_stable", { timeoutMs: 30_000 }, (e) => events.push(e));
    ({ elements } = extractElements(serial));
    target = findLoginTarget(elements);
  } else if (!target.alreadyOnLoginScreen && !target.loginButton) {
    throw new Error(
      "Não achei botão de login nem tela de login. Veja o print e o dump.",
    );
  } else {
    console.log("8) Já na tela de login — segue digitação");
  }

  const fields = findEditableFields(elements);
  if (!fields.user?.center) {
    throw new Error("Campo de usuário não encontrado na extração");
  }
  if (!fields.password?.center) {
    throw new Error("Campo de senha não encontrado na extração");
  }

  console.log("9) Digitar usuário e senha…");
  operate.tapElement(serial, fields.user);
  await sleep(400);
  operate.typeText(serial, user);
  await sleep(400);
  operate.tapElement(serial, fields.password);
  await sleep(400);
  operate.typeText(serial, password);
  await sleep(400);

  ({ elements } = extractElements(serial));
  const enter =
    findLoginTarget(elements).loginButton ||
    elements.find((el) =>
      /entrar|sign in|log in|continue|continuar/i.test(el.label || ""),
    );
  if (!enter?.center) throw new Error("Botão Entrar não encontrado");

  console.log(`10) Clicar em Entrar (${enter.label})…`);
  operate.tapElement(serial, enter);

  const sessionPath = resolve(ROOT, cfg.session?.path || "./state/session.json");
  console.log("11) Guardar estado de sessão…");
  saveSession(sessionPath, {
    stage: "login_submitted",
    agent,
    apps: { instagram: ig, linkedin: li },
    screenshot: shotPath,
    events: events.slice(-20),
    elementCount: elements.length,
  });
  console.log(`   → ${sessionPath}`);
  console.log("OK");
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
