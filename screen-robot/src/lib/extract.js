/**
 * EP-05 — extrair árvore DOM progressiva via frame → OCR/visão.
 * Caller: handle.extract() — cada chamada enriquece a árvore.
 * Proibido: uiautomator dump como fonte da árvore.
 */
import { adb } from "./adb.js";
import { captureFrame } from "./frame.js";
import { ocrWords } from "./ocr.js";
import { detectIcons, detectImages, detectLists } from "./vision.js";

const REMOTE_DUMP = "/sdcard/sr-window-dump.xml";

/** @deprecated legado eventos EP-02 — não usar para árvore DOM */
export function dumpUiXml(serial, deps = {}) {
  const runAdb = deps.adb ?? adb;
  runAdb(serial, ["shell", "uiautomator", "dump", REMOTE_DUMP]);
  const r = runAdb(serial, ["shell", "cat", REMOTE_DUMP]);
  return r.stdout || "";
}

/**
 * @param {string} serial
 * @param {object} [deps]
 */
export function createExtract(serial, deps = {}) {
  /** @type {number} */
  let step = 0;
  /** @type {object|null} */
  let tree = null;
  /** @type {import("./ocr.js").OcrWord[]|null} */
  let wordsCache = null;
  /** @type {{ w: number, h: number }|null} */
  let frameSize = null;
  /** @type {string|null} */
  let framePath = null;

  async function ensurePerception() {
    if (wordsCache && frameSize && framePath) return;
    const capture = deps.captureFrame
      ? (s, d) => deps.captureFrame(s, d)
      : captureFrame;
    const recognize = deps.ocrRecognize
      ? (p, d) => deps.ocrRecognize(p, d)
      : ocrWords;
    framePath = await capture(serial, deps);
    wordsCache = await recognize(framePath, deps);
    let maxX = 1080;
    let maxY = 2400;
    for (const w of wordsCache) {
      maxX = Math.max(maxX, w.bounds.x + w.bounds.w);
      maxY = Math.max(maxY, w.bounds.y + w.bounds.h);
    }
    if (deps.frameSize) {
      frameSize = deps.frameSize;
    } else {
      frameSize = { w: maxX, h: maxY };
    }
    if (!tree) {
      tree = {
        type: "root",
        bounds: { x: 0, y: 0, w: frameSize.w, h: frameSize.h },
        children: [],
        _frame: framePath,
      };
    }
  }

  function stepTexts() {
    tree.children = wordsCache.map((w) => ({
      type: "text",
      text: w.text,
      bounds: { ...w.bounds },
      children: [],
    }));
  }

  function stepHierarchy() {
    const container = {
      type: "other",
      bounds: { ...tree.bounds },
      children: wordsCache.map((w) => ({
        type: "text",
        text: w.text,
        bounds: { ...w.bounds },
        children: [],
      })),
    };
    tree.children = [container];
  }

  function mergeNodes(nodes) {
    if (!nodes.length) return;
    if (tree.children.length === 1 && tree.children[0].type === "other") {
      tree.children[0].children.push(...nodes);
    } else {
      tree.children.push(...nodes);
    }
  }

  return async function extract() {
    await ensurePerception();
    step += 1;
    if (step === 1) stepTexts();
    else if (step === 2) stepHierarchy();
    else if (step === 3) mergeNodes(detectIcons(wordsCache, frameSize));
    else if (step === 4) mergeNodes(detectLists(wordsCache));
    else mergeNodes(detectImages(wordsCache, frameSize));

    const { _frame, ...pub } = tree;
    return structuredClone(pub);
  };
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
