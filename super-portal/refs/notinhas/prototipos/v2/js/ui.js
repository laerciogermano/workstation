/* notinhas.shop · protótipo v2.0 — componentes (DS v2: --nt-*) */
'use strict';

const ICONS = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  store: '<path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  list: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M14 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  next: '<path d="m9 18 6-6-6-6"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  barcode: '<path d="M3 5v14"/><path d="M8 5v14"/><path d="M12 5v14"/><path d="M17 5v14"/><path d="M21 5v14"/>',
  qr: '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
  flash: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
  down: '<path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  nav: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
  sliders: '<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  wifioff: '<path d="M12 20h.01"/><path d="M8.5 16.43a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76"/><path d="M16.85 11.25a10 10 0 0 1 2.22 1.68"/><path d="M5 13a10 10 0 0 1 5.24-2.76"/><path d="m2 2 20 20"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  split: '<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  keyboard: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  finger: '<path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1"/>',
  expand: '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>',
  box: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/>',
  cup: '<path d="M6 8.5V19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8.5"/><path d="M8 8.5c0-2.5 1.5-5.5 4-5.5s4 3 4 5.5"/><path d="M8 12h8"/>',
  beer: '<path d="M17 11h1a3 3 0 0 1 0 6h-1"/><path d="M9 12v6"/><path d="M13 12v6"/><path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8"/><path d="M5 8a2.5 2.5 0 0 1 1-4.8A3 3 0 0 1 11 2a3 3 0 0 1 5 1.5A2.5 2.5 0 0 1 17 8Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  candy: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8"/><path d="M8 12h8"/>',
  snack: '<path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 9.18 0A4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" x2="18" y1="17" y2="17"/>',
  milk: '<path d="M8 2h8"/><path d="M9 2v2.79a4 4 0 0 1-.67 2.22l-.66 1A4 4 0 0 0 7 10.22V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.78a4 4 0 0 0-.67-2.22l-.66-1A4 4 0 0 1 15 4.79V2"/><path d="M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0"/>',
  spray: '<path d="m14.5 7.5 3 3"/><path d="m10.2 11.8 6.5-6.5a2.12 2.12 0 0 1 3 3l-6.5 6.5"/><path d="M3 20c0-2.5 1.8-4 4-4h2"/>',
  drop: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  paw: '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
  baby: '<path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><circle cx="12" cy="12" r="9"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
  eyeoff: '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>',
};
const ico = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const go = (id, p) => `data-go="${id}"${p ? ` data-p='${JSON.stringify(p)}'` : ''}`;
const act = (a, arg) => `data-act="${a}"${arg !== undefined ? ` data-arg="${esc(arg)}"` : ''}`;

/* view-transition-name só na tela viva e sem nomes repetidos */
let VT_USED = new Set(); let VT_LIVE = false;
function vt(name) { if (!VT_LIVE || VT_USED.has(name)) return ''; VT_USED.add(name); return ` style="view-transition-name:${name}"`; }

const SYM = '<svg class="sym" viewBox="40 34 176 188" aria-hidden="true"><path style="fill:var(--nt-logo-a)" d="M52 52 A12 12 0 0 1 64 40 L104 40 A12 12 0 0 1 116 52 L116 202 L100 216 L84 202 L68 216 L52 202 Z"/><path style="fill:var(--nt-logo-b)" d="M140 52 A12 12 0 0 1 152 40 L192 40 A12 12 0 0 1 204 52 L204 122 L188 136 L172 122 L156 136 L140 122 Z"/></svg>';
const wm = (cls = '') => `<span class="wm ${cls}">${SYM}<b>notinhas</b><i>.shop</i></span>`;

function topbar(title, { back = true, right = '', sub = '' } = {}) {
  return `<header class="top">${back ? `<button class="ib" ${go('back')} aria-label="Voltar">${ico('back')}</button>` : ''}
  <div class="tt"><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${right}</header>`;
}
function brandbar() {
  const pts = S.session === 'conta'
    ? `<button class="ptschip" ${go('T-53')} aria-label="Pontos">${ico('award')}<span class="tnum">${S.points}</span></button>` : '';
  return `<header class="top brand">${wm()}<span class="sp"></span>${pts}<button class="ib" ${go('T-51')} aria-label="Perfil e configurações">${ico('user')}</button></header>`;
}
function tabbar(on) {
  const t = (id, i, l) => `<button class="tab${on === id ? ' on' : ''}" ${go(id)}>${ico(i)}<span>${l}</span></button>`;
  return `<nav class="tabbar"${vt('tabbar')}>${t('T-10', 'grid', 'Produtos')}${t('T-31', 'store', 'Lojas')}
  <button class="tab fab" ${go('T-20')} aria-label="Depositar nota"><span class="fabbtn">${ico('qr')}</span><span>Nota</span></button>
  ${t('T-40', 'list', 'Listas')}${t('T-50', 'receipt', 'Notas')}</nav>`;
}
function photo(p, cls = '') {
  if (p && p.foto) return `<div class="ph ${cls}"${vt('p' + p.ean)}><img src="${p.foto}" alt="" loading="lazy"></div>`;
  const cat = p && CATS.find((c) => c.id === p.cat);
  return `<div class="ph ph-empty ${cls}">${ico(cat ? cat.ico : 'box')}</div>`;
}
function price(v, { menor = false, cls = '' } = {}) { return `<span class="price tnum ${menor ? 'menor' : ''} ${cls}">${brl(v)}</span>`; }
const chip = (txt, cls = '') => `<span class="chip ${cls}">${txt}</span>`;
function freshBadge(d) { return d > 14 ? chip('desatualizado', 'warn') : ''; }

function pcard(p, opt = {}) {
  const b = bestOf(p.ean); const h = highlight(p.ean);
  return `<article class="pc" ${go('T-14', { ean: p.ean })}>
    ${photo(p)}
    ${h && opt.hl ? `<span class="badge-off tnum">${pct(h.off)}</span>` : ''}
    <p class="pn">${esc(p.titulo)}</p>
    <p class="pp">${price(b.price, { menor: true })}</p>
    ${h && opt.hl ? `<p class="avg tnum">mediana ${brl(h.med)}</p>` : ''}
    <p class="pm">${storeById(b.store).nome} · ${when(b.d)}</p>
  </article>`;
}

/* REQ-046 progresso (verde = com EAN · vermelho = faltam) */
function progress(done, total, { notas = null, compact = false } = {}) {
  const p = total ? Math.round((done / total) * 100) : 0;
  const miss = total - done;
  return `<div class="prog${compact ? ' compact' : ''}" role="img" aria-label="${done} de ${total} itens com EAN">
    <div class="bar"><i style="width:${p}%"></i><b style="width:${100 - p}%"></b></div>
    <p class="tnum"><span class="ok">${done} com EAN (${p}%)</span>${miss ? ` · <span class="miss">${miss} ${miss === 1 ? 'falta' : 'faltam'}</span>` : ''} · ${total} itens${notas !== null ? ` · ${notas} nota${notas > 1 ? 's' : ''}` : ''}</p>
  </div>`;
}

/* mapa estilizado + pins projetados de lat/lng */
const BOUNDS = { n: -25.5180, s: -25.5580, w: -49.2160, e: -49.1830 };
const proj = (lat, lng) => ({ x: ((lng - BOUNDS.w) / (BOUNDS.e - BOUNDS.w)) * 100, y: ((BOUNDS.n - lat) / (BOUNDS.n - BOUNDS.s)) * 100 });
function fmap(pins, { cls = '', you = true, radius = null } = {}) {
  const a = proj(ANCHOR.lat, ANCHOR.lng);
  const r = radius ? (radius / 3.6) * 100 : 0; /* ~3,6 km de largura visível */
  return `<div class="fmap ${cls}">
    <svg class="streets" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="M-5 38 C 20 34, 40 46, 62 40 S 95 30, 110 34" class="av"/>
      <path d="M30 -5 C 34 30, 26 60, 34 110" class="av"/>
      <path d="M-5 72 C 30 66, 55 80, 110 70" class="st"/><path d="M62 -5 C 60 30, 70 70, 66 110" class="st"/>
      <path d="M-5 18 L 110 24" class="st"/><path d="M12 -5 L 18 110" class="st"/><path d="M84 -5 L 80 110" class="st"/>
      <path d="M-5 92 C 25 86, 60 96, 110 88" class="river"/>
      <rect x="40" y="52" width="12" height="9" rx="2" class="park"/><rect x="72" y="8" width="10" height="8" rx="2" class="park"/>
    </svg>
    ${radius ? `<span class="radius" style="left:${a.x}%;top:${a.y}%;width:${r * 2}%;"></span>` : ''}
    ${you && S.gps ? `<span class="you" style="left:${a.x}%;top:${a.y}%"></span>` : ''}
    ${pins.map((p) => { const c = proj(p.lat, p.lng); return `<button class="pin ${p.cls || ''}" style="left:${c.x}%;top:${c.y}%" ${p.attrs || ''} aria-label="${esc(p.label || '')}">${p.txt ? `<span>${p.txt}</span>` : ''}</button>`; }).join('')}
  </div>`;
}

function stepper(qty, ean) {
  return `<div class="stepper" role="group" aria-label="Quantidade"><button ${act('qty', ean + ':-1')} aria-label="Menos">${ico('minus')}</button><span class="tnum">${qty}</span><button ${act('qty', ean + ':1')} aria-label="Mais">${ico('plus')}</button></div>`;
}
const toggle = (on, a, label) => `<button class="tog${on ? ' on' : ''}" ${act(a)} role="switch" aria-checked="${on}" aria-label="${label}"><i></i></button>`;
const skel = (h = 12, w = '100%', r = 6) => `<span class="skel" style="height:${h}px;width:${w};border-radius:${r}px"></span>`;
const originChip = (o) => o ? chip({ barcode_scan: 'scan', sugestao: 'sugestão', manual: 'manual' }[o], 'meta') : '';
