/* notinhas.shop · protótipo v2.0 — dados do lab (SJP/PR)
   Lojas, DANFE e fotos vêm da base `enotas` (2026-11-08). Preços cruzados entre lojas
   e EANs marcados `exemplo` são conteúdo de protótipo. */
'use strict';

const TODAY = new Date('2026-11-08T10:00:00-03:00');
const ANCHOR = { lat: -25.5350, lng: -49.2060, label: 'Centro, São José dos Pinhais' };

const CATS = [
  { id: 'todas', nome: 'Todas', ico: 'grid' },
  { id: 'mercearia', nome: 'Mercearia', ico: 'box' },
  { id: 'bebidas-nao-alcoolicas', nome: 'Bebidas', ico: 'cup' },
  { id: 'bebidas-alcoolicas', nome: 'Cervejas', ico: 'beer' },
  { id: 'matinais', nome: 'Matinais', ico: 'sun' },
  { id: 'doces-bomboniere', nome: 'Doces', ico: 'candy' },
  { id: 'salgados-snacks', nome: 'Snacks', ico: 'snack' },
  { id: 'frios-laticinios', nome: 'Frios', ico: 'milk' },
  { id: 'limpeza', nome: 'Limpeza', ico: 'spray' },
  { id: 'higiene-beleza', nome: 'Higiene', ico: 'drop' },
  { id: 'pet', nome: 'Pet', ico: 'paw' },
  { id: 'bebe', nome: 'Bebê', ico: 'baby' },
];

/* razão social real da DANFE; `nome` = exibição */
const STORES = [
  { id: 'formosa', nome: 'Formosa', razao: 'FORMOSA COMERCIO VAREJISTA E ATAC LTDA', cnpj: '61.080.262/0001-06', bairro: 'Centro', end: 'R. Izabel a Redentora, 1434', lat: -25.5377, lng: -49.2043, notas: 1, itens: 4, ean: 4 },
  { id: 'dimed', nome: 'Dimed', razao: 'DIMED S/A DISTRIBUIDORA DE MEDICAMENTOS', cnpj: '92.665.611/0425-03', bairro: 'Centro', end: 'R. Izabel a Redentora, 1434 · loja 101', lat: -25.5372, lng: -49.2034, notas: 1, itens: 2, ean: 2 },
  { id: 'atacadao', nome: 'Atacadão', razao: 'ATACADAO S.A.', cnpj: '75.315.333/0222-69', bairro: 'Águas Belas', end: 'Av. Rui Barbosa, 7992', lat: -25.5283, lng: -49.1942, notas: 4, itens: 141, ean: 6 },
  { id: 'jupiter', nome: 'Jupiter', razao: 'JUPITER SUPERMERCADOS LTDA', cnpj: '04.118.410/0001-22', bairro: 'Centro', end: 'R. Izabel a Redentora, 1520', lat: -25.5392, lng: -49.2071, notas: 2, itens: 7, ean: 3 },
  { id: 'parada', nome: 'Parada do Avião', razao: 'Parada do Aviao Distribuidora de bebidas', cnpj: '33.204.551/0001-90', bairro: 'Boneca do Iguaçu', end: 'R. Pará, 960', lat: -25.5462, lng: -49.1871, notas: 1, itens: 1, ean: 0 },
  { id: 'stilo', nome: 'Stilo Atacadista', razao: 'Stilo Central Atacadista De Produtos Ltda', cnpj: '28.410.102/0001-55', bairro: 'Aviação', end: 'R. Medianeira, 386', lat: -25.5531, lng: -49.1988, notas: 2, itens: 38, ean: 3 },
  { id: 'tic', nome: 'TIC Posto VII', razao: 'TIC POSTO VII', cnpj: '07.553.913/0007-10', bairro: 'São Cristóvão', end: 'Av. das Torres, 1640', lat: -25.5208, lng: -49.2109, notas: 1, itens: 2, ean: 0 },
];

/* produtos com EAN vinculado (REQ-045) · ficha canônica produtos_ean (REQ-047/048) */
const PRODUCTS = [
  { ean: '3000054721644', titulo: 'Monster Ultra Fiesta Mango Zero 473ml', marca: 'Monster', cat: 'bebidas-nao-alcoolicas', sub: 'Energéticos e isotônicos', foto: 'media/3000054721644.jpg', ncm: '2202.99.00', fontes: ['PreçoMelhor', 'Open Food Facts'], danfe: 'ENERGETICO MONSTER ULTRA FIESTA MANGO ZERO 473ML' },
  { ean: '3000054355283', titulo: 'Monster Zero Açúcar Lata 473ml', marca: 'Monster', cat: 'bebidas-nao-alcoolicas', sub: 'Energéticos e isotônicos', foto: 'media/3000054355283.webp', ncm: '2202.99.00', fontes: ['PreçoMelhor'], danfe: 'ENERGETICO MONSTER ZERO ACUCAR 473ML' },
  { ean: '7896004006277', titulo: 'Batata Pringles Original 104g', marca: 'Pringles', cat: 'salgados-snacks', sub: 'Batatas', foto: 'media/7896004006277.webp', ncm: '2005.20.00', fontes: ['Open Food Facts', 'UPCitemdb'], danfe: 'BATATA PRINGLES ORIGINAL 100G# +' },
  { ean: '7896004006284', titulo: 'Batata Pringles Queijo 109g', marca: 'Pringles', cat: 'salgados-snacks', sub: 'Batatas', foto: 'media/7896004006284.webp', ncm: '2005.20.00', fontes: ['Open Food Facts'], danfe: 'BATATA PRINGLES MOLHO QUEIJO 100G# +' },
  { ean: '7898367984018', titulo: 'Cerveja Eisenbahn Pilsen Puro Malte 350ml', marca: 'Eisenbahn', cat: 'bebidas-alcoolicas', sub: 'Cervejas', foto: 'media/7898367984018.jpg', ncm: '2203.00.00', fontes: ['PreçoMelhor'], danfe: 'CERVEJA EISENBAHN LT 350ML#*+' },
  { ean: '7895144853734', titulo: 'Mentos Pure Fresh Strong Mint 8,5g', marca: 'Mentos', cat: 'doces-bomboniere', sub: 'Balas e chicletes', foto: 'media/7895144853734.jpg', ncm: '1704.10.00', fontes: ['PreçoMelhor', 'Open Food Facts'], danfe: 'CHICLE MENTOS PURE FRESH3 STRONG MINT 8,5GR# +' },
  { ean: '7894900011517', titulo: 'Coca-Cola Original 2L', marca: 'Coca-Cola', cat: 'bebidas-nao-alcoolicas', sub: 'Refrigerantes', foto: 'media/7894900011517.jpg', ncm: '2202.10.00', fontes: ['Open Food Facts'], danfe: 'Coca Cola Pet 6x2lt' },
  { ean: '7896006711117', titulo: 'Arroz Branco Camil Tipo 1 1kg', marca: 'Camil', cat: 'mercearia', sub: 'Arroz e feijão', foto: 'media/7896006711117.jpg', ncm: '1006.30.21', fontes: ['PreçoMelhor'], danfe: 'ARROZ CAMIL AG.T1' },
  { ean: '7891000379691', titulo: 'Achocolatado Nescau Lata 370g', marca: 'Nestlé', cat: 'matinais', sub: 'Achocolatados', foto: 'media/7891000379691.jpg', ncm: '1806.90.00', fontes: ['Open Food Facts'], danfe: 'ACHOC.PO NESCAU' },
  { ean: '7891000244258', titulo: 'Chocolate Nestlé Alpino 90g', marca: 'Nestlé', cat: 'doces-bomboniere', sub: 'Chocolates', foto: 'media/7891000244258.jpg', ncm: '1806.32.10', fontes: ['PreçoMelhor', 'Open Food Facts'], danfe: 'CHOC.NESTLE ALPINO' },
];

/* observações de preço (preço de balcão · NFC-e) · d = dias atrás */
const OBS = [
  ['3000054721644', 'dimed', 13.99, 0], ['3000054721644', 'stilo', 8.89, 2], ['3000054721644', 'atacadao', 9.49, 5], ['3000054721644', 'formosa', 12.49, 9], ['3000054721644', 'dimed', 14.29, 5], ['3000054721644', 'dimed', 15.40, 35],
  ['3000054355283', 'dimed', 13.99, 0], ['3000054355283', 'stilo', 8.89, 2], ['3000054355283', 'jupiter', 10.99, 6],
  ['7896004006277', 'formosa', 11.99, 4], ['7896004006277', 'atacadao', 10.90, 3], ['7896004006277', 'jupiter', 12.99, 8], ['7896004006277', 'formosa', 12.49, 20],
  ['7896004006284', 'formosa', 11.99, 4], ['7896004006284', 'atacadao', 10.90, 3],
  ['7898367984018', 'formosa', 3.99, 4], ['7898367984018', 'atacadao', 4.19, 3], ['7898367984018', 'stilo', 4.00, 2], ['7898367984018', 'parada', 4.29, 1], ['7898367984018', 'jupiter', 4.49, 10],
  ['7895144853734', 'formosa', 2.99, 4], ['7895144853734', 'tic', 3.99, 3], ['7895144853734', 'dimed', 3.49, 0], ['7895144853734', 'atacadao', 3.19, 3],
  ['7894900011517', 'stilo', 9.99, 2], ['7894900011517', 'atacadao', 10.49, 3], ['7894900011517', 'jupiter', 11.99, 6], ['7894900011517', 'parada', 10.99, 1], ['7894900011517', 'tic', 12.90, 3], ['7894900011517', 'jupiter', 12.49, 22], ['7894900011517', 'atacadao', 10.99, 30],
  ['7896006711117', 'atacadao', 5.99, 3], ['7896006711117', 'jupiter', 6.79, 6], ['7896006711117', 'formosa', 6.49, 4],
  ['7891000379691', 'atacadao', 7.89, 3], ['7891000379691', 'jupiter', 9.49, 6], ['7891000379691', 'formosa', 8.99, 4], ['7891000379691', 'atacadao', 8.49, 18],
  ['7891000244258', 'atacadao', 7.49, 3], ['7891000244258', 'formosa', 8.29, 4], ['7891000244258', 'dimed', 9.99, 0], ['7891000244258', 'tic', 8.99, 3], ['7891000244258', 'atacadao', 7.99, 12],
].map(([ean, store, price, d]) => ({ ean, store, price, d }));

/* itens da vitrine ainda sem EAN — descrição crua da DANFE (base real) */
const NO_EAN = {
  atacadao: [
    ['23407', 'ACHOC.PO TODDY', 4.59, 3], ['34808', 'LEITE L.V.ITALAC.INT', 4.99, 3], ['37001', 'CAFE MELITTA VACUO', 15.45, 3],
    ['13892', 'OLEO SOJA COCAMAR', 7.49, 3], ['82245', 'PAO FORMA VISCONTI', 5.89, 3], ['54629', 'BISC.CLUB SOCIAL', 5.89, 7],
    ['5614', 'MAC.NISSIN LAMEN', 2.49, 3], ['57912', 'CHOC.NESTLE KIT KAT', 4.29, 7], ['14948', 'ACUC.REF.A.ALEGRE', 4.19, 3], ['39734', 'PAPEL HIG.PALOMA N.', 3.59, 3],
  ],
  stilo: [['100250', 'Heineken Lata 12x350', 5.00, 2], ['100145', 'Guarana Antarct 6x2l', 8.99, 2], ['106887', 'Pepsi Lata 12x350ml', 3.50, 2], ['100277', 'Budweiser Lt 12x350', 4.00, 2]],
  jupiter: [['17038', 'CERVEJA LATA HEINEKEN ORIG 350ML#*+', 5.99, 0], ['34811', 'LEITE ITALAC INTEGRAL 1L', 5.29, 0], ['82250', 'PAO FORMA VISCONTI 400G', 6.49, 0], ['10213', 'BATATA PRINGLES ORIGINAL 100G# +', 12.99, 0]],
  parada: [['000937', 'CHEETOS REQUEIJAO 105G ATACADO', 5.90, 1]],
  tic: [['10887', 'SNICKERS BRANCO 42G', 5.99, 3]],
  formosa: [], dimed: [],
};

/* sugestões SI5/SERP pelo descritivo (REQ-039/043) · EANs `exemplo` */
const SUGGEST = {
  'BATATA PRINGLES ORIGINAL 100G# +': [
    { ean: '7896004006277', titulo: 'Batata Pringles Original 104g', score: 0.94, fonte: 'SI5', foto: 'media/7896004006277.webp' },
    { ean: '7896004006284', titulo: 'Batata Pringles Queijo 109g', score: 0.61, fonte: 'SERP', foto: 'media/7896004006284.webp' },
  ],
  'CERVEJA LATA HEINEKEN ORIG 350ML#*+': [
    { ean: '78936683', titulo: 'Cerveja Heineken Lata 350ml', score: 0.92, fonte: 'SI5', foto: null, exemplo: true },
    { ean: '7896045506873', titulo: 'Cerveja Heineken Long Neck 330ml', score: 0.71, fonte: 'SERP', foto: null, exemplo: true },
  ],
  'ACHOC.PO TODDY': [
    { ean: '7894321711263', titulo: 'Achocolatado em Pó Toddy Original 370g', score: 0.88, fonte: 'SI5', foto: null, exemplo: true },
    { ean: '7894321722016', titulo: 'Achocolatado Toddy Original 750g', score: 0.66, fonte: 'SERP', foto: null, exemplo: true },
  ],
};
const suggestFor = (desc) => SUGGEST[desc] || [
  { ean: '7890000' + String(desc.length * 7919).padStart(5, '0').slice(0, 5) + '3', titulo: humanize(desc), score: 0.74, fonte: 'SI5', foto: null, exemplo: true },
];

/* nota que o scan "lê" no protótipo (Jupiter, hoje) */
const SCANNED = {
  chave: '4126 1104 1184 1000 0122 6500 1000 0482 7110 2938 4417',
  store: 'jupiter', d: 0, hora: '09:41', numero: '48271',
  itens: [
    { cod: '17038', desc: 'CERVEJA LATA HEINEKEN ORIG 350ML#*+', qtd: 6, v: 5.99, ean: null },
    { cod: '20981', desc: 'COCA COLA PET 2L', qtd: 1, v: 11.99, ean: '7894900011517', origem: 'barcode_scan' },
    { cod: '12474', desc: 'ARROZ CAMIL AG.T1 1KG', qtd: 2, v: 6.79, ean: '7896006711117', origem: 'sugestao' },
    { cod: '86534', desc: 'ACHOC.PO NESCAU 370G', qtd: 1, v: 9.49, ean: '7891000379691', origem: 'manual' },
    { cod: '10213', desc: 'BATATA PRINGLES ORIGINAL 100G# +', qtd: 1, v: 12.99, ean: null },
    { cod: '34811', desc: 'LEITE ITALAC INTEGRAL 1L', qtd: 4, v: 5.29, ean: null },
  ],
};

/* minhas notas (posse: fingerprint ou conta · RN-14) */
const MY_NOTES = [
  { id: 'n-stilo', store: 'stilo', d: 2, total: 74.30, itens: 12, ean: 2, numero: '102733' },
  { id: 'n-formosa', store: 'formosa', d: 4, total: 30.96, itens: 4, ean: 4, numero: '889120' },
  { id: 'n-atac', store: 'atacadao', d: 6, total: 287.40, itens: 38, ean: 5, numero: '553018' },
  { id: 'n-dimed', store: 'dimed', d: 9, total: 27.98, itens: 2, ean: 2, numero: '310442' },
];

const MONTHS = [['jun', 612.3], ['jul', 701.9], ['ago', 655.0], ['set', 744.2], ['out', 688.7], ['nov', 420.64]];

const SPEND_CATS = [['Mercearia', 142.1], ['Bebidas', 118.6], ['Doces e snacks', 76.2], ['Frios e laticínios', 51.9], ['Limpeza', 31.84]];

/* ADM (US-ADM.01..03) */
const ADM_FAILS = [
  { chave: '4126 1104 …7710 9131', erro: 'Timeout SEFAZ PR (10s)', quando: 'há 2 h', tent: 2 },
  { chave: '4126 1004 …1180 4422', erro: 'HTML sem tabela de itens', quando: 'há 5 h', tent: 1 },
  { chave: '4126 1104 …0091 2207', erro: 'Captcha inesperado', quando: 'há 1 dia', tent: 3 },
];
const ADM_FLAGS = [
  { tipo: 'EAN divergente', alvo: 'Atacadão · cód. 86534 → 7891000379691 vs 7891000053508', votos: '2 × 1', quando: 'há 3 h' },
  { tipo: 'Preço fora da curva', alvo: 'BISC.TRENTO WAFER R$ 31,84 (mediana R$ 3,19)', votos: 'auto', quando: 'há 1 dia' },
  { tipo: 'Preço fora da curva', alvo: 'ENERG.MONSTER LATA R$ 51,54 (fardo?)', votos: 'auto', quando: 'há 1 dia' },
];

/* ---------- helpers de domínio ---------- */
/* normalização de abreviações da NFC-e (REQ-039) */
const ABBR = { ACHOC: 'Achocolatado', PO: 'em Pó', ACUC: 'Açúcar', REF: 'Refinado', BISC: 'Biscoito', CHOC: 'Chocolate', MAC: 'Macarrão', HIG: 'Higiênico', INT: 'Integral', LT: 'Lata', ORIG: 'Original', ABS: 'Absorvente', SALG: 'Salgadinho', ENERG: 'Energético', QJO: 'Queijo', MUSS: 'Muçarela', DET: 'Detergente', LIQ: 'Líquido', OLEO: 'Óleo', CAFE: 'Café', PAO: 'Pão', AGUA: 'Água', REQUEIJAO: 'Requeijão', INST: 'Instantâneo', VACUO: 'a Vácuo', REQ: 'Requeijão', GUARANA: 'Guaraná', ANTARCT: 'Antarctica', ACUCAR: 'Açúcar', ENERGETICO: 'Energético' };
function humanize(s) {
  const t = s.replace(/[#*+]/g, ' ').replace(/\bL\.V\./g, 'LONGA VIDA ').replace(/\bA\.ALEGRE\b/g, 'ALTO ALEGRE');
  return t.split(/[\s.]+/).filter(Boolean).map((w) => {
    const u = w.toUpperCase();
    if (ABBR[u]) return ABBR[u];
    if (/^\d+([.,]\d+)?(ML|G|GR|KG|L|LT)$/i.test(w)) return w.toLowerCase().replace('gr', 'g');
    if (/^\d+x\d*/i.test(w)) return w.toLowerCase();
    return u.charAt(0) + u.slice(1).toLowerCase();
  }).join(' ');
}
const storeById = (id) => STORES.find((s) => s.id === id);
const prodByEan = (e) => PRODUCTS.find((p) => p.ean === e);
const brl = (v) => 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const pct = (v) => (v > 0 ? '+' : '') + Math.round(v * 100) + '%';
function when(d) { return d === 0 ? 'hoje' : d === 1 ? 'ontem' : 'há ' + d + ' dias'; }
function dateOf(d) { const t = new Date(TODAY); t.setDate(t.getDate() - d); return t.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); }
function median(a) { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0; }
function km(a, b) {
  const R = 6371, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lng - a.lng) * r;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const distOf = (storeId) => km(ANCHOR, storeById(storeId));
/* progresso da loja: itens/EAN observados no protótipo + base real (REQ-046) */
function storeStats(s) {
  const ean = PRODUCTS.filter((p) => OBS.some((o) => o.ean === p.ean && o.store === s.id)).length + (typeof S !== 'undefined' ? S.linkedVitrine.filter((k) => k.startsWith(s.id)).length : 0);
  return { ean: Math.max(ean, s.ean), itens: Math.max(s.itens, ean + (NO_EAN[s.id] || []).length), notas: s.notas };
}
const fmtKm = (k) => (k < 1 ? Math.round(k * 1000) + ' m' : k.toFixed(1).replace('.', ',') + ' km');

/* última observação por loja dentro da janela (Q3: 14 dias quente) */
function latestByStore(ean, win = 9999) {
  const m = new Map();
  OBS.filter((o) => o.ean === ean && o.d <= win).forEach((o) => { const c = m.get(o.store); if (!c || o.d < c.d) m.set(o.store, o); });
  return [...m.values()].sort((a, b) => a.price - b.price || a.d - b.d);
}
function bestOf(ean) { return latestByStore(ean, 14)[0] || latestByStore(ean)[0]; }
/* RN-11 destaque: ≥5% e ≥ R$0,50 abaixo da mediana 14d */
function highlight(ean) {
  const l = latestByStore(ean, 14); if (l.length < 3) return null;
  const med = median(l.map((o) => o.price)), b = l[0];
  return b.price <= med * 0.95 && med - b.price >= 0.5 ? { obs: b, med, off: (b.price - med) / med } : null;
}
/* RN-10 ranking: mediana dos índices preço/mediana regional por EAN */
function storeRanking(radius) {
  const rows = STORES.filter((s) => distOf(s.id) <= radius).map((s) => {
    const ratios = [];
    PRODUCTS.forEach((p) => {
      const l = latestByStore(p.ean, 14); const mine = l.find((o) => o.store === s.id);
      if (mine && l.length >= 2) ratios.push(mine.price / median(l.map((o) => o.price)) - 1);
    });
    return { s, idx: ratios.length >= 2 ? median(ratios) : null, n: ratios.length, dist: distOf(s.id) };
  });
  const ranked = rows.filter((r) => r.idx !== null).sort((a, b) => a.idx - b.idx);
  ranked.forEach((r, i) => { r.pos = i + 1; r.of = ranked.length; });
  return [...ranked, ...rows.filter((r) => r.idx === null)];
}
/* cotação de lista (RN-13: nunca interpola preço) */
function quote(items) {
  const byStore = STORES.map((s) => {
    let total = 0, found = 0; const missing = [];
    items.forEach((it) => { const o = latestByStore(it.ean, 30).find((x) => x.store === s.id); if (o) { total += o.price * it.qty; found++; } else missing.push(it.ean); });
    return { s, total, found, missing, cov: items.length ? found / items.length : 0 };
  }).filter((r) => r.found > 0).sort((a, b) => b.found - a.found || a.total - b.total);
  const split = new Map(); let splitTotal = 0; const uncovered = [];
  items.forEach((it) => {
    const o = latestByStore(it.ean, 30)[0];
    if (!o) { uncovered.push(it.ean); return; }
    if (!split.has(o.store)) split.set(o.store, []);
    split.get(o.store).push({ ...it, price: o.price, d: o.d }); splitTotal += o.price * it.qty;
  });
  const full = byStore.filter((r) => r.found === items.length - uncovered.length);
  const ref = full[0] || byStore[0];
  /* compara só o que a loja de referência tem (sem inventar preço — RN-13) */
  const splitOnRef = ref ? items.filter((it) => !ref.missing.includes(it.ean) && !uncovered.includes(it.ean)).reduce((a, it) => a + latestByStore(it.ean, 30)[0].price * it.qty, 0) : 0;
  return { byStore, split: [...split.entries()], splitTotal, uncovered, ref, partial: ref ? ref.found < items.length - uncovered.length : false, saving: ref ? ref.total - splitOnRef : 0 };
}
/* GTIN mod-10 (EAN-8/12/13/14) */
function gtinValid(code) {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false;
  const d = code.split('').map(Number), chk = d.pop();
  const sum = d.reverse().reduce((acc, n, i) => acc + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === chk;
}
