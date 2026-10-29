/**
 * Template de mensagem de prospecção.
 * Variáveis: `{{primeiro_nome}}` / `{{nome}}` ou `$primeiro_nome$` / `$nome$`.
 */
export const DEFAULT_MENSAGEM_PROSPECCAO =
  'Oi {{primeiro_nome}}, tudo bem?';

export type ProspeccaoTemplateVars = {
  nome?: string | null;
};

export function primeiroNomeFrom(nome: string | null | undefined): string {
  const full = String(nome || '').trim();
  if (!full) return '';
  return full.split(/\s+/)[0] || '';
}

/** Substitui placeholders; desconhecido permanece no texto. */
export function renderProspeccaoTemplate(
  template: string | null | undefined,
  vars: ProspeccaoTemplateVars,
): string {
  const raw = String(template || '').trim() || DEFAULT_MENSAGEM_PROSPECCAO;
  const nome = String(vars.nome || '').trim();
  const primeiro = primeiroNomeFrom(nome);
  return raw
    .replace(/\{\{\s*primeiro_nome\s*\}\}/gi, primeiro)
    .replace(/\{\{\s*nome\s*\}\}/gi, nome)
    .replace(/\$primeiro_nome\$/gi, primeiro)
    .replace(/\$nome\$/gi, nome);
}
