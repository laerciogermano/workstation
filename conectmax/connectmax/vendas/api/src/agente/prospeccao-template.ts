/**
 * Template de mensagem de prospecção.
 * Placeholders: `{{chave}}` ou `$chave$` (case-insensitive).
 */
export const DEFAULT_MENSAGEM_PROSPECCAO =
  'Oi {{primeiro_nome}}, tudo bem?';

export const PROSPECCAO_VAR_KEYS = [
  'primeiro_nome',
  'nome',
  'firstname',
  'lastname',
  'nome_agente',
  'empresa',
  'cargo',
  'headline',
  'cidade',
  'email',
  'telefone',
  'profile_url',
] as const;

export type ProspeccaoVarKey = (typeof PROSPECCAO_VAR_KEYS)[number];

export type ProspeccaoTemplateVars = {
  nome?: string | null;
  /** First name do agente (`agentes.first_name`). */
  firstName?: string | null;
  /** Last name do agente (`agentes.last_name`). */
  lastName?: string | null;
  /** Fallback de nome completo do agente (`agentes.nome`) se first+last vazios. */
  nomeAgente?: string | null;
  empresa?: string | null;
  cargo?: string | null;
  headline?: string | null;
  cidade?: string | null;
  email?: string | null;
  telefone?: string | null;
  profileUrl?: string | null;
};

export function primeiroNomeFrom(nome: string | null | undefined): string {
  const full = String(nome || '').trim();
  if (!full) return '';
  return full.split(/\s+/)[0] || '';
}

export function buildProspeccaoVars(
  vars: ProspeccaoTemplateVars,
): Record<ProspeccaoVarKey, string> {
  const nome = String(vars.nome || '').trim();
  const firstName = String(vars.firstName || '').trim();
  const lastName = String(vars.lastName || '').trim();
  const nomeAgenteFallback = String(vars.nomeAgente || '').trim();
  const nomeAgente =
    [firstName, lastName].filter(Boolean).join(' ') || nomeAgenteFallback;
  return {
    primeiro_nome: primeiroNomeFrom(nome),
    nome,
    firstname: firstName || primeiroNomeFrom(nomeAgenteFallback),
    lastname: lastName,
    nome_agente: nomeAgente,
    empresa: String(vars.empresa || '').trim(),
    cargo: String(vars.cargo || '').trim(),
    headline: String(vars.headline || '').trim(),
    cidade: String(vars.cidade || '').trim(),
    email: String(vars.email || '').trim(),
    telefone: String(vars.telefone || '').trim(),
    profile_url: String(vars.profileUrl || '').trim(),
  };
}

/** Substitui placeholders; chave desconhecida permanece no texto. */
export function renderProspeccaoTemplate(
  template: string | null | undefined,
  vars: ProspeccaoTemplateVars,
): string {
  const raw = String(template || '').trim() || DEFAULT_MENSAGEM_PROSPECCAO;
  const map = buildProspeccaoVars(vars);
  let out = raw;
  for (const key of PROSPECCAO_VAR_KEYS) {
    const value = map[key];
    const reBrace = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
    const reDollar = new RegExp(`\\$${key}\\$`, 'gi');
    out = out.replace(reBrace, value).replace(reDollar, value);
  }
  // alias: {{local}} → cidade
  out = out
    .replace(/\{\{\s*local\s*\}\}/gi, map.cidade)
    .replace(/\$local\$/gi, map.cidade);
  return out;
}
