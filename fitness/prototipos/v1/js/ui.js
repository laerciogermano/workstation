/* Fitness · protótipo v1 — componentes (tokens --ft-*) */
'use strict';

const ICONS = {
  back: '<path d="m15 18-6-6 6-6"/>', next: '<path d="m9 18 6-6-6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>', minus: '<path d="M5 12h14"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  bowl: '<path d="M3 11h18a9 9 0 0 1-18 0Z"/><path d="M7 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M17 7c0-1.5 1-2 1-3.5"/><path d="M8 20h8"/>',
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  body: '<circle cx="12" cy="4.5" r="2"/><path d="M7 9h10M12 9v5M9 22l3-8 3 8"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  scale: '<path d="M4 7h16l-2 13H6z"/><path d="M9 11a3 3 0 0 1 6 0"/><path d="M12 11l1.5-1.5"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  finger: '<path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
  spark: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  bolt: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  egg: '<path d="M12 22c6.23-.05 7.87-5.57 7.5-10-.36-4.34-3.95-9.96-7.5-10-3.55.04-7.14 5.66-7.5 10-.37 4.43 1.27 9.95 7.5 10z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  wifioff: '<path d="M12 20h.01"/><path d="M8.5 16.43a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76"/><path d="M16.85 11.25a10 10 0 0 1 2.22 1.68"/><path d="M5 13a10 10 0 0 1 5.24-2.76"/><path d="m2 2 20 20"/>',
  phone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  edit: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
  box: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/>',
  play: '<path d="M6 3l14 9-14 9z"/>', pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  swap: '<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
};
const ico = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const go = (id, p) => `data-go="${id}"${p ? ` data-p='${JSON.stringify(p)}'` : ''}`;
const act = (a, arg) => `data-act="${a}"${arg !== undefined ? ` data-arg="${esc(arg)}"` : ''}`;
const n0 = (v) => Math.round(v).toLocaleString('pt-BR');
const n1 = (v) => (+v).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const sgn = (v, f = n1) => (v > 0 ? '+' : v < 0 ? '−' : '') + f(Math.abs(v));
const dfmt = (d, opt = { day: '2-digit', month: 'short' }) => new Date(d + 'T12:00').toLocaleDateString('pt-BR', opt).replace('.', '');
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);

let VT_USED = new Set(); let VT_LIVE = false;
function vt(name) { if (!VT_LIVE || VT_USED.has(name)) return ''; VT_USED.add(name); return ` style="view-transition-name:${name}"`; }

/* marca provisória: anel de meta com o fechamento do dia */
const SYM = '<svg class="sym" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11" fill="none" stroke="var(--ft-line)" stroke-width="5"/><path d="M16 5a11 11 0 1 1-10.4 14.6" fill="none" stroke="var(--ft-act)" stroke-width="5" stroke-linecap="round"/><circle cx="16" cy="16" r="3.2" fill="var(--ft-ink)"/></svg>';
const wm = (cls = '') => `<span class="wm ${cls}">${SYM}<b>fitness</b></span>`;

function topbar(title, { back = true, right = '', sub = '' } = {}) {
  return `<header class="top">${back ? `<button class="ib" ${go('back')} aria-label="Voltar">${ico('back')}</button>` : ''}
  <div class="tt"><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${right}</header>`;
}
function brandbar(right = '') {
  const me = S.char ? avatar(S.char.nick, S.char.cor, 'sm') : ico('user');
  return `<header class="top brand">${wm()}<span class="sp"></span>${right}<button class="ib${S.char ? ' av-ib' : ''}" ${go('F-60')} aria-label="Perfil">${me}</button></header>`;
}
function tabbar(on) {
  const t = (id, i, l) => `<button class="tab${on === id ? ' on' : ''}" ${go(id)}>${ico(i)}<span>${l}</span></button>`;
  return `<nav class="tabbar"${vt('tabbar')}>${t('F-10', 'home', 'Hoje')}${t('F-21', 'bowl', 'Dieta')}${t('F-30', 'dumbbell', 'Treino')}${t('F-42', 'body', 'Corpo')}${t('F-51', 'trophy', 'Vitrine')}</nav>`;
}
const chip = (txt, cls = '') => `<span class="chip ${cls}">${txt}</span>`;
const toggle = (on, a, label, arg) => `<button class="tog${on ? ' on' : ''}" ${act(a, arg)} role="switch" aria-checked="${on}" aria-label="${label}"><i></i></button>`;
const skel = (h = 12, w = '100%', r = 6) => `<span class="skel" style="height:${h}px;width:${w};border-radius:${r}px"></span>`;
function seg(opts, val, a) {
  const i = Math.max(0, opts.findIndex((o) => o[0] === val));
  return `<div class="seg" style="--n:${opts.length};--i:${i}" role="radiogroup"><span class="pill"></span>${opts.map(([v, l]) => `<button class="${v === val ? 'on' : ''}" role="radio" aria-checked="${v === val}" ${act(a, v)}>${l}</button>`).join('')}</div>`;
}
function numstep(k, v, un, step = 1, dec = 0) {
  return `<div class="numstep"><button ${act('num', k + ':-' + step)} aria-label="Menos">${ico('minus')}</button>
  <span class="nv tnum"><b>${dec ? n1(v) : v}</b><i>${un}</i></span><button ${act('num', k + ':' + step)} aria-label="Mais">${ico('plus')}</button></div>`;
}
function avatar(nick, cor, cls = '') {
  const ini = nick.replace(/[^a-z]/gi, ' ').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return `<span class="av ${cls}" style="--c:${PALETTE[cor % PALETTE.length]}">${ini}</span>`;
}

/* anel do dia: consumido vs meta (+ treino soma ao orçamento) */
function ring(val, max, { size = 168, stroke = 14, label = '', sub = '', over = false } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, p = Math.min(1, max ? val / max : 0);
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--ft-line-2)" stroke-width="${stroke}"/>
  <circle class="rg${over ? ' over' : ''}" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>
  <div class="rv"><b class="tnum">${label}</b><span>${sub}</span></div></div>`;
}
function macroBar(nome, val, alvo, cls) {
  const p = alvo ? Math.min(100, (val / alvo) * 100) : 0, over = val > alvo * 1.08;
  return `<div class="mb ${cls}"><p><span>${nome}</span><b class="tnum">${n0(val)}<i>/${n0(alvo)} g</i></b></p><div class="bar"><i style="width:${p}%"${over ? ' class="over"' : ''}></i></div></div>`;
}
function macros3(t, e) { return `<div class="mbs">${macroBar('Proteína', t.p, e.prot, 'mp')}${macroBar('Carbo', t.c, e.carb, 'mc')}${macroBar('Gordura', t.g, e.fat, 'mg')}</div>`; }
const STATUS = { cumpriu: ['Cumpriu', 'ok'], abaixo: ['Abaixo', 'warn'], estourou: ['Estourou', 'err'], vazio: ['Sem registro', 'meta'] };
function dayStatus(consumed, meta) {
  if (!consumed) return 'vazio';
  const r = consumed / meta; return r > 1.05 ? 'estourou' : r < 0.9 ? 'abaixo' : 'cumpriu';
}

/* gráfico de linha simples: série registrada + projeção tracejada */
function lineChart({ pts = [], proj = [], w = 358, h = 170, pad = [10, 26, 22, 30], unit = 'kg', today = null, hi = null }) {
  const all = [...pts, ...proj]; if (!all.length) return '';
  const xs = all.map((p) => p.x), ys = all.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs); let y0 = Math.min(...ys), y1 = Math.max(...ys);
  const span = Math.max(1, y1 - y0); y0 -= span * 0.15; y1 += span * 0.15;
  const [pt, pr, pb, pl] = pad;
  const X = (x) => pl + ((x - x0) / Math.max(1, x1 - x0)) * (w - pl - pr), Y = (y) => pt + (1 - (y - y0) / (y1 - y0)) * (h - pt - pb);
  const path = (arr) => arr.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ');
  const ticks = [y0 + (y1 - y0) * 0.2, y0 + (y1 - y0) * 0.5, y0 + (y1 - y0) * 0.8];
  const band = proj.length ? `<path class="band" d="${proj.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p.y + (p.x - proj[0].x) * 0.012 * span / 4).toFixed(1)}`).join(' ')} ${[...proj].reverse().map((p) => `L${X(p.x).toFixed(1)} ${Y(p.y - (p.x - proj[0].x) * 0.012 * span / 4).toFixed(1)}`).join(' ')} Z"/>` : '';
  return `<svg class="lc" viewBox="0 0 ${w} ${h}" role="img" aria-label="Gráfico de ${unit}">
    ${ticks.map((t) => `<line x1="${pl}" x2="${w - pr}" y1="${Y(t)}" y2="${Y(t)}" class="grid"/><text x="${pl - 6}" y="${Y(t) + 3.5}" class="yl">${n1(t)}</text>`).join('')}
    ${today !== null ? `<line x1="${X(today)}" x2="${X(today)}" y1="${pt - 4}" y2="${h - pb}" class="today"/><text x="${X(today)}" y="${h - 6}" class="xl" text-anchor="middle">hoje</text>` : ''}
    ${band}${proj.length ? `<path d="${path(proj)}" class="proj"/>` : ''}${pts.length ? `<path d="${path(pts)}" class="line"/>` : ''}
    ${pts.map((p, i) => `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${i === hi ? 5 : 3.2}" class="dot${i === hi ? ' hi' : ''}"/>`).join('')}
    ${proj.length ? `<circle cx="${X(proj[proj.length - 1].x)}" cy="${Y(proj[proj.length - 1].y)}" r="3.6" class="pend"/><text x="${X(proj[proj.length - 1].x) - 4}" y="${Y(proj[proj.length - 1].y) - 9}" class="pl" text-anchor="end">${n1(proj[proj.length - 1].y)} ${unit}</text>` : ''}
    ${pts.length ? `<text x="${X(pts[0].x)}" y="${h - 6}" class="xl">${dfmt(pts[0].d)}</text>` : ''}
  </svg>`;
}

/* figura de palito animada entre duas poses (SMIL) — RF-26 */
function figure(kind, { cls = '', animate = true, bar = true, dur = 2.4 } = {}) {
  const [A, B] = POSES[kind];
  const pl = (p, k) => k.map((j) => p[j].join(',')).join(' ');
  const seq = { leg: ['ft', 'kn', 'hip'], torso: ['hip', 'sh'], arm: ['sh', 'el', 'ha'] };
  const anim = (attr, a, b) => animate ? `<animate attributeName="${attr}" values="${a};${b};${a}" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"/>` : '';
  const lines = Object.entries(seq).map(([n, k]) => `<polyline class="fg-${n}" points="${pl(A, k)}">${anim('points', pl(A, k), pl(B, k))}</polyline>`).join('');
  const ghost = !animate ? Object.values(seq).map((k) => `<polyline class="fg-ghost" points="${pl(B, k)}"/>`).join('') + `<circle class="fg-ghost" cx="${B.head[0]}" cy="${B.head[1]}" r="10"/>` : '';
  const head = `<circle class="fg-head" cx="${A.head[0]}" cy="${A.head[1]}" r="10">${anim('cx', A.head[0], B.head[0])}${anim('cy', A.head[1], B.head[1])}</circle>`;
  let gear = '';
  if (kind === 'bench') gear = '<line class="fg-gear" x1="30" x2="132" y1="112" y2="112"/><line class="fg-gear" x1="124" x2="124" y1="112" y2="152"/><line class="fg-gear" x1="38" x2="38" y1="112" y2="152"/>';
  if (kind === 'pullup') gear = '<line class="fg-gear" x1="60" x2="150" y1="20" y2="20"/>';
  if (['bench', 'row', 'squat', 'press'].includes(kind) && bar) gear += `<circle class="fg-bar" cx="${A.ha[0]}" cy="${A.ha[1]}" r="${kind === 'press' ? 5 : 8}">${anim('cx', A.ha[0], B.ha[0])}${anim('cy', A.ha[1], B.ha[1])}</circle>`;
  return `<svg class="fig ${cls}" viewBox="0 0 200 160" aria-hidden="true"><line class="fg-floor" x1="10" x2="190" y1="153" y2="153"/>${gear}${ghost}${lines}${head}</svg>`;
}

/* foto de progresso ilustrada (silhueta) — o app real usa a câmera */
function silhouette(wk = 1, pose = 'frente', cls = '') {
  const w = (v) => (100 + (v - 100) * wk).toFixed(1); const cx = 100;
  const body = pose === 'lado'
    ? `<path d="M96 48 C 84 52, 86 70, 90 84 C ${92 + 10 * wk} 104, ${88 + 14 * wk} 124, 94 150 L 96 196 L 106 196 L 108 150 C 112 128, ${110 + 6 * wk} 104, 112 84 C 116 66, 114 52, 104 48 Z"/>`
    : `<path d="M${cx - 18} 48 C ${cx - 40} 52, ${cx - 44} 60, ${cx - 46} 86 L ${cx - 50} 128 L ${cx - 42} 128 L ${cx - 36} 92 C ${w(cx - 34)} 108, ${w(cx - 40)} 124, ${w(cx - 32)} 142 L ${cx - 26} 196 L ${cx - 6} 196 L ${cx} 150 L ${cx + 6} 196 L ${cx + 26} 196 L ${w(cx + 32)} 142 C ${w(cx + 40)} 124, ${w(cx + 34)} 108, ${cx + 36} 92 L ${cx + 42} 128 L ${cx + 50} 128 L ${cx + 46} 86 C ${cx + 44} 60, ${cx + 40} 52, ${cx + 18} 48 Z"/>`;
  return `<svg class="sil ${cls}" viewBox="0 0 200 210" aria-hidden="true"><circle cx="100" cy="28" r="15"/>${body}</svg>`;
}

/* mapa estilizado para academias */
function fmap(pins, { cls = '', you = true } = {}) {
  return `<div class="fmap ${cls}"><svg class="streets" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <path d="M-5 38 C 20 34, 40 46, 62 40 S 95 30, 110 34" class="av"/><path d="M30 -5 C 34 30, 26 60, 34 110" class="av"/>
    <path d="M-5 72 C 30 66, 55 80, 110 70" class="st"/><path d="M62 -5 C 60 30, 70 70, 66 110" class="st"/>
    <path d="M-5 18 L 110 24" class="st"/><path d="M12 -5 L 18 110" class="st"/><path d="M84 -5 L 80 110" class="st"/>
    <path d="M-5 92 C 25 86, 60 96, 110 88" class="river"/><rect x="40" y="52" width="12" height="9" rx="2" class="park"/><rect x="72" y="8" width="10" height="8" rx="2" class="park"/></svg>
    ${you && S.gps ? '<span class="you" style="left:50%;top:50%"></span>' : ''}
    ${pins.map((p) => `<button class="pin ${p.cls || ''}" style="left:${p.x}%;top:${p.y}%" ${p.attrs || ''} aria-label="${esc(p.label || '')}"><span>${p.txt || ''}</span></button>`).join('')}</div>`;
}
function stat(v, l, cls = '') { return `<div class="st ${cls}"><b class="tnum">${v}</b><span>${l}</span></div>`; }
function note(txt, i = 'info', cls = '') { return `<p class="note ${cls}">${ico(i)}<span>${txt}</span></p>`; }
