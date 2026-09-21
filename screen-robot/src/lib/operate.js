/**
 * EP-04 — operações de tela (funções puras com `serial` no cfg).
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

function requireSerial(cfg) {
  const serial = cfg?.serial;
  if (!serial) fail("OPERATE_NO_SERIAL", "falta serial");
  return serial;
}

function resolveDeps(deps = {}) {
  return {
    runAdb: deps.adb ?? adb,
    runAdbOk: deps.adbOk ?? adbOk,
    sleep: deps.sleep ?? defaultSleep,
    exists: deps.existsSync ?? existsSync,
    mkdir: deps.mkdirSync ?? mkdirSync,
    resolvePath: deps.resolve ?? resolve,
    connectIfTcp: deps.connectIfTcp ?? defaultConnectIfTcp,
    capture: deps.captureFrame ?? captureFrame,
    recognize: deps.ocrWords ?? ocrWords,
    whichScrcpy:
      deps.whichScrcpy ??
      (() => {
        const r = spawnSync("command", ["-v", "scrcpy"], {
          encoding: "utf8",
          shell: true,
        });
        const p = (r.stdout || "").trim();
        return r.status === 0 && p ? p : null;
      }),
    spawnScrcpy:
      deps.spawnScrcpy ??
      ((bin, args, opts) => spawn(bin, args, opts)),
    matchTemplate: deps.matchTemplate,
    deps,
  };
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
 * @param {{ serial: string, package?: string, pkg?: string, activity?: string }} cfg
 * @param {object} [deps]
 */
export async function launch(cfg, deps = {}) {
  const serial = requireSerial(cfg);
  const d = resolveDeps(deps);
  const pkg = cfg.package ?? cfg.pkg;
  if (!pkg) fail("OPERATE_LAUNCH_FAILED", "launch: falta package");
  const activity = cfg.activity;

  try {
    let component =
      activity == null
        ? null
        : String(activity).includes("/")
          ? String(activity)
          : `${pkg}/${activity}`;
    if (!component) {
      try {
        const resolved = d.runAdb(serial, [
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
      d.runAdb(serial, ["shell", "am", "start", "-n", component]);
    } else {
      d.runAdb(serial, [
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
    d.runAdbOk(serial, [
      "shell",
      "monkey",
      "-p",
      pkg,
      "-c",
      "android.intent.category.LAUNCHER",
      "1",
    ]);
    await d.sleep(1_500);
    if (!d.runAdbOk(serial, ["shell", "pidof", pkg])) {
      fail(
        "OPERATE_LAUNCH_FAILED",
        `launch falhou para ${pkg}: ${e.message}`,
      );
    }
  }
  await d.sleep(2_000);
}

/**
 * @param {{ serial: string, x: number, y: number }} cfg
 * @param {object} [deps]
 */
export function tap(cfg, deps = {}) {
  const serial = requireSerial(cfg);
  const d = resolveDeps(deps);
  const xi = Math.round(Number(cfg.x));
  const yi = Math.round(Number(cfg.y));
  const maxAttempts = 5;
  let lastErr;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      d.connectIfTcp(serial);
      // Preferir `cmd input` (mais estável no redroid); fallback `input`.
      try {
        d.runAdb(serial, ["shell", "cmd", "input", "tap", String(xi), String(yi)]);
      } catch {
        d.runAdb(serial, ["shell", "input", "tap", String(xi), String(yi)]);
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

/**
 * @param {{ serial: string, center?: [number, number], bounds?: object }} cfg
 * @param {object} [deps]
 */
export function tapElement(cfg, deps = {}) {
  const cx = cfg?.center?.[0] ?? cfg?.bounds?.centerX;
  const cy = cfg?.center?.[1] ?? cfg?.bounds?.centerY;
  if (cx == null || cy == null) {
    fail("OPERATE_LAUNCH_FAILED", "tapElement: elemento sem center");
  }
  tap({ serial: requireSerial(cfg), x: cx, y: cy }, deps);
}

/**
 * Digita tocando teclas localizadas por OCR na imagem do teclado.
 * @param {{ serial: string, text: string, region?: object, delayMs?: number }} cfg
 * @param {object} [deps]
 */
export async function type(cfg, deps = {}) {
  const serial = requireSerial(cfg);
  const d = resolveDeps(deps);
  const s = String(cfg.text ?? "");
  if (!s.length) return;
  try {
    const framePath = await d.capture(serial, d.deps);
    const rectangle = regionToRectangle(cfg.region);
    const words = await d.recognize(framePath, {
      ...d.deps,
      rectangle: rectangle || undefined,
      region: cfg.region,
    });
    const keys = buildKeyCenters(words);
    const delayMs = Number(cfg.delayMs ?? 100);
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
      tap({ serial, x: hit.x, y: hit.y }, deps);
      if (delayMs > 0) await d.sleep(delayMs);
    }
  } catch (e) {
    if (e?.code === "OPERATE_TYPE_FAILED" || e?.code === "OPERATE_TAP_FAILED") throw e;
    fail("OPERATE_TYPE_FAILED", e.message || String(e));
  }
}

/**
 * @param {{ serial: string, direction?: string, distance?: number, x?: number, y?: number }} cfg
 * @param {object} [deps]
 */
export function scroll(cfg, deps = {}) {
  const serial = requireSerial(cfg);
  const d = resolveDeps(deps);
  const direction = cfg.direction || "down";
  const distance = Number(cfg.distance ?? 800);
  const x = Number(cfg.x ?? 540);
  const y = Number(cfg.y ?? 1200);
  let x2 = x;
  let y2 = y;
  if (direction === "down") y2 = y + distance;
  else if (direction === "up") y2 = y - distance;
  else if (direction === "left") x2 = x - distance;
  else if (direction === "right") x2 = x + distance;
  d.runAdb(serial, [
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

/**
 * @param {{ serial: string, path: string }} cfg
 * @param {object} [deps]
 */
export function screenshot(cfg, deps = {}) {
  const serial = requireSerial(cfg);
  const d = resolveDeps(deps);
  const path = cfg.path;
  if (!path) fail("OPERATE_SCREENSHOT_FAILED", "screenshot: falta path");
  try {
    const abs = d.resolvePath(path);
    d.mkdir(dirname(abs), { recursive: true });
    const remote = "/sdcard/sr-shot.png";
    d.runAdb(serial, ["shell", "screencap", "-p", remote]);
    d.runAdb(serial, ["pull", remote, abs]);
    d.runAdb(serial, ["shell", "rm", "-f", remote]);
    return abs;
  } catch (e) {
    if (e?.code === "OPERATE_SCREENSHOT_FAILED") throw e;
    fail("OPERATE_SCREENSHOT_FAILED", e.message);
  }
}

/**
 * @param {{ serial: string, templatePath: string }} cfg
 * @param {object} [deps]
 */
export async function matchImage(cfg, deps = {}) {
  const serial = requireSerial(cfg);
  const d = resolveDeps(deps);
  const templatePath = cfg.templatePath;
  if (!d.exists(templatePath)) {
    fail(
      "OPERATE_MATCH_NOT_FOUND",
      `template não encontrado: ${templatePath}`,
    );
  }
  const match =
    d.matchTemplate ??
    (async () => ({ x: 540, y: 1200, confidence: 1 }));
  const hit = await match(serial, templatePath);
  if (!hit || hit.confidence <= 0) {
    fail("OPERATE_MATCH_NOT_FOUND", `match falhou: ${templatePath}`);
  }
  return hit;
}

/**
 * Abre scrcpy no serial (US-21 / SC-27).
 * @param {{ serial: string, title?: string, detached?: boolean, extraArgs?: string[] }} cfg
 * @param {object} [deps]
 * @returns {{ pid: number, serial: string }}
 */
export function openScrcpy(cfg, deps = {}) {
  const serial = requireSerial(cfg);
  const d = resolveDeps(deps);
  const bin = d.whichScrcpy();
  if (!bin) {
    fail(
      "OPERATE_SCRCPY_FAILED",
      "scrcpy não encontrado no PATH (brew install scrcpy)",
    );
  }
  try {
    d.connectIfTcp(serial);
  } catch {
    /* connect best-effort */
  }
  const title = cfg.title || `screen-robot ${serial}`;
  const args = [
    "-s",
    serial,
    "--no-audio",
    "--keyboard=sdk",
    "--window-title",
    title,
    ...(cfg.extraArgs || []),
  ];
  const detached = cfg.detached !== false;
  try {
    const child = d.spawnScrcpy(bin, args, {
      detached,
      stdio: "ignore",
    });
    if (detached && typeof child.unref === "function") child.unref();
    if (child.pid == null) {
      fail("OPERATE_SCRCPY_FAILED", "scrcpy não iniciou (sem pid)");
    }
    return { pid: child.pid, serial };
  } catch (e) {
    if (e?.code === "OPERATE_SCRCPY_FAILED") throw e;
    fail("OPERATE_SCRCPY_FAILED", e.message || String(e));
  }
}

/**
 * @param {{ serial: string, code: string|number }} cfg
 * @param {object} [deps]
 */
export function key(cfg, deps = {}) {
  const serial = requireSerial(cfg);
  const d = resolveDeps(deps);
  d.runAdb(serial, ["shell", "input", "keyevent", String(cfg.code)]);
}
