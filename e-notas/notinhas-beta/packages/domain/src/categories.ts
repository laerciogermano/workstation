/** Categorias canônicas L1 (REQ-049) — ids estáveis, nomes de exibição. */
export const CATEGORIES = [
  { id: 'mercearia', name: 'Mercearia', short: 'Mercearia', icon: 'box' },
  { id: 'bebidas-nao-alcoolicas', name: 'Bebidas não alcoólicas', short: 'Bebidas', icon: 'cup' },
  { id: 'bebidas-alcoolicas', name: 'Bebidas alcoólicas', short: 'Cervejas', icon: 'beer' },
  { id: 'matinais', name: 'Matinais', short: 'Matinais', icon: 'sun' },
  { id: 'doces-bomboniere', name: 'Doces e bomboniere', short: 'Doces', icon: 'candy' },
  { id: 'salgados-snacks', name: 'Salgados e snacks', short: 'Snacks', icon: 'snack' },
  { id: 'frios-laticinios', name: 'Frios e laticínios', short: 'Frios', icon: 'milk' },
  { id: 'padaria', name: 'Padaria', short: 'Padaria', icon: 'box' },
  { id: 'hortifruti', name: 'Hortifruti', short: 'Hortifruti', icon: 'box' },
  { id: 'acougue-peixaria', name: 'Açougue e peixaria', short: 'Açougue', icon: 'box' },
  { id: 'congelados', name: 'Congelados', short: 'Congelados', icon: 'box' },
  { id: 'limpeza', name: 'Limpeza', short: 'Limpeza', icon: 'spray' },
  { id: 'higiene-beleza', name: 'Higiene e beleza', short: 'Higiene', icon: 'drop' },
  { id: 'pet', name: 'Pet', short: 'Pet', icon: 'paw' },
  { id: 'bebe', name: 'Bebê', short: 'Bebê', icon: 'baby' },
  { id: 'outros', name: 'Outros', short: 'Outros', icon: 'box' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];
export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as unknown as readonly [CategoryId, ...CategoryId[]];

const RULES: readonly { re: RegExp; id: CategoryId; sub?: string }[] = [
  { re: /energ[eé]tic|isot[oô]nic|monster|red\s*bull/i, id: 'bebidas-nao-alcoolicas', sub: 'Energéticos e isotônicos' },
  { re: /refrigerante|coca|guaran[aá]|pepsi|refri\b/i, id: 'bebidas-nao-alcoolicas', sub: 'Refrigerantes' },
  { re: /\b[aá]gua\b|crystal|bonafont/i, id: 'bebidas-nao-alcoolicas', sub: 'Águas' },
  { re: /suco|refresco|tang\b|del\s*valle/i, id: 'bebidas-nao-alcoolicas', sub: 'Sucos e refrescos' },
  { re: /cerveja|pilsen|eisenbahn|skol|brahma|heineken|budweiser/i, id: 'bebidas-alcoolicas', sub: 'Cervejas' },
  { re: /vinho|espumante/i, id: 'bebidas-alcoolicas', sub: 'Vinhos e espumantes' },
  { re: /pringles|salgadinho|batata|chips|snack|cheetos|doritos/i, id: 'salgados-snacks', sub: 'Salgadinhos' },
  { re: /chocolate|\bchoc\b|bombom|kit\s*kat|alpino|snickers/i, id: 'doces-bomboniere', sub: 'Chocolates' },
  { re: /mentos|\bbala\b|pirulito|chiclete|chicle/i, id: 'doces-bomboniere', sub: 'Balas e chicletes' },
  { re: /\bbisc|biscoito|wafer|club\s*social/i, id: 'doces-bomboniere', sub: 'Biscoitos' },
  { re: /arroz|feij[aã]o/i, id: 'mercearia', sub: 'Arroz e feijão' },
  { re: /macarr[aã]o|\bmac\b|lamen|massa/i, id: 'mercearia', sub: 'Massas' },
  { re: /[oó]leo|azeite/i, id: 'mercearia', sub: 'Óleos e azeites' },
  { re: /a[cç][uú]car|\bacuc\b|farinha|sal\b/i, id: 'mercearia', sub: 'Farinhas e grãos' },
  { re: /leite|iogurte|queijo|presunto|mortadela|requeij/i, id: 'frios-laticinios' },
  { re: /\bp[aã]o\b|bolo|torrada/i, id: 'padaria' },
  { re: /caf[eé]|achoc|nescau|toddy|cereal|aveia/i, id: 'matinais' },
  { re: /congelad|lasanha|pizza/i, id: 'congelados' },
  { re: /detergente|amaciante|sab[aã]o\b|desinfet|\bpapel\s*hig/i, id: 'limpeza' },
  { re: /sabonete|shampoo|desodorante|creme\s*dental|absorvente/i, id: 'higiene-beleza' },
  { re: /fralda|lenço\s*umedecido/i, id: 'bebe' },
  { re: /ra[cç][aã]o|\bpet\b|cachorro|gato/i, id: 'pet' },
  { re: /banana|tomate|cebola|batata\s*inglesa|fruta|legume|verdura/i, id: 'hortifruti' },
  { re: /carne|frango|peixe|lingui[cç]a|bovin/i, id: 'acougue-peixaria' },
];

export function classifyProduct(text: string): { category: CategoryId; subcategory: string | null } {
  const hit = RULES.find((r) => r.re.test(text));
  return hit ? { category: hit.id, subcategory: hit.sub ?? null } : { category: 'outros', subcategory: null };
}
