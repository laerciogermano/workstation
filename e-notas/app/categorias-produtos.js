/**
 * Categorias canônicas do catálogo (REQ-049).
 * Doc: ../docs/categorias-produtos.md
 */

/** @typedef {{ id: string, nome: string }} CategoriaL1 */

/** @type {CategoriaL1[]} */
export const CATEGORIAS_L1 = [
  { id: 'hortifruti', nome: 'Hortifruti' },
  { id: 'acougue-peixaria', nome: 'Açougue e peixaria' },
  { id: 'frios-laticinios', nome: 'Frios e laticínios' },
  { id: 'padaria', nome: 'Padaria' },
  { id: 'mercearia', nome: 'Mercearia / alimentos básicos' },
  { id: 'matinais', nome: 'Matinais' },
  { id: 'doces-bomboniere', nome: 'Doces e bomboniere' },
  { id: 'salgados-snacks', nome: 'Salgados e snacks' },
  { id: 'congelados', nome: 'Congelados' },
  { id: 'bebidas-nao-alcoolicas', nome: 'Bebidas não alcoólicas' },
  { id: 'bebidas-alcoolicas', nome: 'Bebidas alcoólicas' },
  { id: 'higiene-beleza', nome: 'Higiene e beleza' },
  { id: 'limpeza', nome: 'Limpeza' },
  { id: 'bebe', nome: 'Bebê' },
  { id: 'pet', nome: 'Pet' },
  { id: 'bazar', nome: 'Bazar / utilidades' },
  { id: 'farmacia-suplementos', nome: 'Farmácia / suplementos' },
  { id: 'outros', nome: 'Outros' },
];

/** Subcategorias por id L1. */
export const SUBCATEGORIAS = {
  'bebidas-nao-alcoolicas': [
    'Refrigerantes',
    'Águas',
    'Sucos e refrescos',
    'Energéticos e isotônicos',
    'Chás e ready-to-drink',
  ],
  'bebidas-alcoolicas': ['Cervejas', 'Vinhos e espumantes', 'Destilados e drinks'],
  'salgados-snacks': ['Batatas', 'Salgadinhos', 'Pipocas'],
  'doces-bomboniere': [
    'Balas e pirulitos',
    'Chocolates',
    'Biscoitos doces',
    'Doces em geral',
  ],
  mercearia: [
    'Arroz e feijão',
    'Óleos e azeites',
    'Massas',
    'Conservas',
    'Farinhas e grãos',
  ],
  'frios-laticinios': [
    'Leites',
    'Iogurtes e bebidas lácteas',
    'Queijos',
    'Embutidos e frios',
  ],
  limpeza: ['Roupas', 'Cozinha', 'Banheiro e casa'],
  'higiene-beleza': ['Cabelo', 'Corpo e banho', 'Oral', 'Desodorantes'],
};

const NOME_BY_ID = new Map(CATEGORIAS_L1.map((c) => [c.id, c.nome]));
const ID_BY_NOME = new Map(
  CATEGORIAS_L1.map((c) => [c.nome.toLowerCase(), c.id]),
);

/** Sinônimos / trechos → id L1 (+ sub opcional). */
const MAPA = [
  { re: /energ[eé]tic|isot[oô]nic|monster|red\s*bull/i, l1: 'bebidas-nao-alcoolicas', l2: 'Energéticos e isotônicos' },
  { re: /refrigerante|coca|guaran[aá]|pepsi/i, l1: 'bebidas-nao-alcoolicas', l2: 'Refrigerantes' },
  { re: /\b[aá]gua\b|crystal|bonafont/i, l1: 'bebidas-nao-alcoolicas', l2: 'Águas' },
  { re: /suco|refresco|tang|del\s*valle/i, l1: 'bebidas-nao-alcoolicas', l2: 'Sucos e refrescos' },
  { re: /cerveja|pilsen|eisenbahn|skol|brahma|heineken/i, l1: 'bebidas-alcoolicas', l2: 'Cervejas' },
  { re: /vinho|espumante/i, l1: 'bebidas-alcoolicas', l2: 'Vinhos e espumantes' },
  { re: /pringles|salgadinho|batata\s*frita|chips|snack/i, l1: 'salgados-snacks', l2: 'Salgadinhos' },
  { re: /mentos|bala|pirulito|chiclete|chocolate|bombom/i, l1: 'doces-bomboniere' },
  { re: /arroz|feij[aã]o|macarr[aã]o|massa|óleo|azeite|farinha/i, l1: 'mercearia' },
  { re: /leite|iogurte|queijo|presunto|mortadela|embutido/i, l1: 'frios-laticinios' },
  { re: /p[aã]o|padaria|bolo/i, l1: 'padaria' },
  { re: /caf[eé]|achocolatado|cereal|matin/i, l1: 'matinais' },
  { re: /congelad|lasanha|pizza\s*congel/i, l1: 'congelados' },
  { re: /detergente|amaciante|sab[aã]o|limpeza|desinfet/i, l1: 'limpeza' },
  { re: /sabonete|shampoo|desodorante|creme\s*dental|higiene/i, l1: 'higiene-beleza' },
  { re: /fralda|beb[eê]|lenço\s*umedecido/i, l1: 'bebe' },
  { re: /\bpet\b|ração|cachorro|gato/i, l1: 'pet' },
  { re: /hortifruti|fruta|legume|verdura/i, l1: 'hortifruti' },
  { re: /carne|frango|peixe|açougue/i, l1: 'acougue-peixaria' },
];

/**
 * Normaliza lista livre → nomes canônicos L1 (+ L2 se houver).
 * @param {string[]|string|null|undefined} raw
 * @param {string} [tituloHint]
 * @returns {string[]}
 */
export function normalizeCategoriasCanonicas(raw, tituloHint = '') {
  const out = [];
  const seen = new Set();
  const push = (nome) => {
    const n = String(nome || '').trim();
    if (!n) return;
    const key = n.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(n);
  };

  const parts = Array.isArray(raw)
    ? raw
    : String(raw || '')
        .split(/[;,|/]/)
        .map((s) => s.trim())
        .filter(Boolean);

  for (const p of parts) {
    const id = ID_BY_NOME.get(p.toLowerCase());
    if (id) {
      push(NOME_BY_ID.get(id));
      continue;
    }
    const hit = MAPA.find((m) => m.re.test(p));
    if (hit) {
      push(NOME_BY_ID.get(hit.l1));
      if (hit.l2) push(hit.l2);
    }
  }

  if (!out.length && tituloHint) {
    const hit = MAPA.find((m) => m.re.test(tituloHint));
    if (hit) {
      push(NOME_BY_ID.get(hit.l1));
      if (hit.l2) push(hit.l2);
    }
  }

  if (!out.length && (parts.length || tituloHint)) push(NOME_BY_ID.get('outros'));
  return out.slice(0, 8);
}
