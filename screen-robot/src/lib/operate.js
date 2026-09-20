/**
 * EP-04 — operações de tela (internos do handle).
 * Caller: handle.launch / tap / type / scroll / screenshot / matchImage / openScrcpy.
 * type: OCR das teclas no frame → tap por caractere (sem input text / IME).
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { adb, adbOk, connectIfTcp as defaultConnectIfTcp, sleep as defaultSleep } from "./adb.js";
import { captureFrame } from "./frame.js";
import { ocrWords, regionToRectangle } from "./ocr.js";

function fail(code, msg) {
  const err = new Error(msg);
  err.code = code;
  throw err;
}

/**
 * Mapa caractere → center a partir de palavras OCR (teclas = 1 glifo).
 * @param {{ text: string, bounds: { x: number, y: number, w: number, h: number } }[]} words
 * @returns {Map<string, { x: number, y: number }>}
 */
export function buildKeyCenters(words) {
  /** @type {Map<string, { x: number, y: number }>} */
  const map = new Map();
  for (const w of words || []) {
    const t = String(w?.text || "").trim();
    if (!t) continue;
    const chars = [...t];
    if (chars.length !== 1) continue;
    const ch = chars[0];
    const b = w.bounds || { x: 0, y: 0, w: 0, h: 0 };
    const center = {
      x: Math.floor(b.x + b.w / 2),
      y: Math.floor(b.y + b.h / 2),
    };
    map.set(ch, center);
    const lower = ch.toLowerCase();
    const upper = ch.toUpperCase();
    if (!map.has(lower)) map.set(lower, center);
    if (!map.has(upper)) map.set(upper, center);
  }
  return map;
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
  const connectIfTcp = deps.connectIfTcp ?? defaultConnectIfTcp;
  const capture = deps.captureFrame ?? captureFrame;
  const recognize = deps.ocrWords ?? ocrWords;
  const whichScrcpy =
    deps.whichScrcpy ??
    (() => {
      const r = spawnSync("command", ["-v", "scrcpy"], {
        encoding: "utf8",
        shell: true,
      });
      const p = (r.stdout || "").trim();
      return r.status === 0 && p ? p : null;
    });
  const spawnScrcpy =
    deps.spawnScrcpy ??
    ((bin, args, opts) => spawn(bin, args, opts));

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
    const xi = Math.round(Number(x));
    const yi = Math.round(Number(y));
    const maxAttempts = 5;
    let lastErr;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        connectIfTcp(serial);
        // Preferir `cmd input` (mais estável no redroid); fallback `input`.
        try {
          runAdb(serial, ["shell", "cmd", "input", "tap", String(xi), String(yi)]);
        } catch {
          runAdb(serial, ["shell", "input", "tap", String(xi), String(yi)]);
        }
        return;
      } catch (e) {
        lastErr = e;
        const msg = String(e?.message || e);
        if (
          !/Broken pipe|Failure calling service input|device offline|closed|not found/i.test(
            msg,
          )
        ) {
          fail("OPERATE_TAP_FAILED", msg);
        }
        spawnSync("sleep", ["1"]);
      }
    }
    fail(
      "OPERATE_TAP_FAILED",
      `tap(${xi},${yi}) falhou após ${maxAttempts} tentativas: ${lastErr?.message || lastErr}`,
    );
  }

  function tapElement(el) {
    const cx = el?.center?.[0] ?? el?.bounds?.centerX;
    const cy = el?.center?.[1] ?? el?.bounds?.centerY;
    if (cx == null || cy == null) {
      fail("OPERATE_LAUNCH_FAILED", "tapElement: elemento sem center");
    }
    tap(cx, cy);
  }

  /**
   * Digita tocando teclas localizadas por OCR na imagem do teclado.
   * @param {string} text
   * @param {{ region?: { x?: number, y?: number, width?: number, height?: number, w?: number, h?: number }, delayMs?: number }} [opts]
   */
  async function type(text, opts = {}) {
    const s = String(text ?? "");
    if (!s.length) return;
    try {
      const framePath = await capture(serial, deps);
      const rectangle = regionToRectangle(opts.region);
      const words = await recognize(framePath, {
        ...deps,
        rectangle: rectangle || undefined,
        region: opts.region,
      });
      const keys = buildKeyCenters(words);
      const delayMs = Number(opts.delayMs ?? 100);
      for (const ch of s) {
        if (ch === " " || ch === "\n" || ch === "\t") continue;
        const hit =
          keys.get(ch) || keys.get(ch.toLowerCase()) || keys.get(ch.toUpperCase());
        if (!hit) {
          fail(
            "OPERATE_TYPE_FAILED",
            `tecla "${ch}" não encontrada no OCR do teclado` +
              (rectangle
                ? ` (região ${rectangle.left},${rectangle.top} ${rectangle.width}x${rectangle.height})`
                : ""),
          );
        }
        tap(hit.x, hit.y);
        if (delayMs > 0) await sleep(delayMs);
      }
    } catch (e) {
      if (e?.code === "OPERATE_TYPE_FAILED" || e?.code === "OPERATE_TAP_FAILED") throw e;
      fail("OPERATE_TYPE_FAILED", e.message || String(e));
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

  /**
   * Abre scrcpy no serial do handle (US-21 / SC-27).
   * @param {{ title?: string, detached?: boolean, extraArgs?: string[] }} [opts]
   * @returns {{ pid: number, serial: string }}
   */
  function openScrcpy(opts = {}) {
    const bin = whichScrcpy();
    if (!bin) {
      fail(
        "OPERATE_SCRCPY_FAILED",
        "scrcpy não encontrado no PATH (brew install scrcpy)",
      );
    }
    try {
      connectIfTcp(serial);
    } catch {
      /* connect best-effort */
    }
    const title = opts.title || `screen-robot ${serial}`;
    const args = [
      "-s",
      serial,
      "--no-audio",
      "--keyboard=sdk",
      "--window-title",
      title,
      ...(opts.extraArgs || []),
    ];
    const detached = opts.detached !== false;
    try {
      const child = spawnScrcpy(bin, args, {
        detached,
        stdio: "ignore",
      });
      if (detached && typeof child.unref === "function") child.unref();
      if (child.pid == null) {
        fail("OPERATE_SCRCPY_FAILED", "scrcpy não iniciou (sem pid)");
      }
      return { pid: child.pid, serial };
    } catch (e) {
      fail("OPERATE_SCRCPY_FAILED", e.message || String(e));
    }
  }

  return {
    launch,
    tap,
    tapElement,
    type,
    scroll,
    screenshot,
    matchImage,
    openScrcpy,
  };
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
export async function typeText(serial, text, opts) {
  return createOperate(serial).type(text, opts);
}
export function key(serial, code) {
  adb(serial, ["shell", "input", "keyevent", String(code)]);
}
export function screenshot(serial, path) {
  return createOperate(serial).screenshot(path);
}
