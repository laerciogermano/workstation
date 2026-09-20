/**
 * EP-05 — extrair árvore DOM progressiva (internos do handle).
 * Caller: handle.extract() — cada chamada enriquece a árvore.
 */
import { adb } from "./adb.js";

const REMOTE_DUMP = "/sdcard/sr-window-dump.xml";

export function dumpUiXml(serial, deps = {}) {
  const runAdb = deps.adb ?? adb;
  runAdb(serial, ["shell", "uiautomator", "dump", REMOTE_DUMP]);
  const r = runAdb(serial, ["shell", "cat", REMOTE_DUMP]);
  return r.stdout || "";
}

function parseBoundsAttr(s) {
  const m = String(s).match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!m) return null;
  const x1 = Number(m[1]);
  const y1 = Number(m[2]);
  const x2 = Number(m[3]);
  const y2 = Number(m[4]);
  return {
    x: x1,
    y: y1,
    w: x2 - x1,
    h: y2 - y1,
    center: [Math.floor((x1 + x2) / 2), Math.floor((y1 + y2) / 2)],
    bbox: [x1, y1, x2, y2],
  };
}

function getAttr(attrs, name) {
  const a = attrs.match(new RegExp(`${name}="([^"]*)"`));
  return a ? a[1] : "";
}

function parseFlatNodes(xml) {
  const nodes = [];
  const re = /<node\b([^>]*)\/?>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const attrs = m[1];
    const text = getAttr(attrs, "text");
    const desc = getAttr(attrs, "content-desc");
    const res = getAttr(attrs, "resource-id");
    const clazz = getAttr(attrs, "class");
    const clickable = getAttr(attrs, "clickable") === "true";
    const password = getAttr(attrs, "password") === "true";
    const bounds = parseBoundsAttr(getAttr(attrs, "bounds"));
    nodes.push({ text, desc, res, clazz, clickable, password, bounds });
  }
  return nodes;
}

function boundsOf(n) {
  if (!n.bounds) return undefined;
  return { x: n.bounds.x, y: n.bounds.y, w: n.bounds.w, h: n.bounds.h };
}

function classifyVisual(n) {
  const c = (n.clazz || "").toLowerCase();
  if (
    (c.includes("imagebutton") || (c.includes("button") && !n.text)) &&
    !n.text &&
    (n.desc || n.res)
  )
    return "icon";
  if (c.includes("image") || c.includes("imageview")) return "image";
  if (c.includes("recyclerview") || c.includes("listview") || c.includes("scrollview"))
    return "list";
  if (n.text) return "text";
  return "other";
}

/**
 * @param {string} serial
 * @param {object} [deps]
 */
export function createExtract(serial, deps = {}) {
  const dump = deps.dumpUiXml ?? ((s) => dumpUiXml(s, deps));
  /** @type {number} */
  let step = 0;
  /** @type {object|null} */
  let tree = null;

  function ensureRoot(xml) {
    if (!tree) {
      tree = {
        type: "root",
        bounds: { x: 0, y: 0, w: 1080, h: 2400 },
        children: [],
        _xml: xml,
      };
    }
    tree._xml = xml;
  }

  function stepTexts(nodes) {
    tree.children = nodes
      .filter((n) => n.text)
      .map((n) => ({
        type: "text",
        text: n.text,
        bounds: boundsOf(n),
        children: [],
      }));
  }

  function stepHierarchy(nodes) {
    const texts = nodes.filter((n) => n.text);
    const others = nodes.filter((n) => !n.text && n.bounds);
    const container = {
      type: "other",
      bounds: tree.bounds,
      children: [
        ...others.slice(0, 3).map((n) => ({
          type: "other",
          bounds: boundsOf(n),
          children: [],
        })),
        ...texts.map((n) => ({
          type: "text",
          text: n.text,
          bounds: boundsOf(n),
          children: [],
        })),
      ],
    };
    tree.children = [container];
  }

  function mergeTyped(nodes, type) {
    const hits = nodes.filter((n) => classifyVisual(n) === type);
    const add = hits.map((n) => ({
      type,
      text: n.text || undefined,
      bounds: boundsOf(n),
      children: [],
    }));
    if (tree.children.length === 1 && tree.children[0].type === "other") {
      tree.children[0].children.push(...add);
    } else {
      tree.children.push(...add);
    }
  }

  return async function extract() {
    const xml = dump(serial);
    const nodes = parseFlatNodes(xml);
    ensureRoot(xml);
    step += 1;
    if (step === 1) stepTexts(nodes);
    else if (step === 2) stepHierarchy(nodes);
    else if (step === 3) mergeTyped(nodes, "icon");
    else if (step === 4) mergeTyped(nodes, "list");
    else mergeTyped(nodes, "image");

    const { _xml, ...pub } = tree;
    return structuredClone(pub);
  };
}

/** Legado — lista plana (piloto LinkedIn). */
export function extractElements(serial) {
  const xml = dumpUiXml(serial);
  const elements = [];
  const re = /<node\b([^>]*)\/?>/g;
  let m;
  let i = 0;
  while ((m = re.exec(xml)) !== null) {
    const attrs = m[1];
    const text = getAttr(attrs, "text");
    const desc = getAttr(attrs, "content-desc");
    const res = getAttr(attrs, "resource-id");
    const clazz = getAttr(attrs, "class");
    const clickable = getAttr(attrs, "clickable") === "true";
    const password = getAttr(attrs, "password") === "true";
    const b = parseBoundsAttr(getAttr(attrs, "bounds"));
    if (!b && !text && !desc && !res) continue;
    const label = text || desc || res || clazz || "";
    elements.push({
      id: `e${i++}`,
      kind: password ? "password" : clickable ? "button" : text ? "text" : "node",
      label,
      text,
      contentDesc: desc,
      resourceId: res,
      className: clazz,
      clickable,
      password,
      ...(b
        ? { bbox: b.bbox, center: b.center }
        : {}),
      source: "uiautomator",
    });
  }
  return { elements, xml };
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
