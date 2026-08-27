export type Product = {
  id: string;
  name: string;
  sku: string;
  ean: string;
  model: string;
  category: string;
  pmaPremium: number;
  pmaClassic: number;
  recommendedPrice?: number;
  status: 'ativo' | 'pausado';
  frequency: string;
  startDate: string;
  nextScan: string;
};

export type Ad = {
  id: string;
  productId: string;
  title: string;
  seller: string;
  company: string;
  marketplace: string;
  modality: string;
  price: number;
  promoPrice?: number;
  shipping?: number;
  installments?: number;
  pmaApplied: number;
  diffPct: number;
  classification: 'regular' | 'irregular' | 'pendente' | 'descartado';
  adStatus: 'ativo' | 'pausado' | 'encerrado';
  partner?: string;
  unregistered?: boolean;
  collectedAt: string;
  url: string;
};

export type Occurrence = {
  id: string;
  number: string;
  product: string;
  sku: string;
  pma: number;
  price: number;
  diffPct: number;
  marketplace: string;
  seller: string;
  partner?: string;
  status: 'Identificada' | 'Enviada' | 'Aguardando correção' | 'Corrigida' | 'Reincidente';
  responsible?: string;
  deadline?: string;
  identifiedAt: string;
  overdue?: boolean;
};

export type Partner = {
  id: string;
  legalName: string;
  tradeName: string;
  cnpj: string;
  email: string;
  phone: string;
  distributor: string;
  marketplaces: string[];
  status: 'ativo' | 'inativo';
  openOccurrences: number;
  compliance: number;
};

export const products: Product[] = [
  {
    id: '1',
    name: 'Bluetti AC200MAX',
    sku: 'AC200MAX-127V',
    ean: '1234567890123',
    model: 'AC200MAX',
    category: 'Estação de energia',
    pmaPremium: 8999,
    pmaClassic: 8499,
    recommendedPrice: 9999,
    status: 'ativo',
    frequency: '6h',
    startDate: '2026-01-15',
    nextScan: '2026-08-26 21:00',
  },
  {
    id: '2',
    name: 'Bluetti AC200MAX 220V',
    sku: 'AC200MAX-220V',
    ean: '1234567890124',
    model: 'AC200MAX',
    category: 'Estação de energia',
    pmaPremium: 9299,
    pmaClassic: 8799,
    status: 'ativo',
    frequency: '12h',
    startDate: '2026-01-15',
    nextScan: '2026-08-27 08:00',
  },
  {
    id: '3',
    name: 'Bluetti EB3A',
    sku: 'EB3A-127V',
    ean: '1234567890125',
    model: 'EB3A',
    category: 'Estação portátil',
    pmaPremium: 2499,
    pmaClassic: 2299,
    status: 'pausado',
    frequency: 'diária',
    startDate: '2026-02-01',
    nextScan: '—',
  },
];

export const ads: Ad[] = [
  {
    id: 'a1',
    productId: '1',
    title: 'Bluetti AC200MAX 127V Estação Solar',
    seller: 'TechPower SP',
    company: 'TechPower Comércio LTDA',
    marketplace: 'Mercado Livre',
    modality: 'Premium',
    price: 8799,
    shipping: 0,
    installments: 12,
    pmaApplied: 8999,
    diffPct: -2.2,
    classification: 'irregular',
    adStatus: 'ativo',
    partner: 'TechPower Comércio LTDA',
    collectedAt: '2026-08-26 14:30',
    url: 'https://mercadolivre.com.br/anuncio/1',
  },
  {
    id: 'a2',
    productId: '1',
    title: 'AC200MAX Bluetti 127V',
    seller: 'Loja Desconhecida',
    company: '—',
    marketplace: 'Shopee',
    modality: 'Padrão',
    price: 8100,
    pmaApplied: 8279,
    diffPct: -2.2,
    classification: 'irregular',
    adStatus: 'ativo',
    unregistered: true,
    collectedAt: '2026-08-26 14:30',
    url: 'https://shopee.com.br/anuncio/2',
  },
  {
    id: 'a3',
    productId: '2',
    title: 'Bluetti AC200MAX 220V',
    seller: 'Energia Verde',
    company: 'Energia Verde LTDA',
    marketplace: 'Magalu',
    modality: 'Clássico',
    price: 9199,
    pmaApplied: 8799,
    diffPct: 4.5,
    classification: 'regular',
    adStatus: 'ativo',
    partner: 'Energia Verde LTDA',
    collectedAt: '2026-08-26 12:00',
    url: 'https://magazineluiza.com.br/anuncio/3',
  },
];

export const occurrences: Occurrence[] = [
  {
    id: 'o1',
    number: 'OC-2026-0042',
    product: 'Bluetti AC200MAX',
    sku: 'AC200MAX-127V',
    pma: 8999,
    price: 8799,
    diffPct: -2.2,
    marketplace: 'Mercado Livre',
    seller: 'TechPower SP',
    partner: 'TechPower Comércio LTDA',
    status: 'Aguardando correção',
    responsible: 'Ana Silva',
    deadline: '2026-08-28',
    identifiedAt: '2026-08-26 14:35',
  },
  {
    id: 'o2',
    number: 'OC-2026-0041',
    product: 'Bluetti AC200MAX',
    sku: 'AC200MAX-127V',
    pma: 8279,
    price: 8100,
    diffPct: -2.2,
    marketplace: 'Shopee',
    seller: 'Loja Desconhecida',
    status: 'Identificada',
    identifiedAt: '2026-08-26 14:35',
  },
];

export const partners: Partner[] = [
  {
    id: 'p1',
    legalName: 'TechPower Comércio LTDA',
    tradeName: 'TechPower SP',
    cnpj: '12.345.678/0001-90',
    email: 'comercial@techpower.com.br',
    phone: '(11) 99999-0000',
    distributor: 'Distribuidor Sul',
    marketplaces: ['Mercado Livre', 'Amazon'],
    status: 'ativo',
    openOccurrences: 1,
    compliance: 78,
  },
  {
    id: 'p2',
    legalName: 'Energia Verde LTDA',
    tradeName: 'Energia Verde',
    cnpj: '98.765.432/0001-10',
    email: 'vendas@energiaverde.com.br',
    phone: '(21) 98888-1111',
    distributor: 'Distribuidor RJ',
    marketplaces: ['Magalu', 'Casas Bahia'],
    status: 'ativo',
    openOccurrences: 0,
    compliance: 95,
  },
];

export const marketplaces = [
  'Mercado Livre',
  'Amazon',
  'Shopee',
  'Magalu',
  'Carrefour',
  'Casas Bahia / Via',
  'KaBuM',
  'AliExpress',
  'Google Shopping',
];

export const notifications = [
  { id: 'n1', text: 'Nova irregularidade OC-2026-0042 — TechPower SP', link: '/fiscalizacao/ocorrencias/o1' },
  { id: 'n2', text: 'Prazo vencido — OC-2026-0038', link: '/fiscalizacao/ocorrencias' },
  { id: 'n3', text: 'Falha de varredura no KaBuM', link: '/monitoramento/log' },
];

export const scanLogs = [
  {
    id: 's1',
    at: '2026-08-26 14:00',
    sku: 'AC200MAX-127V',
    channels: 'ML, Shopee, Magalu',
    duration: '4m 12s',
    found: 8,
    new: 2,
    status: 'sucesso',
    error: '',
  },
  {
    id: 's2',
    at: '2026-08-26 14:00',
    sku: 'EB3A-127V',
    channels: 'ML, Amazon',
    duration: '2m 05s',
    found: 0,
    new: 0,
    status: 'parcial',
    error: 'KaBuM: timeout',
  },
];

export const unregisteredSellers = [
  {
    id: 'u1',
    seller: 'Loja Desconhecida',
    company: '—',
    cnpj: '—',
    marketplace: 'Shopee',
    products: 'AC200MAX-127V',
    ads: 3,
    irregularities: 2,
    firstSeen: '2026-08-20',
    lastSeen: '2026-08-26',
  },
];

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

export function getAd(id: string) {
  return ads.find((a) => a.id === id);
}

export function getOccurrence(id: string) {
  return occurrences.find((o) => o.id === id);
}

export function getPartner(id: string) {
  return partners.find((p) => p.id === id);
}
