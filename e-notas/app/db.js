import pg from 'pg';
import { geocodeEndereco } from './geocode.js';

const { Pool } = pg;

let pool;
let schema = 'enotas';

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
  `);

  await p.query(`
    ALTER TABLE ${t('empresas')} ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
    ALTER TABLE ${t('empresas')} ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
  `);

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
            n.emissao AS nota_emissao, cb.codigo_barras
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

/** Upsert: (empresa, código da unidade) → código de barras (EAN). */
export async function upsertCodigoBarras(
  { empresaId, codigoUnidade, codigoBarras },
  client = getPool(),
) {
  const empresa = Number(empresaId);
  const unidade = String(codigoUnidade ?? '').trim();
  const ean = String(codigoBarras ?? '').trim();
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

  const r = await client.query(
    `INSERT INTO ${t('codigos_barras')} (empresa_id, codigo_unidade, codigo_barras)
     VALUES ($1, $2, $3)
     ON CONFLICT (empresa_id, codigo_unidade)
     DO UPDATE SET
       codigo_barras = EXCLUDED.codigo_barras,
       updated_at = now()
     RETURNING *`,
    [empresa, unidade, ean],
  );
  return r.rows[0];
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
