/**
 * EP-04 — operações de tela (funções puras com `serial` no cfg).
 * type: default `adb shell input text`; `method: "ocr"` → OCR das teclas → tap.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { adb, adbOk, connectIfTcp as defaultConnectIfTcp, sleep as defaultSleep } from "./adb.js";
import { captureFrame } from "./frame.js";
import { ocrWords, regionToRectangle } from "./ocr.js";
import { ocrWordsMacosVision } from "./ocr-macos-vision.js";
import { ocrWordsRapidocr } from "./ocr-rapidocr.js";

const OCR_ENGINES = {
  tesseract: ocrWords,
  "macos-vision": ocrWordsMacosVision,
  rapidocr: ocrWordsRapidocr,
};

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
    const b = w.bounds || { x: 0, y: 0, w: 0, h: 0 };
    if (chars.length === 1) {
      const ch = chars[0];
      const center = {
        x: Math.floor(b.x + b.w / 2),
        y: Math.floor(b.y + b.h / 2),
      };
      map.set(ch, center);
      const lower = ch.toLowerCase();
      const upper = ch.toUpperCase();
      if (!map.has(lower)) map.set(lower, center);
      if (!map.has(upper)) map.set(upper, center);
    } else {
      const clean = t.replace(/[^a-zA-Z]/g, "").toUpperCase();
      const isRow1 = clean.length >= 4 && /^[QWERTYUIOP]+$/.test(clean);
      const isRow2 = clean.length >= 4 && /^[ASDFGHJKL]+$/.test(clean);
      const isRow3 = clean.length >= 4 && /^[ZXCVBNM]+$/.test(clean);
      if (isRow1 || isRow2 || isRow3) {
        const step = b.w / clean.length;
        [...clean].forEach((c, i) => {
          const center = {
            x: Math.floor(b.x + step * (i + 0.5)),
            y: Math.floor(b.y + b.h / 2),
          };
          map.set(c, center);
          map.set(c.toLowerCase(), center);
        });
      }
    }
  }
  return fillMissingKeyCenters(map);
}

const QWERTY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

/**
 * Completa teclas ausentes na linha QWERTY (ex. RapidOCR some com "o")
 * interpolando x entre vizinhas conhecidas.
 * @param {Map<string, { x: number, y: number }>} map
 * @returns {Map<string, { x: number, y: number }>}
 */
export function fillMissingKeyCenters(map) {
  const out = new Map(map);
  for (const row of QWERTY_ROWS) {
    const known = [];
    for (let i = 0; i < row.length; i++) {
      const hit = out.get(row[i]) || out.get(row[i].toUpperCase());
      if (hit) known.push({ i, x: hit.x, y: hit.y });
    }
    if (known.length < 2) continue;
    const a = known[0];
    const b = known[known.length - 1];
    const di = b.i - a.i || 1;
    const dx = (b.x - a.x) / di;
    const y = Math.round(known.reduce((s, k) => s + k.y, 0) / known.length);
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (out.has(ch) || out.has(ch.toUpperCase())) continue;
      const center = { x: Math.round(a.x + dx * (i - a.i)), y };
      out.set(ch, center);
      out.set(ch.toUpperCase(), center);
    }
  }
  return out;
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
 * @param {{ serial: string, package: string }} cfg
 * @param {object} [deps]
 */
export function stop(cfg, deps = {}) {
  const serial = requireSerial(cfg);
  const d = resolveDeps(deps);
  const pkg = cfg.package;
  if (!pkg) fail("OPERATE_STOP_FAILED", "stop: falta package");
  d.runAdb(serial, ["shell", "am", "force-stop", pkg]);
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
      // Preferir `input tap` (AVD Play: `cmd input` pode sair 0 sem tocar).
      // Fallback `cmd input` para redroid/outros.
      try {
        d.runAdb(serial, ["shell", "input", "tap", String(xi), String(yi)]);
      } catch {
        d.runAdb(serial, ["shell", "cmd", "input", "tap", String(xi), String(yi)]);
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
 * Toque no ponto do elemento OCR (`x`,`y`).
 * @param {{ serial: string, x: number, y: number }} cfg
 * @param {object} [deps]
 */
export function tapElement(cfg, deps = {}) {
  const xi = cfg?.x;
  const yi = cfg?.y;
  if (xi == null || yi == null || Number.isNaN(Number(xi)) || Number.isNaN(Number(yi))) {
    fail("OPERATE_TAP_FAILED", "tapElement: falta x,y");
  }
  tap({ serial: requireSerial(cfg), x: xi, y: yi }, deps);
}

/**
 * Injeta texto via `adb shell input text` (espaços → `%s`).
 * @param {string} serial
 * @param {string} text
 * @param {object} [deps]
 */
export function typeViaAdb(serial, text, deps = {}) {
  const d = resolveDeps(deps);
  try {
    d.connectIfTcp(serial);
    const escaped = String(text).replace(/ /g, "%s");
    try {
      d.runAdb(serial, ["shell", "input", "text", escaped]);
    } catch {
      d.runAdb(serial, ["shell", "cmd", "input", "text", escaped]);
    }
  } catch (e) {
    fail("OPERATE_TYPE_FAILED", e.message || String(e));
  }
}

/**
 * Digita texto no campo focado.
 * - `method: "adb"` (default): `adb shell input text` (sem tap no teclado)
 * - `method: "ocr"`: OCR das teclas + tap por caractere
 * @param {{ serial: string, text: string, method?: "ocr"|"adb", region?: object, delayMs?: number, engine?: string }} cfg
 * @param {object} [deps]
 */
export async function type(cfg, deps = {}) {
  const serial = requireSerial(cfg);
  const d = resolveDeps(deps);
  const s = String(cfg.text ?? "");
  if (!s.length) return;
  const method = String(cfg.method || "adb").toLowerCase() === "ocr" ? "ocr" : "adb";
  if (method === "adb") {
    typeViaAdb(serial, s, deps);
    return;
  }
  try {
    const framePath = await d.capture(serial, d.deps);
    const rectangle = regionToRectangle(cfg.region);
    const engine = cfg.engine || d.deps?.engine;
    const recognizeFn = (engine && OCR_ENGINES[engine]) || d.recognize;
    const words = await recognizeFn(framePath, {
      ...d.deps,
      rectangle: rectangle || undefined,
      region: cfg.region,
    });
    const keys = buildKeyCenters(words);
    const delayMs = Number(cfg.delayMs ?? 100);
    /** @type {{ ch: string, x: number, y: number }[]} */
    const taps = [];
    for (const ch of s) {
      if (ch === "\n" || ch === "\t") continue;
      if (ch === " ") {
        const spaceHit = keys.get(" ") || { x: 270, y: 845 };
        taps.push({ ch: " ", x: spaceHit.x, y: spaceHit.y });
        continue;
      }
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
      taps.push({ ch, x: hit.x, y: hit.y });
    }
    for (const t of taps) {
      tap({ serial, x: t.x, y: t.y }, deps);
      if (delayMs > 0) await d.sleep(delayMs);
    }
  } catch (e) {
    if (e?.code === "OPERATE_TYPE_FAILED" || e?.code === "OPERATE_TAP_FAILED") throw e;
    fail("OPERATE_TYPE_FAILED", e.message || String(e));
  }
}

function readWmSize(serial, runAdb) {
  try {
    const r = runAdb(serial, ["shell", "wm", "size"]);
    const m = String(r?.stdout || "").match(/(\d+)x(\d+)/);
    if (m) return { w: Number(m[1]), h: Number(m[2]) };
  } catch {
    /* default */
  }
  return { w: 720, h: 1280 };
}

/**
 * @param {{ serial: string, direction?: string, distance?: number, x?: number, y?: number }} cfg
 * @param {object} [deps]
 */
export function scroll(cfg, deps = {}) {
  const serial = requireSerial(cfg);
  const d = resolveDeps(deps);
  const needSize = cfg.x == null || cfg.y == null || cfg.distance == null;
  const size = needSize ? readWmSize(serial, d.runAdb) : { w: 720, h: 1280 };
  const direction = cfg.direction || "down";
  const distance = Number(cfg.distance ?? Math.floor(size.h * 0.35));
  const x = Number(cfg.x ?? Math.floor(size.w / 2));
  const y = Number(cfg.y ?? Math.floor(size.h * 0.62));
  let x2 = x;
  let y2 = y;
  // down = ver itens abaixo = dedo sobe (y diminui). Default antigo y+=distance
  // saía da tela (y=1200 em AVD 720×1280) e a lista People não andava.
  if (direction === "down") y2 = Math.max(0, y - distance);
  else if (direction === "up") y2 = y + distance;
  else if (direction === "left") x2 = Math.max(0, x - distance);
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
    const r = spawnSync(
      "adb",
      ["-s", serial, "exec-out", "screencap", "-p"],
      { encoding: null, maxBuffer: 32 * 1024 * 1024 },
    );
    if (r.status === 0 && r.stdout?.length && r.stdout[0] === 0x89) {
      writeFileSync(abs, r.stdout);
      return abs;
    }
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
