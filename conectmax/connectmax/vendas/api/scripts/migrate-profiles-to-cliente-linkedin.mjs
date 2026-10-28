#!/usr/bin/env node
/**
 * Migra linkedin_profiles + linkedin_profile_details → clientes + cliente_linkedin.
 * Depois DROP nas tabelas antigas e coluna linkedin_profile_id.
 *
 * Uso (cwd: vendas/api, Postgres no ar):
 *   node scripts/migrate-profiles-to-cliente-linkedin.mjs
 *
 * Env: DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME (mesmos do .env Nest)
 */
import pg from 'pg';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  const envPath = resolve(root, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim().replace(/^['"]|['"]$/g, '');
    if (process.env[key] == null) process.env[key] = val;
  }
}

function isSlugId(part) {
  const p = String(part || '').trim();
  if (!p) return false;
  if (/^\d{5,}$/.test(p)) return true;
  return (
    p.length >= 6 &&
    p.length <= 14 &&
    /[0-9]/.test(p) &&
    /^[a-z0-9]+$/i.test(p)
  );
}

function stubNameFromUrl(profileUrl) {
  const m = String(profileUrl || '').match(/linkedin\.com\/in\/([^/?#]+)/i);
  const slug = decodeURIComponent(m?.[1] || '').replace(/\/$/, '');
  if (!slug) return 'linkedin';
  const parts = slug.split('-').filter(Boolean);
  while (parts.length && isSlugId(parts[parts.length - 1])) parts.pop();
  if (parts.length >= 2) {
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ')
      .slice(0, 200);
  }
  return (parts[0] || slug).slice(0, 200);
}

function normalizeUrl(raw) {
  const m = String(raw || '').match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([A-Za-z0-9._%-]+)/i,
  );
  if (!m) return null;
  return `https://www.linkedin.com/in/${decodeURIComponent(m[1])}`;
}

loadEnv();

const client = new pg.Client({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'connectmax',
  password: process.env.DB_PASSWORD || 'connectmax',
  database: process.env.DB_NAME || 'connectmax',
});

async function tableExists(name) {
  const r = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
    [name],
  );
  return r.rowCount > 0;
}

async function columnExists(table, col) {
  const r = await client.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
    [table, col],
  );
  return r.rowCount > 0;
}

async function ensureClienteLinkedinColumns() {
  const alters = [
    `ALTER TABLE cliente_linkedin ADD COLUMN IF NOT EXISTS invite_status varchar(16)`,
    `ALTER TABLE cliente_linkedin ADD COLUMN IF NOT EXISTS search_query varchar(120)`,
    `ALTER TABLE cliente_linkedin ADD COLUMN IF NOT EXISTS past varchar(500)`,
    `ALTER TABLE cliente_linkedin ADD COLUMN IF NOT EXISTS round int`,
    `ALTER TABLE cliente_linkedin ADD COLUMN IF NOT EXISTS card_base64 text`,
    `ALTER TABLE cliente_linkedin ADD COLUMN IF NOT EXISTS raw_ocr jsonb`,
    `ALTER TABLE cliente_linkedin ADD COLUMN IF NOT EXISTS deleted_at timestamptz`,
  ];
  for (const sql of alters) {
    await client.query(sql);
  }
}

async function findOrCreateByUrl(url, nome) {
  const existing = await client.query(
    `SELECT id, cliente_id FROM cliente_linkedin WHERE profile_url = $1 LIMIT 1`,
    [url],
  );
  if (existing.rowCount) return existing.rows[0];

  const c = await client.query(
    `INSERT INTO clientes (id, nome, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, now(), now()) RETURNING id`,
    [nome || stubNameFromUrl(url)],
  );
  const li = await client.query(
    `INSERT INTO cliente_linkedin (id, cliente_id, profile_url, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, now(), now()) RETURNING id, cliente_id`,
    [c.rows[0].id, url],
  );
  return li.rows[0];
}

const BLOB_COLS = new Set([
  'photo_base64',
  'cover_base64',
  'card_base64',
  'raw_ocr',
]);

async function mergeInto(liId, clienteId, patch) {
  const nome = patch._nome;
  // Só preenche blobs se a coluna ainda estiver vazia (evita reescrever MB)
  const cur = await client.query(
    `SELECT photo_base64 IS NOT NULL AND photo_base64 <> '' AS has_photo,
            cover_base64 IS NOT NULL AND cover_base64 <> '' AS has_cover,
            card_base64 IS NOT NULL AND card_base64 <> '' AS has_card,
            raw_ocr IS NOT NULL AS has_ocr
     FROM cliente_linkedin WHERE id = $1`,
    [liId],
  );
  const flags = cur.rows[0] || {};

  const sets = [];
  const vals = [];
  let i = 1;
  for (const [col, val] of Object.entries(patch)) {
    if (col === '_nome') continue;
    if (val === undefined || val === null) continue;
    if (col === 'photo_base64' && flags.has_photo) continue;
    if (col === 'cover_base64' && flags.has_cover) continue;
    if (col === 'card_base64' && flags.has_card) continue;
    if (col === 'raw_ocr' && flags.has_ocr) continue;
    sets.push(`${col} = COALESCE(${col}, $${i})`);
    vals.push(val);
    i += 1;
  }
  if (sets.length) {
    vals.push(liId);
    await client.query(
      `UPDATE cliente_linkedin SET ${sets.join(', ')}, updated_at = now() WHERE id = $${i}`,
      vals,
    );
  }
  if (nome) {
    await client.query(
      `UPDATE clientes SET nome = $1, updated_at = now()
       WHERE id = $2 AND (nome IS NULL OR nome = '' OR nome ILIKE '%-%' OR length(nome) < 3)`,
      [nome, clienteId],
    );
  }
}

/** Soft-deleted → hard delete; só restam ativos p/ migrar. */
async function purgeSoftDeletedProfiles() {
  if (await tableExists('linkedin_profiles')) {
    const del = await client.query(
      `DELETE FROM linkedin_profiles WHERE deleted_at IS NOT NULL`,
    );
    console.log(`purged soft-deleted linkedin_profiles: ${del.rowCount}`);
  }
  if (
    (await tableExists('linkedin_profile_details')) &&
    (await tableExists('linkedin_profiles'))
  ) {
    const orphan = await client.query(`
      DELETE FROM linkedin_profile_details d
      WHERE NOT EXISTS (
        SELECT 1 FROM linkedin_profiles p
        WHERE p.id = d.profile_id AND p.deleted_at IS NULL
      )
    `);
    console.log(`purged details sem perfil ativo: ${orphan.rowCount}`);
  }
  if (await tableExists('cliente_linkedin')) {
    const li = await client.query(
      `DELETE FROM cliente_linkedin WHERE deleted_at IS NOT NULL`,
    );
    console.log(`purged soft-deleted cliente_linkedin: ${li.rowCount}`);
    // clientes órfãos (sem linkedin, sem conexão, sem mensagem)
    const orphans = await client.query(`
      DELETE FROM clientes c
      WHERE NOT EXISTS (SELECT 1 FROM cliente_linkedin li WHERE li.cliente_id = c.id)
        AND NOT EXISTS (
          SELECT 1 FROM client_connection_linkedin cc
          JOIN cliente_linkedin li ON li.id = cc.cliente_linkedin_id
          WHERE li.cliente_id = c.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM client_linkedin_message m
          JOIN cliente_linkedin li ON li.id = m.cliente_linkedin_id
          WHERE li.cliente_id = c.id
        )
    `);
    console.log(`purged clientes órfãos: ${orphans.rowCount}`);
  }
}

async function migrateDetails() {
  if (!(await tableExists('linkedin_profile_details'))) {
    console.log('skip details: tabela ausente');
    return { migrated: 0 };
  }
  // Só details cujo parent ainda existe e está ativo
  const { rows } = await client.query(`
    SELECT d.*
    FROM linkedin_profile_details d
    INNER JOIN linkedin_profiles p ON p.id = d.profile_id
    WHERE p.deleted_at IS NULL
  `);
  let migrated = 0;
  console.log(`details (ativos) rows=${rows.length}`);
  for (const d of rows) {
    const url = normalizeUrl(d.profile_url);
    const nome = d.name || (url ? stubNameFromUrl(url) : 'LinkedIn');
    let li;
    if (url) {
      li = await findOrCreateByUrl(url, nome);
    } else if (
      (await columnExists('cliente_linkedin', 'linkedin_profile_id')) &&
      d.profile_id
    ) {
      const byBridge = await client.query(
        `SELECT id, cliente_id FROM cliente_linkedin WHERE linkedin_profile_id = $1 LIMIT 1`,
        [d.profile_id],
      );
      if (byBridge.rowCount) li = byBridge.rows[0];
    }
    if (!li) {
      const c = await client.query(
        `INSERT INTO clientes (id, nome, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, now(), now()) RETURNING id`,
        [nome],
      );
      const created = await client.query(
        `INSERT INTO cliente_linkedin (id, cliente_id, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, now(), now()) RETURNING id, cliente_id`,
        [c.rows[0].id],
      );
      li = created.rows[0];
    }
    await mergeInto(li.id, li.cliente_id, {
      profile_url: url,
      headline: d.headline,
      company: d.company,
      location: d.location,
      connections: d.connections,
      mutual_connections: d.mutual_connections,
      connection_degree: d.connection_degree,
      invite_status: d.invite_status,
      can_connect: d.can_connect,
      can_message: d.can_message,
      about: d.about,
      experience: d.experience,
      education: d.education,
      skills: d.skills,
      photo_base64: d.photo_base64,
      cover_base64: d.cover_base64,
      card_base64: d.card_base64,
      raw_ocr: d.raw_ocr,
      extracted_at: d.extracted_at,
      _nome: d.name,
    });
    // Preferir nome OCR sobre stub
    if (d.name) {
      await client.query(
        `UPDATE clientes SET nome = $1, updated_at = now() WHERE id = $2`,
        [d.name, li.cliente_id],
      );
    }
    migrated += 1;
    if (migrated % 10 === 0) console.log(`  details ${migrated}/${rows.length}`);
  }
  return { migrated };
}

async function migrateProfiles() {
  if (!(await tableExists('linkedin_profiles'))) {
    console.log('skip profiles: tabela ausente');
    return { migrated: 0 };
  }
  const { rows } = await client.query(
    `SELECT * FROM linkedin_profiles WHERE deleted_at IS NULL`,
  );
  let migrated = 0;
  console.log(`profiles (ativos) rows=${rows.length}`);
  for (const p of rows) {
    // Já migrado via detail com mesma ponte?
    let li = null;
    if (await columnExists('cliente_linkedin', 'linkedin_profile_id')) {
      const r = await client.query(
        `SELECT id, cliente_id FROM cliente_linkedin WHERE linkedin_profile_id = $1 LIMIT 1`,
        [p.id],
      );
      if (r.rowCount) li = r.rows[0];
    }
    // Match por nome + company
    if (!li && p.name) {
      const r = await client.query(
        `SELECT li.id, li.cliente_id FROM cliente_linkedin li
         JOIN clientes c ON c.id = li.cliente_id
         WHERE lower(c.nome) = lower($1)
           AND (li.company IS NULL OR $2::text IS NULL OR lower(split_part(li.company, E'\\n', 1)) = lower($2))
         LIMIT 1`,
        [p.name, p.current],
      );
      if (r.rowCount) li = r.rows[0];
    }
    if (!li) {
      const c = await client.query(
        `INSERT INTO clientes (id, nome, empresa, cargo, cidade, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, now(), now()) RETURNING id`,
        [p.name || 'LinkedIn', p.current, p.title, p.city],
      );
      const created = await client.query(
        `INSERT INTO cliente_linkedin (id, cliente_id, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, now(), now()) RETURNING id, cliente_id`,
        [c.rows[0].id],
      );
      li = created.rows[0];
    }
    await mergeInto(li.id, li.cliente_id, {
      headline: p.title,
      search_query: p.search_query,
      connection_degree: p.level,
      invite_status: p.connection,
      location: p.city,
      mutual_connections: p.mutual_connections,
      company: p.current,
      past: p.past,
      photo_base64: p.photo_base64,
      cover_base64: p.cover_base64,
      card_base64: p.card_base64,
      raw_ocr: p.raw_ocr,
      extracted_at: p.extracted_at,
      round: p.round,
      deleted_at: null,
      _nome: p.name,
    });
    migrated += 1;
    if (migrated % 25 === 0) console.log(`  profiles ${migrated}/${rows.length}`);
  }
  return { migrated };
}

async function dropLegacy() {
  if (await columnExists('cliente_linkedin', 'linkedin_profile_id')) {
    await client.query(
      `ALTER TABLE cliente_linkedin DROP COLUMN IF EXISTS linkedin_profile_id`,
    );
    console.log('dropped column cliente_linkedin.linkedin_profile_id');
  }
  if (await tableExists('linkedin_profile_details')) {
    await client.query(`DROP TABLE IF EXISTS linkedin_profile_details CASCADE`);
    console.log('dropped linkedin_profile_details');
  }
  if (await tableExists('linkedin_profiles')) {
    await client.query(`DROP TABLE IF EXISTS linkedin_profiles CASCADE`);
    console.log('dropped linkedin_profiles');
  }
}

async function main() {
  await client.connect();
  console.log('connected');
  await ensureClienteLinkedinColumns();
  await purgeSoftDeletedProfiles();
  const d = await migrateDetails();
  console.log(`details → cliente_linkedin: ${d.migrated}`);
  const p = await migrateProfiles();
  console.log(`profiles → cliente_linkedin: ${p.migrated}`);
  await dropLegacy();
  console.log('OK');
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
