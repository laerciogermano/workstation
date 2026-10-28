/** Dedup fuzzy no upsert de profiles (nome + current). */

export const DEFAULT_MATCH_SCORE_MIN = 0.88;
export const DEFAULT_NAME_SCORE_MIN = 0.85;

export function matchScoreMin(): number {
  const raw = process.env.PROFILE_MATCH_SCORE_MIN;
  if (raw == null || raw === '') return DEFAULT_MATCH_SCORE_MIN;
  const n = Number(raw);
  return Number.isFinite(n) ? n : DEFAULT_MATCH_SCORE_MIN;
}

export function nameScoreMin(): number {
  const raw = process.env.PROFILE_NAME_SCORE_MIN;
  if (raw == null || raw === '') return DEFAULT_NAME_SCORE_MIN;
  const n = Number(raw);
  return Number.isFinite(n) ? n : DEFAULT_NAME_SCORE_MIN;
}

export function normalize(s: string | null | undefined): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokens do nome para query de candidatos: primeiro + último.
 * Evita "Cristiane Simões Carvalho" → LIKE %simoes% (não acha "Cristiane Carvalho").
 */
export function nameTokens(name: string | null | undefined): string[] {
  const parts = normalize(name).split(' ').filter(Boolean);
  if (parts.length <= 2) return parts;
  return [parts[0], parts[parts.length - 1]];
}

/** LOWER + tira acento no SQL (PG) p/ LIKE bater "tributaria" em "Tributária". */
export function sqlUnaccentLower(expr: string): string {
  return `translate(LOWER(COALESCE(${expr}, '')), 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn')`;
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length;
  const n = b.length;
  /** @type {number[]} */
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

export function stringSimilarity(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na && !nb) return 1;
  if (!na || !nb) return 0;
  const maxLen = Math.max(na.length, nb.length);
  if (!maxLen) return 1;
  return 1 - levenshtein(na, nb) / maxLen;
}

export function nameSimilarity(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  return stringSimilarity(a, b);
}

/**
 * Nome p/ skip de extract: tira pronome (Ela/Dela), id numérico do slug LinkedIn
 * e pontuação — "Rafaela Ferreira 870ab9315" ≈ "Rafaela Ferreira".
 */
export function stripNameNoise(s: string | null | undefined): string {
  const base = normalize(s)
    .replace(/\b(ela|dela|ele|dele|she|her|he|him|they|them)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // tira id do slug no fim ("870ab9315", "6bb660189", "923870410")
  const parts = base.split(' ').filter(Boolean);
  while (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const isId =
      /^\d{4,}$/.test(last) ||
      (last.length >= 6 &&
        last.length <= 14 &&
        /[0-9]/.test(last) &&
        /^[a-z0-9]+$/i.test(last));
    if (!isId) break;
    parts.pop();
  }
  return parts.join(' ');
}

/** Similaridade de nome para dedupe de candidato (mais tolerante que upsert). */
export function candidateNameSimilarity(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const na = stripNameNoise(a);
  const nb = stripNameNoise(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const pa = na.split(' ').filter(Boolean);
  const pb = nb.split(' ').filter(Boolean);
  const ca = na.replace(/\s+/g, '');
  const cb = nb.replace(/\s+/g, '');
  // stub slug colado: "Samuel Lopes" ≈ "Samuelslopes" (compact ≈, não só com espaço)
  if (Math.min(ca.length, cb.length) >= 6) {
    const compactSim = stringSimilarity(ca, cb);
    if (ca === cb) return 0.96;
    if (compactSim >= 0.9) return Math.max(0.95, compactSim);
  }
  const ta = pa.slice(0, 2).join(' ');
  const tb = pb.slice(0, 2).join(' ');
  // "Bárbara Oliveira" ⊂ "Bárbara Oliveira Ela / Dela"
  if (ta.length >= 5 && ta === tb) return 0.95;
  // mesmo 1º + último; meio opcional (Cristiane Simões Carvalho ≈ Cristiane Carvalho)
  if (
    pa.length >= 2 &&
    pb.length >= 2 &&
    pa[0] === pb[0] &&
    pa[pa.length - 1] === pb[pb.length - 1] &&
    pa[0].length >= 3 &&
    pa[pa.length - 1].length >= 3
  ) {
    return 0.96;
  }
  // mesmo sobrenome + 1º nome OCR só se bem parecido (Luís↔Lusi).
  // NÃO: Ana Silva ≈ Karina Silva (sobrenome comum + firstSim fraco).
  if (
    pa.length >= 2 &&
    pb.length >= 2 &&
    pa[1] === pb[1] &&
    pa[1].length >= 4
  ) {
    const fa = pa[0];
    const fb = pb[0];
    const firstSim = stringSimilarity(fa, fb);
    const lenClose = Math.abs(fa.length - fb.length) <= 2;
    const samePrefix =
      fa.length >= 3 && fb.length >= 3 && fa.slice(0, 2) === fb.slice(0, 2);
    if (firstSim >= 0.8) return Math.max(0.92, 0.7 + 0.3 * firstSim);
    if (samePrefix && lenClose && firstSim >= 0.45) return 0.92;
  }
  if (na.startsWith(nb) || nb.startsWith(na)) {
    const shorter = Math.min(na.length, nb.length);
    const longer = Math.max(na.length, nb.length);
    if (longer && shorter / longer >= 0.65) return 0.93;
  }
  const raw = stringSimilarity(na, nb);
  // espaçado vs 1 token com compact fraco: não deixar espaço sozinho ≥ 0.9
  const tokenMismatch =
    (pa.length >= 2 && pb.length === 1) || (pb.length >= 2 && pa.length === 1);
  if (tokenMismatch) {
    const compactSim = stringSimilarity(ca, cb);
    if (compactSim < 0.9) return Math.min(raw, compactSim, 0.88);
  }
  return raw;
}

export function currentSimilarity(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na && !nb) return 1;
  if (!na || !nb) return 0.5;
  return stringSimilarity(na, nb);
}

export type MatchBreakdown = {
  nameSimilarity: number;
  currentSimilarity: number;
  matchScore: number;
  shouldMerge: boolean;
};

export function matchScore(
  incoming: { name?: string | null; current?: string | null },
  existing: { name?: string | null; current?: string | null },
  opts?: { matchMin?: number; nameMin?: number },
): MatchBreakdown {
  const nameSim = nameSimilarity(incoming.name, existing.name);
  const currentSim = currentSimilarity(incoming.current, existing.current);
  const score = 0.75 * nameSim + 0.25 * currentSim;
  const matchMin = opts?.matchMin ?? matchScoreMin();
  const nameMin = opts?.nameMin ?? nameScoreMin();
  return {
    nameSimilarity: nameSim,
    currentSimilarity: currentSim,
    matchScore: score,
    shouldMerge: score >= matchMin && nameSim >= nameMin,
  };
}

/** Campo opcional: ambos vazios = 1; um vazio = 0.5; senão similaridade. */
export function optionalFieldSimilarity(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na && !nb) return 1;
  if (!na || !nb) return 0.5;
  return stringSimilarity(na, nb);
}

export type ConnectionMatchBreakdown = {
  nameSimilarity: number;
  currentSimilarity: number;
  titleSimilarity: number;
  citySimilarity: number;
  matchScore: number;
  /** true = já existe na base de conexões → skip no extract. */
  matched: boolean;
};

/**
 * Score p/ “já temos conexão com este candidato?” (nome + empresa + cargo + cidade).
 * Não usa botão Connect/Pending da UI — só campos de card/CRM.
 */
export function connectionCandidateMatch(
  incoming: {
    name?: string | null;
    title?: string | null;
    city?: string | null;
    current?: string | null;
  },
  existing: {
    name?: string | null;
    title?: string | null;
    city?: string | null;
    current?: string | null;
  },
  opts?: { matchMin?: number; nameMin?: number; strongNameMin?: number },
): ConnectionMatchBreakdown {
  const nameSim = candidateNameSimilarity(incoming.name, existing.name);
  const currentSim = optionalFieldSimilarity(incoming.current, existing.current);
  const titleSim = optionalFieldSimilarity(incoming.title, existing.title);
  const citySim = optionalFieldSimilarity(incoming.city, existing.city);
  const score =
    0.5 * nameSim + 0.2 * currentSim + 0.15 * titleSim + 0.15 * citySim;
  const matchMin = opts?.matchMin ?? matchScoreMin();
  const nameMin = opts?.nameMin ?? nameScoreMin();
  const strongNameMin = opts?.strongNameMin ?? 0.9;
  // Stub (sem cargo/cidade/empresa): nome forte só se quase idêntico (≥0.95 /
  // compact). Evita "Samuel Lopes"≈"Samuelslopes" via levenshtein 0.91 sozinho
  // quando o slug é outra pessoa; mesma pessoa ainda casa com compact 0.96.
  const existingSparse =
    !normalize(existing.current) &&
    !normalize(existing.title) &&
    !normalize(existing.city);
  const strongAlone =
    nameSim >= strongNameMin && (!existingSparse || nameSim >= 0.95);
  const matched =
    strongAlone || (score >= matchMin && nameSim >= nameMin);
  return {
    nameSimilarity: nameSim,
    currentSimilarity: currentSim,
    titleSimilarity: titleSim,
    citySimilarity: citySim,
    matchScore: score,
    matched,
  };
}
