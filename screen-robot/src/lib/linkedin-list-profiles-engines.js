/**
 * Pré-processamento OCR por engine antes do parse de cards LinkedIn.
 * macos-vision: identidade. rapidocr: descola texto. tesseract: une linhas + ancora ações.
 */
import {
  cleanName,
  isValidProfileName,
  parseActionLabel,
} from "./linkedin-list-profiles.js";

/**
 * RapidOCR cola CamelCase / "at" / Current: — descola sem partir "Comprador"/"Greater".
 * @param {string} text
 */
export function expandRapidocrText(text) {
  let s = String(text || "").trim();
  if (!s) return s;

  /** @type {string[]} */
  const locked = [];
  const lock = (m) => {
    locked.push(m);
    return `\0L${locked.length - 1}\0`;
  };
  s = s.replace(/\b\d(?:st|nd|rd|th)\+?\b/gi, lock);

  s = s.replace(/^(Current|Past):(?=\S)/i, "$1: ");
  s = s.replace(/([a-zá-ú])at([A-ZÁ-Ú])/g, "$1 at $2");
  // só minúsculas (não partir "Danielle")
  s = s.replace(/\b(da|de|do|dos|das)(?=[a-zá-ú]{4,})/g, "$1 ");
  // "CoordenadordeSuprime" → após CamelCase ainda "Coordenadorde Suprime"
  s = s.replace(/([a-zá-ú])de([A-ZÁ-Ú])/g, "$1 de $2");
  s = s.replace(/([a-zá-ú])(s[eê]nior)\b/gi, "$1 $2");
  s = s.replace(/([a-zà-ú])([A-ZÁ-Ú])/g, "$1 $2");
  // só casos conhecidos (não partir HEINEKEN)
  s = s.replace(/\b(MG)(CINTO)\b/g, "$1 $2");
  s = s.replace(/(\d)(mutual)/gi, "$1 $2");
  s = s.replace(/\bmutualconnections\b/gi, "mutual connections");
  s = s.replace(/\bmutualconnection\b/gi, "mutual connection");
  s = s.replace(/,(?=\S)/g, ", ");
  s = s.replace(/\s+/g, " ").trim();

  s = s.replace(/\0L(\d+)\0/g, (_, i) => locked[Number(i)]);
  return s;
}

/**
 * @param {{ text?: string, x: number, y: number }[]} elements
 */
export function normalizeRapidocrElements(elements) {
  return (elements || []).map((e) => ({
    ...e,
    text: expandRapidocrText(e.text),
  }));
}

/**
 * Une tokens tesseract na coluna esquerda por proximidade de y (gap X ignorado:
 * "Alexandre" + "Silva" costumam ter furo grande no OCR).
 * @param {{ text?: string, x: number, y: number, w?: number }[]} elements
 * @param {{ yTol?: number, maxX?: number }} [opts]
 */
export function mergeTesseractLines(elements, opts = {}) {
  const yTol = opts.yTol ?? 14;
  const maxX = opts.maxX ?? 520;
  const sorted = [...(elements || [])]
    .filter((e) => {
      if (e?.text == null || !String(e.text).trim()) return false;
      // Coluna do card (não botões Connect/Pending à direita)
      if (parseActionLabel(e.text)) return false;
      return e.x < maxX;
    })
    .sort((a, b) => a.y - b.y || a.x - b.x);

  /** @type {{ parts: object[], y: number }[]} */
  const lines = [];
  for (const e of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - e.y) <= yTol) {
      last.parts.push(e);
      last.y =
        (last.y * (last.parts.length - 1) + e.y) / last.parts.length;
      continue;
    }
    lines.push({ parts: [e], y: e.y });
  }

  return lines.map((l) => {
    const parts = [...l.parts].sort((a, b) => a.x - b.x);
    const text = parts
      .map((p) => String(p.text || "").trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    const xs = parts.map((p) => p.x);
    return {
      type: "text",
      text,
      x: Math.round((Math.min(...xs) + Math.max(...xs)) / 2),
      y: Math.round(l.y),
    };
  });
}

/**
 * @param {string} line
 */
export function nameFromTesseractLine(line) {
  let s = String(line || "");
  s = s
    .replace(/[©®@•·&]+/g, " ")
    .replace(/\b(1st|2nd|3rd\+?)\b/gi, " ")
    .replace(/[-–|/(GQ]+/g, " ")
    .replace(/\b(pending|connect|follow|message)\b/gi, " ")
    .replace(/\b(ltda|llc|inc|s\.?a\.?)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const name = cleanName(s);
  return isValidProfileName(name) ? name : null;
}

/**
 * Prepara elementos tesseract: linhas mergeadas + âncoras Connect/Pending sintéticas.
 * @param {{ text?: string, x: number, y: number }[]} elements
 */
export function prepareTesseractElements(elements) {
  const list = elements || [];
  const lines = mergeTesseractLines(list);
  const right = list.filter((e) => e.x >= 380 && e.y > 160 && e.y < 980);

  /** @type {{ name: string, x: number, y: number, line: object }[]} */
  const nameHits = [];
  const seen = new Set();
  for (const line of lines.sort((a, b) => a.y - b.y)) {
    if (line.y <= 160 || line.y >= 980) continue;
    const name = nameFromTesseractLine(line.text);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    nameHits.push({ name, x: line.x, y: line.y, line });
  }

  /** @type {object[]} */
  const synthetic = [];
  for (const hit of nameHits) {
    let actionLabel = null;
    let actionY = hit.y + 8;
    let actionX = 450;
    for (const e of right) {
      if (Math.abs(e.y - hit.y) > 55) continue;
      const label = parseActionLabel(e.text);
      if (label) {
        actionLabel = label;
        actionY = e.y;
        actionX = e.x;
        break;
      }
    }
    // Só injeta ação sintética se OCR não trouxe botão (evita Pending×2 → yBot clipped)
    if (!actionLabel) {
      synthetic.push({
        type: "text",
        text: "Connect",
        x: actionX,
        y: actionY,
      });
    }
    // Nome canônico na altura do card (tesseract fragmenta)
    synthetic.push({
      type: "text",
      text: hit.name,
      x: Math.min(hit.x, 220),
      y: hit.y,
    });
    const degree = String(hit.line.text).match(/\b(1st|2nd|3rd\+?)\b/i)?.[1];
    if (degree) {
      synthetic.push({
        type: "text",
        text: `• ${degree}`,
        x: 320,
        y: hit.y,
      });
    }
  }

  // Linhas mergeadas + coluna direita + sintéticos (sem re-injetar tokens esq crus —
  // evita nomes de 1 palavra competirem com o nome completo).
  return [...lines, ...right, ...synthetic];
}

/**
 * @param {{ text?: string, x: number, y: number }[]} elements
 * @param {string} [engine]
 */
export function prepareElementsForEngine(elements, engine) {
  const eng = String(engine || "macos-vision").toLowerCase().trim();
  if (eng === "rapidocr") return normalizeRapidocrElements(elements);
  if (eng === "tesseract") return prepareTesseractElements(elements);
  return elements || [];
}
