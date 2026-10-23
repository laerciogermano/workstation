/**
 * Cabeçalho do perfil LinkedIn a partir de `uiautomator dump` (sem OCR).
 */
import { parseProfileHeader } from "./linkedin-profile-page.js";
import {
  elementsFromUiXml,
  parseUiNode,
} from "./ui-dump.js";

export { parseUiNode, elementsFromUiXml };

/**
 * Elementos de texto/desc do dump, ordenados por y (como OCR).
 * Filtra chrome da bottom nav LinkedIn.
 * @param {string} xml
 * @returns {{ text: string, x: number, y: number, resourceId?: string }[]}
 */
export function profileElementsFromUiXml(xml) {
  const out = [];
  const seen = new Set();
  for (const el of elementsFromUiXml(xml)) {
    if (
      /^(search|home|my network|notifications|jobs|post)$/i.test(el.text)
    ) {
      continue;
    }
    const key = `${el.text}|${el.y}|${el.x}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      text: el.text,
      x: el.x,
      y: el.y,
      resourceId: el.resourceId,
    });
  }
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
