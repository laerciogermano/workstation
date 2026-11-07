import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { geocodeEndereco } from './geocode.js';
import {
  collectImageCandidates,
  downloadEanImage,
  withEanSearchLock,
} from './ean-imagens.js';

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EAN_FOTOS_DIR = path.join(__dirname, 'public', 'ean-fotos');

let pool;
let schema = 'enotas';

/** URL relativa pública `ean-fotos/{ean}.ext` se o arquivo existir. */
export function resolveFotoUrlForEan(ean) {
  const code = String(ean ?? '').trim();
  if (!code) return null;
  for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'gif']) {
    if (fs.existsSync(path.join(EAN_FOTOS_DIR, `${code}.${ext}`))) {
      return `ean-fotos/${code}.${ext}`;
    }
  }
  return null;
}

/** Preenche `foto_url` a partir dos arquivos em public/ean-fotos/. */
export async function syncFotosCodigosBarras(client = getPool()) {
  const r = await client.query(
    `SELECT id, codigo_barras, foto_url FROM ${t('codigos_barras')}`,
  );
  let updated = 0;
  for (const row of r.rows) {
    const foto = resolveFotoUrlForEan(row.codigo_barras);
    if (!foto || foto === row.foto_url) continue;
    await client.query(
      `UPDATE ${t('codigos_barras')} SET foto_url = $1, updated_at = now() WHERE id = $2`,
      [foto, row.id],
    );
    updated += 1;
  }
  return { scanned: r.rows.length, updated };
}

function cfg() {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'connectmax',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'connectmax',
  };
}

export function getPool() {
  if (!pool) {
    schema = process.env.DB_SCHEMA || 'enotas';
    pool = new Pool(cfg());
  }
  return pool;
}

export async function initDb() {
  const p = getPool();
  await p.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(schema)}`);
  await p.query(`
    CREATE TABLE IF NOT EXISTS ${t('empresas')} (
      id SERIAL PRIMARY KEY,
      cnpj TEXT NOT NULL UNIQUE,
      nome TEXT,
      endereco TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ${t('notas')} (
      id SERIAL PRIMARY KEY,
      chave_acesso TEXT NOT NULL UNIQUE,
      empresa_id INTEGER NOT NULL REFERENCES ${t('empresas')}(id),
      url TEXT NOT NULL,
      numero TEXT,
      serie TEXT,
      emissao TEXT,
      protocolo TEXT,
      qtd_itens TEXT,
      valor_total TEXT,
      descontos TEXT,
      outras_despesas TEXT,
      valor_a_pagar TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ${t('itens')} (
      id SERIAL PRIMARY KEY,
      nota_id INTEGER NOT NULL REFERENCES ${t('notas')}(id),
      empresa_id INTEGER NOT NULL REFERENCES ${t('empresas')}(id),
      codigo TEXT NOT NULL,
      nome TEXT,
      quantidade TEXT,
      unidade TEXT,
      valor_unitario TEXT,
      valor_total TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (nota_id, codigo)
    );

    CREATE INDEX IF NOT EXISTS itens_codigo_idx ON ${t('itens')}(codigo);
    CREATE INDEX IF NOT EXISTS itens_nota_idx ON ${t('itens')}(nota_id);

    CREATE TABLE IF NOT EXISTS ${t('codigos_barras')} (
      id SERIAL PRIMARY KEY,
      empresa_id INTEGER NOT NULL REFERENCES ${t('empresas')}(id),
      codigo_unidade TEXT NOT NULL,
      codigo_barras TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (empresa_id, codigo_unidade)
    );

    CREATE INDEX IF NOT EXISTS codigos_barras_ean_idx
      ON ${t('codigos_barras')}(codigo_barras);
    CREATE INDEX IF NOT EXISTS codigos_barras_empresa_idx
      ON ${t('codigos_barras')}(empresa_id);

    CREATE TABLE IF NOT EXISTS ${t('ean_imagens')} (
      id SERIAL PRIMARY KEY,
      codigo_barras TEXT NOT NULL,
      url_origem TEXT,
      fonte TEXT,
      path_local TEXT NOT NULL,
      ordem INTEGER NOT NULL DEFAULT 0,
      selecionada BOOLEAN NOT NULL DEFAULT false,
      sha1 TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS ean_imagens_ean_idx
      ON ${t('ean_imagens')}(codigo_barras);

    CREATE TABLE IF NOT EXISTS ${t('ean_sugestoes')} (
      id SERIAL PRIMARY KEY,
      descricao_norm TEXT NOT NULL,
      ean TEXT NOT NULL,
      score DOUBLE PRECISION NOT NULL DEFAULT 0,
      fonte TEXT,
      nome_canonico TEXT,
      confirmacoes INTEGER NOT NULL DEFAULT 0,
      rejeicoes INTEGER NOT NULL DEFAULT 0,
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (descricao_norm, ean)
    );

    CREATE INDEX IF NOT EXISTS ean_sugestoes_desc_idx
      ON ${t('ean_sugestoes')}(descricao_norm);

    CREATE TABLE IF NOT EXISTS ${t('google_imagens_buscas')} (
      query_norm TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      n_solicitado INTEGER NOT NULL DEFAULT 50,
      encontradas INTEGER NOT NULL DEFAULT 0,
      buscado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS ${t('google_imagens_cache')} (
      id SERIAL PRIMARY KEY,
      query_norm TEXT NOT NULL,
      slug TEXT NOT NULL,
      url_origem TEXT,
      path_local TEXT,
      ordem INTEGER NOT NULL DEFAULT 0,
      fonte TEXT NOT NULL DEFAULT 'google-imagens',
      sha1 TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS google_imagens_cache_q_idx
      ON ${t('google_imagens_cache')}(query_norm);
  `);

  await p.query(`
    ALTER TABLE ${t('empresas')} ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
    ALTER TABLE ${t('empresas')} ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
    ALTER TABLE ${t('codigos_barras')} ADD COLUMN IF NOT EXISTS foto_url TEXT;
    ALTER TABLE ${t('codigos_barras')} ADD COLUMN IF NOT EXISTS origem TEXT;
  `);

  await p.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ean_imagens_ean_path_uidx
      ON ${t('ean_imagens')}(codigo_barras, path_local);
    CREATE UNIQUE INDEX IF NOT EXISTS google_imagens_cache_q_ordem_uidx
      ON ${t('google_imagens_cache')}(query_norm, ordem);
  `);

  await syncFotosCodigosBarras(p);

  // Migração: unicidade (nota_id, codigo) — remove duplicatas e aplica UNIQUE se faltar
  await p.query(`
    UPDATE ${t('itens')}
    SET codigo = COALESCE(NULLIF(TRIM(codigo), ''), '__sem_codigo__:' || id::text)
    WHERE codigo IS NULL OR TRIM(codigo) = '';
  `);
  await p.query(`
    DELETE FROM ${t('itens')} a
    USING ${t('itens')} b
    WHERE a.nota_id = b.nota_id
      AND a.codigo = b.codigo
      AND a.id > b.id;
  `);
  await p.query(`
    DO $$
    BEGIN
      ALTER TABLE ${t('itens')} ALTER COLUMN codigo SET NOT NULL;
    EXCEPTION WHEN others THEN NULL;
    END $$;
  `);
  await p.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS itens_nota_codigo_uidx
    ON ${t('itens')} (nota_id, codigo);
  `);

  return p;
}

function quoteIdent(name) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new Error(`identificador inválido: ${name}`);
  }
  return `"${name}"`;
}

function t(table) {
  return `${quoteIdent(schema)}.${quoteIdent(table)}`;
}

export async function findEmpresaByCnpj(cnpj, client = getPool()) {
  const r = await client.query(`SELECT * FROM ${t('empresas')} WHERE cnpj = $1`, [cnpj]);
  return r.rows[0] || null;
}

export async function insertEmpresa({ cnpj, nome, endereco }, client = getPool()) {
  const r = await client.query(
    `INSERT INTO ${t('empresas')} (cnpj, nome, endereco)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [cnpj, nome ?? null, endereco ?? null],
  );
  return r.rows[0];
}

export async function findNotaByChave(chave, client = getPool()) {
  const r = await client.query(`SELECT * FROM ${t('notas')} WHERE chave_acesso = $1`, [chave]);
  return r.rows[0] || null;
}

export async function insertNota(row, client = getPool()) {
  const r = await client.query(
    `INSERT INTO ${t('notas')} (
      chave_acesso, empresa_id, url, numero, serie, emissao, protocolo,
      qtd_itens, valor_total, descontos, outras_despesas, valor_a_pagar
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *`,
    [
      row.chaveAcesso,
      row.empresaId,
      row.url,
      row.numero ?? null,
      row.serie ?? null,
      row.emissao ?? null,
      row.protocolo ?? null,
      row.qtdItens ?? null,
      row.valorTotal ?? null,
      row.descontos ?? null,
      row.outrasDespesas ?? null,
      row.valorAPagar ?? null,
    ],
  );
  return r.rows[0];
}

function codigoItem(item) {
  const c = String(item?.codigo ?? '').trim();
  if (c) return c;
  const nome = String(item?.nome ?? '').trim();
  return nome ? `__nome__:${nome}` : null;
}

/** Deduplica por código dentro da mesma nota (mantém o primeiro). */
export function dedupeItensPorCodigo(itens) {
  const seen = new Set();
  const out = [];
  for (const item of itens || []) {
    const codigo = codigoItem(item);
    if (!codigo || seen.has(codigo)) continue;
    seen.add(codigo);
    out.push({ ...item, codigo });
  }
  return out;
}

export async function insertItem(row, client = getPool()) {
  const r = await client.query(
    `INSERT INTO ${t('itens')} (
      nota_id, empresa_id, codigo, nome, quantidade, unidade,
      valor_unitario, valor_total
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (nota_id, codigo) DO NOTHING
    RETURNING *`,
    [
      row.notaId,
      row.empresaId,
      row.codigo,
      row.nome ?? null,
      row.quantidade ?? null,
      row.unidade ?? null,
      row.valorUnitario ?? null,
      row.valorTotal ?? null,
    ],
  );
  return r.rows[0] || null;
}

export async function listItensByNota(notaId, client = getPool()) {
  const r = await client.query(
    `SELECT * FROM ${t('itens')} WHERE nota_id = $1 ORDER BY id`,
    [notaId],
  );
  return r.rows;
}

export async function updateEmpresaCoords(id, lat, lng, client = getPool()) {
  const r = await client.query(
    `UPDATE ${t('empresas')} SET lat = $2, lng = $3 WHERE id = $1 RETURNING *`,
    [id, lat, lng],
  );
  return r.rows[0] || null;
}

/** Preenche lat/lng faltantes via Nominatim (cache no banco). */
export async function ensureEmpresasCoords(empresas, client = getPool()) {
  const out = [];
  for (const emp of empresas) {
    if (emp.lat != null && emp.lng != null) {
      out.push(emp);
      continue;
    }
    if (!emp.endereco) {
      out.push(emp);
      continue;
    }
    try {
      const coords = await geocodeEndereco(emp.endereco);
      if (coords) {
        const updated = await updateEmpresaCoords(
          emp.id,
          coords.lat,
          coords.lng,
          client,
        );
        out.push(updated || { ...emp, lat: coords.lat, lng: coords.lng });
        console.log(
          `[geo] empresa #${emp.id} ${coords.lat},${coords.lng} — ${emp.nome || emp.cnpj}`,
        );
      } else {
        out.push(emp);
        console.warn(`[geo] sem resultado #${emp.id}`);
      }
    } catch (err) {
      console.warn(`[geo] falha #${emp.id}:`, err.message);
      out.push(emp);
    }
    await new Promise((r) => setTimeout(r, 1100));
  }
  return out;
}

export async function listEmpresas(client = getPool()) {
  const r = await client.query(
    `SELECT * FROM ${t('empresas')} ORDER BY id DESC`,
  );
  return r.rows;
}

/** Geocodifica empresas ainda sem lat/lng e devolve a lista atualizada. */
export async function geocodeEmpresasPendentes(client = getPool()) {
  const pending = await client.query(
    `SELECT * FROM ${t('empresas')}
     WHERE (lat IS NULL OR lng IS NULL)
       AND endereco IS NOT NULL
       AND TRIM(endereco) <> ''
     ORDER BY id`,
  );
  if (pending.rows.length) {
    await ensureEmpresasCoords(pending.rows, client);
  }
  return listEmpresas(client);
}

export async function listNotas(client = getPool()) {
  const r = await client.query(
    `SELECT n.*, e.nome AS empresa_nome, e.cnpj AS empresa_cnpj
     FROM ${t('notas')} n
     JOIN ${t('empresas')} e ON e.id = n.empresa_id
     ORDER BY
       CASE
         WHEN n.emissao ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN
           to_timestamp(substring(n.emissao from 1 for 19), 'DD/MM/YYYY HH24:MI:SS')
         ELSE NULL
       END DESC NULLS LAST,
       n.id DESC`,
  );
  return r.rows;
}

export async function listItens(client = getPool()) {
  const r = await client.query(
    `SELECT i.*, e.nome AS empresa_nome, n.numero AS nota_numero, n.chave_acesso,
            n.emissao AS nota_emissao, cb.codigo_barras, cb.foto_url, cb.origem AS ean_origem
     FROM ${t('itens')} i
     JOIN ${t('empresas')} e ON e.id = i.empresa_id
     JOIN ${t('notas')} n ON n.id = i.nota_id
     LEFT JOIN ${t('codigos_barras')} cb
       ON cb.empresa_id = i.empresa_id AND cb.codigo_unidade = i.codigo
     ORDER BY i.id DESC`,
  );
  return r.rows;
}

export async function listCodigosBarras(client = getPool()) {
  const r = await client.query(
    `SELECT cb.*, e.nome AS empresa_nome, e.cnpj AS empresa_cnpj
     FROM ${t('codigos_barras')} cb
     JOIN ${t('empresas')} e ON e.id = cb.empresa_id
     ORDER BY cb.id DESC`,
  );
  return r.rows;
}

/** Pares (nome do item, EAN) já vinculados — sinal comunitário para enrichment. */
export async function listLinkedNomeEan(client = getPool()) {
  const r = await client.query(
    `SELECT i.nome, cb.codigo_barras, COUNT(*)::int AS usos
     FROM ${t('itens')} i
     JOIN ${t('codigos_barras')} cb
       ON cb.empresa_id = i.empresa_id AND cb.codigo_unidade = i.codigo
     WHERE i.nome IS NOT NULL AND TRIM(i.nome) <> ''
       AND cb.codigo_barras IS NOT NULL AND TRIM(cb.codigo_barras) <> ''
     GROUP BY i.nome, cb.codigo_barras`,
  );
  return r.rows;
}

export async function listEanSugestoes(descricaoNorm, client = getPool()) {
  const norm = String(descricaoNorm ?? '').trim();
  if (!norm) return [];
  const r = await client.query(
    `SELECT * FROM ${t('ean_sugestoes')}
     WHERE descricao_norm = $1
     ORDER BY confirmacoes DESC, score DESC, id ASC`,
    [norm],
  );
  return r.rows;
}

/** Upsert em lote de sugestões (cache de resolução descrição→EAN). */
export async function upsertEanSugestoes(rows, client = getPool()) {
  if (!Array.isArray(rows) || !rows.length) return 0;
  let n = 0;
  for (const row of rows) {
    const descricao_norm = String(row.descricao_norm ?? '').trim();
    const ean = String(row.ean ?? '').replace(/\D/g, '');
    if (!descricao_norm || !ean) continue;
    const score = Number(row.score) || 0;
    const fonte = row.fonte ? String(row.fonte).slice(0, 64) : null;
    const nome_canonico = row.nome_canonico
      ? String(row.nome_canonico).slice(0, 512)
      : null;
    await client.query(
      `INSERT INTO ${t('ean_sugestoes')}
         (descricao_norm, ean, score, fonte, nome_canonico)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (descricao_norm, ean)
       DO UPDATE SET
         score = GREATEST(${t('ean_sugestoes')}.score, EXCLUDED.score),
         fonte = COALESCE(EXCLUDED.fonte, ${t('ean_sugestoes')}.fonte),
         nome_canonico = COALESCE(EXCLUDED.nome_canonico, ${t('ean_sugestoes')}.nome_canonico),
         atualizado_em = now()`,
      [descricao_norm, ean, score, fonte, nome_canonico],
    );
    n += 1;
  }
  return n;
}

/** Incrementa confirmação quando o usuário vincula o EAN sugerido. */
export async function confirmarEanSugestao(
  descricaoNorm,
  ean,
  client = getPool(),
) {
  const norm = String(descricaoNorm ?? '').trim();
  const code = String(ean ?? '').replace(/\D/g, '');
  if (!norm || !code) return null;
  const r = await client.query(
    `UPDATE ${t('ean_sugestoes')}
     SET confirmacoes = confirmacoes + 1, atualizado_em = now()
     WHERE descricao_norm = $1 AND ean = $2
     RETURNING *`,
    [norm, code],
  );
  return r.rows[0] || null;
}

const ORIGENS_EAN = new Set(['sugestao', 'barcode_scan', 'manual']);

function normalizeOrigemEan(raw) {
  const v = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (ORIGENS_EAN.has(v)) return v;
  return 'manual';
}

/** Upsert: (empresa, código da unidade) → EAN + foto + origem do vínculo. */
export async function upsertCodigoBarras(
  { empresaId, codigoUnidade, codigoBarras, fotoUrl, origem },
  client = getPool(),
) {
  const empresa = Number(empresaId);
  const unidade = String(codigoUnidade ?? '').trim();
  const ean = String(codigoBarras ?? '').trim();
  const origemNorm = normalizeOrigemEan(origem);
  if (!Number.isFinite(empresa) || empresa <= 0) {
    throw Object.assign(new Error('empresa_id inválido'), { status: 400 });
  }
  if (!unidade) {
    throw Object.assign(new Error('codigo_unidade obrigatório'), { status: 400 });
  }
  if (!ean) {
    throw Object.assign(new Error('codigo_barras obrigatório'), { status: 400 });
  }

  const emp = await client.query(`SELECT id FROM ${t('empresas')} WHERE id = $1`, [
    empresa,
  ]);
  if (!emp.rows[0]) {
    throw Object.assign(new Error('empresa não encontrada'), { status: 404 });
  }

  const selecionada = await getImagemSelecionada(ean, client);
  const foto =
    (typeof fotoUrl === 'string' && fotoUrl.trim()) ||
    selecionada?.path_local ||
    resolveFotoUrlForEan(ean) ||
    null;

  const r = await client.query(
    `INSERT INTO ${t('codigos_barras')}
       (empresa_id, codigo_unidade, codigo_barras, foto_url, origem)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (empresa_id, codigo_unidade)
     DO UPDATE SET
       codigo_barras = EXCLUDED.codigo_barras,
       foto_url = COALESCE(EXCLUDED.foto_url, ${t('codigos_barras')}.foto_url),
       origem = EXCLUDED.origem,
       updated_at = now()
     RETURNING *`,
    [empresa, unidade, ean, foto, origemNorm],
  );
  return r.rows[0];
}

/** Chave estável p/ cache Google Imagens. */
export function normalizeGoogleQuery(raw) {
  return String(raw ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export async function getGoogleImagensBusca(queryNorm, client = getPool()) {
  const q = normalizeGoogleQuery(queryNorm);
  if (!q) return null;
  const r = await client.query(
    `SELECT * FROM ${t('google_imagens_buscas')} WHERE query_norm = $1`,
    [q],
  );
  return r.rows[0] || null;
}

export async function listGoogleImagensCache(queryNorm, client = getPool()) {
  const q = normalizeGoogleQuery(queryNorm);
  if (!q) return [];
  const r = await client.query(
    `SELECT * FROM ${t('google_imagens_cache')}
     WHERE query_norm = $1
     ORDER BY ordem ASC, id ASC`,
    [q],
  );
  return r.rows;
}

export async function clearGoogleImagensCache(queryNorm, client = getPool()) {
  const q = normalizeGoogleQuery(queryNorm);
  if (!q) return;
  await client.query(
    `DELETE FROM ${t('google_imagens_cache')} WHERE query_norm = $1`,
    [q],
  );
  await client.query(
    `DELETE FROM ${t('google_imagens_buscas')} WHERE query_norm = $1`,
    [q],
  );
}

/**
 * Grava resultado de uma busca Google (mesmo com 0 itens) p/ não re-scrapear.
 * @param {{ queryNorm: string, slug: string, n?: number, imagens: object[] }} payload
 */
export async function saveGoogleImagensCache(
  { queryNorm, slug, n = 50, imagens },
  client = getPool(),
) {
  const q = normalizeGoogleQuery(queryNorm);
  const s = String(slug || q || 'q').trim();
  if (!q) return [];
  await client.query(
    `DELETE FROM ${t('google_imagens_cache')} WHERE query_norm = $1`,
    [q],
  );
  const rows = Array.isArray(imagens) ? imagens : [];
  for (const img of rows) {
    await client.query(
      `INSERT INTO ${t('google_imagens_cache')}
         (query_norm, slug, url_origem, path_local, ordem, fonte, sha1)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (query_norm, ordem) DO UPDATE SET
         url_origem = EXCLUDED.url_origem,
         path_local = COALESCE(EXCLUDED.path_local, ${t('google_imagens_cache')}.path_local),
         fonte = EXCLUDED.fonte,
         sha1 = COALESCE(EXCLUDED.sha1, ${t('google_imagens_cache')}.sha1),
         slug = EXCLUDED.slug`,
      [
        q,
        s,
        img.url_origem || img.url || null,
        img.path_local || null,
        Number(img.ordem) || 0,
        img.fonte || 'google-imagens',
        img.sha1 || null,
      ],
    );
  }
  await client.query(
    `INSERT INTO ${t('google_imagens_buscas')}
       (query_norm, slug, n_solicitado, encontradas, buscado_em)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (query_norm) DO UPDATE SET
       slug = EXCLUDED.slug,
       n_solicitado = EXCLUDED.n_solicitado,
       encontradas = EXCLUDED.encontradas,
       buscado_em = now()`,
    [q, s, Number(n) || 50, rows.length],
  );
  return listGoogleImagensCache(q, client);
}

export async function listEanImagens(codigoBarras, client = getPool()) {
  const ean = String(codigoBarras ?? '').trim();
  if (!ean) return [];
  const r = await client.query(
    `SELECT * FROM ${t('ean_imagens')}
     WHERE codigo_barras = $1
     ORDER BY selecionada DESC, ordem ASC, id ASC`,
    [ean],
  );
  return r.rows;
}

export async function getImagemSelecionada(codigoBarras, client = getPool()) {
  const ean = String(codigoBarras ?? '').trim();
  if (!ean) return null;
  const r = await client.query(
    `SELECT * FROM ${t('ean_imagens')}
     WHERE codigo_barras = $1 AND selecionada = true
     ORDER BY id ASC LIMIT 1`,
    [ean],
  );
  return r.rows[0] || null;
}

async function setFotoUrlForEan(ean, pathLocal, client = getPool()) {
  const code = String(ean).trim();
  const foto = String(pathLocal || '').trim() || null;
  if (!code || !foto) return 0;
  const r = await client.query(
    `UPDATE ${t('codigos_barras')}
     SET foto_url = $1, updated_at = now()
     WHERE codigo_barras = $2`,
    [foto, code],
  );
  return r.rowCount || 0;
}

/** Marca candidata como representativa do feed e propaga `foto_url`. */
export async function selecionarEanImagem(id, client = getPool()) {
  const imgId = Number(id);
  if (!Number.isFinite(imgId) || imgId <= 0) {
    throw Object.assign(new Error('id inválido'), { status: 400 });
  }
  const found = await client.query(
    `SELECT * FROM ${t('ean_imagens')} WHERE id = $1`,
    [imgId],
  );
  const row = found.rows[0];
  if (!row) {
    throw Object.assign(new Error('imagem não encontrada'), { status: 404 });
  }
  await client.query(
    `UPDATE ${t('ean_imagens')} SET selecionada = false
     WHERE codigo_barras = $1 AND selecionada = true`,
    [row.codigo_barras],
  );
  const updated = await client.query(
    `UPDATE ${t('ean_imagens')} SET selecionada = true WHERE id = $1 RETURNING *`,
    [imgId],
  );
  await setFotoUrlForEan(row.codigo_barras, row.path_local, client);
  return updated.rows[0];
}

/**
 * Importa arquivo legado `ean-fotos/{ean}.ext` como candidata se ainda não houver linhas.
 */
async function ensureLegacyFotoAsCandidate(ean, client = getPool()) {
  const code = String(ean).trim();
  const existing = await listEanImagens(code, client);
  if (existing.length) return existing;
  const legacy = resolveFotoUrlForEan(code);
  if (!legacy) return [];
  const r = await client.query(
    `INSERT INTO ${t('ean_imagens')}
       (codigo_barras, url_origem, fonte, path_local, ordem, selecionada)
     VALUES ($1, NULL, 'local', $2, 0, true)
     ON CONFLICT (codigo_barras, path_local) DO UPDATE SET fonte = EXCLUDED.fonte
     RETURNING *`,
    [code, legacy],
  );
  await setFotoUrlForEan(code, legacy, client);
  return r.rows;
}

/**
 * Busca e persiste até 50 candidatas (APIs + Google Imagens, default n=50). Idempotente sem force.
 * @param {string} codigoBarras
 * @param {{ force?: boolean, descricao?: string }} [opts]
 * @returns {{ ean: string, skipped?: boolean, imagens: object[], baixadas: number }}
 */
export async function buscarImagensEan(
  codigoBarras,
  { force = false, descricao = '' } = {},
) {
  const ean = String(codigoBarras ?? '').trim();
  if (!ean) {
    throw Object.assign(new Error('codigo_barras obrigatório'), { status: 400 });
  }
  const nome = String(descricao ?? '').trim();

  return withEanSearchLock(ean, async () => {
    const client = getPool();
    let imagens;

    if (!force) {
      imagens = await ensureLegacyFotoAsCandidate(ean, client);
      if (imagens.length > 0) {
        return { ean, skipped: true, cached: true, imagens, baixadas: 0 };
      }
      imagens = await listEanImagens(ean, client);
      if (imagens.length > 0) {
        return { ean, skipped: true, cached: true, imagens, baixadas: 0 };
      }
    } else {
      await client.query(
        `DELETE FROM ${t('ean_imagens')} WHERE codigo_barras = $1`,
        [ean],
      );
    }

    const candidates = await collectImageCandidates(ean, { descricao: nome });
    let baixadas = 0;
    let ordem = 1;
    const seenSha = new Set();

    for (const c of candidates) {
      try {
        const dl = await downloadEanImage(ean, c.url, ordem);
        if (!dl) continue;
        if (seenSha.has(dl.sha1)) {
          try {
            fs.unlinkSync(
              path.join(__dirname, 'public', ...dl.pathLocal.split('/')),
            );
          } catch {
            /* ignore */
          }
          continue;
        }
        seenSha.add(dl.sha1);
        await client.query(
          `INSERT INTO ${t('ean_imagens')}
             (codigo_barras, url_origem, fonte, path_local, ordem, selecionada, sha1)
           VALUES ($1, $2, $3, $4, $5, false, $6)
           ON CONFLICT (codigo_barras, path_local) DO NOTHING`,
          [ean, c.url, c.fonte, dl.pathLocal, ordem, dl.sha1],
        );
        baixadas += 1;
        ordem += 1;
      } catch (err) {
        console.warn(`[ean-imagens] download ${c.fonte}:`, err.message);
      }
    }

    // Legado flat ainda útil se a busca falhou
    if (baixadas === 0) {
      imagens = await ensureLegacyFotoAsCandidate(ean, client);
      return { ean, skipped: false, cached: false, imagens, baixadas: 0 };
    }

    imagens = await listEanImagens(ean, client);
    const temSelecionada = imagens.some((i) => i.selecionada);
    if (!temSelecionada && imagens[0]) {
      await selecionarEanImagem(imagens[0].id, client);
      imagens = await listEanImagens(ean, client);
    }

    return { ean, skipped: false, cached: false, imagens, baixadas };
  });
}

/** Dispara busca em background (não bloqueia o caller). */
export function enqueueBuscarImagensEan(codigoBarras, opts = {}) {
  const ean = String(codigoBarras ?? '').trim();
  if (!ean) return;
  setImmediate(() => {
    buscarImagensEan(ean, opts)
      .then((r) => {
        console.log(
          `[ean-imagens] ${ean} skipped=${Boolean(r.skipped)} baixadas=${r.baixadas} total=${r.imagens.length}`,
        );
      })
      .catch((err) => console.error(`[ean-imagens] ${ean}:`, err.message));
  });
}

/** Cadastra empresa (se faltar), nota e no máx. um item por código na nota (histórico entre notas). */
export async function cadastrarNotaCompleta({ url, empresa, nota, itens }) {
  if (!empresa?.cnpj) {
    throw Object.assign(new Error('CNPJ da empresa não encontrado na DANFE'), {
      status: 422,
    });
  }
  if (!nota?.chave) {
    throw Object.assign(new Error('Chave de acesso não encontrada na DANFE'), {
      status: 422,
    });
  }

  const existing = await findNotaByChave(nota.chave);
  if (existing) {
    const emp = (
      await getPool().query(`SELECT * FROM ${t('empresas')} WHERE id = $1`, [
        existing.empresa_id,
      ])
    ).rows[0];
    return {
      created: false,
      empresaCriada: false,
      empresa: emp,
      nota: existing,
      itens: await listItensByNota(existing.id),
    };
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    let emp = await findEmpresaByCnpj(empresa.cnpj, client);
    let empresaCriada = false;
    if (!emp) {
      emp = await insertEmpresa(
        {
          cnpj: empresa.cnpj,
          nome: empresa.nome,
          endereco: empresa.endereco,
        },
        client,
      );
      empresaCriada = true;
    }

    const notaRow = await insertNota(
      {
        chaveAcesso: nota.chave,
        empresaId: emp.id,
        url,
        numero: nota.numero,
        serie: nota.serie,
        emissao: nota.emissao,
        protocolo: nota.protocolo,
        qtdItens: nota.qtdItens,
        valorTotal: nota.valorTotal,
        descontos: nota.descontos,
        outrasDespesas: nota.outrasDespesas,
        valorAPagar: nota.valorAPagar,
      },
      client,
    );

    const itensRows = [];
    for (const item of dedupeItensPorCodigo(itens)) {
      const row = await insertItem(
        {
          notaId: notaRow.id,
          empresaId: emp.id,
          codigo: item.codigo,
          nome: item.nome,
          quantidade: item.quantidade,
          unidade: item.unidade,
          valorUnitario: item.valorUnitario,
          valorTotal: item.valorTotal,
        },
        client,
      );
      if (row) itensRows.push(row);
    }

    await client.query('COMMIT');
    return {
      created: true,
      empresaCriada,
      empresa: emp,
      nota: notaRow,
      itens: itensRows,
    };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    client.release();
  }
}

export function dbInfo() {
  const c = cfg();
  return `${c.user}@${c.host}:${c.port}/${c.database} schema=${process.env.DB_SCHEMA || 'enotas'}`;
}
