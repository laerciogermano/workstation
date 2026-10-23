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
      /^(search|home|my network|notifications|jobs|post|back button|cover photo|profile photo|more)$/i.test(
        el.text,
      )
    ) {
      continue;
    }
    // a11y do topo (Premium / notifications / verifications) — não entra no header
    if (
      /\bis a premium member\b|\bmanage notifications\b|\bview .+ verifications\b/i.test(
        el.text,
      )
    ) {
      continue;
    }
    // "Invite X to connect" → Connect (content-desc do botão)
    let text = el.text;
    if (/\binvite\b.+\bto connect\b/i.test(text)) {
      text = "Connect";
    }
    const key = `${text}|${el.y}|${el.x}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      text,
      x: el.x,
      y: el.y,
      resourceId: el.resourceId,
      source: el.source,
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
