export const ROLES = ['attendee', 'family', 'organizer', 'auctioneer'] as const;
export type Role = (typeof ROLES)[number];

/** Componentes plugáveis (CU-55 e CU-73). `staff`: nasce visível só para a organização. */
export const MODULES = {
  auction: { name: 'Leilão', description: 'Leiloeiro chama o leilão e compradores dão lances.' },
  membership_card: { name: 'Carteirinha', description: 'Identificação digital do irmão.' },
  tickets: { name: 'Check-ins e ingressos', description: 'Ingresso e presença em cada evento.' },
  orders: { name: 'Pedidos', description: 'Compras feitas pelo app.' },
  news: { name: 'Notícias', description: 'Comunicados do evento.' },
  vouchers: { name: 'Vouchers de alimentação', description: 'Refeições incluídas na inscrição.' },
  parking: { name: 'Vagas de estacionamento', description: 'Reserva de vaga nos locais.' },
  membership: { name: 'Minha assinatura', description: 'Situação da anuidade.' },
  cost_shares: { name: 'Meus rateios', description: 'Divisão de custos entre irmãos.' },
  network: { name: 'Rede de empresas', description: 'Empresas de irmãos e parceiras.' },
  ranking: { name: 'Meu ranking', description: 'Pontos pela participação.' },
  support: { name: 'Central de atendimento', description: 'Contato com a organização.' },
  products: { name: 'Produtos', description: 'Loja de itens comemorativos.' },
  rooms: { name: 'Gestão de salas', description: 'Reserva de salas dos locais.', staff: true },
  museum: { name: 'Museu e acervo', description: 'Documentos, imóveis, joias e selos.' },
  risks: { name: 'Gestão de riscos', description: 'Riscos do evento e responsáveis.', staff: true },
} as const;
export type ModuleKey = keyof typeof MODULES;
export type ModuleSettings = Record<ModuleKey, { enabled: boolean; roles: Role[] }>;

export function defaultModules(): ModuleSettings {
  return Object.fromEntries(Object.entries(MODULES).map(([k, m]) => [k, {
    enabled: true, roles: 'staff' in m ? ['organizer'] : ['attendee', 'organizer', 'auctioneer'],
  }])) as ModuleSettings;
}

/** Desligado vale para todos; a organização vê o que estiver ligado. */
export function canSee(modules: ModuleSettings, key: ModuleKey, roles: Role[]): boolean {
  const m = modules[key];
  return !!m?.enabled && (roles.includes('organizer') || roles.some((r) => m.roles.includes(r)));
}
