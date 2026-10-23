/**
 * Cabeçalho do perfil LinkedIn a partir de `uiautomator dump` (sem OCR).
 * Converte nodes → { text, x, y } e reusa parseProfileHeader.
 */
import { parseProfileHeader } from "./linkedin-profile-page.js";

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

/**
 * @param {string} nodeTag `<node ...>`
 * @returns {{ text: string, x: number, y: number, resourceId: string, contentDesc: string }|null}
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
  // ignora nós enormes (fullscreen / decor)
  if (y2 - y1 > 400 && x2 - x1 > 400 && !text) return null;
  return {
    text: label,
    x: Math.round((x1 + x2) / 2),
    y: Math.round((y1 + y2) / 2),
    resourceId,
    contentDesc,
  };
}

/**
 * Elementos de texto/desc do dump, ordenados por y (como OCR).
 * @param {string} xml
 * @returns {{ text: string, x: number, y: number, resourceId?: string }[]}
 */
export function profileElementsFromUiXml(xml) {
  /** @type {{ text: string, x: number, y: number, resourceId?: string }[]} */
  const out = [];
  const seen = new Set();
  for (const n of String(xml || "").match(/<node\b[^>]*>/g) || []) {
    const node = parseUiNode(n);
    if (!node) continue;
    // chrome / nav
    if (
      /^(search|home|my network|notifications|jobs|post)$/i.test(node.text)
    ) {
      continue;
    }
    const key = `${node.text}|${node.y}|${node.x}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      text: node.text,
      x: node.x,
      y: node.y,
      resourceId: node.resourceId || undefined,
    });
  }
  out.sort((a, b) => a.y - b.y || a.x - b.x);
  return out;
}

/**
 * @param {string} xml
 * @param {{ nameHint?: string }} [opts]
 */
export function parseProfileHeaderFromUiXml(xml, opts = {}) {
  const els = profileElementsFromUiXml(xml);
  return {
    header: parseProfileHeader(els, { nameHint: opts.nameHint }),
    elements: els,
  };
}
