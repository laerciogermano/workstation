/* Clozzy · protótipo v2 — peças de UI (ícones, marca, avatar, selo do close, botões) */
'use strict';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = (v, cents = true) => 'R$ ' + (cents ? v.toFixed(2) : Math.round(v).toString()).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const n0 = (v) => Math.round(v).toLocaleString('pt-BR');
const kfmt = (v) => (v >= 1000 ? (v / 1000).toFixed(1).replace('.', ',').replace(',0', '') + ' mil' : String(v));

/* ícones de linha próprios, 24 × 24, traço 1,8, pontas redondas */
const ICONS = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  home: '<path d="M4 11.5L12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  lib: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  bell: '<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4-5.3 7.5-5.3s6.3 1.7 7.5 5.3"/>',
  chat: '<path d="M5 18.5V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H8.5z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  heart: '<path d="M12 19.5s-7-4.3-7-9.6A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.3c0 5.3-7 9.6-7 9.6z"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
  share: '<path d="M12 4v11M7.5 8.5L12 4l4.5 4.5"/><path d="M6 12.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-6.5"/>',
  more: '<circle cx="6" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="18" cy="12" r="1.3" fill="currentColor"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chev: '<path d="M10 6l6 6-6 6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4L6 18M18 18l-1.6-1.6M7.6 7.6L6 6"/>',
  camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3L9.5 5h5l1.7 2h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.5"/>',
  image: '<rect x="4" y="4.5" width="16" height="15" rx="3"/><circle cx="9" cy="9.5" r="1.6"/><path d="M20 15.5l-4.5-4.5L6 19.5"/>',
  wallet: '<path d="M4.5 7.5A2.5 2.5 0 0 1 7 5h10.5v3"/><rect x="4.5" y="8" width="15" height="11" rx="2.5"/><circle cx="15.5" cy="13.5" r="1.2" fill="currentColor"/>',
  chart: '<path d="M4.5 19.5h15"/><path d="M7 16v-4M12 16V7.5M17 16v-6.5"/>',
  users: '<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19c.9-3 3-4.5 5.5-4.5s4.6 1.5 5.5 4.5"/><path d="M15 5.8a3.2 3.2 0 0 1 0 6.4M17 14.6c1.8.4 3 1.9 3.5 4.4"/>',
  tag: '<path d="M4.5 12.3V5.5a1 1 0 0 1 1-1h6.8l7.2 7.2a1.4 1.4 0 0 1 0 2l-6 6a1.4 1.4 0 0 1-2 0z"/><circle cx="8.5" cy="8.5" r="1.3"/>',
  edit: '<path d="M5 19l1-4L15.5 5.5a2 2 0 0 1 3 3L9 18z"/>',
  eye: '<path d="M3 12s3.3-6 9-6 9 6 9 6-3.3 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.6"/>',
  flag: '<path d="M6 20.5V4.5M6 5h11l-2.5 4L17 13H6"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.8 9.6a2.3 2.3 0 0 1 4.4.9c0 1.6-2.2 2-2.2 3.4"/><circle cx="12" cy="16.9" r=".6" fill="currentColor"/>',
  out: '<path d="M14 5h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4"/><path d="M10 8l-4 4 4 4M6 12h9"/>',
  mail: '<rect x="4" y="6" width="16" height="12" rx="2.5"/><path d="M4.5 7.5l7.5 5.5 7.5-5.5"/>',
  upload: '<path d="M12 15.5V4.5M7.5 9L12 4.5 16.5 9"/><path d="M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15"/>',
  pix: '<path d="M12 3.8l3.4 3.4-3.4 3.4-3.4-3.4zM12 13.4l3.4 3.4-3.4 3.4-3.4-3.4zM3.8 12l3.4-3.4 3.4 3.4-3.4 3.4zM13.4 12l3.4-3.4 3.4 3.4-3.4 3.4z"/>',
  doc: '<path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9.5A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z"/><path d="M14 3.5V8h4"/>',
  shield: '<path d="M12 3.5l7 2.8v5c0 4.4-3 7.8-7 9.2-4-1.4-7-4.8-7-9.2v-5z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  pause: '<path d="M9 6v12M15 6v12"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1-1"/>',
  sound: '<path d="M5 9.5h3l4-3.5v12l-4-3.5H5z"/><path d="M15.5 9a4 4 0 0 1 0 6"/>',
};
const ico = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* marca */
const mark = (cls = '') => `<svg class="cz-mark ${cls}" viewBox="-6 -6 102 102" aria-hidden="true"><use href="#cz-mark"/></svg>`;
const star = (cls = '') => `<svg class="cz-star ${cls}" viewBox="-6 -6 102 102" aria-hidden="true"><use href="#cz-star"/></svg>`;
const logo = (cls = '') => `<svg class="cz-logo ${cls}" viewBox="-18 -18 412.91 126" role="img" aria-label="Clozzy"><use href="#cz-logo"/></svg>`;
const word = (cls = '') => `<svg class="cz-word ${cls}" viewBox="108 -18 286.91 126" role="img" aria-label="Clozzy"><use href="#cz-word"/></svg>`;

/* navegação dentro do protótipo */
const go = (id, p) => `data-go="${id}"${p ? ` data-p="${esc(JSON.stringify(p))}"` : ''}`;
const act = (a) => `data-act="${a}"`;

const ph = (f, cls = '', extra = '') => `<img class="ph ${cls}" src="${IMG(f)}" alt="" loading="lazy" decoding="async" ${extra}>`;
const av = (k, sz = 'md', ringCls = '') => { const c = CREATORS[k]; return `<span class="av av-${sz} ${ringCls}">${ph(c.foto)}</span>`; };
/* anel do close: verde = post novo no close (não vira texto, não vira fundo) */
const ring = (k, sz = 'md', on = true) => av(k, sz, on ? 'ring-on' : 'ring-off');
/* selo do close: verde com estrela branca; em rosa/roxo vai dentro da pílula preta (tokens) */
const selo = (txt = 'do close') => `<span class="selo">${star()}<b>${txt}</b></span>`;
const sticker = (txt) => `<span class="sticker">${star()}${txt}</span>`;
const lockStar = () => `<span class="lockstar" aria-label="trancado">${star()}</span>`;
const verif = () => `<svg class="verif" viewBox="0 0 24 24" aria-label="verificada"><circle cx="12" cy="12" r="10"/><path d="M7.8 12.3l2.8 2.8 5.6-5.8" class="vk"/></svg>`;

const btn = (label, attrs = '', kind = 'p') => `<button class="btn btn-${kind}" ${attrs}>${label}</button>`;
const ibtn = (icon, attrs = '', label = '') => `<button class="ib" aria-label="${label || icon}" ${attrs}>${ico(icon)}</button>`;

const topbar = (title = '', left = ibtn('back', go('back'), 'Voltar'), right = '') => `<header class="top"><div class="tl">${left}</div>${title ? `<b class="tt">${title}</b>` : '<span></span>'}<div class="tr">${right}</div></header>`;

/* barra de abas flutuante (vidro) */
function tabbar(on, studio = false) {
  const tabs = studio
    ? [['home', 'Resumo', 'C-50'], ['tag', 'Ofertas', 'C-52'], ['plus', 'Publicar', 'C-55'], ['users', 'Fãs', 'C-56'], ['wallet', 'Grana', 'C-57']]
    : [['home', 'Início', 'C-10'], ['compass', 'Explorar', 'C-12'], ['lib', 'Biblioteca', 'C-30'], ['bell', 'Avisos', 'C-32'], ['user', 'Você', 'C-35']];
  return `<nav class="tabbar${studio ? ' tb-st' : ''}">${tabs.map(([i, l, id]) => `<button class="${id === on ? 'on' : ''}${i === 'plus' ? ' tb-plus' : ''}" ${go(id)} aria-label="${l}">${ico(i)}<span>${l}</span>${id === 'C-32' && S.unread ? '<i class="dot"></i>' : ''}</button>`).join('')}</nav>`;
}

/* QR “de mentira” determinístico */
function qr(seed = 7) {
  let x = seed, cells = '';
  const N = 25, rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  const finder = (cx, cy) => (i, j) => i >= cx && i < cx + 7 && j >= cy && j < cy + 7;
  const fs = [finder(0, 0), finder(N - 7, 0), finder(0, N - 7)];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (fs.some((f) => f(i, j))) continue;
    if (rnd() > 0.52) cells += `<rect x="${i}" y="${j}" width="1" height="1"/>`;
  }
  const fp = (a, b) => `<rect x="${a + .5}" y="${b + .5}" width="6" height="6" rx="1.6" fill="none" stroke="currentColor"/><rect x="${a + 2}" y="${b + 2}" width="3" height="3" rx=".8"/>`;
  return `<svg class="qr" viewBox="-1 -1 27 27" aria-label="QR Code Pix">${cells}${fp(0, 0)}${fp(N - 7, 0)}${fp(0, N - 7)}</svg>`;
}

/* linha suave para o gráfico da semana */
function spark(vals, w = 300, h = 90) {
  const mx = Math.max(...vals) * 1.1, mn = Math.min(...vals) * .7, step = w / (vals.length - 1);
  const pts = vals.map((v, i) => [i * step, h - ((v - mn) / (mx - mn)) * h]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2; d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`; }
  const last = pts[pts.length - 1];
  return `<svg class="spark" viewBox="0 -6 ${w} ${h + 12}" preserveAspectRatio="none" aria-hidden="true"><path d="${d} L${w},${h + 6} L0,${h + 6}Z" class="sp-a"/><path d="${d}" class="sp-l"/><circle cx="${last[0]}" cy="${last[1]}" r="4.5" class="sp-d"/></svg>`;
}
