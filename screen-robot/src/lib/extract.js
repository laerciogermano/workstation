/**
 * EP-05 — extrair lista plana de textos via frame → OCR.
 * Caller: extract({ serial }) — só elementos type "text" (sem ícones/listas/imagens).
 * Cada chamada faz OCR de novo (sem cache). Proibido: uiautomator dump como fonte.
 */
import { adb } from "./adb.js";
import { captureFrame } from "./frame.js";
import { ocrWords } from "./ocr.js";

const REMOTE_DUMP = "/sdcard/sr-window-dump.xml";

/** @deprecated legado eventos EP-02 — não usar para extract */
export function dumpUiXml(serial, deps = {}) {
  const runAdb = deps.adb ?? adb;
  runAdb(serial, ["shell", "uiautomator", "dump", REMOTE_DUMP]);
  const r = runAdb(serial, ["shell", "cat", REMOTE_DUMP]);
  return r.stdout || "";
}

function withCenter(el) {
  const b = el.bounds;
  return {
    ...el,
    center: [Math.floor(b.x + b.w / 2), Math.floor(b.y + b.h / 2)],
  };
}

/**
 * @param {{ serial: string }} cfg
 * @param {object} [deps]
 * @returns {Promise<object[]>}
 */
export async function extract(cfg, deps = {}) {
  const serial = cfg?.serial;
  if (!serial) {
    const err = new Error("extract: falta serial");
    err.code = "EXTRACT_NO_SERIAL";
    throw err;
  }
  const capture = deps.captureFrame
    ? (s, d) => deps.captureFrame(s, d)
    : captureFrame;
  const recognize = deps.ocrRecognize
    ? (p, d) => deps.ocrRecognize(p, d)
    : ocrWords;
  const framePath = await capture(serial, deps);
  const words = await recognize(framePath, deps);
  return words.map((w) =>
    withCenter({ type: "text", text: w.text, bounds: { ...w.bounds } }),
  );
}

/**
 * Lista plana a partir de OCR (piloto LinkedIn / findSignIn).
 * @param {string} serial
 * @param {object} [deps]
 */
export async function extractElements(serial, deps = {}) {
  const capture = deps.captureFrame
    ? (s, d) => deps.captureFrame(s, d)
    : captureFrame;
  const recognize = deps.ocrRecognize
    ? (p, d) => deps.ocrRecognize(p, d)
    : ocrWords;
  const framePath = await capture(serial, deps);
  const words = await recognize(framePath, deps);
  const elements = words.map((w, i) => {
    const b = w.bounds;
    const center = [
      Math.floor(b.x + b.w / 2),
      Math.floor(b.y + b.h / 2),
    ];
    return {
      id: `e${i}`,
      kind: "text",
      label: w.text,
      text: w.text,
      contentDesc: "",
      resourceId: "",
      className: "",
      clickable: true,
      password: false,
      bbox: [b.x, b.y, b.x + b.w, b.y + b.h],
      center,
      source: "ocr",
    };
  });
  return { elements, framePath };
}

const LOGIN_LABELS = [
  "entrar",
  "sign in",
  "log in",
  "login",
  "já tenho uma conta",
  "aceitar e continuar",
];
const LOGIN_FIELD_HINTS = [
  "e-mail",
  "email",
  "usuário",
  "usuario",
  "phone",
  "telefone",
  "senha",
  "password",
];

export function findLoginTarget(elements) {
  const lower = (s) => String(s || "").toLowerCase();
  const loginBtn = elements.find((el) => {
    const t = lower(el.label);
    return el.clickable && LOGIN_LABELS.some((k) => t.includes(k));
  });
  const hasUserField = elements.some((el) => {
    const t = lower(el.label) + " " + lower(el.resourceId);
    return (
      LOGIN_FIELD_HINTS.some((k) => t.includes(k)) ||
      el.className?.includes("EditText")
    );
  });
  const hasPassword = elements.some(
    (el) =>
      el.password ||
      lower(el.label).includes("senha") ||
      lower(el.label).includes("password"),
  );
  return {
    alreadyOnLoginScreen: Boolean(hasUserField && (hasPassword || loginBtn)),
    loginButton: loginBtn || null,
  };
}

export function findEditableFields(elements) {
  const edits = elements.filter(
    (el) =>
      el.className?.includes("EditText") ||
      el.password ||
      /email|e-mail|user|usuário|phone|senha|password/i.test(
        el.label + el.resourceId,
      ),
  );
  const password = edits.find(
    (el) => el.password || /senha|password/i.test(el.label + el.resourceId),
  );
  const user =
    edits.find((el) => el !== password && !el.password) ||
    edits.find((el) =>
      /email|e-mail|user|usuário|phone/i.test(el.label + el.resourceId),
    );
  return { user, password };
}

/**
 * US-23 / SC-29 — busca por texto; encapsula `extractElements` (OCR interno).
 * Caller: `findByText(serial, query)` — **não** passa lista de elementos.
 * Retorno: elementos **lado a lado** cujo texto unido está **contido na string maior** (query).
 *
 * @param {string} serial
 * @param {string} query
 * @param {{ minScore?: number, extractElements?: Function, captureFrame?: Function, ocrRecognize?: Function }} [opts]
 * @returns {Promise<{ elements: object[], score: number, text: string, bounds: object, center: [number, number] } | null>}
 */
export async function findByText(serial, query, opts = {}) {
  const runExtract = opts.extractElements ?? extractElements;
  const { elements } = await runExtract(serial, opts);
  return matchByText(elements, query, opts);
}

/**
 * Match síncrono sobre lista já extraída (uso interno / testes).
 * @param {object[]|object} elementsOrTree
 * @param {string} query
 * @param {{ minScore?: number }} [opts]
 */
export function matchByText(elementsOrTree, query, opts = {}) {
  const minScore = opts.minScore ?? 0.75;
  const q = normalizeText(query);
  if (!q) return null;

  const flat = flattenElements(elementsOrTree).filter((el) => elText(el));
  if (!flat.length) return null;

  /** @type {{ elements: object[], score: number, text: string } | null} */
  let best = null;

  for (const el of flat) {
    const text = normalizeText(elText(el));
    const score = similarity(q, text);
    if (isBetter(best, { elements: [el], score, text })) {
      best = { elements: [el], score, text };
    }
  }

  const ordered = [...flat].sort((a, b) => {
    const ba = elBounds(a);
    const bb = elBounds(b);
    if (Math.abs(ba.y - bb.y) > 12) return ba.y - bb.y;
    return ba.x - bb.x;
  });

  const maxWindow = Math.min(ordered.length, Math.max(8, q.split(" ").length + 2));
  for (let i = 0; i < ordered.length; i++) {
    for (let len = 2; len <= maxWindow && i + len <= ordered.length; len++) {
      const slice = ordered.slice(i, i + len);
      if (!sameLineNeighbors(slice)) continue;
      const text = normalizeText(slice.map(elText).join(" "));
      const score = similarity(q, text);
      if (isBetter(best, { elements: slice, score, text })) {
        best = { elements: slice, score, text };
      }
    }
  }

  if (!best || best.score < minScore) return null;

  const bounds = unionBounds(best.elements.map(elBounds));
  const center = [
    Math.floor(bounds.x + bounds.w / 2),
    Math.floor(bounds.y + bounds.h / 2),
  ];
  return {
    elements: best.elements,
    score: best.score,
    text: best.text,
    bounds,
    center,
  };
}

function elText(el) {
  return String(el?.text ?? el?.label ?? "").trim();
}

function elBounds(el) {
  if (el?.bounds) return { ...el.bounds };
  if (Array.isArray(el?.bbox) && el.bbox.length >= 4) {
    const [x0, y0, x1, y1] = el.bbox;
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  return { x: 0, y: 0, w: 0, h: 0 };
}

function flattenElements(input) {
  if (Array.isArray(input)) {
    const out = [];
    for (const item of input) {
      if (item?.children?.length) out.push(...flattenElements(item));
      else out.push(item);
    }
    return out;
  }
  if (input && typeof input === "object") {
    if (Array.isArray(input.children)) return flattenElements(input.children);
    return [input];
  }
  return [];
}

function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Prefere score maior; empate → texto mais longo (mais cobertura). */
function isBetter(current, next) {
  if (!current) return true;
  if (next.score > current.score + 1e-9) return true;
  if (Math.abs(next.score - current.score) <= 1e-9) {
    return next.text.length > current.text.length;
  }
  return false;
}

/** Similaridade [0,1]: prioriza cobertura do query, não substring curta. */
function similarity(query, candidate) {
  if (!query || !candidate) return 0;
  if (query === candidate) return 1;

  // Elemento contém a frase inteira
  if (candidate.includes(query)) {
    return 0.92 + 0.08 * (query.length / candidate.length);
  }

  // Query contém o candidato: só alto se cobrir boa parte do query
  if (query.includes(candidate)) {
    const coverage = candidate.length / query.length;
    if (coverage < 0.55) return coverage * 0.4;
    return 0.72 + 0.2 * coverage;
  }

  const ta = query.split(" ").filter(Boolean);
  const tb = candidate.split(" ").filter(Boolean);
  if (!ta.length || !tb.length) return levenshteinRatio(query, candidate);

  const setB = new Set(tb);
  let hit = 0;
  for (const t of ta) if (setB.has(t)) hit += 1;
  const coverage = hit / ta.length;
  const precision = hit / tb.length;
  const tokenScore = (2 * hit) / (ta.length + tb.length);
  const ordered =
    tb.length >= 2 && query.includes(candidate) ? 1 : sequenceBonus(ta, tb);
  const lev = levenshteinRatio(query, candidate);
  return Math.max(tokenScore * 0.5 + coverage * 0.35 + precision * 0.15, lev, ordered);
}

/** Bônus se os tokens do candidato aparecem em sequência no query. */
function sequenceBonus(queryTokens, candTokens) {
  if (candTokens.length < 2) return 0;
  const q = queryTokens.join(" ");
  const c = candTokens.join(" ");
  if (q === c) return 1;
  if (q.includes(c)) return 0.85 + 0.15 * (c.length / q.length);
  // janela deslizante de candTokens.length em queryTokens
  for (let i = 0; i + candTokens.length <= queryTokens.length; i++) {
    const slice = queryTokens.slice(i, i + candTokens.length);
    let ok = true;
    for (let j = 0; j < slice.length; j++) {
      if (slice[j] !== candTokens[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return 0.8 + 0.2 * (candTokens.length / queryTokens.length);
  }
  return 0;
}

function levenshteinRatio(a, b) {
  if (a === b) return 1;
  const m = a.length;
  const n = b.length;
  if (!m || !n) return 0;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return 1 - dp[m][n] / Math.max(m, n);
}

function sameLineNeighbors(els) {
  if (els.length < 2) return true;
  const ys = els.map((e) => elBounds(e).y + elBounds(e).h / 2);
  const mid = ys.reduce((a, b) => a + b, 0) / ys.length;
  const maxH = Math.max(...els.map((e) => elBounds(e).h || 20));
  if (ys.some((y) => Math.abs(y - mid) > maxH * 0.9)) return false;
  for (let i = 1; i < els.length; i++) {
    const prev = elBounds(els[i - 1]);
    const cur = elBounds(els[i]);
    if (cur.x + cur.w < prev.x - 8) return false;
    const gap = cur.x - (prev.x + prev.w);
    if (gap > Math.max(prev.w, cur.w, 80) * 2.5) return false;
  }
  return true;
}

function unionBounds(boxes) {
  const x1 = Math.min(...boxes.map((b) => b.x));
  const y1 = Math.min(...boxes.map((b) => b.y));
  const x2 = Math.max(...boxes.map((b) => b.x + b.w));
  const y2 = Math.max(...boxes.map((b) => b.y + b.h));
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}
