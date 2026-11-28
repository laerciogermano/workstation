/** Nomes e textos de cada campo em Markdown: o painel mostra mais de um. */
export type MarkdownText = {
  label: string;
  formatted: string;
  modes: string;
  fullScreen: string;
  empty: string;
  placeholder: string;
};

export const DESCRIPTION_TEXT: MarkdownText = {
  label: 'Descrição',
  formatted: 'Descrição formatada',
  modes: 'Modo da descrição',
  fullScreen: 'Abrir descrição em tela cheia',
  empty: 'Sem descrição.',
  placeholder: 'Contexto para quem vai executar (aceita Markdown)',
};

export const SYSTEM_PROMPT_TEXT: MarkdownText = {
  label: 'System prompt',
  formatted: 'System prompt formatado',
  modes: 'Modo do system prompt',
  fullScreen: 'Abrir system prompt em tela cheia',
  empty: 'Sem system prompt.',
  placeholder: 'Instruções padrão para todas as atividades (aceita Markdown)',
};
