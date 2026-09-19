/**
 * Extrair elementos e informações da tela (uiautomator dump).
 */
import { adb } from "./adb.js";

const REMOTE_DUMP = "/sdcard/sr-window-dump.xml";

export function dumpUiXml(serial) {
  adb(serial, ["shell", "uiautomator", "dump", REMOTE_DUMP]);
  const r = adb(serial, ["shell", "cat", REMOTE_DUMP]);
  return r.stdout || "";
}

function parseBounds(s) {
  // [x1,y1][x2,y2]
  const m = String(s).match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!m) return null;
  const x1 = Number(m[1]);
  const y1 = Number(m[2]);
  const x2 = Number(m[3]);
  const y2 = Number(m[4]);
  return {
    bbox: [x1, y1, x2, y2],
    center: [Math.floor((x1 + x2) / 2), Math.floor((y1 + y2) / 2)],
  };
}

/**
 * @returns {{ elements: Array, xml: string }}
 */
export function extractElements(serial) {
  const xml = dumpUiXml(serial);
  const elements = [];
  const re =
    /<node\b([^>]*)\/?>/g;
  let m;
  let i = 0;
  while ((m = re.exec(xml)) !== null) {
    const attrs = m[1];
    const get = (name) => {
      const a = attrs.match(new RegExp(`${name}="([^"]*)"`));
      return a ? a[1] : "";
    };
    const text = get("text");
    const desc = get("content-desc");
    const res = get("resource-id");
    const clazz = get("class");
    const clickable = get("clickable") === "true";
    const password = get("password") === "true";
    const bounds = parseBounds(get("bounds"));
    if (!bounds && !text && !desc && !res) continue;
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
      ...(bounds || {}),
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

const LOGIN_FIELD_HINTS = ["e-mail", "email", "usuário", "usuario", "phone", "telefone", "senha", "password"];

export function findLoginTarget(elements) {
  const lower = (s) => String(s || "").toLowerCase();

  const loginBtn = elements.find((el) => {
    const t = lower(el.label);
    return el.clickable && LOGIN_LABELS.some((k) => t.includes(k));
  });

  const hasUserField = elements.some((el) => {
    const t = lower(el.label) + " " + lower(el.resourceId);
    return LOGIN_FIELD_HINTS.some((k) => t.includes(k)) || el.className?.includes("EditText");
  });
  const hasPassword = elements.some((el) => el.password || lower(el.label).includes("senha") || lower(el.label).includes("password"));

  const alreadyOnLogin = hasUserField && (hasPassword || hasUserField);

  return {
    alreadyOnLoginScreen: Boolean(alreadyOnLogin && (hasPassword || loginBtn)),
    loginButton: loginBtn || null,
  };
}

export function findEditableFields(elements) {
  const edits = elements.filter(
    (el) =>
      el.className?.includes("EditText") ||
      el.password ||
      /email|e-mail|user|usuário|phone|senha|password/i.test(el.label + el.resourceId),
  );
  const password = edits.find((el) => el.password || /senha|password/i.test(el.label + el.resourceId));
  const user =
    edits.find((el) => el !== password && !el.password) ||
    edits.find((el) => /email|e-mail|user|usuário|phone/i.test(el.label + el.resourceId));
  return { user, password };
}
