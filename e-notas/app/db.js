import pg from 'pg';

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
      codigo TEXT,
      nome TEXT,
      quantidade TEXT,
      unidade TEXT,
      valor_unitario TEXT,
      valor_total TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS itens_codigo_idx ON ${t('itens')}(codigo);
    CREATE INDEX IF NOT EXISTS itens_nota_idx ON ${t('itens')}(nota_id);
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

export async function insertItem(row, client = getPool()) {
  const r = await client.query(
    `INSERT INTO ${t('itens')} (
      nota_id, empresa_id, codigo, nome, quantidade, unidade,
      valor_unitario, valor_total
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *`,
    [
      row.notaId,
      row.empresaId,
      row.codigo ?? null,
      row.nome ?? null,
      row.quantidade ?? null,
      row.unidade ?? null,
      row.valorUnitario ?? null,
      row.valorTotal ?? null,
    ],
  );
  return r.rows[0];
}

export async function listItensByNota(notaId, client = getPool()) {
  const r = await client.query(
    `SELECT * FROM ${t('itens')} WHERE nota_id = $1 ORDER BY id`,
    [notaId],
  );
  return r.rows;
}

export async function listEmpresas(client = getPool()) {
  const r = await client.query(
    `SELECT * FROM ${t('empresas')} ORDER BY id DESC`,
  );
  return r.rows;
}

export async function listNotas(client = getPool()) {
  const r = await client.query(
    `SELECT n.*, e.nome AS empresa_nome, e.cnpj AS empresa_cnpj
     FROM ${t('notas')} n
     JOIN ${t('empresas')} e ON e.id = n.empresa_id
     ORDER BY n.id DESC`,
  );
  return r.rows;
}

export async function listItens(client = getPool()) {
  const r = await client.query(
    `SELECT i.*, e.nome AS empresa_nome, n.numero AS nota_numero, n.chave_acesso
     FROM ${t('itens')} i
     JOIN ${t('empresas')} e ON e.id = i.empresa_id
     JOIN ${t('notas')} n ON n.id = i.nota_id
     ORDER BY i.id DESC`,
  );
  return r.rows;
}

/** Cadastra empresa (se faltar), nota e uma linha de item por produto (histórico). */
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
    for (const item of itens) {
      itensRows.push(
        await insertItem(
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
        ),
      );
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
