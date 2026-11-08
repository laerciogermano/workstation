const STOP = new Set([
  'LT',
  'LTS',
  'PCT',
  'PC',
  'PCTS',
  'UN',
  'UND',
  'CX',
  'KG',
  'GR',
  'G',
  'ML',
  'L',
  'DZ',
  'FD',
  'SC',
  'CPT',
  'CAP',
  'TP',
  'TPO',
  'REF',
  'C',
  'DE',
  'DA',
  'DO',
  'COM',
  'SEM',
]);

/** Expande abreviações comuns de NFC-e / atacado. */
export function expandAbreviacoes(raw) {
  let s = String(raw ?? '');
  const rules = [
    [/\bABS\.?\b/gi, 'ABSORVENTE '],
    [/\bABSORV\.?\b/gi, 'ABSORVENTE '],
    [/\bREFRIG\.?\b/gi, 'REFRIGERANTE '],
    [/\bREFRI\.?\b/gi, 'REFRIGERANTE '],
    [/\bSAB\.?\b/gi, 'SABONETE '],
    [/\bDET\.?\b/gi, 'DETERGENTE '],
    [/\bAMAC\.?\b/gi, 'AMACIANTE '],
    [/\bDESOD\.?\b/gi, 'DESODORANTE '],
    [/\bSHAMP\.?\b/gi, 'SHAMPOO '],
    [/\bCOND\.?\b/gi, 'CONDICIONADOR '],
    [/\bBISN\.?\b/gi, 'BISNAGA '],
    [/\bLIMP\.?\b/gi, 'LIMPADOR '],
    [/\bPAP\.?\b/gi, 'PAPEL '],
    [/\bTOALH\.?\b/gi, 'TOALHA '],
  ];
  for (const [re, rep] of rules) s = s.replace(re, rep);
  return s.replace(/\s+/g, ' ').trim();
}

/** Normaliza texto de NFC-e / busca para matching. */
export function normalizeDescricao(raw) {
  return expandAbreviacoes(raw)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((tok) => {
      if (!tok) return false;
      if (STOP.has(tok)) return false;
      if (/^\d+$/.test(tok) && tok.length <= 2) return false;
      return true;
    })
    .join(' ')
    .trim();
}

function tokens(norm) {
  return norm ? norm.split(/\s+/).filter(Boolean) : [];
}

/** Jaccard + cobertura; 0..1. */
export function scoreDescricao(queryNorm, candidateNorm) {
  const a = new Set(tokens(queryNorm));
  const b = new Set(tokens(normalizeDescricao(candidateNorm)));
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  let j = union ? inter / union : 0;
  const cand = normalizeDescricao(candidateNorm);
  if (cand.includes(queryNorm) || queryNorm.includes(cand)) {
    j = Math.max(j, 0.85);
  }
  const cover = inter / a.size;
  return Math.min(1, Math.max(j, cover * 0.95));
}

function gtinCheckOk(digits) {
  if (![8, 12, 13, 14].includes(digits.length)) return true;
  const body = digits.slice(0, -1);
  const check = Number(digits.slice(-1));
  let sum = 0;
  const rev = body.split('').reverse();
  for (let i = 0; i < rev.length; i += 1) {
    const n = Number(rev[i]);
    sum += i % 2 === 0 ? n * 3 : n;
  }
  const expected = (10 - (sum % 10)) % 10;
  return expected === check;
}

/** Valida GTIN/EAN (8–14). Prefere EAN-13: zera à esquerda em GTIN-14 `0`+13. */
export function normalizeEan(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 14) return null;
  if (digits.length === 14 && digits.startsWith('0')) {
    const as13 = digits.slice(1);
    if (gtinCheckOk(as13)) digits = as13;
  }
  if (!gtinCheckOk(digits)) return null;
  return digits;
}

/** Queries alternativas quando o catálogo zera (ex.: TRAD / MOLHO / 100G no SI5). */
export function queryVariants(descricaoNorm) {
  const base = String(descricaoNorm || '').trim();
  if (!base) return [];
  const out = [];
  const push = (q) => {
    const s = String(q || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (s && !out.includes(s)) out.push(s);
  };
  push(base);

  const weak = new Set([
    'TRAD',
    'TRADICIONAL',
    'ORIG',
    'ORIGINAL',
    'PCT',
    'PACOTE',
    'MOLHO',
    'SABOR',
    'EDICAO',
    'LIMITADA',
  ]);
  const isWeight = (t) =>
    /^\d+([.,]\d+)?(G|GR|KG|ML|L|UN|UND)?$/i.test(t) || /^\d+$/.test(t);

  const toks = base.split(/\s+/);
  const noWeak = toks.filter((t) => !weak.has(t) && !isWeight(t));
  push(noWeak.join(' '));

  // marca + último sabor significativo (ex.: PRINGLES QUEIJO)
  if (noWeak.length >= 2) {
    push(`${noWeak[0]} ${noWeak[noWeak.length - 1]}`);
    if (noWeak.length >= 3) {
      push(noWeak.slice(-2).join(' '));
      push(noWeak.slice(0, 2).join(' '));
    }
  }

  if (toks.length > 3) {
    push(toks.slice(0, -1).join(' '));
    push(toks.slice(0, -2).join(' '));
  }
  return out;
}

export function extractEansFromText(text) {
  const out = [];
  const seen = new Set();
  for (const m of String(text ?? '').matchAll(/\b(\d{8,14})\b/g)) {
    const ean = normalizeEan(m[1]);
    if (!ean || seen.has(ean)) continue;
    // ignora códigos internos curtos sem prefixo GS1 BR quando ambíguos
    seen.add(ean);
    out.push(ean);
  }
  return out;
}
