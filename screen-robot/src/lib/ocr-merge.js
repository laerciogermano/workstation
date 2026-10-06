/**
 * Une resultados de vários OCR: hits comuns (texto+posição) e diferenças.
 * Contrato público: [{ type:"text", text, x, y }].
 */

const DEFAULT_DIST = Number(process.env.OCR_MERGE_DIST_PX || 48);

/**
 * @param {string} s
 */
export function normalizeOcrText(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {{ text?: string, x?: number, y?: number }} a
 * @param {{ text?: string, x?: number, y?: number }} b
 * @param {number} [maxDist]
 */
export function isSameOcrHit(a, b, maxDist = DEFAULT_DIST) {
  const ta = normalizeOcrText(a?.text);
  const tb = normalizeOcrText(b?.text);
  if (!ta || !tb) return false;
  const dx = Number(a.x) - Number(b.x);
  const dy = Number(a.y) - Number(b.y);
  const dist = Math.hypot(dx, dy);
  if (dist > maxDist) return false;
  if (ta === tb) return true;
  // um contém o outro (Connect vs + Connect)
  if (ta.includes(tb) || tb.includes(ta)) return true;
  return false;
}

/**
 * Prefer text mais limpo / mais votado.
 * @param {string} cur
 * @param {string} next
 * @param {number} curVotes
 * @param {number} nextVotes
 */
function preferText(cur, next, curVotes, nextVotes) {
  const a = String(cur || "").trim();
  const b = String(next || "").trim();
  if (!a) return b;
  if (!b) return a;
  // score: menos lixo (• a +), começa com letra, comprimento moderado
  const score = (t) => {
    const junk = (t.match(/[•·▪▫□■★☆]/g) || []).length;
    const leadingJunk = /^[^A-Za-z0-9]+/.test(t) ? 3 : 0;
    const alnum = (t.match(/[a-zA-Z0-9]/g) || []).length;
    const exactWord = /^[A-Za-z][A-Za-z0-9+]*$/.test(t) ? 4 : 0;
    return alnum + exactWord - junk * 3 - leadingJunk - (t.length > 40 ? 2 : 0);
  };
  const sa = score(a);
  const sb = score(b);
  if (sb > sa + 1) return b;
  if (sa > sb + 1) return a;
  // empate de qualidade → mais votos
  if (nextVotes > curVotes) return b;
  if (curVotes > nextVotes) return a;
  return sa >= sb ? a : b;
}

/**
 * @param {Array<{ engine?: string, hits: Array<{ text?: string, x?: number, y?: number, type?: string }> }>} batches
 * @param {{ maxDist?: number, keepEngines?: boolean }} [opts]
 * @returns {Array<{ type: string, text: string, x: number, y: number, engines?: string[] }>}
 */
export function mergeOcrHits(batches, opts = {}) {
  const maxDist = opts.maxDist ?? DEFAULT_DIST;
  const keepEngines = opts.keepEngines === true;
  /** @type {Array<{ type: string, text: string, x: number, y: number, engines: string[], votes: number }>} */
  const merged = [];

  for (const batch of batches || []) {
    const engine = String(batch?.engine || "unknown");
    for (const hit of batch?.hits || []) {
      const text = String(hit?.text ?? "").trim();
      if (!text) continue;
      const x = Math.round(Number(hit.x));
      const y = Math.round(Number(hit.y));
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const cand = { type: "text", text, x, y };
      const idx = merged.findIndex((m) => isSameOcrHit(m, cand, maxDist));
      if (idx < 0) {
        merged.push({
          type: "text",
          text,
          x,
          y,
          engines: [engine],
          votes: 1,
        });
        continue;
      }
      const m = merged[idx];
      if (!m.engines.includes(engine)) m.engines.push(engine);
      m.votes += 1;
      m.text = preferText(m.text, text, m.votes - 1, 1);
      // média ponderada das coords
      const n = m.votes;
      m.x = Math.round((m.x * (n - 1) + x) / n);
      m.y = Math.round((m.y * (n - 1) + y) / n);
    }
  }

  merged.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
  return merged.map(({ votes, engines, ...rest }) =>
    keepEngines ? { ...rest, engines } : rest,
  );
}
