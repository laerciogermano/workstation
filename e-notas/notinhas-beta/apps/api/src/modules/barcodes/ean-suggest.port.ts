import type { SuggestionDTO } from '@notinhas/contracts';

/** Candidato externo de EAN pela descrição (REQ-044 · ean-serp / SI5). */
export interface EanSuggestPort {
  byDescription(descricao: string, limit?: number): Promise<SuggestionDTO[]>;
}

/** Sem serviço externo — só catálogo local. */
export function createNoopEanSuggestAdapter(): EanSuggestPort {
  return { async byDescription() { return []; } };
}

/**
 * Cliente HTTP do `ean-serp` (`GET /ean/si5`).
 * Falha de rede/timeout → lista vazia (sugestão é best-effort).
 */
export function createEanSerpAdapter(opts: {
  baseUrl: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): EanSuggestPort {
  const doFetch = opts.fetchImpl ?? fetch;
  const base = opts.baseUrl.replace(/\/$/, '');
  return {
    async byDescription(descricao, limit = 8) {
      const q = descricao.trim();
      if (!q) return [];
      try {
        const url = new URL(`${base}/ean/si5`);
        url.searchParams.set('descricao', q);
        url.searchParams.set('n', String(Math.min(Math.max(limit, 1), 24)));
        url.searchParams.set('enrich', '1');
        const res = await doFetch(url, {
          signal: AbortSignal.timeout(opts.timeoutMs ?? 12_000),
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return [];
        const body = (await res.json()) as {
          candidatos?: { ean?: string; score?: number; nome_canonico?: string | null; image_url?: string | null }[];
        };
        return (body.candidatos ?? [])
          .map((c) => {
            const gtin = String(c.ean ?? '').replace(/\D/g, '');
            const score = Number(c.score) || 0;
            if (gtin.length < 8 || score < 0.35) return null;
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
      } catch {
        return [];
      }
    },
  };
}
