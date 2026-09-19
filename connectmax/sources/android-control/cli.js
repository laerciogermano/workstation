#!/usr/bin/env node
/**
 * android-control — executa uma sequência de ações no Android via ADB.
 *
 * Uso:
 *   node cli.js config.json
 *   node cli.js config.json --device 127.0.0.1:5555
 *   node cli.js tap 360 640
 *   node cli.js type "olá"
 *   node cli.js shot ./print.png
 *   node cli.js swipe 100 800 100 200 300
 *   node cli.js key KEYCODE_BACK
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_DEVICE = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const ADB_IME = "com.android.adbkeyboard/.AdbIME";
const ADB_KB_APK = resolve(__dirname, "apks/ADBKeyboard.apk");

function usage(code = 1) {
  console.log(`Uso:
  node cli.js <config.json> [--device SERIAL]
  node cli.js tap <x> <y> [--device SERIAL]
  node cli.js type <texto> [--device SERIAL]
  node cli.js shot [arquivo.png] [--device SERIAL]
  node cli.js swipe <x1> <y1> <x2> <y2> [ms] [--device SERIAL]
  node cli.js key <KEYCODE|número> [--device SERIAL]
  node cli.js wait <ms>
  node cli.js setup-ime   # instala/ativa ADBKeyBoard (necessário p/ acentos)

Config (JSON): ver config.example.json
Device padrão: ${DEFAULT_DEVICE} (ou ANDROID_SERIAL)

Nota: no Android 15/redroid, \`input text\` quebra com acentos (NPE).
      Digitação usa ADBKeyBoard (broadcast B64).`);
  process.exit(code);
}

function parseArgs(argv) {
  const args = [...argv];
  let device = DEFAULT_DEVICE;
  const out = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--device" || args[i] === "-s") {
      device = args[++i];
      continue;
    }
    if (args[i] === "--help" || args[i] === "-h") usage(0);
    out.push(args[i]);
  }
  return { device, args: out };
}

function adb(device, args, opts = {}) {
  const r = spawnSync("adb", ["-s", device, ...args], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    ...opts,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    const err = (r.stderr || r.stdout || "").trim() || `adb exit ${r.status}`;
    throw new Error(err);
  }
  return r;
}

function adbOk(device, args) {
  const r = spawnSync("adb", ["-s", device, ...args], { encoding: "utf8" });
  return r.status === 0;
}

/** Escapa texto para `adb shell input text` (só ASCII confiável). */
function escapeInputText(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/ /g, "%s")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/&/g, "\\&")
    .replace(/</g, "\\<")
    .replace(/>/g, "\\>")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\|/g, "\\|")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "%s");
}

function isAscii(text) {
  return /^[\x20-\x7E]*$/.test(String(text));
}

/** Instala/ativa ADBKeyBoard (unicode). APK open-source em apks/. */
function ensureAdbKeyboard(device) {
  const installed = adbOk(device, [
    "shell",
    "pm",
    "path",
    "com.android.adbkeyboard",
  ]);
  if (!installed) {
    if (!existsSync(ADB_KB_APK)) {
      throw new Error(
        `ADBKeyBoard não instalado e APK ausente: ${ADB_KB_APK}\n` +
          `Rode: node cli.js setup-ime`,
      );
    }
    console.log("Instalando ADBKeyBoard...");
    adb(device, ["install", "-r", ADB_KB_APK], { stdio: "inherit" });
  }
  adbOk(device, ["shell", "ime", "enable", ADB_IME]);
  adb(device, ["shell", "ime", "set", ADB_IME]);
}

function typeViaAdbKeyboard(device, text) {
  ensureAdbKeyboard(device);
  const b64 = Buffer.from(String(text), "utf8").toString("base64");
  adb(device, ["shell", "am", "broadcast", "-a", "ADB_INPUT_B64", "--es", "msg", b64]);
}

function typeText(device, text, method) {
  const m = method || (isAscii(text) ? "input" : "adb");
  if (m === "input") {
    try {
      adb(device, ["shell", "input", "text", escapeInputText(text)]);
      return;
    } catch (e) {
      console.warn(`input text falhou (${e.message.split("\n")[0]}); usando ADBKeyBoard`);
    }
  }
  typeViaAdbKeyboard(device, text);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runStep(device, step, i) {
  const action = String(step.action || step.cmd || "").toLowerCase();
  const label = `[${i + 1}] ${action}`;

  switch (action) {
    case "tap":
    case "click": {
      const { x, y } = step;
      if (x == null || y == null) throw new Error(`${label}: falta x/y`);
      console.log(`${label} ${x} ${y}`);
      adb(device, ["shell", "input", "tap", String(x), String(y)]);
      break;
    }
    case "type":
    case "text": {
      const text = step.text ?? step.value;
      if (text == null) throw new Error(`${label}: falta text`);
      console.log(`${label} ${JSON.stringify(text)}`);
      // Android 15: input text NPE com unicode → ADBKeyBoard (B64)
      typeText(device, text, step.method);
      break;
    }
    case "setup-ime":
    case "setup_ime": {
      console.log(`${label} ADBKeyBoard`);
      if (!existsSync(ADB_KB_APK)) throw new Error(`APK ausente: ${ADB_KB_APK}`);
      adb(device, ["install", "-r", ADB_KB_APK], { stdio: "inherit" });
      ensureAdbKeyboard(device);
      console.log(`IME ativo: ${ADB_IME}`);
      break;
    }
    case "swipe": {
      const { x1, y1, x2, y2, ms = 300 } = step;
      if ([x1, y1, x2, y2].some((v) => v == null))
        throw new Error(`${label}: falta x1 y1 x2 y2`);
      console.log(`${label} ${x1},${y1} → ${x2},${y2} (${ms}ms)`);
      adb(device, [
        "shell",
        "input",
        "swipe",
        String(x1),
        String(y1),
        String(x2),
        String(y2),
        String(ms),
      ]);
      break;
    }
    case "key":
    case "keyevent": {
      const code = step.code ?? step.key ?? step.value;
      if (code == null) throw new Error(`${label}: falta code`);
      console.log(`${label} ${code}`);
      adb(device, ["shell", "input", "keyevent", String(code)]);
      break;
    }
    case "wait":
    case "sleep": {
      const ms = Number(step.ms ?? step.msleep ?? step.value ?? 0);
      console.log(`${label} ${ms}ms`);
      await sleep(ms);
      break;
    }
    case "screenshot":
    case "shot":
    case "screencap": {
      const path = resolve(
        step.path || step.file || `./screenshots/shot-${Date.now()}.png`,
      );
      mkdirSync(dirname(path), { recursive: true });
      const remote = "/sdcard/android-control-shot.png";
      console.log(`${label} → ${path}`);
      adb(device, ["shell", "screencap", "-p", remote]);
      adb(device, ["pull", remote, path], { stdio: "inherit" });
      adb(device, ["shell", "rm", "-f", remote]);
      break;
    }
    case "shell": {
      const cmd = step.cmd || step.command;
      if (!cmd) throw new Error(`${label}: falta cmd`);
      console.log(`${label} ${cmd}`);
      const r = adb(device, ["shell", ...String(cmd).split(/\s+/)]);
      if (r.stdout) process.stdout.write(r.stdout);
      break;
    }
    case "launch":
    case "am_start": {
      const pkg = step.package || step.pkg;
      const activity = step.activity;
      console.log(`${label} ${pkg}${activity ? "/" + activity : ""}`);
      if (activity) {
        adb(device, ["shell", "am", "start", "-n", `${pkg}/${activity}`]);
      } else {
        adb(device, [
          "shell",
          "monkey",
          "-p",
          pkg,
          "-c",
          "android.intent.category.LAUNCHER",
          "1",
        ]);
      }
      break;
    }
    default:
      throw new Error(`Ação desconhecida: ${action}`);
  }

  if (step.delay) await sleep(Number(step.delay));
}

async function runConfig(device, configPath) {
  const abs = resolve(configPath);
  if (!existsSync(abs)) throw new Error(`Config não encontrada: ${abs}`);
  const cfg = JSON.parse(readFileSync(abs, "utf8"));
  const serial = cfg.device || device;
  const steps = cfg.steps || cfg.commands || cfg.actions;
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error("Config sem steps[]");
  }
  console.log(`Device: ${serial}`);
  console.log(`Steps: ${steps.length}`);
  // garante conexão TCP se parecer host:port
  if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(serial) || serial.includes("localhost")) {
    spawnSync("adb", ["connect", serial], { encoding: "utf8" });
  }
  for (let i = 0; i < steps.length; i++) {
    await runStep(serial, steps[i], i);
  }
  console.log("OK");
}

async function main() {
  const { device, args } = parseArgs(process.argv.slice(2));
  if (args.length === 0) usage(0);

  const first = args[0];
  const rest = args.slice(1);

  if (first.endsWith(".json")) {
    await runConfig(device, first);
    return;
  }

  const cmd = first.toLowerCase();

  if (cmd === "tap" || cmd === "click") {
    await runStep(device, { action: "tap", x: rest[0], y: rest[1] }, 0);
  } else if (cmd === "type" || cmd === "text") {
    await runStep(device, { action: "type", text: rest.join(" ") }, 0);
  } else if (cmd === "setup-ime" || cmd === "setup_ime") {
    await runStep(device, { action: "setup-ime" }, 0);
  } else if (cmd === "shot" || cmd === "screenshot") {
    await runStep(device, { action: "screenshot", path: rest[0] }, 0);
  } else if (cmd === "swipe") {
    await runStep(
      device,
      {
        action: "swipe",
        x1: rest[0],
        y1: rest[1],
        x2: rest[2],
        y2: rest[3],
        ms: rest[4] || 300,
      },
      0,
    );
  } else if (cmd === "key" || cmd === "keyevent") {
    await runStep(device, { action: "key", code: rest[0] }, 0);
  } else if (cmd === "wait") {
    await runStep(device, { action: "wait", ms: rest[0] }, 0);
  } else if (cmd === "launch") {
    await runStep(
      device,
      { action: "launch", package: rest[0], activity: rest[1] },
      0,
    );
  } else {
    usage(1);
  }
}

main().catch((e) => {
  console.error("Erro:", e.message || e);
  process.exit(1);
});
