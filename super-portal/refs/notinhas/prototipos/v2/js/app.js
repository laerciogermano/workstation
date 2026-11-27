/* notinhas.shop · protótipo v2.0 — estado, navegação, galeria e player */
'use strict';

const clone = (o) => JSON.parse(JSON.stringify(o));
const S0 = () => ({
  session: 'anon', email: '', points: 15, gps: true, online: true, cam: 'ok', scanResult: 'ok', credits: 'ok', reduced: false,
  q: '', sort: 'preco', cat: 'todas', radius: 5, fresh: 14, qs: '',
  sel: { ean: '3000054721644', store: 'atacadao', list: 'l1', note: 'n-formosa', cod: '10213' },
  lists: [
    { id: 'l1', nome: 'Compra do mês', items: [{ ean: '7894900011517', qty: 2 }, { ean: '7896006711117', qty: 2 }, { ean: '7891000379691', qty: 1 }, { ean: '7896004006277', qty: 1 }, { ean: '7891000244258', qty: 3 }, { ean: '7895144853734', qty: 2 }] },
    { id: 'l2', nome: 'Churrasco de sábado', items: [{ ean: '7898367984018', qty: 12 }, { ean: '7894900011517', qty: 2 }, { ean: '7896004006284', qty: 2 }] },
  ],
  scanned: clone(SCANNED), scanDone: false, scanCredited: false,
  sheet: null, addQty: 1, addList: 'l1', urlIn: '', newName: '', histPoint: null, mapSel: null, mapStore: null,
  vtab: 'ean', linkedVitrine: [], homeSec: 0, wsplit: false, authTab: 'criar', pick: null, photo: 4, flash: false, proc: 0, eanIn: '',
  emailIn: '', pw: '', lgpd: false, optIn: false, alerts: true, loginErr: false, sent: false, bairro: 'Centro', del: '',
  ledger: [['Nota · Formosa', 10, 'há 4 dias'], ['Código · Pringles Original', 5, 'há 4 dias']],
  admFails: clone(ADM_FAILS), admFlags: clone(ADM_FLAGS), toast: null,
});
let S = S0();

const ORDER = FLOWS.flatMap((f) => f.steps);
const flowOf = (id) => FLOWS.find((f) => f.steps.includes(id));
const DARK = ['T-20', 'T-23'];
let SHEET_ANIM = false, TOAST_ANIM = false;

/* ---------- render ---------- */
function screenHTML(id, live) {
  VT_USED = new Set(); VT_LIVE = live;
  let h;
  try { h = SCREENS[id].render(); } catch (e) { console.error(id, e); h = `<div class="body"><p class="meta">Erro em ${id}: ${esc(e.message)}</p></div>`; }
  VT_LIVE = false; return h;
}
const status = () => `<div class="sb"><span class="tnum">9:41</span><span class="isl"></span><span class="sbr">${S.online ? '5G' : ''}<svg viewBox="0 0 26 12" aria-hidden="true"><rect x="1" y="1" width="21" height="10" rx="3" fill="none" stroke="currentColor" opacity=".5"/><rect x="3" y="3" width="15" height="6" rx="1.5" fill="currentColor"/></svg></span></div>`;
function toastHTML() {
  if (!S.toast) return '';
  const a = S.toast.go ? `<button ${go(S.toast.go, S.toast.p)}>${S.toast.label || 'Ver'}</button>` : '';
  return `<div class="toast${TOAST_ANIM ? ' anim' : ''}" role="status">${ico('check')}<span>${S.toast.msg}</span>${a}</div>`;
}
function frame(id, live) {
  const sc = SCREENS[id];
  if (sc.kind === 'web') {
    const sh = live ? sheetHTML().replace('class="sheet"', `class="sheet${SHEET_ANIM ? ' anim' : ''}"`) : '';
    return `<div class="web"><div class="dbar"><i></i><i></i><i></i><span>notinhas.shop${sc.path || ''}</span></div><div class="wscr">${screenHTML(id, live)}${sh}${live ? toastHTML() : ''}</div></div>`;
  }
  if (sc.kind === 'desk') return `<div class="desk"><div class="dbar"><i></i><i></i><i></i><span>notinhas.shop/admin</span></div><div class="dscr">${screenHTML(id, live)}</div></div>`;
  const sh = live ? sheetHTML().replace('class="sheet"', `class="sheet${SHEET_ANIM ? ' anim' : ''}"`) : '';
  return `<div class="phone"><div class="scr${DARK.includes(id) ? ' is-dark' : ''}">${status()}${screenHTML(id, live)}${sh}${live ? toastHTML() : ''}</div></div>`;
}

/* ---------- player ---------- */
const $ = (s, r = document) => r.querySelector(s);
const player = $('#player'), live = $('#live'), stage = $('#stage');
let cur = null; const hist = []; let procTimer = null, toastTimer = null;

function reducedMotion() { return S.reduced || matchMedia('(prefers-reduced-motion: reduce)').matches; }
function swap(fn, dir) {
  document.documentElement.dataset.dir = dir;
  if (document.startViewTransition && !reducedMotion() && player.classList.contains('open')) { const t = document.startViewTransition(fn); [t.ready, t.finished, t.updateCallbackDone].forEach((pr) => pr.catch(() => {})); }
  else fn();
}
function nav(id, p, opt = {}) {
  let dir = opt.dir || 'fwd';
  if (id === 'back') { id = hist.pop() || 'T-10'; dir = 'back'; }
  else {
    if (id === 'T-20' && S.cam === 'negada') id = 'T-70';
    if (id === 'T-25' && !S.online) { id = 'T-71'; flash('Sem internet · nota guardada na fila'); }
    if ((id === 'T-42' || id === 'T-41' || id === 'D-42') && S.credits === 'out') id = 'T-54';
    /* numa tela desktop, destinos de celular viram o equivalente D-xx */
    if (!opt.raw && cur && SCREENS[cur].kind === 'web' && WMAP[id]) { if (id === 'T-41') S.wsplit = true; if (id === 'T-42') S.wsplit = false; if (id === 'T-03') S.authTab = 'entrar'; if (id === 'T-02') S.authTab = 'criar'; id = WMAP[id]; }
    if (cur && cur !== id && !opt.replace) hist.push(cur);
  }
  if (p) Object.assign(S.sel, p);
  if (id === 'T-23' || id === 'D-23') S.eanIn = '';
  if (id === 'T-04') S.sent = false;
  S.sheet = null; S.histPoint = null;
  if ((cur === 'T-22' || cur === 'D-22') && (id === 'T-23' || id === 'D-23') && !p) { const pend = S.scanned.itens.find((i) => !i.ean); if (pend) S.sel.cod = pend.cod; }
  swap(() => { cur = id; paint(); }, dir);
}
function paint() {
  const kind = SCREENS[cur].kind; live.className = kind === 'desk' ? 'is-desk' : kind === 'web' ? 'is-web' : '';
  document.documentElement.dataset.dev = kind === 'web' || kind === 'desk' ? 'web' : 'phone';
  const dt = $('#dev-toggle'); if (dt) dt.textContent = kind === 'web' ? 'Ver no celular' : kind === 'desk' ? 'Backoffice' : 'Ver no desktop';
  live.innerHTML = frame(cur, true);
  SHEET_ANIM = false; TOAST_ANIM = false;
  document.documentElement.classList.toggle('rm', reducedMotion());
  fit(); notes();
  history.replaceState(null, '', '#' + cur);
  const isProc = cur === 'T-25' || cur === 'D-25';
  if (isProc && !procTimer) runProc();
  if (!isProc && procTimer) { clearInterval(procTimer); procTimer = null; }
  if (cur === 'T-10' || cur === 'D-10') homeHooks();
  if (cur === 'T-11' || cur === 'D-11') { const i = $('input[data-input="q"]', live); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
}
/* home: seções da altura da tela, rolagem horizontal, chips acompanham */
function homeHooks() {
  const body = $('.home', live); if (!body) return;
  const chips = $('#hchips', live);
  body.addEventListener('scroll', () => {
    const i = Math.round(body.scrollTop / body.clientHeight);
    if (i === S.homeSec) return; S.homeSec = i;
    [...chips.children].forEach((c, k) => c.classList.toggle('on', k === i));
    const c = chips.children[i]; if (c) chips.scrollTo({ left: c.offsetLeft - 16, behavior: reducedMotion() ? 'auto' : 'smooth' });
  }, { passive: true });
  /* roda do mouse: um gesto = uma seção (o snap nativo do Chrome é instável com wheel) */
  let wheelLock = false, acc = 0;
  body.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    e.preventDefault(); if (wheelLock) return;
    acc += e.deltaY; if (Math.abs(acc) < 30) return;
    const i = Math.max(0, Math.min(body.querySelectorAll('.hsec').length - 1, Math.round(body.scrollTop / body.clientHeight) + Math.sign(acc)));
    acc = 0; wheelLock = true;
    body.scrollTo({ top: i * body.clientHeight, behavior: reducedMotion() ? 'auto' : 'smooth' });
    setTimeout(() => { wheelLock = false; }, 650);
  }, { passive: false });
  live.querySelectorAll('.hsec .hrail').forEach((rail) => {
    const dots = rail.nextElementSibling;
    let loading = false;
    rail.addEventListener('scroll', () => {
      const w = rail.scrollWidth / Math.ceil(rail.children.length / 2);
      const i = Math.round(rail.scrollLeft / w);
      if (dots && !dots.classList.contains('inf')) [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i));
      if (rail.dataset.inf && !loading && rail.scrollLeft + rail.clientWidth > rail.scrollWidth - w * 1.5) {
        loading = true; const sk = `<article class="hcard sk">${skel(120, '100%', 10)}${skel(10, '90%')}${skel(16, '50%')}</article>`; rail.insertAdjacentHTML('beforeend', sk + sk);
        setTimeout(() => { rail.lastElementChild.remove(); rail.lastElementChild.remove(); rail.insertAdjacentHTML('beforeend', maisCards(rail.children.length, 8)); loading = false; }, reducedMotion() ? 150 : 600);
      }
    }, { passive: true });
  });
  live.querySelectorAll('.hsec').forEach((sec) => { const r = sec.querySelector('.hrail'), n = sec.querySelector('.hsec-nav'); if (r && n) n.hidden = r.scrollWidth <= r.clientWidth + 4 && !r.dataset.inf; });
  if (S.homeSec) body.scrollTop = S.homeSec * body.clientHeight;
}
function runProc() {
  S.proc = 0;
  procTimer = setInterval(() => {
    S.proc++;
    if (S.proc < PROC.length) { if (cur === 'T-25' || cur === 'D-25') { live.innerHTML = frame(cur, true); fit(); } return; }
    clearInterval(procTimer); procTimer = null;
    const r = S.scanResult;
    if (r === 'ok') {
      S.scanDone = true;
      if (!S.scanCredited) { S.points += 10; S.scanCredited = true; S.ledger.unshift(['Nota · Jupiter', 10, 'hoje']); }
      nav('T-22', null, { replace: true });
    } else nav(r === 'dup' ? 'T-26' : 'T-27', null, { replace: true });
  }, reducedMotion() ? 260 : 560);
}
function flash(msg, extra = {}) {
  S.toast = { msg, ...extra }; TOAST_ANIM = true; clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { S.toast = null; const t = $('.toast', live); if (t) { t.classList.add('out'); setTimeout(() => t.remove(), 200); } }, 2800);
}
function fit() {
  const kind = SCREENS[cur].kind;
  const w = kind === 'web' ? 1440 : kind === 'desk' ? 1280 : 414, h = kind === 'web' ? 900 : kind === 'desk' ? 836 : 868;
  const sw = stage.clientWidth - 32, sh = stage.clientHeight - (kind ? 140 : 32);
  const k = Math.min(1, sw / w, sh / h).toFixed(3);
  live.style.setProperty('--s', k); document.documentElement.style.setProperty('--s', k);
}
addEventListener('resize', () => cur && player.classList.contains('open') && fit());

function notes() {
  const sc = SCREENS[cur], f = flowOf(cur);
  const tags = (arr, cls) => arr.map((x) => `<span class="tg ${cls}">${x}</span>`).join('');
  $('#pnotes-body').innerHTML = `<p class="pn-id">${cur}${sc.novo ? ' <span class="snew">novo no v2</span>' : ''}</p><h3>${sc.name}</h3><p class="pn-flow">${f.n} · ${f.title}</p>
  <div class="tgs">${tags(sc.us, 'us')}${tags(sc.rn, 'rn')}${tags(sc.req, 'rq')}</div><p class="pn-txt">${sc.notes}</p>`;
  document.querySelectorAll('#plist a').forEach((a) => a.classList.toggle('on', a.dataset.id === cur));
  const on = document.querySelector('#plist a.on'); if (on) on.scrollIntoView({ block: 'nearest' });
  document.querySelectorAll('[data-scen]').forEach((b) => { const [k, v] = b.dataset.scen.split(':'); b.classList.toggle('on', String(S[k]) === v); });
}

function openPlayer(id) { hist.length = 0; player.classList.add('open'); document.body.style.overflow = 'hidden'; cur = id; paint(); $('#stage-close').focus({ preventScroll: true }); }
function closePlayer() { player.classList.remove('open'); document.body.style.overflow = ''; history.replaceState(null, '', location.pathname); if (procTimer) { clearInterval(procTimer); procTimer = null; } }

/* ---------- ações ---------- */
function curItem() { return S.scanned.itens.find((i) => i.cod === S.sel.cod) || S.scanned.itens.find((i) => !i.ean) || S.scanned.itens[0]; }
function linkItem(how) {
  const it = curItem(); const sug = suggestFor(it.desc);
  let ean, titulo, origem;
  if (how === 'manual') { ean = S.eanIn; origem = 'manual'; titulo = humanize(it.desc); }
  else if (how === 'scan') { ean = sug[0].ean; titulo = sug[0].titulo; origem = 'barcode_scan'; }
  else { const g = sug[+how.split(':')[1]]; ean = g.ean; titulo = g.titulo; origem = 'sugestao'; }
  it.ean = ean; it.titulo = titulo; it.origem = origem;
  S.points += 5; S.ledger.unshift(['Código · ' + titulo.split(' ').slice(0, 3).join(' '), 5, 'hoje']);
  flash('+5 pontos · código vinculado');
  if (ean === '7896004006277') nav('T-24', null, { replace: true }); else nav('T-22', null, { replace: true, dir: 'back' });
}
const ACTS = {
  cat: (a) => { S.cat = a; paint(); },
  jump: (a) => { const body = $('.home', live); if (body) body.scrollTo({ top: +a * body.clientHeight, behavior: reducedMotion() ? 'auto' : 'smooth' }); },
  q: (a) => { S.q = a; paint(); },
  sort: (a) => { S.sort = a; paint(); },
  fresh: (a) => { S.fresh = +a; paint(); },
  radius: (a) => { S.radius = +a; paint(); },
  vtab: (a) => { S.vtab = a; paint(); },
  hp: (a) => { S.histPoint = S.histPoint === +a ? null : +a; paint(); },
  mapsel: (a) => { S.mapSel = a; paint(); },
  mapstore: (a) => { S.mapStore = a; paint(); },
  pick: (a) => { S.pick = +a; paint(); },
  photo: (a) => { S.photo = +a; paint(); },
  flash: () => { S.flash = !S.flash; paint(); },
  bairro: (a) => { S.bairro = a; S.gps = false; paint(); },
  addlist: (a) => { S.addList = a; paint(); },
  'sheet-add': (a) => { S.sel.ean = a; S.sheet = 'add'; S.addQty = 1; SHEET_ANIM = true; paint(); },
  sheet: (a) => { S.sheet = a; S.addQty = 1; SHEET_ANIM = true; paint(); },
  'sheet-close': () => { const sh = $('.sheet', live), sc = $('.scrim', live); if (sh) { sh.classList.add('out'); sc.classList.add('out'); } setTimeout(() => { S.sheet = null; paint(); }, reducedMotion() ? 0 : 200); },
  qty: (a) => {
    const [e, d] = a.split(':');
    if (e === 'add') S.addQty = Math.max(1, S.addQty + +d);
    else { const it = listOf().items.find((i) => i.ean === e); if (it) it.qty = Math.max(1, it.qty + +d); }
    paint();
  },
  rm: (a) => { const l = listOf(); l.items = l.items.filter((i) => i.ean !== a); flash('Removido da lista'); paint(); },
  'add-ok': () => {
    const l = S.lists.find((x) => x.id === S.addList); const it = l.items.find((i) => i.ean === S.sel.ean);
    if (it) it.qty += S.addQty; else l.items.push({ ean: S.sel.ean, qty: S.addQty });
    S.sheet = null; flash(`Adicionado a ${l.nome}`, { go: 'T-42', p: { list: l.id }, label: 'Ver lista' }); paint();
  },
  'newlist-ok': () => { const id = 'l' + (S.lists.length + 1) + Date.now() % 1000; S.lists.push({ id, nome: S.newName.trim() || 'Nova lista', items: [] }); S.newName = ''; S.sheet = null; flash('Lista criada'); paint(); },
  scan: () => { const vf = $('.vf', live); if (vf) vf.classList.add('hit'); setTimeout(() => nav('T-25', null, { replace: true }), reducedMotion() ? 0 : 450); },
  decode: () => nav('T-25', null, { replace: true }),
  urlfill: (a) => { S.urlIn = a === 'ok' ? 'http://www.fazenda.pr.gov.br/nfce/qrcode?p=41261104118410000122650010000482711029384417|2|1|1|7C3B…' : 'https://pix.exemplo.com/qr/9f2c-41aa'; paint(); },
  'url-ok': () => { const ok = /fazenda\.pr\.gov\.br\/nfce\/qrcode/i.test(S.urlIn); if (!ok) { S.scanResult = 'invalid'; nav('T-27'); } else { if (S.scanResult === 'invalid') S.scanResult = 'ok'; nav('T-25'); } },
  retry: () => { S.scanResult = 'ok'; nav('T-25', null, { replace: true }); },
  link: (a) => linkItem(a),
  'photo-ok': () => { flash('Foto salva na ficha do produto'); nav('T-22', null, { replace: true, dir: 'back' }); },
  vlink: (a) => { if (!S.linkedVitrine.includes(a)) { S.linkedVitrine.push(a); S.points += 5; S.ledger.unshift(['Código · vitrine', 5, 'hoje']); } flash('+5 pontos · código vinculado'); if (cur === 'T-34') nav('back'); else paint(); },
  wsplit: (a) => { S.wsplit = a === 'split'; paint(); },
  authtab: (a) => { S.authTab = a; S.loginErr = false; paint(); },
  rail: (a) => { const [i, d] = a.split(':'); const r = live.querySelectorAll('.hsec .hrail')[+i]; if (r) r.scrollBy({ left: +d * r.clientWidth * 0.85, behavior: reducedMotion() ? 'auto' : 'smooth' }); },
  'cam-ok': () => { S.cam = 'ok'; nav('T-20', null, { replace: true }); },
  signup: () => { S.session = 'conta'; S.email = S.emailIn; flash(`Conta criada · ${allNotes().length} notas, ${S.lists.length} listas e ${S.points} pontos vinculados`); nav('T-53', null, { replace: true }); },
  login: () => { if (!S.pw || S.pw === 'errada' || !S.emailIn) { S.loginErr = true; paint(); return; } S.loginErr = false; S.session = 'conta'; S.email = S.emailIn; flash('Bem-vindo de volta'); nav('T-10'); },
  sent: () => { S.sent = true; paint(); },
  logout: () => { S.session = 'anon'; flash('Sessão encerrada neste aparelho'); nav('T-10'); },
  delete: () => { const keep = { cam: S.cam, online: S.online, scanResult: S.scanResult, credits: S.credits, reduced: S.reduced }; S = Object.assign(S0(), keep, { points: 0, lists: [], ledger: [] }); hist.length = 0; flash('Dados apagados'); nav('T-10', null, { replace: true }); },
  toast: (a) => { flash(a); paint(); },
  'adm-retry': (a) => { const f = S.admFails[+a]; f.ok = true; f.tent++; flash('Nota reprocessada e ingerida'); paint(); },
  'adm-flag': (a) => { const [i, r] = a.split(':'); S.admFlags[+i].res = r; paint(); },
};
const TOGGLES = { alerts: 'alerts', optin: 'optIn', gps: 'gps', lgpd: 'lgpd' };

live.addEventListener('click', (e) => {
  const a = e.target.closest('[data-act]');
  if (a && !a.disabled) {
    e.preventDefault(); const name = a.dataset.act;
    if (TOGGLES[name]) {
      const k = TOGGLES[name]; S[k] = !S[k];
      live.querySelectorAll(`[data-act="${name}"]`).forEach((el) => { el.classList.toggle('on', S[k]); el.setAttribute('aria-checked', S[k]); });
      if (name === 'gps' || name === 'lgpd') setTimeout(paint, reducedMotion() ? 0 : 240);
      return;
    }
    if (ACTS[name]) ACTS[name](a.dataset.arg);
    return;
  }
  const g = e.target.closest('[data-go]');
  if (g) { e.preventDefault(); nav(g.dataset.go, g.dataset.p ? JSON.parse(g.dataset.p) : null); }
});
live.addEventListener('input', (e) => {
  const el = e.target, k = el.dataset.input; if (!k) return;
  if (k === 'eanIn') { el.value = el.value.replace(/\D/g, ''); }
  S[k] = k === 'radius' ? +el.value : el.value;
  if (k === 'q') $('#res', live).innerHTML = SCREENS[cur].kind === 'web' ? webResults() : searchResults();
  if (k === 'qs') $('#rk', live).innerHTML = storeRanking(S.radius).filter((r) => !S.qs || norm(r.s.nome).includes(norm(S.qs))).map(rankRow).join('');
  if (k === 'radius') $('#rv', live).textContent = S.radius + ' km';
  if (k === 'eanIn') {
    const ok = gtinValid(S.eanIn), f = el.closest('.field');
    f.classList.toggle('ok', !!S.eanIn && ok); f.classList.toggle('bad', !!S.eanIn && !ok);
    $('#eanhint', live).textContent = S.eanIn ? (ok ? 'Código válido' : S.eanIn.length < 8 ? 'Continue digitando' : 'Dígito verificador não confere') : 'Fica no verso da embalagem';
    $('#eansave', live).disabled = !ok;
  }
  if (k === 'pw' || k === 'emailIn') {
    const m = $('#pwm', live); if (m) m.className = 'pwm s' + Math.min(4, (S.pw.length >= 8) + /\d/.test(S.pw) + /[A-Z]/.test(S.pw) + /[^\w]/.test(S.pw));
    const b = $('#signup', live); if (b) b.disabled = !(/.+@.+\..+/.test(S.emailIn) && S.pw.length >= 8 && S.lgpd);
  }
  if (k === 'del') $('#delbtn', live).disabled = S.del !== 'EXCLUIR';
});
live.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.dataset.input === 'urlIn') ACTS['url-ok']();
  if (e.key === 'Enter' && e.target.dataset.input === 'newName') ACTS['newlist-ok']();
});

/* cenários */
document.querySelectorAll('[data-scen]').forEach((b) => b.addEventListener('click', () => {
  const [k, v] = b.dataset.scen.split(':');
  S[k] = v === 'true' ? true : v === 'false' ? false : v;
  if (k === 'session' && v === 'conta' && !S.email) S.email = 'ana@email.com';
  if (k === 'online' && v === 'false' && cur === 'T-10') { nav('T-71'); return; }
  paint();
}));
$('#scen-reset').addEventListener('click', () => { S = S0(); hist.length = 0; nav('T-10', null, { replace: true }); });

/* player chrome */
const plist = $('#plist');
FLOWS.forEach((f) => {
  plist.insertAdjacentHTML('beforeend', `<h4>${f.n} · ${f.title}</h4>`);
  f.steps.forEach((id) => plist.insertAdjacentHTML('beforeend', `<a data-id="${id}" href="#${id}"><span>${id}</span>${SCREENS[id].name}</a>`));
});
plist.addEventListener('click', (e) => { const a = e.target.closest('a[data-id]'); if (a) { e.preventDefault(); nav(a.dataset.id); } });
$('#stage-close').addEventListener('click', closePlayer);
function toggleDevice() {
  const kind = SCREENS[cur].kind;
  if (kind === 'web') nav(WBACK(cur), null, { replace: true, raw: true });
  else if (kind === 'desk') nav('T-10', null, { replace: true });
  else { if (cur === 'T-41') S.wsplit = true; if (cur === 'T-42') S.wsplit = false; nav(WMAP[cur] || 'D-10', null, { replace: true }); }
}
$('#dev-toggle').addEventListener('click', toggleDevice);
$('#pn-toggle').addEventListener('click', () => player.classList.toggle('notes-open'));
document.addEventListener('keydown', (e) => {
  if (!player.classList.contains('open')) return;
  const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
  if (e.key === 'Escape') { if (S.sheet) ACTS['sheet-close'](); else closePlayer(); }
  else if (typing) return;
  else if (e.key === 'ArrowRight') { const i = ORDER.indexOf(cur); nav(ORDER[(i + 1) % ORDER.length]); }
  else if (e.key === 'ArrowLeft') { const i = ORDER.indexOf(cur); nav(ORDER[(i - 1 + ORDER.length) % ORDER.length], null, { dir: 'back' }); }
  else if (e.key === 'Backspace') { e.preventDefault(); nav('back'); }
  else if (e.key.toLowerCase() === 'h') player.classList.toggle('hints');
  else if (e.key.toLowerCase() === 'd') toggleDevice();
  else if (e.key.toLowerCase() === 't') { const i = THEMES.findIndex((t) => t.id === document.documentElement.dataset.theme); applyTheme(THEMES[(i + 1) % THEMES.length].id, true); }
});

/* ---------- galeria ---------- */
function buildGallery() {
  const gal = $('#gallery'), nv = $('#flownav');
  FLOWS.forEach((f) => {
    nv.insertAdjacentHTML('beforeend', `<a href="#${f.id}"><b>${f.n}</b>${f.title}</a>`);
    const steps = f.steps.map((id, i) => {
      const sc = SCREENS[id];
      return `${i ? `<span class="arrow" aria-hidden="true"><svg viewBox="0 0 36 12"><path d="M0 6h32M27 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></span>` : ''}
      <figure class="step"><div class="mini${sc.kind ? ' ' + sc.kind : ''}" data-open="${id}" role="button" tabindex="0" aria-label="Abrir ${id} ${sc.name}"><div inert>${frame(id, false)}</div></div>
      <figcaption><span class="slabel"><span class="sid">${id}</span><span class="sname">${sc.name}</span>${sc.novo ? '<span class="snew">novo</span>' : ''}</span><span class="sus">${sc.us.join(' · ')}</span></figcaption></figure>`;
    }).join('');
    gal.insertAdjacentHTML('beforeend', `<section class="flow" id="${f.id}"><div class="fhead"><span class="fnum">${f.n}</span><h2>${f.title}</h2><p>${f.desc}</p></div><div class="strip">${steps}</div></section>`);
  });
  gal.addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) openPlayer(b.dataset.open); });
  gal.addEventListener('keydown', (e) => { const b = e.target.closest('[data-open]'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openPlayer(b.dataset.open); } });

  /* rastreabilidade */
  const allUS = ['01.01', '01.02', '01.03', '01.04', '01.05', '01.06', '01.07', '01.08', '01.09', '01.10', '01.11', '01.12', '02.01', '02.02', '02.03', '02.04', '02.05', '02.06', '02.07', '03.01', '03.02', '03.03', '03.04', '03.05', '03.06', '04.01', '04.02', '04.03', '04.04', '04.05', '04.06', 'ADM.01', 'ADM.02', 'ADM.03'].map((x) => 'US-' + x);
  const allRN = Array.from({ length: 15 }, (_, i) => 'RN-' + String(i + 1).padStart(2, '0'));
  const used = (k) => new Set(Object.values(SCREENS).flatMap((s) => s[k]));
  const uUS = used('us'), uRN = used('rn');
  const cover = (all, u) => all.map((x) => `<span class="cv${u.has(x) ? ' ok' : ''}" title="${x}">${x.replace(/^(US|RN)-/, '')}</span>`).join('');
  $('#cov-us').innerHTML = cover(allUS, uUS); $('#cov-rn').innerHTML = cover(allRN, uRN);
  $('#cov-us-n').textContent = `${allUS.filter((x) => uUS.has(x)).length}/${allUS.length}`;
  $('#cov-rn-n').textContent = `${allRN.filter((x) => uRN.has(x)).length}/${allRN.length}`;
  $('#trace tbody').innerHTML = ORDER.map((id) => { const s = SCREENS[id]; return `<tr><td><a href="#${id}" data-open="${id}" class="sid">${id}</a></td><td>${s.name}${s.novo ? ' <span class="snew">novo</span>' : ''}</td><td>${flowOf(id).n}</td><td>${s.us.join(', ')}</td><td>${s.rn.join(', ') || '—'}</td><td>${s.req.join(', ') || '—'}</td></tr>`; }).join('');
  $('#trace').addEventListener('click', (e) => { const a = e.target.closest('[data-open]'); if (a) { e.preventDefault(); openPlayer(a.dataset.open); } });

  $('#st-screens').textContent = ORDER.length;
  $('#st-new').textContent = ORDER.filter((id) => SCREENS[id].novo).length;
  $('#st-us').textContent = `${allUS.filter((x) => uUS.has(x)).length}/${allUS.length}`;
  $('#st-rn').textContent = `${allRN.filter((x) => uRN.has(x)).length}/${allRN.length}`;
}
buildGallery();

/* ---------- temas ---------- */
const THEMES = [
  { id: 'institucional', nome: 'Institucional', tag: 'atual', desc: 'Azul de programa público + verde de menor preço sobre névoa. O DESIGN.md v2 como está.', sw: ['#0069B4', '#00984B', '#0B1F33', '#F5F7FA'] },
  { id: 'escuro', nome: 'Escuro', desc: 'Fundo preto puro e cinzas neutros; azul só no botão de ação. Testa se o verde do menor preço continua o protagonista.', sw: ['#2F86E8', '#34D27F', '#F5F5F5', '#000000'] },
  { id: 'petroleo', nome: 'Petróleo + lima', desc: 'Azul esverdeado mais sóbrio, verde mais vivo. Menos “banco”, mais “feira limpa”.', sw: ['#0E6170', '#3F9E1F', '#10272B', '#F2F5F4'] },
  { id: 'grafite', nome: 'Grafite + esmeralda', desc: 'Ação em quase-preto, só o preço tem cor. Máxima escassez de acento: o verde salta.', sw: ['#1F2430', '#00995A', '#16181D', '#F6F6F4'] },
  { id: 'feira', nome: 'Feira (laranja + verde)', desc: 'Laranja de hortifruti e encarte como ação, verde no menor preço. Mais varejo, mais calor.', sw: ['#DC5A07', '#1F8A3A', '#2A1A0E', '#FBF7F2'] },
  { id: 'papel', nome: 'Papel de nota', desc: 'Fundo de cupom térmico, azul-tinta, preços em fonte mono como na nota impressa.', sw: ['#23446B', '#2D7A3E', '#1E1C18', '#F3EFE6'] },
];
const TSCREENS = [['T-10', 'Home'], ['T-14', 'Detalhe'], ['T-31', 'Lojas'], ['T-41', 'Lista dividida'], ['T-22', 'Nota ingerida'], ['T-51', 'Perfil']];
let tScreen = ['T-10', 'T-14'];
function getTheme() { try { return localStorage.getItem('nt-theme') || 'institucional'; } catch (e) { return 'institucional'; } }
function applyTheme(id, animate) {
  const root = document.documentElement;
  if (animate && root.dataset.theme !== id && document.startViewTransition && !reducedMotion()) {
    root.dataset.vt = 'theme';
    const t = document.startViewTransition(() => applyTheme(id));
    [t.ready, t.updateCallbackDone].forEach((pr) => pr.catch(() => {}));
    t.finished.catch(() => {}).finally(() => { delete root.dataset.vt; });
    return;
  }
  root.dataset.theme = id;
  try { localStorage.setItem('nt-theme', id); } catch (e) { /* sem storage: só nesta visita */ }
  document.querySelectorAll('[data-theme-pick]').forEach((b) => { b.classList.toggle('on', b.dataset.themePick === id); if (b.getAttribute('role') === 'radio') b.setAttribute('aria-checked', b.dataset.themePick === id); });
  document.querySelectorAll('.tcard').forEach((c) => c.classList.toggle('on', c.dataset.theme === id));
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--nt-canvas').trim();
}
function renderThemes() {
  $('#tscreens').innerHTML = TSCREENS.map(([id, l]) => `<button class="${tScreen.includes(id) ? 'on' : ''}" data-tscreen="${id}">${l}</button>`).join('');
  $('#themes').innerHTML = THEMES.map((t) => `<article class="tcard" data-theme="${t.id}">
    <header><h3>${t.nome}</h3>${t.tag ? `<span>${t.tag}</span>` : ''}</header>
    <div class="tsw">${['ação', 'menor preço', 'texto', 'fundo'].map((l, i) => `<i style="background:${t.sw[i]}" data-l="${l}"></i>`).join('')}</div>
    <p>${t.desc}</p>
    <div class="tminis" style="background:var(--nt-stage)">${tScreen.map((id) => `<div class="mini" role="button" tabindex="0" data-open="${id}" data-open-theme="${t.id}" aria-label="Abrir ${id} no tema ${t.nome}"><div inert>${frame(id, false)}</div></div>`).join('')}</div>
    <button class="sbtn p" data-theme-pick="${t.id}">Usar este tema</button></article>`).join('');
  applyTheme(document.documentElement.dataset.theme || getTheme());
}
$('#tscreens').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tscreen]'); if (!b) return;
  const id = b.dataset.tscreen;
  tScreen = tScreen.includes(id) ? (tScreen.length > 1 ? tScreen.filter((x) => x !== id) : tScreen) : [...tScreen, id].slice(-2);
  renderThemes();
});
$('#themes').addEventListener('click', (e) => {
  const pick = e.target.closest('[data-theme-pick]'); if (pick) { applyTheme(pick.dataset.themePick); return; }
  const m = e.target.closest('[data-open]'); if (m) { applyTheme(m.dataset.openTheme); openPlayer(m.dataset.open); }
});
const dots = THEMES.map((t) => `<button class="tdot" data-theme-pick="${t.id}" style="--a:${t.sw[0]};--b:${t.sw[1]}" title="${t.nome}" aria-label="Tema ${t.nome}"></button>`).join('');
$('#themebar').insertAdjacentHTML('beforeend', dots);
$('#themebar').addEventListener('click', (e) => { const b = e.target.closest('[data-theme-pick]'); if (b) applyTheme(b.dataset.themePick); });
$('#stage-themes').innerHTML = THEMES.map((t) => `<button data-theme-pick="${t.id}" role="radio" title="${t.nome}"><span class="tdot" style="--a:${t.sw[0]};--b:${t.sw[1]}"></span><span class="tname">${t.nome}</span></button>`).join('');
$('#stage-themes').addEventListener('click', (e) => { const b = e.target.closest('[data-theme-pick]'); if (b) applyTheme(b.dataset.themePick, true); });
$('#scen-theme').innerHTML = THEMES.map((t) => `<button data-theme-pick="${t.id}">${t.nome.split(' ')[0]}</button>`).join('');
$('#scen-theme').addEventListener('click', (e) => { const b = e.target.closest('[data-theme-pick]'); if (b) applyTheme(b.dataset.themePick, true); });
$('#flownav').insertAdjacentHTML('afterbegin', '<a href="#temas"><b>◐</b>Temas</a>');
document.documentElement.dataset.theme = getTheme();
renderThemes();
document.querySelectorAll('[data-start]').forEach((b) => b.addEventListener('click', () => openPlayer(b.dataset.start)));
if (location.hash && SCREENS[location.hash.slice(1)]) openPlayer(location.hash.slice(1));
