/**
 * Heurística: fatiar OCR da página de perfil LinkedIn por âncoras About / Experience / Education.
 */

const SECTION_RE = /^(about|experience|education|skills|activity|featured|interests)$/i;
const URL_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9._%-]+\/?/i;

/**
 * @param {object[]} els elementos do extract ({ text, x, y })
 * @returns {{
 *   headline: string|null,
 *   location: string|null,
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
    if (SECTION_RE.test(key)) {
      const s = key.toLowerCase();
      section =
        s === "about" ||
        s === "experience" ||
        s === "education" ||
        s === "skills"
          ? s
          : "other";
      continue;
    }
    if (buckets[section]) buckets[section].push(t);
    else buckets.other.push(t);
  }

  const join = (arr) => (arr.length ? arr.join("\n") : null);

  let headline = null;
  let location = null;
  let connectionDegree = null;
  const others = buckets.other;
  for (let i = 0; i < others.length; i++) {
    const t = others[i];
    const low = t.toLowerCase();
    if (/\b(1st|2nd|3rd\+?)\b/i.test(t) && !connectionDegree) {
      const m = t.match(/\b(1st|2nd|3rd\+?)\b/i);
      if (m) connectionDegree = m[1];
    }
    if (nameHint && low.includes(nameHint.split(/\s+/)[0])) continue;
    if (/^(connect|message|pending|follow|more|1st|2nd|3rd)/i.test(t)) continue;
    if (!headline && t.length >= 8 && t.length <= 180) {
      headline = t;
      continue;
    }
    if (
      !location &&
      headline &&
      /,\s*|brazil|brasil|minas|paulo|horizon|campinas|remote/i.test(t) &&
      t.length <= 120
    ) {
      location = t;
    }
  }

  return {
    headline,
    location,
    about: join(buckets.about),
    experience: join(buckets.experience),
    education: join(buckets.education),
    skills: join(buckets.skills),
    connectionDegree,
    profileUrl: findLinkedInProfileUrl(texts),
    texts,
  };
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
