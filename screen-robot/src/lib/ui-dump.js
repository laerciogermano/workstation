/**
 * uiautomator dump → texto/coords (alternativa ao OCR quando a árvore expõe o node).
 * findByText / waitForText tentam dump primeiro (SCREEN_ROBOT_UIDUMP≠0).
 * Passar opts.dumpUiXml(serial) quando serial (evita ciclo com extract.js).
 */

function decodeXmlText(raw) {
  return String(raw || "")
    .replace(/&#10;/g, "\n")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a, b) {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (nb.includes(na) || na.includes(nb)) {
    const shorter = Math.min(na.length, nb.length);
    const longer = Math.max(na.length, nb.length);
    return shorter / longer;
  }
  // token overlap simples
  const ta = new Set(na.split(" ").filter(Boolean));
  const tb = nb.split(" ").filter(Boolean);
  if (!ta.size || !tb.length) return 0;
  let hit = 0;
  for (const t of tb) if (ta.has(t)) hit += 1;
  return hit / Math.max(ta.size, tb.length);
}

/**
 * @param {string} nodeTag
 * @returns {{ text: string, x: number, y: number, w: number, h: number, resourceId: string, contentDesc: string, clickable: boolean }|null}
 */
export function parseUiNode(nodeTag) {
  const n = String(nodeTag || "");
  const text = decodeXmlText((n.match(/\btext="([^"]*)"/) || [])[1] || "");
  const contentDesc = decodeXmlText(
    (n.match(/content-desc="([^"]*)"/) || [])[1] || "",
  );
  const resourceId = (
    (n.match(/resource-id="([^"]*)"/) || [])[1] || ""
  )
    .split("/")
    .pop();
  const b = n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
  if (!b) return null;
  const x1 = Number(b[1]);
  const y1 = Number(b[2]);
  const x2 = Number(b[3]);
  const y2 = Number(b[4]);
  const label = text || contentDesc;
  if (!label) return null;
  const w = x2 - x1;
  const h = y2 - y1;
  if (h > 400 && w > 400 && !text) return null;
  return {
    text: label,
    x: Math.round((x1 + x2) / 2),
    y: Math.round((y1 + y2) / 2),
    w,
    h,
    resourceId,
    contentDesc,
    clickable: /clickable="true"/.test(n),
  };
}

/**
 * @param {string} xml
 * @returns {{ text: string, x: number, y: number, bounds: { x: number, y: number, w: number, h: number }, resourceId?: string }[]}
 */
export function elementsFromUiXml(xml) {
  /** @type {ReturnType<typeof parseUiNode>[]} */
  const raw = [];
  for (const n of String(xml || "").match(/<node\b[^>]*>/g) || []) {
    const node = parseUiNode(n);
    if (node) raw.push(node);
  }
  const seen = new Set();
  /** @type {{ text: string, x: number, y: number, bounds: object, resourceId?: string }[]} */
  const out = [];
  for (const node of raw) {
    const key = `${node.text}|${node.y}|${node.x}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      text: node.text,
      x: node.x,
      y: node.y,
      bounds: {
        x: node.x - Math.round(node.w / 2),
        y: node.y - Math.round(node.h / 2),
        w: node.w,
        h: node.h,
      },
      resourceId: node.resourceId || undefined,
    });
  }
  out.sort((a, b) => a.y - b.y || a.x - b.x);
  return out;
}

/** Dump fresco + elements. */
export function dumpElements(serial, deps = {}) {
  const xml = dumpUiXml(serial, deps);
  return { xml, elements: elementsFromUiXml(xml) };
}

/**
 * Match por texto no dump (mesmo shape de findByText OCR).
 * @param {string} serialOrXml serial device OU xml já dumpado
 * @param {string|string[]} query
 */
export function findByTextInUiDump(serialOrXml, query, opts = {}) {
  const minScore = opts.minScore ?? 0.75;
  const queries = (Array.isArray(query) ? query : [query])
    .map((q) => String(q ?? "").trim())
    .filter(Boolean);
  if (!queries.length) return null;

  let elements = opts.elements;
  if (!elements) {
    const raw = String(serialOrXml || "");
    const xml = raw.includes("<node") ? raw : dumpUiXml(serialOrXml, opts);
    elements = elementsFromUiXml(xml);
  }
  if (!elements.length) return null;

  /** @type {{ text: string, x: number, y: number, score: number, query: string }|null} */
  let best = null;
  for (const q of queries) {
    for (const el of elements) {
      const score = similarity(q, el.text);
      if (score < minScore) continue;
      if (!best || score > best.score) {
        best = {
          text: el.text,
          x: el.x,
          y: el.y,
          score,
          query: q,
        };
      }
    }
  }
  if (!best) return null;
  return {
    elements: [{ type: "text", text: best.text, x: best.x, y: best.y }],
    score: best.score,
    text: best.text,
    x: best.x,
    y: best.y,
    query: best.query,
    source: "uidump",
  };
}

export function uidumpEnabled(opts = {}) {
  if (opts.preferDump === false) return false;
  if (opts.preferDump === true) return true;
  const env = process.env.SCREEN_ROBOT_UIDUMP;
  if (env === "0" || env === "false") return false;
  return true; // default on
}
