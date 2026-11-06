import { stripTags, tdHtmls } from './html-utils.js';

export function parseNotificacoesHtml(html) {
  if (/Nenhum registro encontrado/i.test(html)) return [];
  const out = [];
  const tbody = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)?.[1] || html;
  for (const m of tbody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const tds = tdHtmls(m[1]);
    if (tds.length < 3) continue;
    const assunto = stripTags(tds[1] || tds[0]);
    if (!assunto || /^assunto$/i.test(assunto)) continue;
    out.push({
      assunto,
      enviadoPor: stripTags(tds[2]) || null,
      data: stripTags(tds[3]) || null,
    });
  }
  return out;
}
