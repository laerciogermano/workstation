/**
 * Enriquecimento da ficha canônica `produtos_ean` a partir do EAN.
 * Fontes abertas/grátis: PreçoMelhor → Open*Facts → UPCitemdb.
 */
import { downloadEanImage } from './ean-imagens.js';

const UA =
  'notinhas.shop/0.1 (produto-ean-enrich; +https://notinhas.shop)';
const FETCH_MS = 12_000;

/** @type {Map<string, Promise<unknown>>} */
const inflight = new Map();

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function digitsEan(raw) {
  return String(raw ?? '').replace(/\D/g, '');
}

async function fetchJson(url, { headers } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': UA,
        Accept: 'application/json',
        ...(headers || {}),
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function pickTitulo(...vals) {
  for (const v of vals) {
    const s = String(v || '')
      .replace(/#/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (s && s.length >= 3) return s.slice(0, 512);
  }
  return null;
}

function uniqCats(list) {
  const out = [];
  const seen = new Set();
  for (const raw of list || []) {
    const c = String(raw || '')
      .replace(/^en:/i, '')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!c) continue;
    const key = c.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c.slice(0, 64));
    if (out.length >= 20) break;
  }
  return out;
}

async function fromPrecoMelhor(ean) {
  const data = await fetchJson(
    `https://www.precomelhor.com.br/api/product/${encodeURIComponent(ean)}`,
  );
  const p = data?.product;
  if (!p || typeof p !== 'object') return null;
  const cats = uniqCats([
    p.category_name,
    ...(String(p.category_path || '')
      .split('>')
      .map((s) => s.trim())
      .filter((s) => s && !/^root$/i.test(s))),
  ]);
  return {
    fonte: 'precomelhor',
    titulo: pickTitulo(p.product_name, p.multilingual_title?.split?.('|')?.[0]),
    marca: pickTitulo(p.brand_name, p.brand) || null,
    descricao: pickTitulo(p.meta_description) || null,
    categorias: cats,
    ncm: p.ncm ? String(p.ncm).replace(/\s/g, '') : null,
    cest: p.cest ? String(p.cest).replace(/\D/g, '') : null,
    quantidade:
      Number.isFinite(Number(p.normalized_value)) && Number(p.normalized_value) > 0
        ? Number(p.normalized_value)
        : null,
    quantidade_unidade: p.normalized_unit
      ? String(p.normalized_unit).slice(0, 16)
      : null,
    nutriscore: p.nutriscore_grade
      ? String(p.nutriscore_grade).slice(0, 8)
      : null,
    image_url: p.image_url || null,
    extras: {
      manufacturer_name: p.manufacturer_name || null,
      packaging_material: p.packaging_material || null,
      nova_group: p.nova_group ?? null,
      eco_score: p.eco_score || null,
      category_path: p.category_path || null,
    },
  };
}

async function fromOpenFacts(ean, host, fonte) {
  const data = await fetchJson(
    `https://${host}/api/v2/product/${encodeURIComponent(ean)}.json`,
  );
  if (!data || data.status !== 1 || !data.product) return null;
  const p = data.product;
  const cats = uniqCats([
    ...(Array.isArray(p.categories_tags) ? p.categories_tags : []),
    ...(String(p.categories || '')
      .split(',')
      .map((s) => s.trim())),
  ]);
  const qty = p.product_quantity || p.quantity;
  let quantidade = null;
  let quantidade_unidade = null;
  const m = String(qty || '').match(/([\d.,]+)\s*([a-zA-Zµ]+)?/);
  if (m) {
    quantidade = Number(String(m[1]).replace(',', '.'));
    if (!Number.isFinite(quantidade)) quantidade = null;
    quantidade_unidade = m[2] ? String(m[2]).slice(0, 16) : null;
  }
  return {
    fonte,
    titulo: pickTitulo(
      p.product_name_pt,
      p.product_name,
      p.generic_name_pt,
      p.generic_name,
    ),
    marca: pickTitulo(p.brands) || null,
    descricao: pickTitulo(p.generic_name_pt, p.generic_name) || null,
    categorias: cats,
    ncm: null,
    cest: null,
    quantidade,
    quantidade_unidade,
    nutriscore: p.nutriscore_grade
      ? String(p.nutriscore_grade).slice(0, 8)
      : null,
    image_url:
      p.image_front_url || p.image_url || p.image_front_small_url || null,
    extras: {
      nova_group: p.nova_group ?? null,
      labels: p.labels || null,
    },
  };
}

async function fromUpcitemdb(ean) {
  const data = await fetchJson(
    `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(ean)}`,
  );
  const item = Array.isArray(data?.items) ? data.items[0] : null;
  if (!item) return null;
  return {
    fonte: 'upcitemdb',
    titulo: pickTitulo(item.title),
    marca: pickTitulo(item.brand) || null,
    descricao: pickTitulo(item.description) || null,
    categorias: uniqCats([item.category]),
    ncm: null,
    cest: null,
    quantidade: null,
    quantidade_unidade: null,
    nutriscore: null,
    image_url: Array.isArray(item.images) ? item.images[0] : null,
    extras: { ean_upcitemdb: item.ean || item.upc || null },
  };
}

/**
 * Mescla hits por prioridade (primeiro ganha campos vazios do acumulado).
 * @param {object[]} hits
 */
export function mergeProdutoHits(hits) {
  const out = {
    titulo: null,
    marca: null,
    descricao: null,
    categorias: [],
    ncm: null,
    cest: null,
    quantidade: null,
    quantidade_unidade: null,
    nutriscore: null,
    image_url: null,
    fontes: [],
    extras: {},
  };
  for (const h of hits) {
    if (!h) continue;
    out.fontes.push(h.fonte);
    if (!out.titulo && h.titulo) out.titulo = h.titulo;
    if (!out.marca && h.marca) out.marca = h.marca;
    if (!out.descricao && h.descricao) out.descricao = h.descricao;
    if ((!out.categorias || !out.categorias.length) && h.categorias?.length) {
      out.categorias = h.categorias;
    } else if (h.categorias?.length) {
      out.categorias = uniqCats([...(out.categorias || []), ...h.categorias]);
    }
    if (!out.ncm && h.ncm) out.ncm = h.ncm;
    if (!out.cest && h.cest) out.cest = h.cest;
    if (out.quantidade == null && h.quantidade != null) {
      out.quantidade = h.quantidade;
      out.quantidade_unidade = h.quantidade_unidade || null;
    }
    if (!out.nutriscore && h.nutriscore) out.nutriscore = h.nutriscore;
    if (!out.image_url && h.image_url) out.image_url = h.image_url;
    if (h.extras && typeof h.extras === 'object') {
      out.extras[h.fonte] = h.extras;
    }
  }
  out.fontes = [...new Set(out.fontes)];
  return out;
}

async function localizeRemoteFoto(ean, url) {
  const remote = String(url || '').trim();
  if (!remote || !/^https?:\/\//i.test(remote)) return null;
  try {
    const dl = await downloadEanImage(ean, remote, 90);
    return dl?.pathLocal || null;
  } catch (err) {
    console.warn(`[produto-ean-enrich] foto ${ean}:`, err.message);
    return null;
  }
}

/**
 * Consulta fontes e grava em `produtos_ean`.
 * @param {string} codigoBarras
 * @param {{ force?: boolean }} [opts]
 */
export async function enrichProdutoEan(codigoBarras, { force = false } = {}) {
  const ean = digitsEan(codigoBarras);
  if (!ean || ean.length < 8) {
    throw Object.assign(new Error('codigo_barras inválido'), { status: 400 });
  }

  const existing = inflight.get(ean);
  if (existing) return existing;

  const run = (async () => {
    const {
      getProdutoEan,
      upsertProdutoEan,
    } = await import('./db.js');

    if (!force) {
      const cur = await getProdutoEan(ean);
      if (
        cur?.enriquecido_em &&
        cur.titulo &&
        cur.titulo !== ean &&
        Date.now() - new Date(cur.enriquecido_em).getTime() < 7 * 24 * 3600 * 1000
      ) {
        return {
          ean,
          skipped: true,
          cached: true,
          produto: cur,
          fontes: cur.fontes || [],
        };
      }
    }

    const hits = [];
    const pm = await fromPrecoMelhor(ean);
    if (pm) hits.push(pm);
    await sleep(200);

    if (!pm?.titulo || !pm?.categorias?.length) {
      const off = await fromOpenFacts(
        ean,
        'world.openfoodfacts.org',
        'openfoodfacts',
      );
      if (off) hits.push(off);
      await sleep(200);
    }

    if (!hits.some((h) => h.titulo)) {
      const ob = await fromOpenFacts(
        ean,
        'world.openbeautyfacts.org',
        'openbeautyfacts',
      );
      if (ob) hits.push(ob);
      await sleep(200);
    }

    if (!hits.some((h) => h.titulo)) {
      const op = await fromOpenFacts(
        ean,
        'world.openproductsfacts.org',
        'openproductsfacts',
      );
      if (op) hits.push(op);
      await sleep(200);
    }

    if (!hits.some((h) => h.titulo)) {
      try {
        const upc = await fromUpcitemdb(ean);
        if (upc) hits.push(upc);
      } catch (err) {
        console.warn('[produto-ean-enrich] upcitemdb:', err.message);
      }
    }

    const merged = mergeProdutoHits(hits);
    if (!merged.titulo && !merged.marca && !merged.ncm && !merged.image_url) {
      return {
        ean,
        skipped: false,
        cached: false,
        produto: await getProdutoEan(ean),
        fontes: [],
        found: false,
      };
    }

    let fotoLocal = null;
    if (merged.image_url) {
      fotoLocal = await localizeRemoteFoto(ean, merged.image_url);
    }

    const fontePrincipal = merged.fontes[0] || 'enrich';
    const produto = await upsertProdutoEan({
      codigoBarras: ean,
      titulo: merged.titulo,
      categorias: merged.categorias,
      fotoUrl: fotoLocal,
      marca: merged.marca,
      descricao: merged.descricao,
      ncm: merged.ncm,
      cest: merged.cest,
      quantidade: merged.quantidade,
      quantidadeUnidade: merged.quantidade_unidade,
      nutriscore: merged.nutriscore,
      fontes: merged.fontes,
      extras: merged.extras,
      fonte: fontePrincipal,
      forceTitulo: true,
      marcarEnriquecido: true,
    });

    return {
      ean,
      skipped: false,
      cached: false,
      found: true,
      produto,
      fontes: merged.fontes,
      baixadas: fotoLocal ? 1 : 0,
    };
  })().finally(() => {
    inflight.delete(ean);
  });

  inflight.set(ean, run);
  return run;
}

/** Dispara enrich em background (não bloqueia). */
export function enqueueEnrichProdutoEan(codigoBarras, opts = {}) {
  const ean = digitsEan(codigoBarras);
  if (!ean) return;
  setImmediate(() => {
    enrichProdutoEan(ean, opts)
      .then((r) => {
        console.log(
          `[produto-ean-enrich] ${ean} found=${Boolean(r.found)} skipped=${Boolean(r.skipped)} fontes=${(r.fontes || []).join(',') || '-'}`,
        );
      })
      .catch((err) =>
        console.error(`[produto-ean-enrich] ${ean}:`, err.message),
      );
  });
}
