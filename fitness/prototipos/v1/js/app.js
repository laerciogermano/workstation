/* Fitness · protótipo v1 — estado, navegação, galeria e player (mesma arquitetura do notinhas v2.0) */
'use strict';

const clone = (o) => JSON.parse(JSON.stringify(o));
const PROF0 = { idade: 31, altura: 168, genero: 'f', peso: 72, ativ: 'moderado', obj: 'definicao', mag: 20, ok: false };
const GATES0 = () => ({ hoje: true, dieta: true, treino: true, corpo: true });
const S0 = () => ({
  onboarded: true, gates: GATES0(), unlockAfter: null, newDevice: false, fp: 'fp_7c3b·e41d·a91e', online: true, gps: true, reduced: false, paused: false,
  prof: clone(PROF0), base: clone(PROF0),
  stock: [...STOCK_FULL], pref: {}, fq: '',
  meals: { cafe: 'feito', almoco: 'feito', lanche: null, jantar: null }, extras: [],
  day: 0, done: ['agachamento', 'supino'], sets: { agachamento: 4, supino: 4 }, sessDone: false, pub: true,
  hist: clone(HIST0), photos: clone(PHOTOS0), metric: 'peso', pose: 'frente', cmpA: 0, cmpB: 3, wipe: 50,
  customMeasures: [], metricIn: { nome: '', un: 'cm', dir: 0 },
  mIn: Object.fromEntries(MEASURES.map((m) => [m.id, HIST0[HIST0.length - 1][m.id]])),
  char: { nick: 'carla.no.ferro', cor: 0, gym: 'forja' }, optIn: true, hideOld: false,
  share: { objetivo: true, streak: true, treinos: true, prs: true, dieta: true, evolucao: false, peso: false, medidas: false, fotos: false },
  nickIn: '', corIn: 1, gymIn: null, posts: [], kudos: [], queue: 0,
  vtab: 'todos', q: '', qobj: 'todos', qgym: false, gq: '', rtab: 'visits', ctab: 'todos',
  sel: { meal: 'almoco', ex: 'agachamento', nick: 'ana.calistenia', gym: 'forja', crown: 'agacha-forja', chal: 'nov-volume' },
  sheet: null, toast: null,
});
let S = S0();

const ORDER = FLOWS.flatMap((f) => f.steps);
const flowOf = (id) => FLOWS.find((f) => f.steps.includes(id));
const SECTION_OF = {
  'F-10': 'hoje', 'F-11': 'hoje', 'F-12': 'hoje',
  'F-20': 'dieta', 'F-21': 'dieta', 'F-22': 'dieta', 'F-23': 'dieta', 'F-24': 'dieta',
  'F-30': 'treino', 'F-31': 'treino', 'F-32': 'treino',
  'F-40': 'corpo', 'F-41': 'corpo', 'F-42': 'corpo', 'F-43': 'corpo',
};
const NEEDS_NET = ['F-51', 'F-52', 'F-53', 'F-55', 'F-56', 'F-70', 'F-71', 'F-72', 'F-73', 'F-74', 'F-75'];
const lockGates = () => { S.gates = { hoje: false, dieta: false, treino: false, corpo: false }; S.onboarded = false; };
const unlock = (sec) => { S.gates[sec] = true; if (sec === 'hoje') S.onboarded = true; };
function gateEntry(sec) {
  if (sec === 'hoje') return 'F-02';
  if (sec === 'dieta') return S.gates.hoje ? 'F-20' : 'F-02';
  if (sec === 'treino') return 'F-07';
  if (sec === 'corpo') return 'F-08';
  return 'F-01';
}
let SHEET_ANIM = false, TOAST_ANIM = false;

/* ---------- render ---------- */
function screenHTML(id, live) {
  VT_USED = new Set(); VT_LIVE = live; let h;
  try { h = SCREENS[id].render(); } catch (e) { console.error(id, e); h = `<div class="body"><p class="hint">Erro em ${id}: ${esc(e.message)}</p></div>`; }
  VT_LIVE = false; return h;
}
const status = () => `<div class="sb"><span class="tnum">9:41</span><span class="isl"></span><span class="sbr">${S.online ? '5G' : ''}<svg viewBox="0 0 26 12" aria-hidden="true"><rect x="1" y="1" width="21" height="10" rx="3" fill="none" stroke="currentColor" opacity=".5"/><rect x="3" y="3" width="15" height="6" rx="1.5" fill="currentColor"/></svg></span></div>`;
function toastHTML() { if (!S.toast) return ''; const a = S.toast.go ? `<button ${go(S.toast.go, S.toast.p)}>${S.toast.label || 'Ver'}</button>` : ''; return `<div class="toast${TOAST_ANIM ? ' anim' : ''}" role="status">${ico('check')}<span>${S.toast.msg}</span>${a}</div>`; }
function frame(id, live) {
  const sh = live ? sheetHTML().replace('class="sheet"', `class="sheet${SHEET_ANIM ? ' anim' : ''}"`) : '';
  return `<div class="phone"><div class="scr${SCREENS[id].dark ? ' is-dark' : ''}">${status()}${screenHTML(id, live)}${sh}${live ? toastHTML() : ''}</div></div>`;
}

/* ---------- player ---------- */
const $ = (s, r = document) => r.querySelector(s);
const player = $('#player'), live = $('#live'), stage = $('#stage');
let cur = null; const hist = []; let toastTimer = null;
function reducedMotion() { return S.reduced || matchMedia('(prefers-reduced-motion: reduce)').matches; }
function swap(fn, dir) {
  document.documentElement.dataset.dir = dir;
  if (document.startViewTransition && !reducedMotion() && player.classList.contains('open')) { const t = document.startViewTransition(fn); [t.ready, t.finished, t.updateCallbackDone].forEach((pr) => pr.catch(() => {})); }
  else fn();
}
function nav(id, p, opt = {}) {
  let dir = opt.dir || 'fwd';
  if (id === 'back') { id = hist.pop() || 'F-10'; dir = 'back'; }
  else {
    if (id === 'F-01' && S.newDevice) id = 'F-62';
    const sec = SECTION_OF[id];
    if (sec && !S.gates[sec] && !opt.raw) {
      S.unlockAfter = sec === 'dieta' && !S.gates.hoje ? 'dieta' : null;
      const entry = gateEntry(sec);
      if (id !== entry) {
        flash({ hoje: 'Antes: sua base metabólica', dieta: S.gates.hoje ? 'Antes: o que tem em casa' : 'Antes: meta e o que tem em casa', treino: 'Antes: peso para o treino', corpo: 'Antes: como medir o corpo' }[sec]);
        id = entry;
      }
    }
    if (NEEDS_NET.includes(id) && !S.online) id = 'F-61';
    if (cur && cur !== id && !opt.replace) hist.push(cur);
  }
  if (p) Object.assign(S.sel, p);
  if (id === 'F-50' && !S.nickIn && !S.char) S.nickIn = '';
  if (id === 'F-40') {
    const last = lastM();
    S.mIn = Object.fromEntries(allMeasures().map((m) => [m.id, m.id === 'peso' && S.prof.peso ? S.prof.peso : (last[m.id] != null ? last[m.id] : (m.un === 'kg' ? S.prof.peso : 0))]));
  }
  if (id === 'F-44') S.metricIn = { nome: '', un: 'cm', dir: 0 };
  S.sheet = null;
  swap(() => { cur = id; paint(); }, dir);
}
function paint() {
  live.innerHTML = frame(cur, true);
  SHEET_ANIM = false; TOAST_ANIM = false;
  document.documentElement.classList.toggle('rm', reducedMotion());
  fit(); notes(); history.replaceState(null, '', '#' + cur);
}
function flash(msg, extra = {}) {
  S.toast = { msg, ...extra }; TOAST_ANIM = true; clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { S.toast = null; const t = $('.toast', live); if (t) { t.classList.add('out'); setTimeout(() => t.remove(), 200); } }, 2800);
}
function fit() {
  if (!player.classList.contains('open')) return;
  const padX = 32, padY = 90;
  const sw = Math.max(0, stage.clientWidth - padX), sh = Math.max(0, stage.clientHeight - padY);
  let raw = Math.min(1, sw > 0 ? sw / 414 : 1, sh > 0 ? sh / 868 : 1);
  if (!(raw > 0)) raw = 1;
  const k = Math.max(0.4, Math.min(1, raw)).toFixed(3);
  live.style.setProperty('--s', k);
  document.documentElement.style.setProperty('--s', k);
}
addEventListener('resize', () => cur && player.classList.contains('open') && fit());
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(() => cur && player.classList.contains('open') && fit()).observe(stage);
}
function notes() {
  const sc = SCREENS[cur], f = flowOf(cur);
  const tags = (arr, cls) => arr.map((x) => `<span class="tg ${cls}">${x}</span>`).join('');
  $('#pnotes-body').innerHTML = `<p class="pn-id">${cur}</p><h3>${sc.name}</h3><p class="pn-flow">${f.n} · ${f.title}</p><div class="tgs">${tags(sc.rf, 'rf')}${tags(sc.rn, 'rn')}</div><p class="pn-txt">${sc.notes}</p>`;
  document.querySelectorAll('#plist a').forEach((a) => a.classList.toggle('on', a.dataset.id === cur));
  const on = document.querySelector('#plist a.on'); if (on) on.scrollIntoView({ block: 'nearest' });
  document.querySelectorAll('[data-scen]').forEach((b) => { const [k, v] = b.dataset.scen.split(':'); b.classList.toggle('on', scenVal(k) === v); });
}
function openPlayer(id) {
  hist.length = 0;
  player.classList.add('open');
  document.body.style.overflow = 'hidden';
  cur = id;
  live.style.setProperty('--s', '1');
  paint();
  const refit = () => fit();
  requestAnimationFrame(() => { refit(); requestAnimationFrame(refit); });
  setTimeout(refit, 50);
  setTimeout(refit, 200);
  try { $('#stage-close').focus({ preventScroll: true }); } catch (e) { /* ignore */ }
}
function closePlayer() { player.classList.remove('open'); document.body.style.overflow = ''; history.replaceState(null, '', location.pathname); }

/* ---------- ações ---------- */
const LIM = { idade: [14, 90], altura: [130, 220], peso: [35, 250] };
function post(p) { if (!S.char || !S.optIn) return false; const item = { id: 'm' + Date.now(), nick: S.char.nick, mine: true, gym: S.char.gym, quando: 'agora', kudos: 0, ...p }; if (!S.online) { S.queue++; return 'fila'; } S.posts.unshift(item); return true; }
const ACTS = {
  gen: (a) => {
    S.pref = {}; const pl = PLAN();
    const goDieta = () => { unlock('dieta'); if (!pl.viable) nav('F-24', null, { replace: true }); else { flash(`Plano gerado · ${n0(pl.tot.kcal)} kcal com ${S.stock.length} ingredientes`); nav('F-21', null, { replace: true }); } };
    goDieta();
  },
  num: (a) => {
    const [k, d] = a.split(':'); const step = +d;
    if (k.startsWith('m.')) { const id = k.slice(2); S.mIn[id] = +((S.mIn[id] || 0) + step).toFixed(1); }
    else { const [lo, hi] = LIM[k]; S.prof[k] = Math.min(hi, Math.max(lo, +(S.prof[k] + step).toFixed(1))); S.prof.ok = false; }
    paint();
  },
  sexo: (a) => { S.prof.genero = a; S.prof.ok = false; paint(); },
  ativ: (a) => { S.prof.ativ = a; paint(); },
  obj: (a) => { S.prof.obj = a; const g = goalOf(a); S.prof.mag = g.def; S.prof.ok = false; paint(); },
  finish: (a) => {
    unlock('hoje'); S.prof.ok = S.prof.ok || !E().extreme; S.base = clone(S.prof);
    flash('Pronto · meta e macros calculadas'); hist.length = 0;
    if (S.unlockAfter === 'dieta') { S.unlockAfter = null; nav('F-20', null, { replace: true }); return; }
    if (S.unlockAfter === 'treino') { S.unlockAfter = null; nav('F-07', null, { replace: true }); return; }
    nav(a || 'F-10', null, { replace: true });
  },
  unlockDieta: () => { unlock('dieta'); flash('Dieta liberada · plano com o seu estoque'); hist.length = 0; nav('F-21', null, { replace: true }); },
  unlockTreino: () => { unlock('treino'); S.base = clone(S.prof); flash('Treino liberado'); hist.length = 0; nav('F-30', null, { replace: true }); },
  unlockCorpo: () => { unlock('corpo'); flash('Corpo liberado · medidas padrão + as suas'); hist.length = 0; nav('F-42', null, { replace: true }); },
  safe: () => { S.prof.mag = E().g.safe; S.sheet = null; paint(); },
  confirm: () => { S.prof.ok = true; S.sheet = null; nav('F-06'); },
  stock: (a) => { S.stock = S.stock.includes(a) ? S.stock.filter((x) => x !== a) : [...S.stock, a]; paint(); },
  pref: (a) => { const [m, c, id] = a.split(':'); S.pref[m] = { ...(S.pref[m] || {}), [c]: id }; paint(); },
  meal: (a) => { const [m, v] = a.split(':'); S.meals[m] = S.meals[m] === v ? null : v; paint(); },
  qmeal: (a) => { S.meals[a] = S.meals[a] === 'feito' ? null : 'feito'; const m = PLAN().meals.find((x) => x.id === a); if (S.meals[a]) flash(`${m.nome} marcado · +${n0(m.tot.kcal)} kcal`); paint(); },
  extra: (a) => { S.extras.push(clone(EXTRAS[+a])); S.sheet = null; flash(`${EXTRAS[+a].nome} somado ao dia`); paint(); },
  rmextra: (a) => { S.extras.splice(+a, 1); paint(); },
  closeday: () => {
    const st = dayStatus(consumed().kcal, E().meta);
    let msg = `Dia fechado · ${STATUS[st][0].toLowerCase()}`;
    if (st === 'cumpriu' && S.share.dieta) { const r = post({ tipo: 'dieta', tit: 'Meta da dieta cumprida', vals: [['Meta', n0(E().meta) + ' kcal'], ['Proteína', n0(consumed().p) + ' g']] }); if (r === true) msg += ' · na vitrine'; }
    flash(msg); nav('F-10');
  },
  day: (a) => { S.day = +a; paint(); },
  ex: (a) => { const on = S.done.includes(a); S.done = on ? S.done.filter((x) => x !== a) : [...S.done, a]; S.sets[a] = on ? 0 : EXS[a].series; if (!on) flash(`${EXS[a].nome} · +${exKcal(EXS[a], S.prof.peso)} kcal`); paint(); },
  set: (a) => { const [id, n] = a.split(':'); S.sets[id] = (S.sets[id] || 0) >= +n ? +n - 1 : +n; const full = S.sets[id] >= EXS[id].series; if (full && !S.done.includes(id)) { S.done.push(id); flash('Exercício concluído'); } if (!full) S.done = S.done.filter((x) => x !== id); paint(); },
  pause: () => { S.paused = !S.paused; paint(); },
  finishsess: () => {
    const t = train(); S.sessDone = true; let msg = 'Sessão salva · ' + n0(t.kcal) + ' kcal no balanço';
    if (S.pub && S.char && S.optIn) { const r = post({ tipo: 'treino', tit: t.s.nome, vals: [['Duração', t.min + ' min'], ['Gasto', n0(t.kcal) + ' kcal'], ...(t.vol ? [['Volume', n0(t.vol) + ' kg']] : [])], pr: t.pr ? 'Agachamento · 50 kg' : null }); msg = r === 'fila' ? 'Sessão salva · publicação na fila' : 'Publicado na vitrine'; if (r === true) { flash(msg, { go: 'F-51', label: 'Ver' }); nav('F-10', null, { replace: true }); return; } }
    flash(msg); nav('F-10', null, { replace: true });
  },
  savem: () => {
    const rec = { d: TODAY, ...S.mIn }; const i = S.hist.findIndex((x) => x.d === TODAY); if (i >= 0) S.hist[i] = rec; else S.hist.push(rec);
    const old = E().meta; if (S.mIn.peso != null) { S.prof.peso = S.mIn.peso; S.base = clone(S.prof); }
    const nw = E().meta;
    if (S.share.evolucao || S.share.medidas) post({ tipo: 'medida', tit: 'Avaliação registrada', vals: [['Cintura', sgn((S.mIn.cintura || 0) - (S.hist[0].cintura || 0)) + ' cm'], ['Registros', S.hist.length + '']] });
    unlock('corpo');
    flash(old !== nw ? `Avaliação salva · meta recalculada ${n0(old)} → ${n0(nw)} kcal` : 'Avaliação salva'); S.metric = S.mIn.cintura != null ? 'cintura' : (allMeasures()[0] || MEASURES[0]).id; nav('F-42', null, { replace: true });
  },
  shot: () => { const w = +(S.photos[S.photos.length - 1].w - 0.01).toFixed(2); const i = S.photos.findIndex((p) => p.d === TODAY); if (i < 0) S.photos.push({ d: TODAY, w }); S.cmpB = S.photos.length - 1; unlock('corpo'); const vf = $('.vf', live); if (vf) vf.classList.add('hit'); setTimeout(() => { flash('Foto salva na timeline · só neste aparelho'); nav('F-42', null, { replace: true }); }, reducedMotion() ? 0 : 380); },
  pose: (a) => { S.pose = a; paint(); },
  metric: (a) => { S.metric = a; paint(); },
  metricUn: (a) => { S.metricIn.un = a; paint(); },
  metricDir: (a) => { S.metricIn.dir = +a; paint(); },
  metricPreset: (a) => {
    const p = MEASURE_PRESETS.find((x) => x.id === a); if (!p) return;
    if (allMeasures().some((m) => m.id === p.id)) { flash('Essa métrica já está na lista'); return; }
    S.customMeasures.push({ ...p, custom: true });
    S.hist.forEach((h) => { if (h[p.id] == null) h[p.id] = p.un === '%' ? 20 : p.un === 'mil' ? 8 : 30; });
    S.metric = p.id; S.sheet = null; unlock('corpo'); flash(`${p.nome} adicionada`); nav('F-40', null, { replace: true });
  },
  addMetric: () => {
    const nome = (S.metricIn.nome || '').trim(); if (nome.length < 2) { flash('Dê um nome à métrica'); return; }
    const id = 'c_' + nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24);
    if (!id || allMeasures().some((m) => m.id === id || m.nome.toLowerCase() === nome.toLowerCase())) { flash('Já existe uma métrica com esse nome'); return; }
    const m = { id, nome, un: S.metricIn.un || 'cm', dir: S.metricIn.dir || 0, custom: true, onde: 'Sua métrica' };
    S.customMeasures.push(m);
    S.hist.forEach((h) => { if (h[id] == null) h[id] = 0; });
    S.metric = id; unlock('corpo'); flash(`${nome} adicionada · registre o valor`); nav('F-40', null, { replace: true });
  },
  cmpA: (a) => { S.cmpA = +a; paint(); },
  cmpB: (a) => { S.cmpB = +a; if (cur === 'F-42') nav('F-43'); else paint(); },
  cor: (a) => { S.corIn = +a; paint(); },
  gymIn: (a) => { S.gymIn = S.gymIn === a ? null : a; paint(); },
  mkchar: () => { S.char = { nick: S.nickIn, cor: S.corIn, gym: S.gymIn }; S.nickIn = ''; flash(S.optIn ? 'Personagem criado · vitrine ligada' : 'Personagem criado · vitrine privada'); nav('F-51', null, { replace: true }); },
  rmchar: () => { S.char = null; S.posts = []; flash('Personagem apagado · dados privados continuam aqui'); nav('F-51', null, { replace: true }); },
  share: (a) => { S.share[a] = !S.share[a]; paint(); },
  hideold: () => { S.hideOld = !S.hideOld; if (S.hideOld) { S._hidden = S.posts; S.posts = []; } else if (S._hidden) { S.posts = S._hidden; } paint(); },
  kudo: (a) => { S.kudos = S.kudos.includes(a) ? S.kudos.filter((x) => x !== a) : [...S.kudos, a]; paint(); },
  vtab: (a) => { S.vtab = a; paint(); },
  rtab: (a) => { S.rtab = a; paint(); },
  ctab: (a) => { S.ctab = a; paint(); },
  joinchal: (a) => { const c = chalOf(a); flash(c ? `Participando · ${c.nome}` : 'Desafio'); paint(); },
  qobj: (a) => { S.qobj = a; paint(); },
  qgym: () => { S.qgym = !S.qgym; paint(); },
  gq: (a) => { S.gq = S.gq === a ? '' : a; paint(); },
  gymlink: (a) => { if (!S.char) return; S.char.gym = S.char.gym === a ? null : a; flash(S.char.gym ? `Vinculado a ${gymOf(a).nome}` : 'Vínculo removido'); paint(); },
  apply: () => { if (E().extreme && !S.prof.ok) { S.sheet = 'extreme'; SHEET_ANIM = true; paint(); return; } S.base = clone(S.prof); S.pref = {}; flash(`Recalculado · meta ${n0(E().meta)} kcal e plano novo`, { go: 'F-21', label: 'Ver dieta' }); paint(); },
  reonb: () => { lockGates(); nav('F-02'); },
  fresh: () => { const keep = { online: S.online, gps: S.gps, reduced: S.reduced }; S = Object.assign(S0(), keep, { onboarded: false, gates: { hoje: false, dieta: false, treino: false, corpo: false }, newDevice: false, fp: 'fp_0d92·77ab·c310', char: null, posts: [], meals: { cafe: null, almoco: null, lanche: null, jantar: null }, done: [], sets: {}, customMeasures: [] }); hist.length = 0; nav('F-02', null, { replace: true }); },
  wipe: () => { const keep = { online: S.online, gps: S.gps, reduced: S.reduced }; S = Object.assign(S0(), keep, { onboarded: false, gates: { hoje: false, dieta: false, treino: false, corpo: false }, char: null, posts: [], meals: { cafe: null, almoco: null, lanche: null, jantar: null }, done: [], sets: {}, customMeasures: [] }); hist.length = 0; flash('Dados apagados deste aparelho'); nav('F-01', null, { replace: true }); },
  retry: () => { if (S.online) { if (S.queue) { flash(`${S.queue} publicação enviada`); S.queue = 0; } nav('F-51', null, { replace: true }); } else flash('Ainda sem internet'); },
  gps: () => { S.gps = true; paint(); },
  sheet: (a) => { S.sheet = a; SHEET_ANIM = true; paint(); },
  'sheet-close': () => { const sh = $('.sheet', live), sc = $('.scrim', live); if (sh) { sh.classList.add('out'); sc.classList.add('out'); } setTimeout(() => { S.sheet = null; paint(); }, reducedMotion() ? 0 : 200); },
};
const TOGGLES = { optin: 'optIn', pub: 'pub' };

live.addEventListener('click', (e) => {
  const a = e.target.closest('[data-act]');
  if (a && !a.disabled) {
    e.preventDefault(); const name = a.dataset.act;
    if (TOGGLES[name]) { const k = TOGGLES[name]; S[k] = !S[k]; a.classList.toggle('on', S[k]); a.setAttribute('aria-checked', S[k]); setTimeout(paint, reducedMotion() ? 0 : 220); return; }
    if (ACTS[name]) ACTS[name](a.dataset.arg);
    return;
  }
  const g = e.target.closest('[data-go]');
  if (g && !g.disabled) { e.preventDefault(); nav(g.dataset.go, g.dataset.p ? JSON.parse(g.dataset.p) : null); }
});
live.addEventListener('input', (e) => {
  const el = e.target, k = el.dataset.input; if (!k) return;
  if (k === 'metricNome') { S.metricIn.nome = el.value; return; }
  if (k === 'mag') {
    S.prof.mag = +el.value; S.prof.ok = false; const en = E();
    el.style.setProperty('--p', ((en.mag - en.g.min) / (en.g.max - en.g.min)) * 100 + '%'); el.classList.toggle('bad', en.extreme);
    $('#magv', live).textContent = en.mag + '%'; $('#metav', live).firstChild.textContent = n0(en.meta); $('#diffv', live).textContent = `${sgn(en.diff, n0)} kcal vs gasto`;
    clearTimeout(el._t); el._t = setTimeout(paint, 400); return;
  }
  if (k === 'wipe') { S.wipe = +el.value; el.closest('.wipe').style.setProperty('--w', S.wipe + '%'); return; }
  if (k === 'nickIn') {
    el.value = el.value.toLowerCase().replace(/\s/g, '.'); S.nickIn = el.value;
    const valid = /^[a-z0-9._]{3,20}$/.test(S.nickIn), taken = CHARS.some((c) => c.nick === S.nickIn), f = el.closest('.fld');
    f.classList.toggle('ok', valid && !taken); f.classList.toggle('bad', !!S.nickIn && (!valid || taken));
    $('#nkh', live).textContent = !S.nickIn ? '3 a 20 letras minúsculas, números, ponto ou _' : taken ? 'Já existe alguém com esse apelido' : valid ? 'Disponível' : 'Use só minúsculas, números, ponto ou _';
    $('#mkchar', live).disabled = !(valid && !taken);
    const av = $('.avpick .av', live); if (av) av.outerHTML = avatar(S.nickIn || 'voce', S.corIn, 'xl');
    return;
  }
  S[k] = el.value;
  if (k === 'fq') $('#stk', live).innerHTML = stockList(FOODS.filter((f) => !S.fq.trim() || f.nome.toLowerCase().includes(S.fq.trim().toLowerCase())));
  if (k === 'q') $('#res', live).innerHTML = searchResults();
  if (k === 'gq') $('#gres', live).innerHTML = gymList(GYMS.filter((g) => !S.gq.trim() || (g.nome + ' ' + g.bairro).toLowerCase().includes(S.gq.trim().toLowerCase())).sort((a, b) => a.km - b.km));
});

/* ---------- cenários ---------- */
function scenVal(k) {
  if (k === 'first') return String(!S.gates.hoje);
  if (k === 'stock') return S.stock.length <= STOCK_POOR.length ? 'pobre' : 'cheio';
  if (k === 'char') return S.char ? 'com' : 'sem';
  if (k === 'goal') return S.prof.obj;
  return String(S[k]);
}
document.querySelectorAll('[data-scen]').forEach((b) => b.addEventListener('click', () => {
  const [k, v] = b.dataset.scen.split(':');
  if (k === 'first') {
    if (v === 'true') { lockGates(); S.newDevice = false; nav('F-01', null, { replace: true }); return; }
    S.gates = GATES0(); S.onboarded = true;
  }
  else if (k === 'newDevice') { S.newDevice = v === 'true'; if (S.newDevice) { lockGates(); S.fp = 'fp_0d92·77ab·c310'; nav('F-62', null, { replace: true }); return; } S.fp = 'fp_7c3b·e41d·a91e'; }
  else if (k === 'stock') { S.stock = v === 'pobre' ? [...STOCK_POOR] : [...STOCK_FULL]; S.pref = {}; }
  else if (k === 'char') { S.char = v === 'com' ? { nick: 'carla.no.ferro', cor: 0, gym: 'forja' } : null; if (!S.char) S.posts = []; }
  else if (k === 'goal') { S.prof.obj = v; S.prof.mag = goalOf(v).def; if (v === 'hipertrofia') Object.assign(S.prof, { genero: 'm', idade: 28, altura: 178, peso: 80 }); else Object.assign(S.prof, { genero: PROF0.genero, idade: PROF0.idade, altura: PROF0.altura, peso: PROF0.peso }); S.base = clone(S.prof); }
  else S[k] = v === 'true' ? true : v === 'false' ? false : v;
  if (k === 'online' && v === 'false' && NEEDS_NET.includes(cur)) { nav('F-61', null, { replace: true }); return; }
  if (k === 'online' && v === 'true' && cur === 'F-61') { ACTS.retry(); return; }
  paint();
}));
$('#scen-reset').addEventListener('click', () => { S = S0(); hist.length = 0; nav('F-10', null, { replace: true }); });

/* ---------- player chrome ---------- */
const plist = $('#plist');
FLOWS.forEach((f) => { plist.insertAdjacentHTML('beforeend', `<h4>${f.n} · ${f.title}</h4>`); f.steps.forEach((id) => plist.insertAdjacentHTML('beforeend', `<a data-id="${id}" href="#${id}"><span>${id}</span>${SCREENS[id].name}</a>`)); });
plist.addEventListener('click', (e) => { const a = e.target.closest('a[data-id]'); if (a) { e.preventDefault(); nav(a.dataset.id, null, { raw: true }); } });
$('#stage-close').addEventListener('click', closePlayer);
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
  else if (e.key.toLowerCase() === 't') { const i = THEMES.findIndex((t) => t.id === document.documentElement.dataset.theme); applyTheme(THEMES[(i + 1) % THEMES.length].id, true); }
});

/* ---------- galeria + rastreabilidade ---------- */
const ALL_RF = Array.from({ length: 57 }, (_, i) => 'RF-' + String(i + 1).padStart(2, '0'));
const ALL_RN = ['RN-01', 'RN-01b', ...Array.from({ length: 23 }, (_, i) => 'RN-' + String(i + 2).padStart(2, '0'))];
function buildGallery() {
  const gal = $('#gallery'), nv = $('#flownav');
  FLOWS.forEach((f) => {
    nv.insertAdjacentHTML('beforeend', `<a href="#${f.id}"><b>${f.n}</b>${f.title}</a>`);
    const steps = f.steps.map((id, i) => { const sc = SCREENS[id];
      return `${i ? '<span class="arrow" aria-hidden="true"><svg viewBox="0 0 36 12"><path d="M0 6h32M27 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></span>' : ''}
      <figure class="step"><div class="mini" data-open="${id}" role="button" tabindex="0" aria-label="Abrir ${id} ${sc.name}"><div inert>${frame(id, false)}</div></div>
      <figcaption><span class="slabel"><span class="sid">${id}</span><span class="sname">${sc.name}</span></span><span class="sus">${[...sc.rf, ...sc.rn].join(' · ')}</span></figcaption></figure>`; }).join('');
    gal.insertAdjacentHTML('beforeend', `<section class="flow" id="${f.id}"><div class="fhead"><span class="fnum">${f.n}</span><h2>${f.title}</h2><p>${f.desc}</p></div><div class="strip">${steps}</div></section>`);
  });
  gal.addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) openPlayer(b.dataset.open); });
  gal.addEventListener('keydown', (e) => { const b = e.target.closest('[data-open]'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openPlayer(b.dataset.open); } });
  const used = (k) => new Set(Object.values(SCREENS).flatMap((s) => s[k]));
  const uRF = used('rf'), uRN = used('rn');
  const cover = (all, u) => all.map((x) => `<span class="cv${u.has(x) ? ' ok' : ''}" title="${x}">${x.replace(/^(RF|RN)-/, '')}</span>`).join('');
  $('#cov-rf').innerHTML = cover(ALL_RF, uRF); $('#cov-rn').innerHTML = cover(ALL_RN, uRN);
  const cRF = ALL_RF.filter((x) => uRF.has(x)).length, cRN = ALL_RN.filter((x) => uRN.has(x)).length;
  $('#cov-rf-n').textContent = `${cRF}/${ALL_RF.length}`; $('#cov-rn-n').textContent = `${cRN}/${ALL_RN.length}`;
  $('#trace tbody').innerHTML = ORDER.map((id) => { const s = SCREENS[id]; return `<tr><td><a href="#${id}" data-open="${id}" class="sid">${id}</a></td><td>${s.name}</td><td>${flowOf(id).n}</td><td>${s.rf.join(', ')}</td><td>${s.rn.join(', ') || '—'}</td></tr>`; }).join('');
  $('#trace').addEventListener('click', (e) => { const a = e.target.closest('[data-open]'); if (a) { e.preventDefault(); openPlayer(a.dataset.open); } });
  $('#st-screens').textContent = ORDER.length; $('#st-flows').textContent = FLOWS.length;
  $('#st-rf').textContent = `${cRF}/${ALL_RF.length}`; $('#st-rn').textContent = `${cRN}/${ALL_RN.length}`;
}
buildGallery();

/* ---------- temas ---------- */
const THEMES = [
  { id: 'cobalto', nome: 'Cobalto', desc: 'Ação em azul-cobalto, verde só para “cumpriu”. Fundo claro neutro — referência “health app” mainstream.', sw: ['#2B4BF2', '#16A34A', '#0E1116', '#F4F5F7'] },
  { id: 'preto', nome: 'Preto', desc: 'Fundo preto puro e cinzas neutros. Ação em cobalto claro, mesma gramática do claro.', sw: ['#5B7BFF', '#34D27F', '#F2F2F2', '#000000'] },
  { id: 'lima', nome: 'Lima sobre preto', tag: 'academia', desc: 'Preto + lima elétrico (Sprint). Progress rings e treino noturno — menos “app de saúde”.', sw: ['#C6F432', '#34D27F', '#F2F2F2', '#000000'] },
  { id: 'pista', nome: 'Pista', tag: 'padrão', desc: 'Escuro + laranja vivo nos CTAs (sem peach, sem mint). Corrida / streak.', sw: ['#FF4D00', '#FF5C14', '#F2F2F2', '#0B0B0B'] },
  { id: 'zona', nome: 'Zona', tag: 'cardio', desc: 'Laranja vivo nos botões + verde neon do Next no “cumpriu” (fonte preta).', sw: ['#FF4D00', '#39FF14', '#F2F2F2', '#0B0B0B'] },
  { id: 'volt', nome: 'Volt', tag: 'energia', desc: 'Preto + amarelo elétrico. Sinal de alerta de academia, PR, “vai”.', sw: ['#FFD400', '#FFE566', '#F2F2F2', '#000000'] },
  { id: 'next', nome: 'Next', tag: 'radical', desc: 'Preto + verde neon ácido (Next Fitness / gym dark). CTA chamativo, contraste máximo.', sw: ['#39FF14', '#7CFF6B', '#F2F2F2', '#000000'] },
  { id: 'esmeralda', nome: 'Esmeralda', tag: 'performance', desc: 'Carvão + verde-água saturado. Academia premium, recovery tech.', sw: ['#00D68F', '#34E0A8', '#E8F5EF', '#070D0B'] },
  { id: 'forja', nome: 'Forja', tag: 'musculação', desc: 'Grafite + azul elétrico (Gym Floor). Força, coaching, piso da academia.', sw: ['#2D9CDB', '#34D27F', '#E8EAED', '#121417'] },
  { id: 'giz', nome: 'Giz e tijolo', tag: 'box', desc: 'Papel quente + laranja vivo nos botões (sem verde).', sw: ['#FF4D00', '#FF5C14', '#1C1917', '#F5F1EA'] },
  { id: 'salvia', nome: 'Sálvia', tag: 'recuperação', desc: 'Verde sálvia e fundo frio (Flow / yoga). Mobilidade, descanso, mind-body.', sw: ['#4F7A5A', '#15803D', '#1F2A22', '#F2F6F3'] },
  { id: 'musgo', nome: 'Musgo', tag: 'outdoor', desc: 'Oliva militar em papel claro. Trilha, calistenia no parque, less-tech.', sw: ['#556B2F', '#4D7C0F', '#1A2114', '#F3F1E8'] },
  { id: 'neon', nome: 'Neon dia', tag: 'energia', desc: 'Claro com magenta vivo (Nike Run Club / mainstream). Motivação em fundo branco.', sw: ['#E11D48', '#16A34A', '#0E1116', '#FAFAFA'] },
];
const TSCREENS = [['F-10', 'Hoje'], ['F-21', 'Dieta'], ['F-30', 'Treino'], ['F-42', 'Corpo'], ['F-51', 'Vitrine'], ['F-05', 'Base']];
let tScreen = ['F-10', 'F-51'];
function getTheme() { try { return localStorage.getItem('ft-theme') || 'pista'; } catch (e) { return 'pista'; } }
function applyTheme(id, animate) {
  const root = document.documentElement;
  if (animate && root.dataset.theme !== id && document.startViewTransition && !reducedMotion()) { root.dataset.vt = 'theme'; const t = document.startViewTransition(() => applyTheme(id)); [t.ready, t.updateCallbackDone].forEach((pr) => pr.catch(() => {})); t.finished.catch(() => {}).finally(() => { delete root.dataset.vt; }); return; }
  root.dataset.theme = id; try { localStorage.setItem('ft-theme', id); } catch (e) { /* sem storage */ }
  document.querySelectorAll('[data-theme-pick]').forEach((b) => { b.classList.toggle('on', b.dataset.themePick === id); if (b.getAttribute('role') === 'radio') b.setAttribute('aria-checked', b.dataset.themePick === id); });
  document.querySelectorAll('.tcard').forEach((c) => c.classList.toggle('on', c.dataset.theme === id));
}
function renderThemes() {
  $('#tscreens').innerHTML = TSCREENS.map(([id, l]) => `<button class="${tScreen.includes(id) ? 'on' : ''}" data-tscreen="${id}">${l}</button>`).join('');
  $('#themes').innerHTML = THEMES.map((t) => `<article class="tcard" data-theme="${t.id}"><header><h3>${t.nome}</h3>${t.tag ? `<span>${t.tag}</span>` : ''}</header>
    <div class="tsw">${['ação', 'cumpriu', 'texto', 'fundo'].map((l, i) => `<i style="background:${t.sw[i]}" data-l="${l}"></i>`).join('')}</div><p>${t.desc}</p>
    <div class="tminis">${tScreen.map((id) => `<div class="mini" role="button" tabindex="0" data-open="${id}" data-open-theme="${t.id}" aria-label="Abrir ${id} no tema ${t.nome}"><div inert>${frame(id, false)}</div></div>`).join('')}</div>
    <button class="sbtn p" data-theme-pick="${t.id}">Usar este tema</button></article>`).join('');
  applyTheme(document.documentElement.dataset.theme || getTheme());
}
$('#tscreens').addEventListener('click', (e) => { const b = e.target.closest('[data-tscreen]'); if (!b) return; const id = b.dataset.tscreen; tScreen = tScreen.includes(id) ? (tScreen.length > 1 ? tScreen.filter((x) => x !== id) : tScreen) : [...tScreen, id].slice(-2); renderThemes(); });
$('#themes').addEventListener('click', (e) => { const pick = e.target.closest('[data-theme-pick]'); if (pick) { applyTheme(pick.dataset.themePick); return; } const m = e.target.closest('[data-open]'); if (m) { applyTheme(m.dataset.openTheme); openPlayer(m.dataset.open); } });
const stbar = $('#stage-themes'), themebar = $('#themebar'), scenTheme = $('#scen-theme');
THEMES.forEach((t) => {
  const dot = `<i style="background:linear-gradient(135deg, ${t.sw[3]} 0 50%, ${t.sw[0]} 50% 100%)"></i>`;
  stbar.insertAdjacentHTML('beforeend', `<button role="radio" data-theme-pick="${t.id}" title="${t.nome}" aria-label="${t.nome}">${dot}</button>`);
  themebar.insertAdjacentHTML('beforeend', `<button data-theme-pick="${t.id}">${dot}${t.nome}</button>`);
  scenTheme.insertAdjacentHTML('beforeend', `<button data-theme-pick="${t.id}">${t.nome}</button>`);
});
[stbar, themebar, scenTheme].forEach((el) => el.addEventListener('click', (e) => { const b = e.target.closest('[data-theme-pick]'); if (b) applyTheme(b.dataset.themePick, true); }));
renderThemes();

document.querySelectorAll('[data-start]').forEach((b) => b.addEventListener('click', () => { if (b.dataset.start === 'F-01') lockGates(); openPlayer(b.dataset.start); }));
const h = location.hash.slice(1); if (SCREENS[h]) openPlayer(h);
