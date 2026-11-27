/* Utilidades: formatação, ícones e cor (white-label). */
window.SP = { screens: {}, order: [], actions: {}, modals: {}, peeks: {} };

SP.HOJE = '2026-11-27';
SP.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
SP.brl = v => (+v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
SP.brlk = v => v >= 1e6 ? 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' mi' : v >= 1e4 ? 'R$ ' + (v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil' : SP.brl(v);
SP.dinheiro = v => (+v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
SP.num = v => (+v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
SP.data = s => s ? s.slice(0, 10).split('-').reverse().join('/') : '—';
SP.dataCurta = s => s ? s.slice(8, 10) + '/' + s.slice(5, 7) : '—';
SP.addDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
SP.dias = (a, b = SP.HOJE) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);
SP.agora = () => SP.HOJE + ' ' + new Date().toTimeString().slice(0, 5);
SP.quando = s => { if (!s) return '—'; const [d, h] = s.split(' '); const n = SP.dias(d); return (n === 0 ? 'hoje' : n === 1 ? 'ontem' : SP.data(d)) + (h ? ' · ' + h : ''); };
SP.parseNum = s => typeof s === 'number' ? s : (parseFloat(String(s ?? '').replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')) || 0);
SP.clone = o => JSON.parse(JSON.stringify(o));
SP.soDig = s => String(s ?? '').replace(/\D/g, '');
SP.contem = (a, b) => String(a ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(String(b ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
SP.iniciais = n => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase();
SP.plural = (n, um, varios) => n + ' ' + (n === 1 ? um : varios);
SP.diasTxt = n => SP.plural(n, 'dia', 'dias');
SP.baixar = (nome, texto, tipo = 'text/plain') => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([texto], { type: tipo + ';charset=utf-8' })); a.download = nome; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
SP.csv = linhas => '﻿' + linhas.map(l => l.map(c => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(';')).join('\n');

/* ---------- CNPJ (numérico e alfanumérico, IN RFB 2.229/2024) e CPF ---------- */
const alnum = SP.alnum = s => String(s ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
const P1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const dvCnpj = base => { const um = (b, p) => { const r = [...b].reduce((s, c, i) => s + (c.charCodeAt(0) - 48) * p[i], 0) % 11; return r < 2 ? 0 : 11 - r; }; const a = um(base, P1); return '' + a + um(base + a, [6, ...P1]); };
SP.cnpj = base => SP.mascarar('doc', base + dvCnpj(base));
SP.cnpjValido = v => { const c = alnum(v); return /^[0-9A-Z]{12}\d{2}$/.test(c) && !/^(.)\1+$/.test(c) && dvCnpj(c.slice(0, 12)) === c.slice(12); };
SP.cpfValido = v => { const c = SP.soDig(v); if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false; return [9, 10].every(n => { const r = [...c.slice(0, n)].reduce((s, d, i) => s + d * (n + 1 - i), 0) * 10 % 11 % 10; return r === +c[n]; }); };

/* ---------- máscaras ---------- */
const molde = (s, m) => { let i = 0, out = ''; for (const ch of m) { if (i >= s.length) break; out += ch === '#' ? s[i++] : ch; } return out; };
SP.mascaraDe = path => { const k = path.split('.').pop(); return /^(cnpj|doc)$/.test(k) ? 'doc' : /^(telefone|whats)$/.test(k) ? 'tel' : k === 'cep' ? 'cep' : k === 'email' || /^emails\.\d$/.test(path) ? 'email' : ''; };
SP.mascarar = (m, v) => {
  if (!m || v == null) return v ?? '';
  if (m === 'doc') { const c = alnum(v).slice(0, 14); return /^\d{0,11}$/.test(c) ? molde(c, '###.###.###-##') : molde(c, '##.###.###/####-##'); }
  if (m === 'tel') { const c = SP.soDig(v).slice(0, 11); return molde(c, c.length > 10 ? '(##) #####-####' : '(##) ####-####'); }
  if (m === 'cep') return molde(SP.soDig(v).slice(0, 8), '#####-###');
  return v;
};
SP.attrsMask = m => m ? ` data-mask="${m}"` + ({ doc: ' autocomplete="off" spellcheck="false" autocapitalize="characters"', tel: ' autocomplete="tel" inputmode="tel"', cep: ' autocomplete="postal-code" inputmode="numeric"', email: ' autocomplete="email" spellcheck="false" autocapitalize="off"' }[m] || '') : '';
SP.exemplo = m => ({ doc: 'CNPJ ou CPF', tel: '(11) 90000-0000', cep: '00000-000', email: 'nome@empresa.com.br' }[m] || '');

/* ---------- ícones de linha (24×24) ---------- */
const P = {
  home: 'M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10',
  inbox: 'M4 13l2.5-8h11L20 13v6H4zM4 13h5l1 3h4l1-3h5',
  pulse: 'M3 12h4l3-8 4 16 3-8h4',
  bell: 'M6 16V11a6 6 0 1112 0v5l2 2H4zM10 21h4',
  quote: 'M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h5',
  cart: 'M3 4h2l2.5 11h10L20 7H6.5M9 20h.01M17 20h.01',
  users: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM3 20c0-3.5 2.7-5.5 6-5.5s6 2 6 5.5M16 4.5a3.5 3.5 0 010 6.5M18 15c1.8.8 3 2.5 3 5',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3.6-6 8-6s8 2 8 6',
  tag: 'M4 4h8l8 8-8 8-8-8zM8.5 8.5h.01',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  checklist: 'M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17M12 6h8M12 12h8M12 18h8',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3.5 2',
  flow: 'M4 4h6v6H4zM14 14h6v6h-6zM10 7h4a3 3 0 013 3v4',
  truck: 'M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z',
  carrier: 'M3 20V9l9-5 9 5v11M8 20v-7h8v7M8 16h8',
  nf: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  money: 'M3 6h18v12H3zM12 15a3 3 0 100-6 3 3 0 000 6zM6 9h.01M18 15h.01',
  barcode: 'M4 5v14M7 5v14M10 5v11M13 5v14M17 5v11M20 5v14',
  bank: 'M3 9l9-5 9 5M5 10v7M10 10v7M14 10v7M19 10v7M3 20h18',
  chart: 'M4 4v16h16M8 16v-4M12 16V8M16 16v-6',
  kanban: 'M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v13h-4z',
  trophy: 'M8 4h8v5a4 4 0 01-8 0zM8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M10 17h4M8 20h8',
  line: 'M4 4v16h16M7 15l4-5 3 3 5-7',
  factory: 'M3 20V9l6 4V9l6 4V4h5v16zM7 17h.01M12 17h.01M17 17h.01',
  team: 'M12 8a3 3 0 100-6 3 3 0 000 6zM5 21v-2a7 7 0 0114 0v2',
  id: 'M3 5h18v14H3zM9 12a2 2 0 100-4 2 2 0 000 4zM6 16c.5-2 1.600-2.500 3-2.500s2.500.5 3 2.5M14 10h4M14 14h4',
  support: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6',
  brush: 'M14 4l6 6-8 8H6v-6zM4 21h16',
  bolt: 'M13 3L5 14h6l-1 7 8-11h-6z',
  template: 'M4 4h16v5H4zM4 13h7v7H4zM15 13h5M15 17h5M15 20h3',
  sliders: 'M4 7h10M18 7h2M4 17h2M10 17h10M16 5v4M8 15v4',
  plug: 'M9 3v5M15 3v5M7 8h10v3a5 5 0 01-10 0zM12 16v5',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4',
  plus: 'M12 5v14M5 12h14',
  x: 'M6 6l12 12M18 6L6 18',
  menu: 'M4 7h16M4 12h16M4 17h10',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  back: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
  down: 'M6 9l6 6 6-6',
  filter: 'M4 5h16l-6 7v6l-4 2v-8z',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.500 6.500l4 4',
  eye: 'M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  copy: 'M8 8h12v12H8zM16 8V4H4v12h4',
  history: 'M4 5v5h5M4.500 10a8 8 0 112 7M12 8v5l3 2',
  pdf: 'M6 3h9l4 4v14H6zM15 3v4h4M9 17v-5h1.500a1.500 1.500 0 010 3H9M15 12h-2v5M13 14.500h1.500',
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  mail: 'M3 6h18v12H3zM3 7l9 7 9-7',
  whats: 'M4 20l1.300-4A8 8 0 1112 20a8 8 0 01-4-1zM9 9c0 3 3 6 6 6l1-1.500-2-1-1 .8c-1-.4-1.800-1.200-2.300-2.300l.8-1-1-2z',
  clip: 'M20 11l-8 8a5 5 0 01-7-7l9-9a3.500 3.500 0 015 5l-9 9a2 2 0 01-3-3l8-8',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5',
  full: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  logout: 'M14 4H5v16h9M10 12h11M17 8l4 4-4 4',
  upload: 'M12 16V4M7 9l5-5 5 5M4 16v4h16v-4',
  download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  pause: 'M8 5v14M16 5v14',
  play: 'M7 4l13 8-13 8z',
  undo: 'M9 7L4 12l5 5M4 12h10a6 6 0 016 6v1',
  alert: 'M12 3l10 18H2zM12 10v5M12 18h.01',
  info: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v5M12 8h.01',
  spark: 'M12 3l2.200 6.800L21 12l-6.800 2.200L12 21l-2.200-6.800L3 12l6.800-2.200z',
  link: 'M10 14a4 4 0 006 0l3-3a4 4 0 00-6-6l-1 1M14 10a4 4 0 00-6 0l-3 3a4 4 0 006 6l1-1',
  pin: 'M12 21s7-6 7-12a7 7 0 10-14 0c0 6 7 12 7 12zM12 11.500a2.500 2.500 0 100-5 2.500 2.500 0 000 5z',
  box: 'M4 8l8-4 8 4v9l-8 4-8-4zM4 8l8 4 8-4M12 12v9',
  lock: 'M6 11h12v9H6zM8.500 11V8a3.500 3.500 0 017 0v3',
  sun: 'M12 16a4 4 0 100-8 4 4 0 000 8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.500 1.500M17.500 17.500L19 19M19 5l-1.500 1.500M6.500 17.500L5 19',
  moon: 'M20 14.500A8.500 8.500 0 019.500 4 8.500 8.500 0 1020 14.500z',
  cal: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5',
  cmd: 'M9 9h6v6H9zM9 9H7a2 2 0 112-2zM15 9V7a2 2 0 112 2zM15 15h2a2 2 0 11-2 2zM9 15v2a2 2 0 11-2-2z',
  send: 'M4 12l17-8-6 17-3-7zM12 14l9-10',
  transfer: 'M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4',
  phone: 'M7 3l3 5-2 2c1.500 3 3 4.500 6 6l2-2 5 3-2 4C10 21 3 14 3 5z',
  sidebar: 'M4 5h16v14H4zM10 5v14',
};
SP.icon = (n, s = 18) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.700" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n] || P.info}"/></svg>`;

/* ---------- cor: tudo do tenant sai de uma cor semente ---------- */
const rgb = h => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
const hex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const lum = h => { const [r, g, b] = rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
SP.contraste = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
SP.misturar = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); };
SP.inkSobre = c => SP.contraste(c, '#ffffff') >= SP.contraste(c, '#111111') ? '#ffffff' : '#111111';
/* ajusta a cor até ter contraste 4,5:1 como texto sobre o fundo */
SP.comoTexto = (c, fundo) => { const alvo = lum(fundo) > .4 ? '#000000' : '#ffffff'; let out = c, t = 0; while (SP.contraste(out, fundo) < 5.4 && t < 1) { t += .05; out = SP.misturar(c, alvo, t); } return out; };
SP.tokens = (tenant, tema) => {
  const surf = tema === 'dark' ? '#0f0f0f' : '#ffffff';
  const b = tenant.cor, a = tenant.destaque;
  return [
    `--brand:${b}`, `--brand-ink:${SP.inkSobre(b)}`, `--brand-text:${SP.comoTexto(b, surf)}`,
    `--accent:${a}`, `--accent-ink:${SP.inkSobre(a)}`,
    `--r:${tenant.raio}px`, `--font:'${tenant.fonte}', system-ui, sans-serif`,
  ].join(';');
};
