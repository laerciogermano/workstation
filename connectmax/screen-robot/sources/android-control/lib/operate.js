/**
 * Executar operações — launch, tap, type, screenshot, key.
 */
import { mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { adb, adbOk, sleep } from "./adb.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ADB_IME = "com.android.adbkeyboard/.AdbIME";
const ADB_KB_APK = resolve(ROOT, "apks/ADBKeyboard.apk");

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

function ensureAdbKeyboard(serial) {
  const installed = adbOk(serial, ["shell", "pm", "path", "com.android.adbkeyboard"]);
  if (!installed) {
    if (!existsSync(ADB_KB_APK)) {
      throw new Error(`ADBKeyBoard ausente: ${ADB_KB_APK}`);
    }
    adb(serial, ["install", "-r", ADB_KB_APK], { stdio: "inherit" });
  }
  adbOk(serial, ["shell", "ime", "enable", ADB_IME]);
  adb(serial, ["shell", "ime", "set", ADB_IME]);
}

export async function launch(serial, pkg, activity) {
  if (activity) {
    adb(serial, ["shell", "am", "start", "-n", `${pkg}/${activity}`]);
  } else {
    adb(serial, [
      "shell",
      "monkey",
      "-p",
      pkg,
      "-c",
      "android.intent.category.LAUNCHER",
      "1",
    ]);
  }
  await sleep(2_000);
}

export function tap(serial, x, y) {
  adb(serial, ["shell", "input", "tap", String(x), String(y)]);
}

export function tapElement(serial, el) {
  if (!el?.center) throw new Error("tapElement: elemento sem center");
  tap(serial, el.center[0], el.center[1]);
}

export function typeText(serial, text) {
  const s = String(text);
  if (/^[\x20-\x7E]*$/.test(s)) {
    try {
      adb(serial, ["shell", "input", "text", escapeInputText(s)]);
      return;
    } catch {
      /* fallback */
    }
  }
  ensureAdbKeyboard(serial);
  const b64 = Buffer.from(s, "utf8").toString("base64");
  adb(serial, ["shell", "am", "broadcast", "-a", "ADB_INPUT_B64", "--es", "msg", b64]);
}

export function key(serial, code) {
  adb(serial, ["shell", "input", "keyevent", String(code)]);
}

export function screenshot(serial, path) {
  const abs = resolve(path);
  mkdirSync(dirname(abs), { recursive: true });
  const remote = "/sdcard/sr-shot.png";
  adb(serial, ["shell", "screencap", "-p", remote]);
  adb(serial, ["pull", remote, abs]);
  adb(serial, ["shell", "rm", "-f", remote]);
  return abs;
}
