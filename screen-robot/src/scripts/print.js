#!/usr/bin/env node
/**
 * Tira um screenshot do device ADB online e salva o PNG.
 *
 * Uso (a partir de screen-robot/src):
 *   npm run print -- -n teste.png
 *   npm run print -- teste.png
 *   node scripts/print.js -n tela.png --device emulator-5554
 *
 * Sem diretório no nome → grava em screenshots/<nome>.
 * Default: screenshots/print-<timestamp>.png
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { screenshot } from "../lib/operate.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(ROOT, "screenshots");

function usage(code = 1) {
  console.error(`Uso:
  npm run print -- -n <arquivo.png>
  npm run print -- <arquivo.png>
  node scripts/print.js -n <arquivo.png> [--device SERIAL] [--config path]

Opções:
  -n, --name   nome do arquivo (obrigatório se não passar posicional)
  --device, -s serial ADB (senão: ANDROID_SERIAL / device.config.json / 1º device)
  --config     path do device.config.json

Nota: o "--" após "npm run print" é necessário para o npm repassar -n.`);
  process.exit(code);
}

function loadConfig(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

function firstOnlineSerial() {
  const out = spawnSync("adb", ["devices"], { encoding: "utf8" }).stdout || "";
  const line = String(out)
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("List") && /\bdevice\b/.test(l));
  return line ? line.split(/\s+/)[0] : null;
}

function resolveSerial({ deviceFlag, config }) {
  if (deviceFlag) return deviceFlag;
  if (process.env.ANDROID_SERIAL) return process.env.ANDROID_SERIAL;
  const fromCfg = config?.provision?.serial || config?.device;
  if (fromCfg) return fromCfg;
  const online = firstOnlineSerial();
  if (online) return online;
  throw new Error(
    "Nenhum device ADB. Suba o emulador ou passe --device SERIAL.",
  );
}

function resolveOutPath(name) {
  if (!name) {
    return resolve(OUT_DIR, `print-${Date.now()}.png`);
  }
  const withExt = name.endsWith(".png") ? name : `${name}.png`;
  if (isAbsolute(withExt) || withExt.includes("/") || withExt.includes("\\")) {
    return resolve(withExt);
  }
  return resolve(OUT_DIR, basename(withExt));
}

function parseArgs(argv) {
  let name = null;
  let device = null;
  let configPath = resolve(ROOT, "device.config.json");
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") usage(0);
    if (a === "-n" || a === "--name") {
      name = argv[++i];
      if (!name) usage(1);
      continue;
    }
    if (a === "--device" || a === "-s") {
      device = argv[++i];
      if (!device) usage(1);
      continue;
    }
    if (a === "--config") {
      configPath = resolve(argv[++i]);
      continue;
    }
    if (a.startsWith("-")) {
      console.error(`Flag desconhecida: ${a}`);
      usage(1);
    }
    positional.push(a);
  }

  if (!name && positional[0]) name = positional[0];
  return { name, device, configPath };
}

function main() {
  const { name, device, configPath } = parseArgs(process.argv.slice(2));
  const config = loadConfig(configPath);
  const serial = resolveSerial({ deviceFlag: device, config });
  const path = resolveOutPath(name);

  const abs = screenshot({ serial, path });
  console.log(`OK ${serial} → ${abs}`);
}

main();
