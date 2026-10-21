/**
 * Heurística: fatiar OCR da página de perfil LinkedIn por âncoras About / Experience / Education.
 */

const SECTION_START_RE =
  /^(about|experience|education|skills)\b/i;
/** Fecha o bucket atual (evita “More profiles” / Interests entrarem em Experience). */
const SECTION_STOP_RE =
  /^(about|experience|education|skills|activity|featured|interests|licenses|volunteering|courses|publications|organizations|newsletters|top voices|companies|more profiles for you|people also viewed|accomplishments)\b/i;

const URL_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9._%-]+\/?/i;

const CHROME_RE =
  /^(search|connect|message|pending|follow|\+ follow|i\+ connect|1 message|• message|show all.*|page|\d{1,2}:\d{2}\s*\$?|premium)$/i;

const DATE_RANGE_RE =
  /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*[-–]\s*(?:Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})\b/i;

const HEADER_STOP_RE =
  /^(about|experience|education|skills|activity|open to work|featured|interests)\b/i;
const LOCATION_RE =
  /,\s*|brazil|brasil|minas|paulo|horizonte|campinas|remote|united states|portugal/i;
const CONNECTIONS_RE = /^(\d[\d,]*)\s*connections?\b/i;
const NAME_DEGREE_RE = /^(.*?)\s*[•·]\s*(1st|2nd|3rd\+?)\s*$/i;

/**
 * Cabeçalho do perfil (topo da página): nome, empresas, conexões, Connect/Message.
 * Usa ordem por y quando disponível.
 * @param {object[]} els
 * @param {{ nameHint?: string }} [opts]
 */
export function parseProfileHeader(els, opts = {}) {
  const nameHint = String(opts.nameHint || "")
    .trim()
    .toLowerCase();
  const hintFirst = nameHint.split(/\s+/).filter(Boolean)[0] || "";

  // Preferir y quando há coords (page-00); senão ordem do array.
  const sorted = (Array.isArray(els) ? els : [])
    .map((e) => ({
      text: String(e?.text || "").replace(/\s+/g, " ").trim(),
      y: Number(e?.y),
    }))
    .filter((e) => e.text)
    .sort((a, b) => {
      const ay = Number.isFinite(a.y) ? a.y : 1e9;
      const by = Number.isFinite(b.y) ? b.y : 1e9;
      if (ay !== by) return ay - by;
      return 0;
    });

  let name = null;
  let connectionDegree = null;
  let location = null;
  let connections = null;
  /** @type {string[]} */
  const companyLines = [];
  /** @type {string[]} */
  const mutualParts = [];
  let canConnect = false;
  let canMessage = false;
  let pastName = false;

  for (const { text: t } of sorted) {
    if (HEADER_STOP_RE.test(t)) break;

    const degInline = t.match(NAME_DEGREE_RE);
    if (degInline) {
      name = degInline[1].replace(/\s+/g, " ").trim();
      connectionDegree = degInline[2];
      pastName = true;
      continue;
    }

    if (/^(1st|2nd|3rd\+?)$/i.test(t)) {
      if (!connectionDegree) connectionDegree = t;
      continue;
    }

    if (/connect/i.test(t) && !/connections?/i.test(t) && !/mutual/i.test(t)) {
      canConnect = true;
      continue;
    }
    if (/\bmessage\b/i.test(t) && !/send profile/i.test(t)) {
      canMessage = true;
      continue;
    }

    const conn = t.match(CONNECTIONS_RE);
    if (conn) {
      connections = `${conn[1].replace(/,/g, "")} connections`;
      pastName = true;
      continue;
    }

    if (/mutual/i.test(t) || (/^connections?$/i.test(t) && mutualParts.length)) {
      mutualParts.push(t);
      continue;
    }

    // nome sem bullet (só hint)
    if (
      !name &&
      hintFirst &&
      t.toLowerCase().includes(hintFirst) &&
      t.length >= 5 &&
      t.length <= 120 &&
      !LOCATION_RE.test(t) &&
      !/followers|open to/i.test(t)
    ) {
      name = t.replace(/\s*[•·].*$/, "").trim();
      pastName = true;
      const m = t.match(/\b(1st|2nd|3rd\+?)\b/i);
      if (m) connectionDegree = m[1];
      continue;
    }

    if (LOCATION_RE.test(t) && t.length <= 120 && !/connections?/i.test(t)) {
      location = t;
      pastName = true;
      continue;
    }

    // linhas de empresa: entre nome e location (ou antes de connections)
    if (
      pastName &&
      !location &&
      !connections &&
      t.length >= 3 &&
      t.length <= 120 &&
      !isChromeLine(t) &&
      !/followers|mutual|show details|#opentowork/i.test(t) &&
      !/^\d{1,2}:\d{2}/.test(t) &&
      !/^search$/i.test(t)
    ) {
      companyLines.push(t);
    }
  }

  let mutualConnections = null;
  if (mutualParts.length) {
    const joined = mutualParts.join(" ").replace(/\s+/g, " ").trim();
    mutualConnections = /mutual/i.test(joined)
      ? joined
      : `${joined} mutual connections`;
  }

  return {
    name,
    company: companyLines.length ? companyLines.join("\n") : null,
    location,
    connections,
    mutualConnections,
    connectionDegree,
    canConnect,
    canMessage,
  };
}

/**
 * @param {object[]} els elementos do extract ({ text, x, y })
 * @returns {{
 *   name: string|null,
 *   company: string|null,
 *   headline: string|null,
 *   location: string|null,
 *   connections: string|null,
 *   mutualConnections: string|null,
 *   canConnect: boolean,
 *   canMessage: boolean,
 *   about: string|null,
 *   experience: string|null,
 *   education: string|null,
 *   skills: string|null,
 *   connectionDegree: string|null,
 *   profileUrl: string|null,
 *   texts: string[]
 * }}
 */
export function parseProfilePageOcr(els, opts = {}) {
  const nameHint = String(opts.nameHint || "")
    .trim()
    .toLowerCase();
  const texts = (Array.isArray(els) ? els : [])
    .map((e) => String(e?.text || "").trim())
    .filter(Boolean);

  // Cabeçalho só do 1º frame (evita misturar y de páginas do scroll).
  const headerEls = Array.isArray(opts.headerEls) ? opts.headerEls : els;
  const header = parseProfileHeader(headerEls, opts);

  /** @type {Record<string, string[]>} */
  const buckets = {
    about: [],
    experience: [],
    education: [],
    skills: [],
    other: [],
  };
  let section = "other";

  for (const t of texts) {
    const key = t.replace(/\s+/g, " ").trim();
    const low = key.toLowerCase();

    const start = low.match(SECTION_START_RE);
    const stop = low.match(SECTION_STOP_RE);
    if (start) {
      const name = start[1].toLowerCase();
      section =
        name === "about" ||
        name === "experience" ||
        name === "education" ||
        name === "skills"
          ? name
          : "other";
      const rest = key.replace(SECTION_START_RE, "").replace(/^[:\s-]+/, "").trim();
      if (rest && buckets[section]) buckets[section].push(rest);
      continue;
    }
    if (stop) {
      // Interests / Activity / More profiles… — sai do Experience
      section = "other";
      continue;
    }

    if (buckets[section]) buckets[section].push(t);
    else buckets.other.push(t);
  }

  const join = (arr) => {
    const cleaned = dedupeLines(arr.filter((l) => !isChromeLine(l)));
    return cleaned.length ? cleaned.join("\n") : null;
  };

  // headline = cargo (não empresa). Evita pegar "Rede Mater Dei" como headline.
  let headline = null;
  const companySet = new Set(
    String(header.company || "")
      .split("\n")
      .map((s) => s.toLowerCase())
      .filter(Boolean),
  );
  const others = buckets.other;
  for (const t of others) {
    const low = t.toLowerCase();
    if (companySet.has(low)) continue;
    if (header.name && low === header.name.toLowerCase()) continue;
    if (nameHint && low.includes(nameHint.split(/\s+/)[0])) continue;
    if (/^(connect|message|pending|follow|more|1st|2nd|3rd)/i.test(t)) continue;
    if (CONNECTIONS_RE.test(t) || /mutual/i.test(t)) continue;
    if (LOCATION_RE.test(t)) continue;
    if (isChromeLine(t)) continue;
    // cargo típico: sem vírgula de cidade, não é só empresa repetida
    if (!headline && t.length >= 8 && t.length <= 180 && !/brazil|brasil/i.test(t)) {
      headline = t;
      break;
    }
  }

  return {
    name: header.name,
    company: header.company,
    headline,
    location: header.location,
    connections: header.connections,
    mutualConnections: header.mutualConnections,
    canConnect: header.canConnect,
    canMessage: header.canMessage,
    about: join(buckets.about),
    experience: formatExperienceBlocks(buckets.experience),
    education: join(buckets.education),
    skills: join(buckets.skills),
    connectionDegree: header.connectionDegree,
    profileUrl: findLinkedInProfileUrl(texts),
    texts,
  };
}

function isChromeLine(t) {
  const s = String(t || "").replace(/\s+/g, " ").trim();
  if (!s) return true;
  if (CHROME_RE.test(s)) return true;
  if (/^\d{1,2}:\d{2}/.test(s)) return true;
  if (/followers$/i.test(s)) return true;
  if (/^•\s*\d+(st|nd|rd)/i.test(s)) return true;
  return false;
}

/** Remove chrome repetido do scroll: só linhas iguais consecutivas (mantém vários "Comprador"). */
function dedupeLines(arr) {
  const out = [];
  let prev = "";
  for (const raw of arr || []) {
    const t = String(raw || "").replace(/\s+/g, " ").trim();
    if (!t) continue;
    const n = t.toLowerCase();
    if (n === prev) continue;
    prev = n;
    out.push(t);
  }
  return out;
}

/** Dedupa blocos de experience inteiros (scroll overlap). */
function dedupeBlocks(blocks) {
  const out = [];
  const seen = new Set();
  for (const b of blocks || []) {
    const n = String(b || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(b);
  }
  return out;
}

/**
 * Monta blocos cargo / empresa / datas.
 * Cada range de datas fecha um emprego; dedupa pelo range (overlap de scroll).
 */
function formatExperienceBlocks(lines) {
  const cleaned = dedupeLines((lines || []).filter((l) => !isChromeLine(l)));
  if (!cleaned.length) return null;

  /** @type {string[]} */
  const blocks = [];
  /** @type {string[]} */
  let pending = [];

  for (const line of cleaned) {
    if (DATE_RANGE_RE.test(line)) {
      // título + empresa: últimas 1–3 linhas úteis antes da data
      let head = pending
        .filter((l) => !isNoiseExperienceLine(l))
        .slice(-3);
      // drop logo OCR em CAPS se alguma linha seguinte do bloco já contém o nome
      head = head.filter((l, i) => {
        if (l !== l.toUpperCase() || l.length < 4) return true;
        const rest = head.slice(i + 1).join(" ").toLowerCase();
        return !rest.includes(l.toLowerCase());
      });
      pending = [];
      const parts = [...head, line];
      if (parts.length) blocks.push(parts.join("\n"));
      continue;
    }
    pending.push(line);
  }

  // sem datas: devolve linhas limpas (melhor que nada)
  if (!blocks.length) {
    const rest = cleaned.filter((l) => !isNoiseExperienceLine(l));
    return rest.length ? rest.join("\n") : null;
  }

  // dedupa por linha de data
  const seenDates = new Set();
  const unique = [];
  for (const b of blocks) {
    const dm = b.match(DATE_RANGE_RE);
    const key = dm ? dm[0].toLowerCase() : b.toLowerCase();
    if (seenDates.has(key)) continue;
    seenDates.add(key);
    unique.push(b);
  }
  return unique.join("\n\n");
}

/** Lixo típico de logo / OCR no card de experiência. */
function isNoiseExperienceLine(t) {
  const s = String(t || "").trim();
  if (!s) return true;
  if (s.length <= 3) return true;
  if (/^(outubro|ru|rosa|page)$/i.test(s)) return true;
  return false;
}

/** Extrai URL linkedin.com/in/… de uma lista de strings OCR. */
export function findLinkedInProfileUrl(texts) {
  const list = Array.isArray(texts) ? texts : [String(texts || "")];
  for (const t of list) {
    const m = String(t || "").match(URL_RE);
    if (!m) continue;
    let url = m[0];
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    return url.replace(/\/$/, "");
  }
  return null;
}
