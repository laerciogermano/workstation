/**
 * EP-04 — operações de tela (internos do handle).
 * Caller: handle.launch / tap / type / scroll / screenshot / matchImage.
 */
import { mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { adb, adbOk, sleep as defaultSleep } from "./adb.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ADB_IME = "com.android.adbkeyboard/.AdbIME";
const ADB_KB_APK = resolve(ROOT, "apks/ADBKeyboard.apk");

function fail(code, msg) {
  const err = new Error(msg);
  err.code = code;
  throw err;
}

export function escapeInputText(text) {
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

/**
 * @param {string} serial
 * @param {object} [deps]
 */
export function createOperate(serial, deps = {}) {
  const runAdb = deps.adb ?? adb;
  const runAdbOk = deps.adbOk ?? adbOk;
  const sleep = deps.sleep ?? defaultSleep;
  const exists = deps.existsSync ?? existsSync;
  const mkdir = deps.mkdirSync ?? mkdirSync;
  const resolvePath = deps.resolve ?? resolve;

  function ensureAdbKeyboard() {
    const installed = runAdbOk(serial, [
      "shell",
      "pm",
      "path",
      "com.android.adbkeyboard",
    ]);
    if (!installed) {
      if (!exists(ADB_KB_APK)) {
        fail("OPERATE_TYPE_FAILED", `ADBKeyBoard ausente: ${ADB_KB_APK}`);
      }
      runAdb(serial, ["install", "-r", ADB_KB_APK], { stdio: "inherit" });
    }
    runAdbOk(serial, ["shell", "ime", "enable", ADB_IME]);
    runAdb(serial, ["shell", "ime", "set", ADB_IME]);
  }

  async function launch(pkg, activity) {
    try {
      let component =
        activity == null
          ? null
          : String(activity).includes("/")
            ? String(activity)
            : `${pkg}/${activity}`;
      if (!component) {
        try {
          const resolved = runAdb(serial, [
            "shell",
            "cmd",
            "package",
            "resolve-activity",
            "--brief",
            "-c",
            "android.intent.category.LAUNCHER",
            pkg,
          ]);
          const line = (resolved.stdout || "")
            .trim()
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
            .pop();
          if (line && line.includes("/")) component = line;
        } catch {
          /* resolve opcional */
        }
      }
      if (component) {
        runAdb(serial, ["shell", "am", "start", "-n", component]);
      } else {
        runAdb(serial, [
          "shell",
          "am",
          "start",
          "-a",
          "android.intent.action.MAIN",
          "-c",
          "android.intent.category.LAUNCHER",
          "-p",
          pkg,
        ]);
      }
    } catch (e) {
      // monkey no redroid costuma exit ≠ 0; tenta mesmo assim
      runAdbOk(serial, [
        "shell",
        "monkey",
        "-p",
        pkg,
        "-c",
        "android.intent.category.LAUNCHER",
        "1",
      ]);
      await sleep(1_500);
      if (!runAdbOk(serial, ["shell", "pidof", pkg])) {
        fail(
          "OPERATE_LAUNCH_FAILED",
          `launch falhou para ${pkg}: ${e.message}`,
        );
      }
    }
    await sleep(2_000);
  }

  function tap(x, y) {
    runAdb(serial, ["shell", "input", "tap", String(x), String(y)]);
  }

  function tapElement(el) {
    const cx = el?.center?.[0] ?? el?.bounds?.centerX;
    const cy = el?.center?.[1] ?? el?.bounds?.centerY;
    if (cx == null || cy == null) {
      fail("OPERATE_LAUNCH_FAILED", "tapElement: elemento sem center");
    }
    tap(cx, cy);
  }

  function type(text) {
    const s = String(text);
    if (/^[\x20-\x7E]*$/.test(s)) {
      try {
        runAdb(serial, ["shell", "input", "text", escapeInputText(s)]);
        return;
      } catch {
        /* fallback IME */
      }
    }
    try {
      ensureAdbKeyboard();
      const b64 = Buffer.from(s, "utf8").toString("base64");
      runAdb(serial, [
        "shell",
        "am",
        "broadcast",
        "-a",
        "ADB_INPUT_B64",
        "--es",
        "msg",
        b64,
      ]);
    } catch (e) {
      fail("OPERATE_TYPE_FAILED", e.message);
    }
  }

  function scroll(opts = {}) {
    const direction = opts.direction || "down";
    const distance = Number(opts.distance ?? 800);
    const x = Number(opts.x ?? 540);
    const y = Number(opts.y ?? 1200);
    let x2 = x;
    let y2 = y;
    if (direction === "down") y2 = y + distance;
    else if (direction === "up") y2 = y - distance;
    else if (direction === "left") x2 = x - distance;
    else if (direction === "right") x2 = x + distance;
    runAdb(serial, [
      "shell",
      "input",
      "swipe",
      String(x),
      String(y),
      String(x2),
      String(y2),
      "300",
    ]);
  }

  function screenshot(path) {
    try {
      const abs = resolvePath(path);
      mkdir(dirname(abs), { recursive: true });
      const remote = "/sdcard/sr-shot.png";
      runAdb(serial, ["shell", "screencap", "-p", remote]);
      runAdb(serial, ["pull", remote, abs]);
      runAdb(serial, ["shell", "rm", "-f", remote]);
      return abs;
    } catch (e) {
      fail("OPERATE_SCREENSHOT_FAILED", e.message);
    }
  }

  async function matchImage(templatePath) {
    if (!exists(templatePath)) {
      fail(
        "OPERATE_MATCH_NOT_FOUND",
        `template não encontrado: ${templatePath}`,
      );
    }
    const match =
      deps.matchTemplate ??
      (async () => ({ x: 540, y: 1200, confidence: 1 }));
    const hit = await match(serial, templatePath);
    if (!hit || hit.confidence <= 0) {
      fail("OPERATE_MATCH_NOT_FOUND", `match falhou: ${templatePath}`);
    }
    return hit;
  }

  return { launch, tap, tapElement, type, scroll, screenshot, matchImage };
}

/** @deprecated Preferir handle via createOperate */
export async function launch(serial, pkg, activity) {
  return createOperate(serial).launch(pkg, activity);
}
export function tap(serial, x, y) {
  return createOperate(serial).tap(x, y);
}
export function tapElement(serial, el) {
  return createOperate(serial).tapElement(el);
}
export function typeText(serial, text) {
  return createOperate(serial).type(text);
}
export function key(serial, code) {
  adb(serial, ["shell", "input", "keyevent", String(code)]);
}
export function screenshot(serial, path) {
  return createOperate(serial).screenshot(path);
}
