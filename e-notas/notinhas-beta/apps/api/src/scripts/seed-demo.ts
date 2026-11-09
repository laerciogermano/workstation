/**
 * Seed de demonstração = dados do protótipo v2 (beta-docs/prototipos/v2/js/data.js).
 * Lojas, endereços e descrições de DANFE vêm da base real do lab (SJP/PR);
 * preços cruzados entre lojas são de protótipo → notas marcadas is_demo = true.
 * Idempotente: pode rodar de novo (datas são relativas a "hoje").
 */
import { randomBytes } from 'node:crypto';
import { classifyProduct } from '@notinhas/domain';
import { createPool, withTx } from '../shared/db.js';
import { loadEnv } from '../shared/env.js';
import { hashPassword } from '../shared/security/crypto.js';
import { migrate } from './migrate.js';

const STORES = [
  { key: 'formosa', nome: 'Formosa', razao: 'FORMOSA COMERCIO VAREJISTA E ATAC LTDA', cnpj: '61080262000106', bairro: 'Centro', end: 'R. Izabel a Redentora, 1434', lat: -25.5377, lng: -49.2043 },
  { key: 'dimed', nome: 'Dimed', razao: 'DIMED S/A DISTRIBUIDORA DE MEDICAMENTOS', cnpj: '92665611042503', bairro: 'Centro', end: 'R. Izabel a Redentora, 1434 · loja 101', lat: -25.5372, lng: -49.2034 },
  { key: 'atacadao', nome: 'Atacadão', razao: 'ATACADAO S.A.', cnpj: '75315333022269', bairro: 'Águas Belas', end: 'Av. Rui Barbosa, 7992', lat: -25.5283, lng: -49.1942 },
  { key: 'jupiter', nome: 'Jupiter', razao: 'JUPITER SUPERMERCADOS LTDA', cnpj: '48946642000104', bairro: 'Centro', end: 'R. Izabel a Redentora, 1520', lat: -25.5392, lng: -49.2071 },
  { key: 'parada', nome: 'Parada do Avião', razao: 'Parada do Aviao Distribuidora de bebidas', cnpj: '37750765000159', bairro: 'Boneca do Iguaçu', end: 'R. Pará, 960', lat: -25.5462, lng: -49.1871 },
  { key: 'stilo', nome: 'Stilo Atacadista', razao: 'Stilo Central Atacadista De Produtos Ltda', cnpj: '36479917000249', bairro: 'Aviação', end: 'R. Medianeira, 386', lat: -25.5531, lng: -49.1988 },
  { key: 'tic', nome: 'TIC Posto VII', razao: 'TIC POSTO VII', cnpj: '75635573000786', bairro: 'São Cristóvão', end: 'Av. das Torres, 1640', lat: -25.5208, lng: -49.2109 },
] as const;
type StoreKey = (typeof STORES)[number]['key'];

const PRODUCTS = [
  { ean: '3000054721644', titulo: 'Monster Ultra Fiesta Mango Zero 473ml', marca: 'Monster', sub: 'Energéticos e isotônicos', foto: '/media/3000054721644.jpg', ncm: '2202.99.00', fontes: ['PreçoMelhor', 'Open Food Facts'], danfe: 'ENERGETICO MONSTER ULTRA FIESTA MANGO ZERO 473ML' },
  { ean: '3000054355283', titulo: 'Monster Zero Açúcar Lata 473ml', marca: 'Monster', sub: 'Energéticos e isotônicos', foto: '/media/3000054355283.webp', ncm: '2202.99.00', fontes: ['PreçoMelhor'], danfe: 'ENERGETICO MONSTER ZERO ACUCAR 473ML' },
  { ean: '7896004006277', titulo: 'Batata Pringles Original 104g', marca: 'Pringles', sub: 'Batatas', foto: '/media/7896004006277.webp', ncm: '2005.20.00', fontes: ['Open Food Facts', 'UPCitemdb'], danfe: 'BATATA PRINGLES ORIGINAL 100G# +' },
  { ean: '7896004006284', titulo: 'Batata Pringles Queijo 109g', marca: 'Pringles', sub: 'Batatas', foto: '/media/7896004006284.webp', ncm: '2005.20.00', fontes: ['Open Food Facts'], danfe: 'BATATA PRINGLES MOLHO QUEIJO 100G# +' },
  { ean: '7898367984018', titulo: 'Cerveja Eisenbahn Pilsen Puro Malte 350ml', marca: 'Eisenbahn', sub: 'Cervejas', foto: '/media/7898367984018.jpg', ncm: '2203.00.00', fontes: ['PreçoMelhor'], danfe: 'CERVEJA EISENBAHN LT 350ML#*+' },
  { ean: '7895144853734', titulo: 'Mentos Pure Fresh Strong Mint 8,5g', marca: 'Mentos', sub: 'Balas e chicletes', foto: '/media/7895144853734.jpg', ncm: '1704.10.00', fontes: ['PreçoMelhor', 'Open Food Facts'], danfe: 'CHICLE MENTOS PURE FRESH3 STRONG MINT 8,5GR# +' },
  { ean: '7894900011517', titulo: 'Coca-Cola Original 2L', marca: 'Coca-Cola', sub: 'Refrigerantes', foto: '/media/7894900011517.jpg', ncm: '2202.10.00', fontes: ['Open Food Facts'], danfe: 'COCA COLA PET 2L' },
  { ean: '7896006711117', titulo: 'Arroz Branco Camil Tipo 1 1kg', marca: 'Camil', sub: 'Arroz e feijão', foto: '/media/7896006711117.jpg', ncm: '1006.30.21', fontes: ['PreçoMelhor'], danfe: 'ARROZ CAMIL AG.T1 1KG' },
  { ean: '7891000379691', titulo: 'Achocolatado Nescau Lata 370g', marca: 'Nestlé', sub: 'Achocolatados', foto: '/media/7891000379691.jpg', ncm: '1806.90.00', fontes: ['Open Food Facts'], danfe: 'ACHOC.PO NESCAU 370G' },
  { ean: '7891000244258', titulo: 'Chocolate Nestlé Alpino 90g', marca: 'Nestlé', sub: 'Chocolates', foto: '/media/7891000244258.jpg', ncm: '1806.32.10', fontes: ['PreçoMelhor', 'Open Food Facts'], danfe: 'CHOC.NESTLE ALPINO 90G' },
];

// [ean, loja, preço, dias atrás]
const OBS: [string, StoreKey, number, number][] = [
  ['3000054721644', 'dimed', 13.99, 0], ['3000054721644', 'stilo', 8.89, 2], ['3000054721644', 'atacadao', 9.49, 5], ['3000054721644', 'formosa', 12.49, 9], ['3000054721644', 'dimed', 14.29, 5], ['3000054721644', 'dimed', 15.4, 35],
  ['3000054355283', 'dimed', 13.99, 0], ['3000054355283', 'stilo', 8.89, 2], ['3000054355283', 'jupiter', 10.99, 6],
  ['7896004006277', 'formosa', 11.99, 4], ['7896004006277', 'atacadao', 10.9, 3], ['7896004006277', 'jupiter', 12.99, 8], ['7896004006277', 'formosa', 12.49, 20],
  ['7896004006284', 'formosa', 11.99, 4], ['7896004006284', 'atacadao', 10.9, 3],
  ['7898367984018', 'formosa', 3.99, 4], ['7898367984018', 'atacadao', 4.19, 3], ['7898367984018', 'stilo', 4.0, 2], ['7898367984018', 'parada', 4.29, 1], ['7898367984018', 'jupiter', 4.49, 10],
  ['7895144853734', 'formosa', 2.99, 4], ['7895144853734', 'tic', 3.99, 3], ['7895144853734', 'dimed', 3.49, 0], ['7895144853734', 'atacadao', 3.19, 3],
  ['7894900011517', 'stilo', 9.99, 2], ['7894900011517', 'atacadao', 10.49, 3], ['7894900011517', 'jupiter', 11.99, 6], ['7894900011517', 'parada', 10.99, 1], ['7894900011517', 'tic', 12.9, 3], ['7894900011517', 'jupiter', 12.49, 22], ['7894900011517', 'atacadao', 10.99, 30],
  ['7896006711117', 'atacadao', 5.99, 3], ['7896006711117', 'jupiter', 6.79, 6], ['7896006711117', 'formosa', 6.49, 4],
  ['7891000379691', 'atacadao', 7.89, 3], ['7891000379691', 'jupiter', 9.49, 6], ['7891000379691', 'formosa', 8.99, 4], ['7891000379691', 'atacadao', 8.49, 18],
  ['7891000244258', 'atacadao', 7.49, 3], ['7891000244258', 'formosa', 8.29, 4], ['7891000244258', 'dimed', 9.99, 0], ['7891000244258', 'tic', 8.99, 3], ['7891000244258', 'atacadao', 7.99, 12],
];

// itens ainda sem EAN — descrição crua da DANFE (base real): [cód., descrição, preço, dias]
const NO_EAN: Partial<Record<StoreKey, [string, string, number, number][]>> = {
  atacadao: [
    ['23407', 'ACHOC.PO TODDY', 4.59, 3], ['34808', 'LEITE L.V.ITALAC.INT', 4.99, 3], ['37001', 'CAFE MELITTA VACUO', 15.45, 3],
    ['13892', 'OLEO SOJA COCAMAR', 7.49, 3], ['82245', 'PAO FORMA VISCONTI', 5.89, 3], ['54629', 'BISC.CLUB SOCIAL', 5.89, 7],
    ['5614', 'MAC.NISSIN LAMEN', 2.49, 3], ['57912', 'CHOC.NESTLE KIT KAT', 4.29, 7], ['14948', 'ACUC.REF.A.ALEGRE', 4.19, 3], ['39734', 'PAPEL HIG.PALOMA N.', 3.59, 3],
  ],
  stilo: [['100250', 'Heineken Lata 12x350', 5.0, 2], ['100145', 'Guarana Antarct 6x2l', 8.99, 2], ['106887', 'Pepsi Lata 12x350ml', 3.5, 2], ['100277', 'Budweiser Lt 12x350', 4.0, 2]],
  jupiter: [['17038', 'CERVEJA LATA HEINEKEN ORIG 350ML#*+', 5.99, 0], ['34811', 'LEITE ITALAC INTEGRAL 1L', 5.29, 0], ['82250', 'PAO FORMA VISCONTI 400G', 6.49, 0], ['10213', 'BATATA PRINGLES ORIGINAL 100G# +', 12.99, 0]],
  parada: [['000937', 'CHEETOS REQUEIJAO 105G ATACADO', 5.9, 1]],
  tic: [['10887', 'SNICKERS BRANCO 42G', 5.99, 3]],
};

/** Chave de acesso sintética com DV mod-11 válido (modelo 65, emissão normal). */
function accessKey(cnpj: string, issued: Date, n: number): string {
  const yymm = `${String(issued.getFullYear()).slice(2)}${String(issued.getMonth() + 1).padStart(2, '0')}`;
  const body = `41${yymm}${cnpj}65001${String(n).padStart(9, '0')}1${String(90000000 + n).slice(-8)}`;
  let w = 2;
  let s = 0;
  for (let i = body.length - 1; i >= 0; i--) {
    s += Number(body[i]) * w;
    w = w === 9 ? 2 : w + 1;
  }
  const r = s % 11;
  return body + (r < 2 ? 0 : 11 - r);
}

const env = loadEnv();
await migrate(env, { info: () => undefined });
const db = createPool(env.DATABASE_URL, env.DB_SCHEMA);
const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000 - 3 * 3600_000);
const codeFor = (ean: string) => `9${ean.slice(-6)}`;

await withTx(db, async (tx) => {
  // limpa só o que é demo (notas do lab importadas ficam)
  await tx.query('DELETE FROM receipts WHERE is_demo');
  await tx.query('DELETE FROM stores s WHERE NOT EXISTS (SELECT 1 FROM receipts r WHERE r.store_id = s.id)');
  const storeIds = new Map<StoreKey, number>();
  for (const s of STORES) {
    const { rows } = await tx.query<{ id: number }>(
      `INSERT INTO stores (cnpj, legal_name, display_name, address, neighborhood, city, lat, lng, geocode_status, geocoded_at)
       VALUES ($1, $2, $3, $4, $5, 'São José dos Pinhais', $6, $7, 'manual', now())
       ON CONFLICT (cnpj) DO UPDATE SET display_name = EXCLUDED.display_name, neighborhood = EXCLUDED.neighborhood,
         lat = coalesce(stores.lat, EXCLUDED.lat), lng = coalesce(stores.lng, EXCLUDED.lng), geocode_status = 'manual'
       RETURNING id`,
      [s.cnpj, s.razao, s.nome, `${s.end}, ${s.bairro}, São José dos Pinhais, PR`, s.bairro, s.lat, s.lng],
    );
    const id = rows[0]?.id;
    if (id) storeIds.set(s.key, id);
  }
  for (const p of PRODUCTS) {
    const { category } = classifyProduct(`${p.titulo} ${p.danfe}`);
    await tx.query(
      `INSERT INTO products (gtin, title, brand, category, subcategory, ncm, photo_url, sources)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (gtin) DO UPDATE SET title = EXCLUDED.title, brand = EXCLUDED.brand, category = EXCLUDED.category,
         subcategory = EXCLUDED.subcategory, ncm = EXCLUDED.ncm, photo_url = coalesce(products.photo_url, EXCLUDED.photo_url), sources = EXCLUDED.sources`,
      [p.ean, p.titulo, p.marca, category, p.sub, p.ncm, p.foto, p.fontes],
    );
  }

  // uma nota por (loja, dia)
  const groups = new Map<string, { store: StoreKey; d: number; lines: { code: string; desc: string; price: number; ean?: string }[] }>();
  const add = (store: StoreKey, d: number, line: { code: string; desc: string; price: number; ean?: string }) => {
    const k = `${store}:${d}`;
    const g = groups.get(k) ?? { store, d, lines: [] };
    g.lines.push(line);
    groups.set(k, g);
  };
  for (const [ean, store, price, d] of OBS) {
    const p = PRODUCTS.find((x) => x.ean === ean);
    if (p) add(store, d, { code: codeFor(ean), desc: p.danfe, price, ean });
  }
  for (const [store, items] of Object.entries(NO_EAN) as [StoreKey, [string, string, number, number][]][]) {
    for (const [code, desc, price, d] of items) add(store, d, { code, desc, price });
  }

  let n = 1;
  for (const g of groups.values()) {
    const storeId = storeIds.get(g.store);
    const s = STORES.find((x) => x.key === g.store);
    if (!storeId || !s) continue;
    const issued = daysAgo(g.d);
    const total = g.lines.reduce((a, l) => a + Math.round(l.price * 100), 0);
    const { rows } = await tx.query<{ id: number }>(
      `INSERT INTO receipts (access_key, store_id, url, number, series, issued_at, total_cents, is_demo)
       VALUES ($1, $2, $3, $4, '1', $5, $6, true) RETURNING id`,
      [accessKey(s.cnpj, issued, n), storeId, `https://www.fazenda.pr.gov.br/nfce/qrcode?p=demo-${n}`, String(48000 + n), issued, total],
    );
    const receiptId = rows[0]?.id;
    n++;
    let line = 1;
    for (const l of g.lines) {
      await tx.query(
        `INSERT INTO receipt_items (receipt_id, store_id, line_no, store_code, description, quantity, unit, unit_price_cents, total_cents)
         VALUES ($1, $2, $3, $4, $5, 1, 'UN', $6, $6)`,
        [receiptId, storeId, line++, l.code, l.desc, Math.round(l.price * 100)],
      );
      if (l.ean) {
        await tx.query(
          `INSERT INTO barcode_links (store_id, store_code, gtin, origin) VALUES ($1, $2, $3, 'import')
           ON CONFLICT (store_id, store_code) DO NOTHING`,
          [storeId, l.code, l.ean],
        );
        await tx.query(
          `INSERT INTO barcode_registrations (store_id, store_code, gtin, origin)
           SELECT $1, $2, $3, 'import'
           WHERE NOT EXISTS (
             SELECT 1 FROM barcode_registrations
             WHERE store_id = $1 AND store_code = $2 AND gtin = $3 AND origin = 'import'
           )`,
          [storeId, l.code, l.ean],
        );
      }
    }
  }

  // fila do ADM (T-62) com exemplos reais de falha — sem retry automático
  for (const [i, [code, msg]] of [['SEFAZ_TIMEOUT', 'SEFAZ sem resposta (10 s)'], ['SEFAZ_PARSER_ERROR', 'HTML sem tabela de itens'], ['SEFAZ_PARSER_ERROR', 'Captcha inesperado']].entries()) {
    await tx.query(
      `INSERT INTO ingest_failures (url, error_code, error_message, attempts) VALUES ($1, $2, $3, $4) ON CONFLICT (url) DO NOTHING`,
      [`https://www.fazenda.pr.gov.br/nfce/qrcode?p=exemplo-falha-${i}`, code, msg, i + 1],
    );
  }
});

// admin para o backoffice (T-61..63)
const adminEmail = 'admin@notinhas.local';
const exists = await db.query('SELECT 1 FROM users WHERE email = $1 AND deleted_at IS NULL', [adminEmail]);
if (!exists.rowCount) {
  const password = process.env['SEED_ADMIN_PASSWORD'] ?? randomBytes(9).toString('base64url');
  await db.query(`INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, 'Admin', 'admin')`, [adminEmail, await hashPassword(password)]);
  console.log(`admin criado: ${adminEmail} / ${password}  (troque em produção)`);
}
const c = await db.query<{ r: number; i: number; l: number }>(
  'SELECT (SELECT count(*)::int FROM receipts) r, (SELECT count(*)::int FROM receipt_items) i, (SELECT count(*)::int FROM barcode_links) l',
);
console.log('seed ok:', c.rows[0]);
await db.end();
