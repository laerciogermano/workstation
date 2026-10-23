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
  /^(search|connect|message|pending|follow|\+ follow|i\+ connect|1 message|• message|• pending|show all.*|page|\d{1,2}:\d{2}\s*\$?|premium|back button|cover photo|profile photo|more)$/i;

/** content-desc / a11y do topo do perfil LinkedIn — não é nome/cargo */
const PROFILE_A11Y_NOISE_RE =
  /\bis a premium member\b|\bmanage notifications\b|\bview .+ verifications\b|\binvite .+ to connect\b|\bsee your contact info\b|\bnotify .+ about\b/i;

const DATE_RANGE_RE =
  /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*[-–]\s*(?:Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})\b/i;

const HEADER_STOP_RE =
  /^(about|experience|education|skills|activity|open to work|featured|interests)\b/i;
/** Cidade típica (evita “Pontifícia … de Minas Gerais” virar location). */
const LOCATION_RE =
  /,\s*(brazil|brasil|[A-Z]{2}\b)|^(greater\s+)?(belo horizonte|s[aã]o paulo|rio de janeiro|campinas|curitiba|bras[ií]lia|porto alegre|contagem|betim)|remote|united states|portugal/i;
const CONNECTIONS_RE = /^(\d[\d,]*)\+?\s*connections?\b/i;
const NAME_DEGREE_RE = /^(.*?)\s*[•·]\s*(1st|2nd|3rd\+?)\s*$/i;
const DEGREE_ONLY_RE = /^[•·]?\s*(1st|2nd|3rd\+?)\s*$/i;
const AD_RE =
  /^(aqui sua empresa|economiza\+?|try premium|advertisement)\b/i;

/**
 * slug `bruno-toyomoto-923870410` → `Bruno Toyomoto` (hint de nome p/ OCR).
 * @param {string} rawUrl
 */
/** Trecho final do slug: só id estrutural (`923870410`, `6bb660189`) — sem lista de palavras. */
export function isLinkedInSlugId(part) {
  const p = String(part || "").trim();
  if (!p) return false;
  if (/^\d{5,}$/.test(p)) return true;
  return (
    p.length >= 6 &&
    p.length <= 14 &&
    /[0-9]/.test(p) &&
    /^[a-z0-9]+$/i.test(p)
  );
}

/** Remove id estrutural no fim do nome (não usa dicionário de cargos). */
export function stripLinkedInSlugIdFromName(raw) {
  const words = String(raw || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  while (words.length >= 2 && isLinkedInSlugId(words[words.length - 1])) {
    words.pop();
  }
  return words.join(" ");
}

/** Chave abstrata p/ comparar slug colado ↔ texto na tela (sem acento/espaço). */
export function foldNameKey(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/** Hint só p/ ranquear candidatos da tela — não é o nome final. */
export function nameHintFromLinkedInUrl(rawUrl) {
  const m = String(rawUrl || "").match(/linkedin\.com\/in\/([^/?#]+)/i);
  const slug = decodeURIComponent(m?.[1] || "").replace(/\/$/, "");
  if (!slug) return "";
  const parts = slug.split("-").filter(Boolean);
  while (parts.length && isLinkedInSlugId(parts[parts.length - 1])) {
    parts.pop();
  }
  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ")
    .trim();
}

function looksLikePersonName(t) {
  const s = String(t || "").replace(/\s+/g, " ").trim();
  if (s.length < 3 || s.length > 80) return false;
  // rótulo UI com barra ("Ela / Dela") — não é nome na tela
  if (/\//.test(s)) return false;
  if (LOCATION_RE.test(s) || /connections?|mutual|followers|open to/i.test(s)) {
    return false;
  }
  if (DEGREE_ONLY_RE.test(s) || AD_RE.test(s) || isChromeLine(s)) return false;
  if (PROFILE_A11Y_NOISE_RE.test(s)) return false;
  if (/^\d/.test(s)) return false;
  if (/^(manage|view|invite|see|open|send|share|follow)\b/i.test(s)) return false;
  const words = s.split(/\s+/).filter((w) => w && w !== "|");
  if (words.length < 1 || words.length > 5) return false;
  if (words.some((w) => /^(is|a|an|the|of|about)$/i.test(w))) return false;
  const capped = words.filter((w) => /^[\p{L}]/u.test(w)).length;
  return capped >= Math.min(1, words.length);
}

/** Score 0..1: quanto o texto da tela se parece com o hint (slug), só p/ desempate. */
function nameHintScore(candidate, hintTokens) {
  if (!hintTokens.length) return 0;
  const candFold = foldNameKey(candidate);
  if (!candFold) return 0;
  let hit = 0;
  let considered = 0;
  for (const tok of hintTokens) {
    const tf = foldNameKey(tok);
    if (tf.length < 3) continue;
    considered += 1;
    if (
      candFold.includes(tf) ||
      tf.includes(candFold) ||
      (tf.length >= 6 &&
        candFold.length >= 6 &&
        (tf.startsWith(candFold.slice(0, 6)) ||
          candFold.startsWith(tf.slice(0, 6))))
    ) {
      hit += 1;
    }
  }
  if (!considered) return 0;
  return hit / considered;
}

/**
 * Cabeçalho do perfil (topo): nome, cargo, empresa, cidade, conexões, pending/connect/message.
 * @param {object[]} els
 * @param {{ nameHint?: string }} [opts]
 */
export function parseProfileHeader(els, opts = {}) {
  const nameHint = stripLinkedInSlugIdFromName(String(opts.nameHint || "").trim())
    .toLowerCase();
  const hintTokens = nameHint.split(/[\s-]+/).filter((t) => t.length >= 3);

  const sorted = (Array.isArray(els) ? els : [])
    .map((e) => ({
      text: String(e?.text || "").replace(/\s+/g, " ").trim(),
      y: Number(e?.y),
      x: Number(e?.x) || 0,
      source: e?.source === "desc" ? "desc" : e?.source === "text" ? "text" : null,
    }))
    .filter((e) => e.text)
    .sort((a, b) => {
      const ay = Number.isFinite(a.y) ? a.y : 1e9;
      const by = Number.isFinite(b.y) ? b.y : 1e9;
      if (ay !== by) return ay - by;
      return (a.x || 0) - (b.x || 0);
    });

  let name = null;
  let connectionDegree = null;
  let location = null;
  let connections = null;
  /** @type {string[]} */
  const midLines = [];
  /** @type {string[]} */
  const mutualParts = [];
  let canConnect = false;
  let canMessage = false;
  /** @type {'connect'|'pending'|'connected'|null} */
  let inviteStatus = null;
  let pastName = false;
  /** @type {{ text: string, score: number, y: number, x: number, source: string|null }[]} */
  const nameCandidates = [];
  /** pending "500+" antes de "connections" no dump */
  let pendingConnCount = null;

  for (const { text: t, source, x, y } of sorted) {
    // Activity/About… só encerra o header depois do nome (dump traz Activity@0 offscreen)
    if (pastName && HEADER_STOP_RE.test(t)) break;
    if (!pastName && HEADER_STOP_RE.test(t)) continue;
    if (AD_RE.test(t)) continue;
    if (/^\d{1,2}:\d{2}/.test(t) || /^search$/i.test(t)) continue;

    const degOnly = t.match(DEGREE_ONLY_RE);
    if (degOnly) {
      if (!connectionDegree) connectionDegree = degOnly[1];
      continue;
    }

    const degInline = t.match(NAME_DEGREE_RE);
    if (degInline) {
      const n = stripLinkedInSlugIdFromName(
        degInline[1].replace(/\s+/g, " ").trim(),
      );
      if (n.length >= 2 && looksLikePersonName(n)) {
        nameCandidates.push({
          text: n,
          score:
            nameHintScore(n, hintTokens) +
            (source === "text" ? 0.15 : 0) +
            (x > 0 && x < 280 ? 0.1 : 0),
          y: Number.isFinite(y) ? y : 0,
          x,
          source,
        });
        pastName = true;
      }
      connectionDegree = degInline[2];
      continue;
    }

    if (/\binvite\b.+\bconnect\b/i.test(t)) {
      canConnect = true;
      if (inviteStatus !== "pending") inviteStatus = "connect";
      continue;
    }
    if (/\bpending\b/i.test(t) && !/manage notifications/i.test(t)) {
      inviteStatus = "pending";
      canConnect = false;
      continue;
    }
    if (
      /\bconnect\b/i.test(t) &&
      !/connections?/i.test(t) &&
      !/mutual/i.test(t)
    ) {
      canConnect = true;
      if (inviteStatus !== "pending") inviteStatus = "connect";
      continue;
    }
    if (/\bmessage\b/i.test(t) && !/send profile/i.test(t)) {
      canMessage = true;
      continue;
    }

    // chrome / a11y depois de grau e CTAs
    if (PROFILE_A11Y_NOISE_RE.test(t) || isChromeLine(t)) continue;

    const conn = t.match(CONNECTIONS_RE);
    if (conn) {
      connections = `${conn[1].replace(/,/g, "")} connections`;
      pendingConnCount = null;
      pastName = true;
      continue;
    }
    if (/^(\d[\d,]*)\+?$/.test(t) && !connections) {
      pendingConnCount = t.replace(/,/g, "");
      continue;
    }
    if (/^connections?$/i.test(t) && pendingConnCount && !connections) {
      connections = `${pendingConnCount} connections`;
      pendingConnCount = null;
      pastName = true;
      continue;
    }

    if (/mutual/i.test(t) || (/^connections?$/i.test(t) && mutualParts.length)) {
      mutualParts.push(t);
      continue;
    }

    if (LOCATION_RE.test(t) && t.length <= 120 && !/connections?/i.test(t)) {
      location = t;
      pastName = true;
      continue;
    }

    if (looksLikePersonName(t)) {
      const cleaned = stripLinkedInSlugIdFromName(
        t.replace(/\s*[•·].*$/, "").replace(/\s+/g, " ").trim(),
      );
      const solidName = nameCandidates.some(
        (c) => String(c.text).trim().split(/\s+/).length >= 2,
      );
      // Já há nome composto na tela → próximas linhas person-like são cargo/empresa
      if (cleaned && looksLikePersonName(cleaned) && !solidName) {
        const words = cleaned.split(/\s+/).filter(Boolean).length;
        const score =
          nameHintScore(cleaned, hintTokens) +
          (source === "text" ? 0.2 : 0) +
          (x > 0 && x < 280 ? 0.15 : 0) +
          (words >= 2 ? 0.25 : 0);
        nameCandidates.push({
          text: cleaned,
          score,
          y: Number.isFinite(y) ? y : 0,
          x,
          source,
        });
        pastName = true;
        const m = t.match(/\b(1st|2nd|3rd\+?)\b/i);
        if (m) connectionDegree = m[1];
        continue;
      }
    }

    if (
      pastName &&
      !location &&
      !connections &&
      t.length >= 3 &&
      t.length <= 280 &&
      !/\//.test(t) &&
      !isChromeLine(t) &&
      !PROFILE_A11Y_NOISE_RE.test(t) &&
      !DEGREE_ONLY_RE.test(t) &&
      !AD_RE.test(t) &&
      !/followers|mutual|show details|#opentowork/i.test(t)
    ) {
      midLines.push(t);
    }
  }

  if (nameCandidates.length) {
    // preferir texto da tela à esquerda (nome) + melhor overlap com hint
    nameCandidates.sort(
      (a, b) => b.score - a.score || a.x - b.x || a.y - b.y,
    );
    name = stripLinkedInSlugIdFromName(nameCandidates[0].text);
  }

  // mid: cargo(s) + empresa (última linha curta costuma ser empresa)
  let headline = null;
  let company = null;
  if (midLines.length === 1) {
    headline = midLines[0];
  } else if (midLines.length >= 2) {
    const last = midLines[midLines.length - 1];
    const rest = midLines.slice(0, -1);
    // empresa típica: curta, sem "em"/"de" de cargo longo
    if (last.length <= 48 && rest.join(" ").length >= 8) {
      company = last;
      headline = rest.join(" ");
    } else if (/[·•]/.test(last) && rest.length) {
      // "Elba … · Pontifícia Universidade…" → 1º segmento = empresa
      company = last.split(/\s*[·•]\s*/)[0].trim() || last;
      headline = rest.join(" ");
    } else {
      headline = midLines.join(" ");
      company = null;
    }
  }
  // empresa não pode ser o próprio nome
  if (
    company &&
    name &&
    company.replace(/\s+/g, " ").trim().toLowerCase() ===
      name.replace(/\s+/g, " ").trim().toLowerCase()
  ) {
    company = null;
  }

  let mutualConnections = null;
  if (mutualParts.length) {
    const joined = mutualParts.join(" ").replace(/\s+/g, " ").trim();
    mutualConnections = /mutual/i.test(joined)
      ? joined
      : `${joined} mutual connections`;
  }

  if (!inviteStatus && canMessage && !canConnect) {
    inviteStatus = "connected";
  }
  if (inviteStatus === "pending") canConnect = false;

  return {
    name,
    headline,
    company,
    location,
    connections,
    mutualConnections,
    connectionDegree,
    canConnect,
    canMessage,
    inviteStatus,
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

  // headline do header; fallback: 1ª linha útil em "other"
  let headline = header.headline || null;
  if (!headline) {
    const companySet = new Set(
      String(header.company || "")
        .split("\n")
        .map((s) => s.toLowerCase())
        .filter(Boolean),
    );
    for (const t of buckets.other) {
      const low = t.toLowerCase();
      if (companySet.has(low)) continue;
      if (header.name && low === header.name.toLowerCase()) continue;
      if (nameHint && low.includes(nameHint.split(/\s+/)[0])) continue;
      if (/^(connect|message|pending|follow|more|1st|2nd|3rd)/i.test(t)) continue;
      if (CONNECTIONS_RE.test(t) || /mutual/i.test(t)) continue;
      if (LOCATION_RE.test(t)) continue;
      if (isChromeLine(t)) continue;
      if (t.length >= 8 && t.length <= 180 && !/brazil|brasil/i.test(t)) {
        headline = t;
        break;
      }
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
    inviteStatus: header.inviteStatus ?? null,
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
