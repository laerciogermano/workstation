/* Clozzy · protótipo v2 — estado, navegação, galeria, player e temas (arquitetura dos protótipos Fitness / notinhas v2) */
'use strict';

const clone = (o) => JSON.parse(JSON.stringify(o));
const S0 = () => ({
  auth: 'fan', age: true, creator: 'fan', pix: 'ok', libEmpty: false, reduced: false,
  subs: ['lara', 'bia'], bought: ['pack-glow'], lib: clone(LIB0), cancelled: [],
  sel: { c: 'lara', o: 'close' }, pending: false,
  terms: true, cterms: false, sent: false, code: '48', likes: ['Make', 'Dança'],
  cat: 'Tudo', q: '', libtab: 'assinatura', unread: true, liked: false, sentMsg: false,
  pixSec: 899, checking: false, copied: false, reason: null,
  notifyOn: true, mailOn: true, published: true, pixType: 'CPF',
  price: 29.9, otype: null, cfilter: 'tudo', pubVis: 'pack', wm: true, pubNotify: true,
  saldo: 6482.3, saque: 1000, payouts: clone(PAYOUTS), sheet: null, toast: null,
});
let S = S0();

const ORDER = FLOWS.flatMap((f) => f.steps);
const flowOf = (id) => FLOWS.find((f) => f.steps.includes(id));
const STUDIO_GATED = ['C-50', 'C-52', 'C-53', 'C-54', 'C-55', 'C-56', 'C-57', 'C-58'];
const AUTH_GATED = ['C-30', 'C-31', 'C-32', 'C-33', 'C-34', 'C-35', 'C-23', 'C-24', 'C-25'];
let SHEET_ANIM = false, TOAST_ANIM = false;
const $ = (s, r = document) => r.querySelector(s);

/* ---------- render ---------- */
const themeNow = () => document.documentElement.dataset.theme || 'noite';
function screenHTML(id) {
  try { return SCREENS[id].render(); } catch (e) { console.error(id, e); return `<div class="body"><p class="muted">Erro em ${id}: ${esc(e.message)}</p></div>`; }
}
const status = (light) => `<div class="sb${light ? ' lt' : ''}"><span class="tnum">9:41</span><span class="isl"></span><span class="sbr"><svg viewBox="0 0 18 12" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 26 12" aria-hidden="true"><rect x="1" y="1" width="21" height="10" rx="3" fill="none" stroke="currentColor" opacity=".45"/><rect x="3" y="3" width="15" height="6" rx="1.5"/><rect x="23.5" y="4" width="1.5" height="4" rx=".7" opacity=".45"/></svg></span></div>`;
function toastHTML() { if (!S.toast) return ''; return `<div class="toast${TOAST_ANIM ? ' anim' : ''}" role="status">${ico('check')}<span>${S.toast}</span></div>`; }
function frame(id, live, theme = themeNow()) {
  const sc = SCREENS[id], studio = STUDIO.includes(id);
  const cls = ['scr', sc.photo ? 'is-photo' : '', sc.moment ? 'is-moment' : '', studio ? 'st' : ''].join(' ');
  const sh = live ? sheetHTML().replace('class="sheet"', `class="sheet${SHEET_ANIM ? ' anim' : ''}"`) : '';
  return `<div class="phone" data-t="${theme}"><div class="${cls}">${status(sc.photo || sc.moment)}${screenHTML(id)}${sh}${live ? toastHTML() : ''}</div></div>`;
}

/* ---------- player ---------- */
const player = $('#player'), live = $('#live'), stage = $('#stage');
let cur = null; const hist = []; let toastTimer = null, pixTimer = null;
const reducedMotion = () => S.reduced || matchMedia('(prefers-reduced-motion: reduce)').matches;
function swap(fn, dir) {
  document.documentElement.dataset.dir = dir;
  if (document.startViewTransition && !reducedMotion() && player.classList.contains('open')) { const t = document.startViewTransition(fn); [t.ready, t.finished, t.updateCallbackDone].forEach((p) => p.catch(() => {})); }
  else fn();
}
function route(id) {
  if (S.auth === 'anon' && AUTH_GATED.includes(id)) { flash('Entre para continuar'); return 'C-04'; }
  if (!S.age && ['C-10', 'C-11', 'C-12', 'C-20', 'C-21'].includes(id)) return 'C-02';
  if (STUDIO_GATED.includes(id) && S.creator !== 'ativa') return S.creator === 'analise' ? 'C-44' : 'C-40';
  return id;
}
function nav(id, p, opt = {}) {
  let dir = opt.dir || 'fwd';
  if (id === 'back') { id = hist.pop() || 'C-10'; dir = 'back'; }
  else { id = route(id); if (cur && cur !== id && !opt.replace) hist.push(cur); }
  if (p) Object.assign(S.sel, p);
  if (id === 'C-53') { const o = S.sel.o === 'new' ? null : offerOf(S.sel.o); S.price = o ? o.preco : 19.9; S.otype = null; }
  if (id === 'C-23' && cur !== 'C-23') { S.pixSec = 899; S.checking = false; S.copied = false; }
  S.sheet = null; needPaint = false;
  swap(() => { cur = id; paint(); }, dir);
}
function paint() {
  needPaint = false;
  live.innerHTML = frame(cur, true);
  SHEET_ANIM = false; TOAST_ANIM = false;
  document.documentElement.classList.toggle('rm', reducedMotion());
  fit(); notes(); history.replaceState(null, '', '#' + cur);
  clearInterval(pixTimer);
  if (cur === 'C-23') pixTimer = setInterval(() => { S.pixSec = Math.max(0, S.pixSec - 1); const t = $('[data-timer]', live); if (t) t.textContent = `${Math.floor(S.pixSec / 60)}:${String(S.pixSec % 60).padStart(2, '0')}`; if (!S.pixSec) nav('C-26', null, { replace: true }); }, 1000);
}
function rerender() { paint(); }
let needPaint = false;
function flash(msg) {
  S.toast = msg; TOAST_ANIM = true; clearTimeout(toastTimer);
  needPaint = true; queueMicrotask(() => { if (needPaint && cur && player.classList.contains('open')) paint(); });
  toastTimer = setTimeout(() => { S.toast = null; const t = $('.toast', live); if (t) { t.classList.add('out'); setTimeout(() => t.remove(), 220); } }, 2600);
}
function fit() {
  if (!player.classList.contains('open')) return;
  const sw = Math.max(0, stage.clientWidth - 32), sh = Math.max(0, stage.clientHeight - 96);
  const k = Math.max(0.42, Math.min(1, sw / 414, sh / 868)).toFixed(3);
  live.style.setProperty('--s', k);
}
addEventListener('resize', () => cur && fit());
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => cur && fit()).observe(stage);
function notes() {
  const m = META[cur], f = flowOf(cur);
  $('#pnotes-body').innerHTML = `<p class="pn-id">${cur}</p><h3>${m.name}</h3><p class="pn-flow">${f.n} · ${f.title}${STUDIO.includes(cur) ? ' · lado da criadora' : ''}</p><div class="tgs">${m.p.map((x) => `<span class="tg${x === 'pós-v1' ? ' pv' : ''}">${x}</span>`).join('')}</div><p class="pn-txt">${m.notes}</p>`;
  document.querySelectorAll('#plist a').forEach((a) => a.classList.toggle('on', a.dataset.id === cur));
  const on = $('#plist a.on'); if (on) on.scrollIntoView({ block: 'nearest' });
  document.querySelectorAll('[data-scen]').forEach((b) => { const [k, v] = b.dataset.scen.split(':'); b.classList.toggle('on', String(scenVal(k)) === v); });
}
function scenVal(k) { return k === 'sub' ? S.subs.includes('lara') : S[k]; }
function openPlayer(id) {
  hist.length = 0; player.classList.add('open'); document.body.style.overflow = 'hidden';
  cur = route(id); live.style.setProperty('--s', '1'); paint();
  requestAnimationFrame(() => { fit(); requestAnimationFrame(fit); }); setTimeout(fit, 80);
  try { $('#stage-close').focus({ preventScroll: true }); } catch (e) { /* */ }
}
function closePlayer() { player.classList.remove('open'); document.body.style.overflow = ''; clearInterval(pixTimer); history.replaceState(null, '', location.pathname + location.search); }

/* ---------- ações ---------- */
const ACTS = {
  'age': (v) => { if (v === 'yes') { S.age = true; nav(S.auth === 'anon' ? 'C-03' : 'C-10'); } else flash('Tudo bem. Volte quando fizer 18.'); },
  'toggle': (k) => { S[k] = !S[k]; rerender(); },
  'signup': () => { if (!S.terms) return flash('Aceite os Termos para continuar'); S.code = ''; nav('C-06'); },
  'login': () => { S.auth = 'fan'; if (S.pending) { S.pending = false; nav('C-22'); } else nav('C-10'); flash('Oi, Rafa'); },
  'logout': () => { S.auth = 'anon'; hist.length = 0; nav('C-01'); },
  'sent': () => { S.sent = true; rerender(); },
  'key': (k) => { if (k === '⌫') S.code = S.code.slice(0, -1); else if (S.code.length < 6) S.code += k; rerender(); if (S.code.length === 6) setTimeout(() => { S.auth = 'fan'; flash('E-mail confirmado'); nav('C-07'); }, 380); },
  'like': (c) => { S.likes = S.likes.includes(c) ? S.likes.filter((x) => x !== c) : [...S.likes, c]; rerender(); },
  'cat': (c) => { S.cat = c; rerender(); },
  'q': (q) => { S.q = q; rerender(); },
  'story': () => { if (S.sel.c === 'lara') nav('C-11', { c: 'bia' }, { replace: true }); else nav('back'); },
  'like-story': () => { S.liked = !S.liked; rerender(); },
  'checkout': () => {
    const o = offerOf(S.sel.o);
    if (S.auth === 'anon') { S.pending = true; nav('C-04'); return; }
    const has = o.tipo === 'assinatura' ? S.subs.includes(S.sel.c) && !S.cancelled.includes(S.sel.c) : S.bought.includes(o.id);
    if (has) { flash('Você já tem esse acesso. Nada foi cobrado.'); return; }
    nav('C-23');
  },
  'copy': () => { S.copied = true; rerender(); flash('Código Pix copiado'); },
  'paid': () => {
    if (S.checking) return;
    S.checking = true; rerender();
    setTimeout(() => {
      S.checking = false;
      if (S.pix === 'expira') { nav('C-26', null, { replace: true }); return; }
      const o = offerOf(S.sel.o), k = S.sel.c;
      if (o.tipo === 'assinatura') { if (!S.subs.includes(k)) S.subs.push(k); S.cancelled = S.cancelled.filter((x) => x !== k); const e = S.lib.find((x) => x.tipo === 'assinatura' && x.who === k); if (e) { e.st = 'ativa'; e.info = 'renova 16 dez · ' + brl(C(k).preco); } else S.lib.unshift({ tipo: 'assinatura', who: k, nome: 'Close da ' + C(k).nome.split(' ')[0], st: 'ativa', info: 'renova 16 dez · ' + brl(C(k).preco) }); }
      else if (!S.bought.includes(o.id)) { S.bought.push(o.id); S.lib.unshift({ tipo: o.tipo, who: k, nome: o.nome, st: 'ativa', info: (o.itens > 1 ? o.itens + ' itens' : '1 vídeo') + ' · comprado hoje', capa: o.capa }); }
      S.libEmpty = false;
      nav('C-24', null, { replace: true });
    }, 1300);
  },
  'newpix': () => { S.pix = 'ok'; nav('C-23', null, { replace: true }); },
  'lib': (t) => { S.libtab = t; rerender(); },
  'sheet': (k) => { S.sheet = k || null; SHEET_ANIM = !!k; rerender(); },
  'cancel': () => { const k = S.sel.c; if (!S.cancelled.includes(k)) S.cancelled.push(k); const e = S.lib.find((x) => x.tipo === 'assinatura' && x.who === k); if (e) e.info = 'cancelada · vê tudo até 12 dez'; S.sheet = null; flash('Cancelada. Você vê tudo até 12 dez.'); rerender(); },
  'reactivate': () => { S.cancelled = S.cancelled.filter((x) => x !== S.sel.c); flash('Assinatura reativada'); rerender(); },
  'notify': () => { S.notifyOn = !S.notifyOn; rerender(); },
  'mail': () => { S.mailOn = !S.mailOn; rerender(); },
  'readall': () => { S.unread = false; rerender(); },
  'sendmsg': () => { S.sentMsg = true; rerender(); },
  'reason': (i) => { S.reason = +i; rerender(); },
  'report': () => { if (S.reason == null) return flash('Escolha um motivo'); S.reason = null; flash('Recebida · protocolo #48213'); nav('back'); },
  'selfie': () => { flash('Foto boa. Documento legível.'); nav('C-43'); },
  'pixtype': (t) => { S.pixType = t; rerender(); },
  'submitkyc': () => { if (!S.cterms) return flash('Aceite os Termos de criadora'); S.creator = 'analise'; nav('C-44'); },
  'approve': () => { S.creator = 'ativa'; flash('Conta ativa. Bem-vinda ao Studio.'); nav('C-50'); },
  'publish': () => { S.published = !S.published; rerender(); },
  'offer': (id) => { const o = OFFERS.find((x) => x.id === id); o.ativa = !o.ativa; flash(o.ativa ? 'Oferta ativa no perfil' : 'Oferta pausada'); rerender(); },
  'otype': (t) => { S.otype = t; rerender(); },
  'price': (d) => { S.price = Math.max(4.9, Math.round((S.price + +d) * 10) / 10); rerender(); },
  'saveoffer': () => { flash('Oferta salva'); nav('C-52'); },
  'cf': (f) => { S.cfilter = f; rerender(); },
  'archive': () => { S.sheet = null; flash('Arquivado. Some do perfil, fica no seu acervo.'); rerender(); },
  'pv': (v) => { S.pubVis = v; rerender(); },
  'wm': () => { S.wm = !S.wm; rerender(); },
  'pubnotify': () => { S.pubNotify = !S.pubNotify; rerender(); },
  'post': () => { flash(S.pubNotify ? 'Publicado · 3.240 fãs avisados' : 'Publicado'); nav('C-54'); },
  'saque': (v) => { S.saque = +v; rerender(); },
  'withdraw': () => { S.payouts.unshift({ v: S.saque, q: 'agora', st: 'processando' }); S.saldo = Math.max(0, S.saldo - S.saque); S.saque = Math.min(1000, S.saldo); flash('Saque pedido · cai em até 1 dia útil'); nav('C-57'); },
  'toast': (m) => { flash(m); },
};
live.addEventListener('click', (e) => {
  const a = e.target.closest('[data-act]');
  if (a && live.contains(a)) { if (a.getAttribute('aria-disabled') === 'true' && !['signup', 'report', 'submitkyc'].includes(a.dataset.act)) return; const [k, ...v] = a.dataset.act.split(':'); if (ACTS[k]) { e.preventDefault(); ACTS[k](v.join(':')); } return; }
  const g = e.target.closest('[data-go]');
  if (g && live.contains(g)) { e.preventDefault(); nav(g.dataset.go, g.dataset.p ? JSON.parse(g.dataset.p) : null); }
});
live.addEventListener('input', (e) => {
  const m = e.target.dataset.model; if (!m) return;
  S[m] = e.target.value; const pos = e.target.selectionStart; paint();
  const n = $(`[data-model="${m}"]`, live); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (er) { /* */ } }
});

/* cenários */
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-scen]'); if (!b) return;
  const [k, v] = b.dataset.scen.split(':'); const val = v === 'true' ? true : v === 'false' ? false : v;
  if (k === 'sub') { S.subs = val ? [...new Set([...S.subs, 'lara'])] : S.subs.filter((x) => x !== 'lara'); }
  else S[k] = val;
  if (k === 'auth' && val === 'anon') S.pending = false;
  if (cur) { const r = route(cur); if (r !== cur) nav(r, null, { replace: true }); else paint(); }
});
$('#scen-reset').addEventListener('click', () => { S = S0(); OFFERS.forEach((o) => { o.ativa = o.id !== 'item-ro'; }); hist.length = 0; nav('C-10', null, { replace: true }); flash('Estado reiniciado'); });

/* teclado */
addEventListener('keydown', (e) => {
  if (!player.classList.contains('open')) return;
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) { if (e.key === 'Escape') document.activeElement.blur(); return; }
  const i = ORDER.indexOf(cur);
  if (e.key === 'ArrowRight') nav(ORDER[(i + 1) % ORDER.length], null, { replace: true, dir: 'fwd' });
  else if (e.key === 'ArrowLeft') nav(ORDER[(i - 1 + ORDER.length) % ORDER.length], null, { replace: true, dir: 'back' });
  else if (e.key === 'Backspace') { e.preventDefault(); nav('back'); }
  else if (e.key === 'Escape') { if (S.sheet) ACTS.sheet(''); else closePlayer(); }
  else if (e.key.toLowerCase() === 'h') live.classList.toggle('hot');
  else if (e.key.toLowerCase() === 't') { const j = THEMES.findIndex((t) => t.id === themeNow()); applyTheme(THEMES[(j + 1) % THEMES.length].id, true); }
});
$('#stage-close').addEventListener('click', closePlayer);
$('#pn-toggle').addEventListener('click', () => player.classList.toggle('notes-off'));

/* ---------- galeria ---------- */
function gallery() {
  $('#gallery').innerHTML = FLOWS.map((f) => `<section class="flow" id="f${f.n}">
    <header class="fh"><span class="fn tnum">${f.n}</span><div><h2>${f.title}</h2><p>${f.desc}</p></div><button class="sbtn s" data-start="${f.steps[0]}">Navegar ${ico('arrow')}</button></header>
    <div class="frow">${f.steps.map((id, i) => `<figure class="shot" data-open="${id}" tabindex="0" role="button" aria-label="Abrir ${id} ${META[id].name}">
      <div class="mini"><div inert>${frame(id, false)}</div></div>
      <figcaption><b class="tnum">${id}</b><span>${META[id].name}</span>${META[id].p.includes('pós-v1') ? '<em>pós-v1</em>' : ''}</figcaption></figure>${i < f.steps.length - 1 ? '<span class="arr" aria-hidden="true">' + ico('arrow') + '</span>' : ''}`).join('')}</div></section>`).join('');
}
function plist() {
  $('#plist').insertAdjacentHTML('beforeend', FLOWS.map((f) => `<div class="pl-f"><p>${f.n} · ${f.title}</p>${f.steps.map((id) => `<a href="#${id}" data-id="${id}"><b class="tnum">${id}</b>${META[id].name}</a>`).join('')}</div>`).join(''));
  $('#plist').addEventListener('click', (e) => { const a = e.target.closest('a[data-id]'); if (a) { e.preventDefault(); nav(a.dataset.id, null, { replace: true }); } });
}
document.addEventListener('click', (e) => {
  const s = e.target.closest('[data-start]'); if (s) { openPlayer(s.dataset.start); return; }
  const pick = e.target.closest('[data-theme-pick]'); if (pick) { applyTheme(pick.dataset.themePick, true); return; }
  const m = e.target.closest('[data-open]'); if (m && !player.contains(m)) { if (m.dataset.openTheme) applyTheme(m.dataset.openTheme); openPlayer(m.dataset.open); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('[data-open]')) e.target.click(); });

/* ---------- temas ---------- */
function getTheme() { const q = new URLSearchParams(location.search).get('tema'); if (q && THEMES.some((t) => t.id === q)) return q; try { return localStorage.getItem('cz-theme') || 'noite'; } catch (e) { return 'noite'; } }
function applyTheme(id, animate) {
  const root = document.documentElement;
  if (animate && root.dataset.theme !== id && document.startViewTransition && !reducedMotion()) { root.dataset.vt = 'theme'; const t = document.startViewTransition(() => applyTheme(id)); [t.ready, t.updateCallbackDone].forEach((p) => p.catch(() => {})); t.finished.catch(() => {}).finally(() => { delete root.dataset.vt; }); return; }
  root.dataset.theme = id; try { localStorage.setItem('cz-theme', id); } catch (e) { /* */ }
  document.querySelectorAll('[data-theme-pick]').forEach((b) => { b.classList.toggle('on', b.dataset.themePick === id); if (b.getAttribute('role') === 'radio') b.setAttribute('aria-checked', b.dataset.themePick === id); });
  document.querySelectorAll('.tcard').forEach((c) => c.classList.toggle('on', c.dataset.theme === id));
  gallery();
  if (player.classList.contains('open')) paint();
}
function themesSection() {
  $('#themes').innerHTML = THEMES.map((t) => `<article class="tcard" data-theme="${t.id}"><header><h3>${t.nome}</h3>${t.tag ? `<span>${t.tag}</span>` : ''}</header>
    <div class="sws">${t.sw.map((c) => `<i style="background:${c}"></i>`).join('')}</div><p>${t.desc}</p>
    <div class="tminis">${TSCREEN.map((id) => `<div class="mini" role="button" tabindex="0" data-open="${id}" data-open-theme="${t.id}" aria-label="Abrir ${id} no tema ${t.nome}"><div inert>${frame(id, false, t.id)}</div></div>`).join('')}</div>
    <button class="sbtn ${'p'}" data-theme-pick="${t.id}">Usar este tema</button></article>`).join('');
  const dot = (t) => `<i class="tdot" style="background:${t.sw[0]};box-shadow:inset 0 0 0 1px rgba(0,0,0,.12), inset -7px 0 0 ${t.sw[2] || t.sw[1]}"></i>`;
  THEMES.forEach((t) => {
    $('#stage-themes').insertAdjacentHTML('beforeend', `<button role="radio" data-theme-pick="${t.id}" title="${t.nome}" aria-label="${t.nome}">${dot(t)}</button>`);
    $('#themebar').insertAdjacentHTML('beforeend', `<button data-theme-pick="${t.id}">${dot(t)}${t.nome}</button>`);
    $('#scen-theme').insertAdjacentHTML('beforeend', `<button data-theme-pick="${t.id}">${t.nome}</button>`);
  });
}

/* ---------- rastreio ---------- */
function trace() {
  const P = Array.from({ length: 15 }, (_, i) => 'P' + String(i + 1).padStart(2, '0'));
  const cov = Object.fromEntries(P.map((p) => [p, ORDER.filter((id) => META[id].p.includes(p))]));
  $('#cov').innerHTML = P.map((p) => `<div class="cv${cov[p].length ? ' on' : ''}"><b>${p}</b><span class="tnum">${cov[p].length}</span></div>`).join('');
  $('#cov-n').textContent = `${P.filter((p) => cov[p].length).length} de ${P.length} páginas`;
  $('#trace tbody').innerHTML = ORDER.map((id) => `<tr data-open="${id}"><td class="tnum"><b>${id}</b></td><td>${META[id].name}</td><td>${flowOf(id).title}</td><td>${META[id].p.join(' · ')}</td></tr>`).join('');
  $('#st-screens').textContent = ORDER.length; $('#st-flows').textContent = FLOWS.length; $('#st-themes').textContent = THEMES.length;
  $('#st-p').textContent = P.filter((p) => cov[p].length).length + '/15';
}

/* ---------- início ---------- */
themesSection(); plist(); trace();
applyTheme(getTheme());
const h = location.hash.slice(1); if (META[h]) openPlayer(h);
