export interface ProductInfo {
  title: string;
  brand: string | null;
  photoUrls: string[];
  categoriesHint: string;
  source: 'openfoodfacts';
}

/** Ficha externa do produto por EAN (REQ-048). Adaptador: Open Food Facts. */
export interface ProductLookupPort {
  byGtin(gtin: string): Promise<ProductInfo | null>;
}

/** Open Food Facts — API pública, sem chave. Falha = null (enriquecimento é opcional). */
export function createOpenFoodFactsAdapter(opts: { timeoutMs?: number; fetchImpl?: typeof fetch } = {}): ProductLookupPort {
  const doFetch = opts.fetchImpl ?? fetch;
  return {
    async byGtin(gtin) {
      try {
        const res = await doFetch(
          `https://world.openfoodfacts.org/api/v2/product/${gtin}.json?fields=product_name,product_name_pt,brands,quantity,image_front_url,image_url,categories_tags`,
          {
            signal: AbortSignal.timeout(opts.timeoutMs ?? 4000),
            headers: { 'User-Agent': 'notinhas.shop/1.0 (contato@notinhas.shop)' },
          },
        );
        if (!res.ok) return null;
        const body = (await res.json()) as {
          status?: number;
          product?: {
            product_name?: string; product_name_pt?: string; brands?: string; quantity?: string;
            image_front_url?: string; image_url?: string; categories_tags?: string[];
          };
        };
        const p = body.product;
        const name = p?.product_name_pt || p?.product_name;
        if (body.status !== 1 || !p || !name) return null;
        const brand = p.brands?.split(',')[0]?.trim() || null;
        const title = [name, p.quantity && !name.includes(p.quantity) ? p.quantity : ''].filter(Boolean).join(' ').trim();
        const photoUrls = [p.image_front_url, p.image_url].filter((u): u is string => !!u && u.startsWith('https://'));
        return { title, brand, photoUrls: [...new Set(photoUrls)], categoriesHint: (p.categories_tags ?? []).join(' '), source: 'openfoodfacts' };
      } catch {
        return null;
      }
    },
  };
}
