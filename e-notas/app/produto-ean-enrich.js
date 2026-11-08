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

/** Título DANFE em CAPS → forma legível; remove ruído # / * / +. */
export function humanizeDanfeTitulo(raw) {
  let s = String(raw || '')
    .replace(/[#*+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return null;
  const letters = s.replace(/[^A-Za-zÀ-ÿ]/g, '');
  const upperRatio =
    letters.length > 0
      ? [...letters].filter((c) => c === c.toUpperCase() && c !== c.toLowerCase())
          .length / letters.length
      : 0;
  if (upperRatio < 0.6) return s.slice(0, 512);
  const small = new Set([
    'de',
    'da',
    'do',
    'das',
    'dos',
    'e',
    'em',
    'com',
    'sem',
    'ml',
    'g',
    'kg',
    'lt',
  ]);
  s = s
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w, i) => {
      if (/^\d+([.,]\d+)?(ml|g|kg|l|un)?$/i.test(w)) return w.toLowerCase();
      if (i > 0 && small.has(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
  // ajustes comuns BR
  s = s
    .replace(/\bEnergetico\b/g, 'Energético')
    .replace(/\bAcucar\b/g, 'Açúcar')
    .replace(/\bQueijo\b/g, 'Queijo')
    .replace(/\bLt\b/g, 'Lata');
  return s.slice(0, 512);
}

function inferMarcaCategoria(titulo) {
  const t = String(titulo || '').toLowerCase();
  let marca = null;
  let categorias = [];
  if (/monster/.test(t)) {
    marca = 'Monster';
    categorias = ['Bebidas energéticas', 'Bebidas'];
  } else if (/red\s*bull/.test(t)) {
    marca = 'Red Bull';
    categorias = ['Bebidas energéticas', 'Bebidas'];
  } else if (/pringles/.test(t)) {
    marca = 'Pringles';
    categorias = ['Salgadinhos', 'Snacks'];
  } else if (/mentos/.test(t)) {
    marca = 'Mentos';
    categorias = ['Balas e pirulitos', 'Doces'];
  } else if (/eisenbahn/.test(t)) {
    marca = 'Eisenbahn';
    categorias = ['Cervejas', 'Bebidas'];
  } else if (/energ[eé]tico/.test(t)) {
    categorias = ['Bebidas energéticas', 'Bebidas'];
  }
  return { marca, categorias };
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
      const fontesOk = Array.isArray(cur?.fontes) && cur.fontes.length > 0;
      const fonteFraca =
        !cur?.fonte ||
        cur.fonte === 'backfill' ||
        cur.fonte === 'danfe-norm' ||
        cur.fonte === 'vinculo';
      if (
        cur?.enriquecido_em &&
        cur.titulo &&
        cur.titulo !== ean &&
        fontesOk &&
        !fonteFraca &&
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
    const cur = await getProdutoEan(ean);

    // Sem hit externo: humaniza título DANFE já conhecido (backfill / nota).
    if (!merged.titulo) {
      const seed = humanizeDanfeTitulo(cur?.titulo || '');
      if (seed) {
        merged.titulo = seed;
        merged.fontes = [...new Set([...(merged.fontes || []), 'danfe-norm'])];
      }
    } else if (merged.titulo === merged.titulo.toUpperCase()) {
      merged.titulo = humanizeDanfeTitulo(merged.titulo) || merged.titulo;
    }

    const inferred = inferMarcaCategoria(merged.titulo || cur?.titulo || '');
    if (!merged.marca && inferred.marca) merged.marca = inferred.marca;
    if ((!merged.categorias || !merged.categorias.length) && inferred.categorias.length) {
      merged.categorias = inferred.categorias;
    }

    if (!merged.titulo && !merged.marca && !merged.ncm && !merged.image_url) {
      return {
        ean,
        skipped: false,
        cached: false,
        produto: cur,
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
