import type { SuggestionDTO } from '@notinhas/contracts';

/** Candidato externo de EAN pela descrição (REQ-044 · ean-serp / SI5). */
export interface EanSuggestPort {
  byDescription(descricao: string, limit?: number): Promise<SuggestionDTO[]>;
  /**
   * Fotos SI5 + Google Imagens para um EAN (REQ-040 / REQ-042) — best-effort.
   * `descricao` melhora a query do Google (`EAN + nome`).
   */
  photosByGtin(gtin: string, opts?: { descricao?: string }): Promise<{ url: string; source: string }[]>;
}

/** Sem serviço externo — só catálogo local. */
export function createNoopEanSuggestAdapter(): EanSuggestPort {
  return { async byDescription() { return []; }, async photosByGtin() { return []; } };
}

/**
 * Cliente HTTP do `ean-serp` (`GET /ean/si5` + `/ean/google-imagens`).
 * Falha de rede/timeout → lista vazia (sugestão é best-effort).
 */
export function createEanSerpAdapter(opts: {
  baseUrl: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): EanSuggestPort {
  const doFetch = opts.fetchImpl ?? fetch;
  const base = opts.baseUrl.replace(/\/$/, '');
  async function si5(descricao: string, limit: number) {
    const url = new URL(`${base}/ean/si5`);
    url.searchParams.set('descricao', descricao);
    // ean-serp MAX_LIMIT = 100; pedimos folga p/ filtro de score
    url.searchParams.set('n', String(Math.min(Math.max(limit, 1), 100)));
    url.searchParams.set('enrich', '1');
    const res = await doFetch(url, {
      signal: AbortSignal.timeout(opts.timeoutMs ?? 20_000),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [] as SuggestionDTO[];
    const body = (await res.json()) as {
      candidatos?: { ean?: string; score?: number; nome_canonico?: string | null; image_url?: string | null }[];
    };
    return (body.candidatos ?? [])
      .map((c) => {
        const gtin = String(c.ean ?? '').replace(/\D/g, '');
        const score = Number(c.score) || 0;
        if (gtin.length < 8 || score < 0.2) return null;
        return {
          gtin,
          title: (c.nome_canonico || gtin).trim(),
          photoUrl: c.image_url && c.image_url.startsWith('https://') ? c.image_url : null,
          score: Math.round(Math.min(1, score) * 100) / 100,
          source: 'si5' as const,
        };
      })
      .filter((s): s is SuggestionDTO => !!s)
      .slice(0, limit);
  }

  async function googleImagens(query: string, limit: number) {
    const url = new URL(`${base}/ean/google-imagens`);
    url.searchParams.set('descricao', query);
    url.searchParams.set('n', String(Math.min(Math.max(limit, 1), 40)));
    const res = await doFetch(url, {
      signal: AbortSignal.timeout(opts.timeoutMs ?? 35_000),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [] as { url: string; source: string }[];
    const body = (await res.json()) as { imagens?: { url?: string; source?: string }[] };
    const out: { url: string; source: string }[] = [];
    const seen = new Set<string>();
    for (const img of body.imagens ?? []) {
      const u = String(img?.url ?? '').trim();
      if (!u.startsWith('https://') || seen.has(u)) continue;
      seen.add(u);
      out.push({ url: u, source: img.source || 'Google' });
      if (out.length >= limit) break;
    }
    return out;
  }

  return {
    async byDescription(descricao, limit = 50) {
      const q = descricao.trim();
      if (!q) return [];
      try {
        return await si5(q, limit);
      } catch {
        return [];
      }
    },
    async photosByGtin(gtin, photoOpts) {
      const code = String(gtin).replace(/\D/g, '');
      if (code.length < 8) return [];
      const nome = String(photoOpts?.descricao ?? '').trim();
      const googleQ = [code, nome].filter(Boolean).join(' ').slice(0, 180);

      const [si5Hits, googleHits] = await Promise.all([
        si5(code, 8).catch(() => [] as SuggestionDTO[]),
        googleImagens(googleQ, 24).catch(() => [] as { url: string; source: string }[]),
      ]);

      const urls = new Map<string, string>();
      for (const h of si5Hits) {
        if (!h.photoUrl) continue;
        if (h.gtin === code || h.gtin.endsWith(code) || code.endsWith(h.gtin)) {
          urls.set(h.photoUrl, 'SI5');
        } else if (urls.size < 4) {
          urls.set(h.photoUrl, 'SI5');
        }
      }
      for (const g of googleHits) {
        if (!urls.has(g.url)) urls.set(g.url, g.source || 'Google');
      }
      return [...urls.entries()].map(([url, source]) => ({ url, source }));
    },
  };
}
