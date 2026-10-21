/**
 * Heurística: fatiar OCR da página de perfil LinkedIn por âncoras About / Experience / Education.
 */

const SECTION_RE = /^(about|experience|education)$/i;

/**
 * @param {object[]} els elementos do extract ({ text, x, y })
 * @returns {{ headline: string|null, location: string|null, about: string|null, experience: string|null, education: string|null, texts: string[] }}
 */
export function parseProfilePageOcr(els, opts = {}) {
  const nameHint = String(opts.nameHint || "")
    .trim()
    .toLowerCase();
  const texts = (Array.isArray(els) ? els : [])
    .map((e) => String(e?.text || "").trim())
    .filter(Boolean);

  /** @type {Record<string, string[]>} */
  const buckets = { about: [], experience: [], education: [], other: [] };
  let section = "other";

  for (const t of texts) {
    const key = t.replace(/\s+/g, " ").trim();
    if (SECTION_RE.test(key)) {
      section = key.toLowerCase();
      continue;
    }
    if (section === "about" || section === "experience" || section === "education") {
      buckets[section].push(t);
    } else {
      buckets.other.push(t);
    }
  }

  const join = (arr) => (arr.length ? arr.join("\n") : null);

  // Headline: primeira linha "longa" abaixo do nome (heurística)
  let headline = null;
  let location = null;
  const others = buckets.other;
  for (let i = 0; i < others.length; i++) {
    const t = others[i];
    const low = t.toLowerCase();
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
      break;
    }
  }

  return {
    headline,
    location,
    about: join(buckets.about),
    experience: join(buckets.experience),
    education: join(buckets.education),
    texts,
  };
}
