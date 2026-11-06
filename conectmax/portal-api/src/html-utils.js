export function stripTags(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseStatus(inner) {
  const visible = [
    ...inner.matchAll(/<div class="status[^"]*"[^>]*>([\s\S]*?)<\/div>/gi),
  ];
  for (const m of visible) {
    if (/\bd-none\b/.test(m[0])) continue;
    const t = stripTags(m[1]);
    if (t) return t;
  }
  const nota = inner.match(
    /<div class="status-nota[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  );
  if (nota) return stripTags(nota[1]) || null;
  return null;
}

export function parseMoney(text) {
  const t = stripTags(text);
  const m = t.match(/-?\s*R\$\s*([\d.]*\d),(\d{2})/);
  if (!m) {
    const n = Number(String(t).replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  const intPart = m[1].replace(/\./g, '');
  return Number(`${intPart}.${m[2]}`);
}

export function tdHtmls(inner) {
  return [...inner.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((x) => x[1]);
}

export function maxCurrentPage(html) {
  const pages = [...html.matchAll(/current_page=(\d+)/gi)].map((m) =>
    Number(m[1]),
  );
  return pages.length ? Math.max(...pages) : 1;
}

export function isLoginPage(html) {
  return (
    /name=["']usuario["']/i.test(html) ||
    (/login\.php/i.test(html) && /senha/i.test(html))
  );
}

export function dataValueRows(html) {
  return [
    ...html.matchAll(
      /<tr[^>]*data-value=["'](\d+)["']([^>]*)>([\s\S]*?)<\/tr>/gi,
    ),
  ].map((m) => ({
    id: Number(m[1]),
    attrs: m[2],
    inner: m[3],
  }));
}
