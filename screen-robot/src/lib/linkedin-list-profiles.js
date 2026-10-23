/**
 * Parse de cards da lista LinkedIn People a partir do OCR (sem IA).
 * Usado por scripts/login-extract-profiles.js e testes de fixture.
 * Engine: `opts.engine` → pré-processamento em linkedin-list-profiles-engines.js
 * (rapidocr descola texto; tesseract une linhas / ancora ações).
 */
import { prepareElementsForEngine } from "./linkedin-list-profiles-engines.js";

/** Partículas de nome BR/PT (OCR traz "de"/"da" em minúsculo). */
export const NAME_PARTICLES = new Set([
  "de",
  "da",
  "do",
  "dos",
  "das",
  "e",
  "di",
  "del",
  "van",
  "von",
]);

const BAD_NAME_RE =
  /\b(month|cancel|premium|try|free|dismiss|skip|ignore|linkedin|connect|pending|message|follow|current|past|mutual|connection|comprador|compradora|gest[aã]o|university|pramet|dormer|construtora|brazil|brasil|location|specialist|buyer|coordinator|procurement|jobs|posts|schools|courses|people|ltda|llc|inc|chain|supply|suprimentos|compras|analista|edited|yesterday|today|hour|minute|viewed|horizonte|paulo|minas|gerais|campinas|contagem|indaiatuba|sarzedo|curitiba|pendin|reforma|tribut[aá]ria|founder|ceo|desafios|profissionais|aplicada)\b/i;

/** Ações do card People (padrão da lista de prospecção). */
export const PEOPLE_CARD_ACTIONS = new Set(["Connect", "Pending", "Message"]);

/**
 * OCR do botão: "© Pending", "i+ Connect", "+ Connect", "+ Follow".
 * @returns {"Connect"|"Pending"|"Message"|"Follow"|null}
 */
export function parseActionLabel(text) {
  const raw = String(text || "").trim();
  if (!raw || /mutual|connection/i.test(raw)) return null;
  if (!/\b(connect|pending|message|follow)\b/i.test(raw)) return null;
  if (/\bpending\b/i.test(raw)) return "Pending";
  if (/\bconnect\b/i.test(raw)) return "Connect";
  if (/\bfollow\b/i.test(raw)) return "Follow";
  if (/\bmessage\b/i.test(raw)) return "Message";
  return null;
}

export function cleanName(raw) {
  const words = String(raw || "")
    .trim()
    .replace(/[©®]/g, " ")
    .replace(/[·•].*$/, "")
    .replace(/\s*[-–]\s*\d*(st|nd|rd|th)?\+?.*$/i, "")
    .replace(/\s+[A-Za-z]$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const out = [];
  for (const w of words) {
    if (out.length && out[out.length - 1].toLowerCase() === w.toLowerCase()) {
      continue;
    }
    out.push(w);
  }
  return out.join(" ");
}

export function isValidProfileName(name) {
  const n = cleanName(name);
  if (n.length < 5 || n.length > 70) return false;
  if (BAD_NAME_RE.test(n)) return false;
  if (/[a-z][A-Z]/.test(n)) return false;
  if (/current:|past:|,/i.test(n)) return false;
  const words = n.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) return false;
  if (words[0].length < 2) return false;
  // "Sabrina Patricia dos" / "Artur de" = sobrenome incompleto (OCR cortou)
  if (NAME_PARTICLES.has(words[words.length - 1].toLowerCase())) return false;
  // "Cristiane Simões O Carvalho" / "Bl OA" — letras soltas ou siglas OCR
  if (
    words.some(
      (w) =>
        (w.length < 2 && !NAME_PARTICLES.has(w.toLowerCase())) ||
        (w.length <= 2 &&
          w === w.toUpperCase() &&
          !NAME_PARTICLES.has(w.toLowerCase())),
    )
  ) {
    return false;
  }
  if (!words.every((w) => /^[\p{L}']+$/u.test(w))) return false;
  if (words.some((w) => w.length >= 3 && w === w.toUpperCase())) return false;
  if (!/^[\p{Lu}]/u.test(words[0])) return false;
  for (const w of words.slice(1)) {
    if (NAME_PARTICLES.has(w.toLowerCase())) continue;
    if (!/^[\p{Lu}]/u.test(w)) return false;
  }
  return true;
}

/** Card em destaque: nome bem acima do Connect (~187px). Lista comum: ~0–80px. */
const NAME_ABOVE_ACTION_PX = 220;

export function pickNameAboveAction(elements, act) {
  const band = elements.filter(
    (e) =>
      e.y >= act.y - NAME_ABOVE_ACTION_PX &&
      e.y <= act.y + 20 &&
      e.x < 420 &&
      e.y > 160,
  );
  /** @type {{ name: string, x: number, y: number, score: number }[]} */
  const scored = [];
  for (const e of band) {
    const raw = String(e.text || "");
    if (parseActionLabel(raw)) continue;
    const name = cleanName(raw);
    if (!isValidProfileName(name)) continue;
    let score = name.length;
    if (/\s/.test(raw)) score += 40;
    if (name.split(/\s+/).length >= 2) score += 20;
    if (/[•·]/.test(raw) || /\b(1st|2nd|3rd)/i.test(raw)) score += 60;
    scored.push({ name, x: e.x, y: e.y, score });
  }
  scored.sort((a, b) => b.score - a.score || a.y - b.y);
  return scored[0] || null;
}

/**
 * @param {{ name: string, action: string, texts: string[] }} card
 */
export function parseCardFields(card) {
  const texts = (card.texts || []).map((t) => String(t || "").trim()).filter(Boolean);
  const joined = texts.join(" | ");

  let nivel = null;
  const nivelHit = joined.match(/\b(1st|2nd|3rd\+)\b/i);
  if (nivelHit) {
    const n = nivelHit[1].toLowerCase();
    nivel = n.startsWith("1") ? "1st" : n.startsWith("2") ? "2nd" : "3rd+";
  }

  const status =
    parseActionLabel(card.action) || String(card.action || "").trim() || null;

  let mutualConnections = null;
  const mutualJoined = texts.find((t) => /mutual\s*connections?/i.test(t));
  if (mutualJoined) {
    const m = mutualJoined.match(/(\d+)\s*mutual/i);
    mutualConnections = m
      ? `${m[1]} mutual connections`
      : mutualJoined.replace(/\s+/g, " ");
  } else {
    const hasMutual = texts.some(
      (t) => /^mutual$/i.test(t) || /^connections?$/i.test(t),
    );
    if (hasMutual) {
      const num = texts.find((t) => /^\d+$/.test(t));
      mutualConnections = num
        ? `${num} mutual connections`
        : "mutual connections";
    }
  }

  let cidade = null;
  const cityLine = texts.find(
    (t) =>
      /,\s*(Brazil|Brasil|SP|RJ|MG|PR|RS|BA|PE|CE)/i.test(t) ||
      /\b(São Paulo|Sao Paulo|Campinas|Belo Horizonte|Rio de Janeiro|Curitiba|Porto Alegre|Brasília|Brasilia|Greater Belo Horizonte|Contagem|Sarzedo|Indaiatuba)\b/i.test(
        t,
      ),
  );
  if (cityLine) {
    cidade = cityLine.replace(/\s+/g, " ").trim();
  } else {
    const cityish = texts.filter(
      (t) =>
        /\b(paulo|horizonte|campinas|janeiro|curitiba|alegre|bras[ií]lia|minas|gerais|brazil|brasil|contagem|sarzedo|indaiatuba)\b/i.test(
          t,
        ) && !/premium|cancel|month|activate/i.test(t),
    );
    if (cityish.length) {
      cidade = [...new Set(cityish.map((t) => t.replace(/\s+/g, " ").trim()))]
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  let title = null;
  const titleHit = texts.find(
    (t) =>
      (/\|/.test(t) ||
        /\.\.\.$/.test(t) ||
        /Comprador|Procurement|Coordenador|Supervisora|Planejador/i.test(t)) &&
      t.length >= 6 &&
      !/premium|cancel|mutual|brazil|current:|past:/i.test(t) &&
      !parseActionLabel(t) &&
      !/^\d/.test(t),
  );
  if (titleHit) title = titleHit.replace(/\s+/g, " ").trim();

  let current = null;
  const currentHit = texts.find(
    (t) => /^current:\s*/i.test(t) || /current:\s*\S/i.test(t),
  );
  if (currentHit) {
    current = currentHit.replace(/\s+/g, " ").replace(/^current:\s*/i, "").trim();
  }

  let past = null;
  const pastHit = texts.find(
    (t) => /^past:\s*/i.test(t) || /past:\s*\S/i.test(t),
  );
  if (pastHit) {
    past = pastHit.replace(/\s+/g, " ").replace(/^past:\s*/i, "").trim();
  }

  /** Objeto canônico do perfil na lista. */
  return {
    name: card.name,
    title,
    level: nivel,
    connection: status,
    city: cidade,
    mutualConnections,
    current,
    past,
  };
}

/**
 * Cards da lista a partir do OCR.
 * @param {{ text?: string, x: number, y: number }[]} elements
 * @param {{ engine?: string }} [opts] `rapidocr` | `tesseract` | `macos-vision` | …
 */
export function profilesFromExtract(elements, opts = {}) {
  const engine = opts.engine || process.env.SCREEN_ROBOT_OCR || "macos-vision";
  const els = prepareElementsForEngine(elements, engine);

  const actionsRaw = els
    .map((e) => {
      const label = parseActionLabel(e.text);
      if (!label || e.y <= 160 || e.y >= 980) return null;
      return { ...e, actionLabel: label };
    })
    .filter(Boolean)
    .sort((a, b) => a.y - b.y);
  // Uma ação por card (OCR/pré-processamento pode duplicar Pending/Connect no mesmo y)
  /** @type {typeof actionsRaw} */
  const actions = [];
  for (const a of actionsRaw) {
    if (actions.some((o) => Math.abs(o.y - a.y) <= 28)) continue;
    actions.push(a);
  }

  /** @type {object[]} */
  const out = [];
  const seen = new Set();

  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];
    const picked = pickNameAboveAction(els, act);
    if (!picked) continue;

    // Faixa a partir do nome (não do topo da tela) — evita misturar card anterior.
    const yTop = Math.max(160, picked.y - 12);
    const yBot =
      i === actions.length - 1
        ? Math.min(980, Math.max(act.y, picked.y) + 220)
        : Math.min(
            actions[i + 1].y - 8,
            Math.max(act.y, picked.y) + 220,
          );

    const card = els
      .filter((e) => e.y >= yTop && e.y < yBot && e.x < 540)
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .map((e) => ({ text: e.text, x: e.x, y: e.y }));

    const key = picked.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const cardTop = Math.max(0, Math.min(yTop, picked.y - 24));
    const cardBot = Math.max(cardTop + 80, Math.min(980, yBot));
    const base = {
      name: picked.name,
      key,
      action: act.actionLabel,
      x: picked.x,
      y: picked.y,
      actionY: act.y,
      /** Região do card na lista (px no OCR / frame 540×960). */
      cardBounds: {
        left: 8,
        top: cardTop,
        width: 524,
        height: cardBot - cardTop,
      },
      texts: card.map((e) => e.text),
      ocr: card,
    };
    out.push({
      ...base,
      fields: parseCardFields(base),
    });
  }
  return out;
}
