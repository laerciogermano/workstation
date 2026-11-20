import { parseStatus, stripTags, tdHtmls } from './html-utils.js';

export function parseChamadosHtml(html) {
  if (/Nenhum registro encontrado/i.test(html)) return [];
  const out = [];
  const tbody = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)?.[1] || html;
  for (const m of tbody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const tds = tdHtmls(m[1]);
    if (tds.length < 5) continue;
    const status = parseStatus(m[1]) || stripTags(tds[0]);
    if (!status || /^status$/i.test(status)) continue;
    out.push({
      status,
      assunto: stripTags(tds[1]) || null,
      envolvidos: stripTags(tds[2]) || null,
      criadoEm: stripTags(tds[3]) || null,
      editadoPor: stripTags(tds[4]) || null,
      ultimaInteracao: tds[5] ? stripTags(tds[5]) || null : null,
    });
  }
  return out;
}
