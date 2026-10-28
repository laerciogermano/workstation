/**
 * Parse dump/OCR da tela Manage → Connections (lista "Connected on …").
 * Cards ordenados do topo = conexões mais recentes.
 * No fluxo extract-connections a fonte é só dump (uiautomator).
 */

const HEADER_RE =
  /^(connections|locations|companies|search|grow|catch\s*up|invitations|manage|home|network|post|notifications|jobs|premium)$/i;
const CONNECTED_RE =
  /^connected\s*on\s*(.+)$/i;
/** "Connectedon0ctober23,2026" / "Connected on October 21, 2026" */
const CONNECTED_GLUED_RE =
  /^connected\s*on\s*(.+)$/i;

/**
 * Normaliza data OCR ("0ctober23,2026" → "October 23, 2026").
 * @param {string} raw
 */
export function normalizeConnectedOn(raw) {
  let s = String(raw || "")
    .replace(/\s+/g, " ")
    .trim();
  s = s.replace(/0&tober/i, "October");
  s = s.replace(/0ctober/i, "October");
  s = s.replace(/^0ct/i, "Oct");
  s = s.replace(/&/g, "");

  // ConnectedonOctober23,2026 → October 23, 2026
  s = s.replace(
    /^(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(\d{1,2}),?\s*(\d{4})$/i,
    "$1 $2, $3",
  );
  s = s.replace(/,(\d{4})$/, ", $1");
  return s || null;
}

function isConnectedLine(t) {
  return /^connected\s*on/i.test(String(t || "").replace(/\s+/g, " ").trim()) ||
    /^connectedon/i.test(String(t || "").replace(/\s+/g, ""));
}

function connectedDateFromText(t) {
  const compact = String(t || "").replace(/\s+/g, "");
  const spaced = String(t || "").replace(/\s+/g, " ").trim();
  let m = spaced.match(CONNECTED_RE);
  if (m) return normalizeConnectedOn(m[1]);
  m = compact.match(/^connectedon(.+)$/i);
  if (m) return normalizeConnectedOn(m[1]);
  return null;
}

function isChrome(t) {
  const s = String(t || "").trim();
  if (!s) return true;
  if (HEADER_RE.test(s)) return true;
  if (/^\d[\d,.]*\+?\s*connections?$/i.test(s)) return true;
  if (/^\d{1,2}:\d{2}/.test(s)) return true;
  if (/^[\d@回回]+$/.test(s)) return true;
  // dump a11y / chrome da lista Connections
  if (/^go back$/i.test(s)) return true;
  if (/profile picture$/i.test(s)) return true;
  if (/^send a message to /i.test(s)) return true;
  if (/^more actions for /i.test(s)) return true;
  if (/^search by name$/i.test(s)) return true;
  if (/^filter by /i.test(s)) return true;
  if (/^more filters$/i.test(s)) return true;
  return false;
}

/**
 * @param {Array<{ text?: string, x?: number, y?: number }>} els
 * @returns {Array<{ name: string, title: string|null, connectedOn: string|null, y: number }>}
 */
export function connectionsFromExtract(els) {
  const texts = (els || [])
    .filter((e) => e && e.text != null && e.y != null)
    .map((e) => ({
      text: String(e.text).trim(),
      x: e.x,
      y: e.y,
    }))
    .filter((e) => e.text.length > 0)
    .sort((a, b) => a.y - b.y || (a.x || 0) - (b.x || 0));

  /** @type {number[]} */
  const anchors = [];
  for (let i = 0; i < texts.length; i++) {
    if (isConnectedLine(texts[i].text)) anchors.push(i);
  }

  /** @type {Array<{ name: string, title: string|null, connectedOn: string|null, y: number }>} */
  const out = [];
  for (let a = 0; a < anchors.length; a++) {
    const ai = anchors[a];
    const connectedOn = connectedDateFromText(texts[ai].text);
    const prevEnd = a === 0 ? -1 : anchors[a - 1];
    const block = texts.slice(prevEnd + 1, ai).filter((e) => !isChrome(e.text));
    if (!block.length) continue;

    // nome = primeira linha "substantiva"; title = resto
    const nameEl = block[0];
    let name = nameEl.text.replace(/\s+/g, " ").trim();
    // OCR cola NomeSobrenome → tenta separar CamelCase leve
    if (!/\s/.test(name) && /[a-z][A-Z]/.test(name)) {
      name = name.replace(/([a-z])([A-Z])/g, "$1 $2");
    }
    const titleParts = block.slice(1).map((e) => e.text.replace(/\s+/g, " ").trim());
    const title = titleParts.length ? titleParts.join(" ").replace(/\s+/g, " ").trim() : null;

    out.push({
      name,
      title,
      connectedOn,
      y: nameEl.y,
    });
  }
  return out;
}

/**
 * Merge por nome+connectedOn (scroll).
 * @param {Array<{ name: string, title: string|null, connectedOn: string|null }>} acc
 * @param {Array<{ name: string, title: string|null, connectedOn: string|null }>} batch
 */
export function mergeConnections(acc, batch) {
  const key = (c) =>
    `${String(c.name || "").toLowerCase()}|${String(c.connectedOn || "").toLowerCase()}`;
  const nameKey = (c) => String(c.name || "").toLowerCase().replace(/\s+/g, "");
  const seen = new Set(acc.map(key));
  const seenNames = new Set(acc.map(nameKey));
  const next = [...acc];
  for (const c of batch) {
    const k = key(c);
    const nk = nameKey(c);
    if (!c.name || seen.has(k)) continue;
    // mesmo nome em scrolls consecutivos (OCR data diferente) → skip
    if (nk && seenNames.has(nk)) continue;
    seen.add(k);
    seenNames.add(nk);
    next.push(c);
  }
  return next;
}
