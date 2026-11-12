/* Fitness · protótipo v1 — dados de exemplo, cálculos e fluxos
   Cálculos reais: Mifflin–St Jeor (RF-11), fator de atividade (RF-12), objetivo → estratégia (RN-04..06),
   macros (RF-15), projeção (RF-16), plano por estoque (RF-18/19), MET por exercício (RF-27). */
'use strict';

const TODAY = '2026-11-08';
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/* ---------- energia ---------- */
const ACTIVITY = [
  { id: 'sedentario', nome: 'Sedentário', desc: 'Trabalho sentado, quase sem exercício', f: 1.2 },
  { id: 'leve', nome: 'Leve', desc: 'Caminhadas ou treino 1–2× por semana', f: 1.375 },
  { id: 'moderado', nome: 'Moderado', desc: 'Treino 3–5× por semana', f: 1.55 },
  { id: 'alto', nome: 'Alto', desc: 'Treino pesado 6–7× por semana', f: 1.725 },
  { id: 'atleta', nome: 'Muito alto', desc: 'Dois treinos por dia ou trabalho físico', f: 1.9 },
];
const GOALS = [
  { id: 'hipertrofia', nome: 'Ganhar músculo', sub: 'hipertrofia', strat: 'superavit', def: 10, min: 5, max: 20, safe: 15, prot: 2.0, ico: 'dumbbell' },
  { id: 'definicao', nome: 'Perder gordura', sub: 'definição', strat: 'deficit', def: 20, min: 10, max: 30, safe: 25, prot: 2.2, ico: 'flame' },
  { id: 'recomp', nome: 'Recomposição', sub: 'trocar gordura por músculo', strat: 'deficit', def: 10, min: 5, max: 15, safe: 15, prot: 2.2, ico: 'refresh' },
  { id: 'manutencao', nome: 'Manter', sub: 'saúde e constância', strat: 'manutencao', def: 0, min: 0, max: 0, safe: 0, prot: 1.6, ico: 'scale' },
];
const STRAT = { deficit: 'Déficit', superavit: 'Superávit', manutencao: 'Manutenção' };
const goalOf = (id) => GOALS.find((g) => g.id === id);
const actOf = (id) => ACTIVITY.find((a) => a.id === id);

function tmbOf(p) { return Math.round(10 * p.peso + 6.25 * p.altura - 5 * p.idade + (p.genero === 'm' ? 5 : -161)); }
function energy(p) {
  const g = goalOf(p.obj), tmb = tmbOf(p), tdee = Math.round(tmb * actOf(p.ativ).f);
  const mag = g.strat === 'manutencao' ? 0 : p.mag;
  const sign = g.strat === 'deficit' ? -1 : g.strat === 'superavit' ? 1 : 0;
  const meta = Math.round((tdee * (1 + (sign * mag) / 100)) / 10) * 10;
  const protG = Math.round(g.prot * p.peso), fatG = Math.round(Math.max(0.6, g.strat === 'superavit' ? 1 : 0.9) * p.peso);
  const carbG = Math.max(0, Math.round((meta - protG * 4 - fatG * 9) / 4));
  const extreme = mag > g.safe || meta < tmb;
  return { tmb, tdee, meta, g, strat: g.strat, mag, sign, prot: protG, fat: fatG, carb: carbG, extreme, diff: meta - tdee };
}
/* projeção semanal com TMB recalculada a cada semana (RN-09: premissas visíveis) */
function projection(p, weeks = 12, adesao = 0.85) {
  const e = energy(p); const out = [{ w: 0, kg: p.peso }];
  let kg = p.peso;
  for (let w = 1; w <= weeks; w++) {
    const pp = { ...p, peso: kg }, ee = energy(pp);
    let dKg = ((ee.meta - ee.tdee) * 7 * adesao) / 7700;
    if (e.strat === 'superavit') dKg = Math.min(dKg, 0.35); /* ganho de massa magra é lento */
    if (e.strat === 'manutencao') dKg = 0;
    kg = +(kg + dKg).toFixed(2); out.push({ w, kg });
  }
  return out;
}

/* ---------- alimentos (por 100 g; un = g por unidade) ---------- */
const FOODS = [
  { id: 'ovo', nome: 'Ovo', cat: 'prot', kcal: 143, p: 13, c: 1.1, g: 9.5, un: 50, unl: 'ovo' },
  { id: 'frango', nome: 'Peito de frango', cat: 'prot', kcal: 165, p: 31, c: 0, g: 3.6 },
  { id: 'patinho', nome: 'Patinho moído', cat: 'prot', kcal: 219, p: 35.9, c: 0, g: 7.3 },
  { id: 'tilapia', nome: 'Tilápia', cat: 'prot', kcal: 128, p: 26, c: 0, g: 2.7 },
  { id: 'iogurte', nome: 'Iogurte natural', cat: 'prot', kcal: 51, p: 4.1, c: 1.9, g: 3 },
  { id: 'queijo', nome: 'Queijo minas frescal', cat: 'prot', kcal: 264, p: 17.4, c: 3.2, g: 20.2 },
  { id: 'whey', nome: 'Whey protein', cat: 'prot', kcal: 400, p: 80, c: 8, g: 6, un: 30, unl: 'scoop' },
  { id: 'arroz', nome: 'Arroz branco cozido', cat: 'carb', kcal: 128, p: 2.5, c: 28.1, g: 0.2 },
  { id: 'feijao', nome: 'Feijão carioca cozido', cat: 'carb', kcal: 76, p: 4.8, c: 13.6, g: 0.5 },
  { id: 'batata', nome: 'Batata-doce cozida', cat: 'carb', kcal: 77, p: 0.6, c: 18.4, g: 0.1 },
  { id: 'aveia', nome: 'Aveia em flocos', cat: 'carb', kcal: 394, p: 13.9, c: 66.6, g: 8.5 },
  { id: 'pao', nome: 'Pão integral', cat: 'carb', kcal: 253, p: 9.4, c: 49.9, g: 3.7, un: 25, unl: 'fatia' },
  { id: 'banana', nome: 'Banana', cat: 'carb', kcal: 98, p: 1.3, c: 26, g: 0.1, un: 70, unl: 'banana' },
  { id: 'azeite', nome: 'Azeite', cat: 'fat', kcal: 884, p: 0, c: 0, g: 100 },
  { id: 'amendoim', nome: 'Pasta de amendoim', cat: 'fat', kcal: 588, p: 25, c: 20, g: 50 },
  { id: 'brocolis', nome: 'Brócolis', cat: 'veg', kcal: 25, p: 2.1, c: 4.4, g: 0.5 },
  { id: 'salada', nome: 'Folhas e tomate', cat: 'veg', kcal: 18, p: 1, c: 3.2, g: 0.2 },
];
const FCATS = [{ id: 'prot', nome: 'Proteínas' }, { id: 'carb', nome: 'Carboidratos' }, { id: 'fat', nome: 'Gorduras' }, { id: 'veg', nome: 'Vegetais' }];
const food = (id) => FOODS.find((f) => f.id === id);
const STOCK_FULL = ['ovo', 'frango', 'patinho', 'iogurte', 'arroz', 'feijao', 'batata', 'aveia', 'pao', 'banana', 'azeite', 'amendoim', 'brocolis', 'salada'];
const STOCK_POOR = ['arroz', 'banana', 'azeite'];

/* refeições: fatia da meta + preferência de fontes */
const MEALS = [
  { id: 'cafe', nome: 'Café da manhã', hora: '07:30', share: 0.25, prot: ['ovo', 'iogurte', 'queijo', 'whey'], carb: ['pao', 'aveia', 'banana'], fat: ['amendoim'], fatG: 10, veg: [] },
  { id: 'almoco', nome: 'Almoço', hora: '12:30', share: 0.35, prot: ['frango', 'patinho', 'tilapia', 'ovo'], carb: ['arroz', 'batata'], beans: true, fat: ['azeite'], fatG: 8, veg: ['salada', 'brocolis'] },
  { id: 'lanche', nome: 'Lanche', hora: '16:00', share: 0.15, prot: ['iogurte', 'whey', 'ovo', 'queijo'], carb: ['banana', 'aveia', 'pao'], fat: [], fatG: 0, veg: [] },
  { id: 'jantar', nome: 'Jantar', hora: '20:00', share: 0.25, prot: ['tilapia', 'frango', 'patinho', 'ovo'], carb: ['batata', 'arroz'], fat: ['azeite'], fatG: 6, veg: ['brocolis', 'salada'] },
];
const nut = (f, gr) => ({ kcal: (f.kcal * gr) / 100, p: (f.p * gr) / 100, c: (f.c * gr) / 100, g: (f.g * gr) / 100 });
const sum = (arr) => arr.reduce((a, x) => ({ kcal: a.kcal + x.kcal, p: a.p + x.p, c: a.c + x.c, g: a.g + x.g }), { kcal: 0, p: 0, c: 0, g: 0 });
const CAP = { ovo: 150, iogurte: 200, queijo: 60, whey: 30, frango: 200, patinho: 180, tilapia: 200 };
function roundG(f, gr) { if (f.un) { const n = Math.max(1, Math.round(gr / f.un)); return n * f.un; } return Math.max(0, Math.round(gr / 5) * 5); }

/* RF-18/19 · RN-10: só usa o que está no estoque; avisa quando não fecha */
function buildPlan(stock, e, pref = {}) {
  const has = (id) => stock.includes(id);
  const pick = (mid, cat, ids) => { const pr = (pref[mid] || {})[cat]; return pr && has(pr) ? pr : ids.find(has); };
  const missing = new Set(); const meals = [];
  MEALS.forEach((m) => {
    const tk = e.meta * m.share, tp = e.prot * m.share; const items = [];
    const pid = pick(m.id, 'prot', m.prot);
    if (pid) {
      const f = food(pid); const want = (tp * 0.9 * 100) / f.p; const gr = roundG(f, Math.min(want, CAP[pid] || 999));
      items.push({ id: pid, gr });
      const rest = tp * 0.9 - (f.p * gr) / 100; const p2 = rest > 8 && m.prot.find((id) => id !== pid && has(id));
      if (p2) { const f2 = food(p2); items.push({ id: p2, gr: roundG(f2, Math.min((rest * 100) / f2.p, CAP[p2] || 999)) }); }
    } else missing.add('prot');
    const fid = pick(m.id, 'fat', m.fat); if (fid && m.fatG) items.push({ id: fid, gr: m.fatG });
    const vid = pick(m.id, 'veg', m.veg); if (vid) items.push({ id: vid, gr: 100 });
    const cid = pick(m.id, 'carb', m.carb);
    if (cid) {
      const used = sum(items.map((i) => nut(food(i.id), i.gr))).kcal; let rem = Math.max(0, tk - used);
      if (m.beans && has('feijao')) { const fb = food('feijao'); const gb = roundG(fb, (rem * 0.35 * 100) / fb.kcal); items.push({ id: 'feijao', gr: gb }); rem -= nut(fb, gb).kcal; }
      const fc = food(cid); items.push({ id: cid, gr: roundG(fc, (Math.max(0, rem) * 100) / fc.kcal) });
    } else missing.add('carb');
    const tot = sum(items.map((i) => nut(food(i.id), i.gr)));
    meals.push({ ...m, items, tot, alvo: Math.round(tk) });
  });
  const tot = sum(meals.map((m) => m.tot));
  const gap = { kcal: tot.kcal / e.meta, p: tot.p / e.prot };
  const viable = !missing.size && gap.kcal > 0.9 && gap.kcal < 1.1 && gap.p > 0.85;
  return { meals, tot, missing: [...missing], viable, gap };
}

/* ---------- treino ---------- */
const EXS = {
  supino: { nome: 'Supino reto com barra', mod: 'musc', anim: 'bench', grupo: 'Peito · tríceps · ombro anterior', met: 6, series: 4, reps: 8, kg: 40,
    desc: 'Deitado no banco, desça a barra controlando até tocar o meio do peito e empurre até estender os cotovelos.', dicas: ['Escápulas encaixadas e pés firmes no chão', 'Cotovelos a ~45° do tronco, não abertos a 90°', 'Desça em 2 s, suba em 1 s'] },
  remada: { nome: 'Remada curvada', mod: 'musc', anim: 'row', grupo: 'Costas · bíceps · posterior de ombro', met: 6, series: 4, reps: 10, kg: 30,
    desc: 'Tronco inclinado a ~45°, coluna neutra; puxe a barra até o umbigo levando os cotovelos para trás.', dicas: ['Joelhos levemente flexionados', 'Sem balançar o tronco para ganhar impulso', 'Aperte as escápulas no topo'] },
  agachamento: { nome: 'Agachamento livre com barra', mod: 'musc', anim: 'squat', grupo: 'Quadríceps · glúteos · core', met: 6, series: 4, reps: 8, kg: 50, pr: true,
    desc: 'Barra apoiada no trapézio, desça como se fosse sentar até a coxa ficar paralela ao chão e suba empurrando o chão.', dicas: ['Joelhos acompanham a ponta dos pés', 'Calcanhar sempre no chão', 'Peito aberto, olhar à frente'] },
  desenvolvimento: { nome: 'Desenvolvimento com halteres', mod: 'musc', anim: 'press', grupo: 'Ombros · tríceps', met: 5, series: 3, reps: 10, kg: 12,
    desc: 'Em pé ou sentado, empurre os halteres da altura dos ombros até acima da cabeça sem arquear a lombar.', dicas: ['Abdômen contraído', 'Não bata os halteres no topo', 'Desça até a linha do queixo'] },
  prancha: { nome: 'Prancha', mod: 'cali', anim: 'plank', grupo: 'Core · ombros', met: 3.8, series: 3, seg: 40,
    desc: 'Apoio nos antebraços e pontas dos pés, corpo em linha reta da cabeça aos calcanhares.', dicas: ['Quadril nem alto nem caído', 'Respire curto e contínuo', 'Contraia glúteos'] },
  barra: { nome: 'Barra fixa', mod: 'cali', anim: 'pullup', grupo: 'Dorsais · bíceps · antebraço', met: 8, series: 4, reps: 6, kg: 0,
    desc: 'Pegada pronada um pouco mais larga que os ombros; puxe até o queixo passar a barra e desça até estender os braços.', dicas: ['Comece com escápulas deprimidas', 'Sem chutar as pernas', 'Desça em 2 s'] },
  flexao: { nome: 'Flexão de braço', mod: 'cali', anim: 'pushup', grupo: 'Peito · tríceps · core', met: 8, series: 4, reps: 12, kg: 0,
    desc: 'Mãos na linha dos ombros, corpo em prancha; desça até o peito quase tocar o chão e empurre.', dicas: ['Cotovelos a ~45°', 'Quadril alinhado com o tronco', 'Amplitude completa'] },
  agachar: { nome: 'Agachamento livre', mod: 'cali', anim: 'squat', grupo: 'Quadríceps · glúteos', met: 5, series: 4, reps: 15, kg: 0, nobar: true,
    desc: 'Pés na largura dos ombros, desça até a coxa paralela e suba sem tirar o calcanhar do chão.', dicas: ['Braços à frente para equilibrar', 'Joelhos para fora', 'Ritmo constante'] },
};
const SESSIONS = {
  A: { id: 'A', nome: 'Treino A · Musculação', mod: 'Musculação', ex: ['agachamento', 'supino', 'remada', 'desenvolvimento', 'prancha'] },
  B: { id: 'B', nome: 'Treino B · Calistenia', mod: 'Calistenia', ex: ['barra', 'flexao', 'agachar', 'prancha'] },
  R: { id: 'R', nome: 'Descanso ativo', mod: 'Descanso', ex: [] },
};
const WEEKPLAN = ['A', 'B', 'R', 'A', 'B', 'R', 'B']; /* Dom..Sáb */
function exMin(x) { return x.seg ? (x.series * (x.seg + 60)) / 60 : (x.series * (x.reps * 3 + 90)) / 60; }
function exKcal(x, kg) { return Math.round((x.met * kg * exMin(x)) / 60); }
function exVol(x) { return x.kg ? x.series * x.reps * x.kg : 0; }
const exSets = (x) => `${x.series} × ${x.seg ? x.seg + ' s' : x.reps}${x.kg ? ' · ' + x.kg + ' kg' : x.nobar ? ' · peso do corpo' : x.seg ? '' : ' · peso do corpo'}`;

/* poses (vista lateral) para a visualização do movimento — RF-26 */
const POSES = {
  squat: [{ head: [100, 30], sh: [100, 46], el: [90, 54], ha: [94, 44], hip: [100, 88], kn: [100, 120], ft: [100, 152] },
          { head: [110, 66], sh: [104, 80], el: [94, 88], ha: [100, 78], hip: [82, 116], kn: [122, 124], ft: [104, 152] }],
  bench: [{ head: [44, 100], sh: [62, 104], el: [62, 84], ha: [62, 62], hip: [116, 104], kn: [140, 104], ft: [140, 150] },
          { head: [44, 100], sh: [62, 104], el: [76, 112], ha: [62, 92], hip: [116, 104], kn: [140, 104], ft: [140, 150] }],
  row:   [{ head: [62, 66], sh: [78, 74], el: [80, 100], ha: [80, 124], hip: [120, 92], kn: [110, 122], ft: [114, 152] },
          { head: [62, 66], sh: [78, 74], el: [104, 80], ha: [90, 102], hip: [120, 92], kn: [110, 122], ft: [114, 152] }],
  press: [{ head: [100, 30], sh: [100, 46], el: [86, 60], ha: [92, 42], hip: [100, 88], kn: [100, 120], ft: [100, 152] },
          { head: [100, 30], sh: [100, 46], el: [96, 26], ha: [104, 8], hip: [100, 88], kn: [100, 120], ft: [100, 152] }],
  plank: [{ head: [42, 118], sh: [56, 126], el: [58, 148], ha: [78, 148], hip: [106, 132], kn: [134, 140], ft: [164, 148] },
          { head: [42, 116], sh: [56, 125], el: [58, 148], ha: [78, 148], hip: [106, 128], kn: [134, 139], ft: [164, 148] }],
  pushup:[{ head: [38, 108], sh: [52, 116], el: [52, 132], ha: [52, 150], hip: [104, 128], kn: [134, 138], ft: [164, 148] },
          { head: [38, 130], sh: [52, 136], el: [70, 130], ha: [52, 150], hip: [104, 140], kn: [134, 144], ft: [164, 148] }],
  pullup:[{ head: [106, 44], sh: [100, 58], el: [100, 40], ha: [100, 20], hip: [100, 100], kn: [98, 128], ft: [100, 152] },
          { head: [106, 12], sh: [100, 32], el: [86, 40], ha: [100, 20], hip: [100, 76], kn: [98, 104], ft: [100, 128] }],
};

/* ---------- avaliação física ---------- */
const MEASURES = [
  { id: 'peso', nome: 'Peso', un: 'kg', dir: -1 },
  { id: 'cintura', nome: 'Cintura', un: 'cm', dir: -1, onde: 'Na altura do umbigo, relaxado' },
  { id: 'quadril', nome: 'Quadril', un: 'cm', dir: -1, onde: 'Na parte mais larga do glúteo' },
  { id: 'peito', nome: 'Peito', un: 'cm', dir: 0, onde: 'Linha dos mamilos, após expirar' },
  { id: 'braco', nome: 'Braço', un: 'cm', dir: 1, onde: 'Meio do braço, contraído' },
  { id: 'coxa', nome: 'Coxa', un: 'cm', dir: 0, onde: 'Meio da coxa, em pé' },
];
const HIST0 = [
  { d: '2026-08-23', peso: 76.0, cintura: 86.0, quadril: 104.0, peito: 96.0, braco: 29.5, coxa: 60.0 },
  { d: '2026-09-06', peso: 75.1, cintura: 85.0, quadril: 103.2, peito: 95.5, braco: 29.6, coxa: 59.6 },
  { d: '2026-09-20', peso: 74.4, cintura: 83.6, quadril: 102.5, peito: 95.0, braco: 29.8, coxa: 59.0 },
  { d: '2026-10-04', peso: 73.8, cintura: 82.5, quadril: 101.8, peito: 94.6, braco: 29.9, coxa: 58.6 },
  { d: '2026-10-18', peso: 72.9, cintura: 81.4, quadril: 101.0, peito: 94.2, braco: 30.1, coxa: 58.1 },
  { d: '2026-11-01', peso: 72.0, cintura: 80.5, quadril: 100.4, peito: 93.8, braco: 30.2, coxa: 57.8 },
];
const PHOTOS0 = [
  { d: '2026-08-23', w: 1.0 }, { d: '2026-09-20', w: 0.95 }, { d: '2026-10-18', w: 0.9 }, { d: '2026-11-01', w: 0.87 },
];
/* últimos 7 dias antes de hoje: dieta (cumpriu|abaixo|estourou) e treino */
const WEEK0 = [
  { d: '2026-11-01', dieta: 'cumpriu', treino: true, prot: true },
  { d: '2026-11-02', dieta: 'cumpriu', treino: true, prot: false },
  { d: '2026-11-03', dieta: 'estourou', treino: false, prot: true },
  { d: '2026-11-04', dieta: 'cumpriu', treino: true, prot: false },
  { d: '2026-11-05', dieta: 'cumpriu', treino: true, prot: true },
  { d: '2026-11-06', dieta: 'abaixo', treino: false, prot: false },
  { d: '2026-11-07', dieta: 'cumpriu', treino: true, prot: true },
];

/* ---------- social ---------- */
const GYMS = [
  { id: 'forja', nome: 'Forja Fitness', bairro: 'Centro', km: 0.6, mod: ['Musculação', 'Funcional'], hora: '05:00–23:00', x: 46, y: 44, n: 38 },
  { id: 'box41', nome: 'Box 41 Calistenia', bairro: 'São Pedro', km: 1.2, mod: ['Calistenia', 'Mobilidade'], hora: '06:00–22:00', x: 66, y: 30, n: 17 },
  { id: 'studio', nome: 'Studio Pinhais', bairro: 'Cidade Jardim', km: 1.9, mod: ['Funcional', 'Pilates'], hora: '06:00–21:00', x: 24, y: 64, n: 9 },
  { id: 'ponte', nome: 'Academia Ponte Alta', bairro: 'Aristocrata', km: 2.6, mod: ['Musculação', 'Lutas'], hora: '05:30–23:00', x: 78, y: 70, n: 22 },
  { id: 'arena', nome: 'Arena Muscle', bairro: 'Afonso Pena', km: 3.4, mod: ['Musculação', 'Cross'], hora: '24 horas', x: 14, y: 22, n: 41 },
];
const gymOf = (id) => GYMS.find((g) => g.id === id);
const PALETTE = ['#2B4BF2', '#E0457B', '#0EA5A4', '#F59E0B', '#7C3AED', '#16A34A'];
const CHARS = [
  { nick: 'ana.calistenia', cor: 2, gym: 'box41', obj: 'recomp', streak: 21, treinos: 148, prs: ['Barra fixa · 12 reps', 'Flexão · 40 reps'], conq: ['100 treinos', '3 semanas seguidas'], evol: null },
  { nick: 'joao.ovoearroz', cor: 3, gym: 'forja', obj: 'definicao', streak: 9, treinos: 64, prs: ['Supino · 70 kg'], conq: ['Semana limpa', 'Proteína 7/7'], evol: '−6,2 kg em 12 semanas' },
  { nick: 'bruno.medindo', cor: 0, gym: 'studio', obj: 'definicao', streak: 14, treinos: 52, prs: [], conq: ['Medida a cada 14 dias × 6'], evol: '−4 cm de cintura em 8 semanas' },
  { nick: 'dani.agacha', cor: 1, gym: 'arena', obj: 'hipertrofia', streak: 33, treinos: 211, prs: ['Agachamento · 90 kg', 'Terra · 110 kg'], conq: ['200 treinos', 'Volume 1 t em uma sessão'], evol: null },
  { nick: 'marcos.supino', cor: 4, gym: 'forja', obj: 'hipertrofia', streak: 5, treinos: 100, prs: ['Supino · 100 kg'], conq: ['100 treinos'], evol: '+3,1 kg em 16 semanas' },
  { nick: 'lu.recomp', cor: 5, gym: 'ponte', obj: 'recomp', streak: 12, treinos: 77, prs: ['Desenvolvimento · 16 kg'], conq: ['Proteína 7/7'], evol: null },
  { nick: 'tiago.bulking', cor: 0, gym: 'arena', obj: 'hipertrofia', streak: 2, treinos: 18, prs: ['Remada · 50 kg'], conq: ['Primeiro mês'], evol: null },
];
const charOf = (n) => CHARS.find((c) => c.nick === n);
const FEED0 = [
  { id: 'f1', nick: 'ana.calistenia', tipo: 'treino', tit: 'Treino B · Calistenia', vals: [['Duração', '52 min'], ['Gasto', '410 kcal'], ['Streak', '21 dias']], pr: 'Barra fixa · 12 reps', quando: 'há 2 h', kudos: 14 },
  { id: 'f2', nick: 'joao.ovoearroz', tipo: 'dieta', tit: 'Meta da dieta cumprida', vals: [['Sequência', '7 dias'], ['Proteína', '7/7 dias']], conq: 'Desafio “Semana limpa” concluído', quando: 'há 3 h', kudos: 9 },
  { id: 'f3', nick: 'bruno.medindo', tipo: 'medida', tit: 'Avaliação registrada', vals: [['Cintura', '−4 cm em 8 sem.'], ['Registros', '6 seguidos']], quando: 'há 5 h', kudos: 21 },
  { id: 'f4', nick: 'dani.agacha', tipo: 'treino', tit: 'Pernas pesadas', vals: [['Volume', '6.240 kg'], ['Gasto', '520 kcal'], ['Duração', '74 min']], pr: 'Agachamento · 90 kg', quando: 'ontem', kudos: 32 },
  { id: 'f5', nick: 'marcos.supino', tipo: 'conquista', tit: '100 treinos registrados', vals: [['Desde', 'jul/2026'], ['Streak', '5 dias']], conq: 'Conquista “100 treinos”', quando: 'ontem', kudos: 18 },
];
const CHALLENGES = [
  { id: 'c1', nome: '5 treinos na semana', of: 5, ico: 'dumbbell', base: 'treino' },
  { id: 'c2', nome: 'Proteína na meta 7 dias', of: 7, ico: 'egg', base: 'prot' },
  { id: 'c3', nome: 'Medida a cada 14 dias', of: 1, ico: 'ruler', base: 'medida' },
];

/* ---------- fluxos e telas (metadados de rastreio no screens.js) ---------- */
const FLOWS = [
  { id: 'e01', n: 'E01', title: 'Primeiro uso', desc: 'Sem conta: o fingerprint vincula os dados em silêncio. O onboarding é o cadastro metabólico: dados, rotina e objetivo viram TMB, gasto, estratégia, macros e projeção.', steps: ['F-01', 'F-02', 'F-03', 'F-04', 'F-05', 'F-06'] },
  { id: 'e02', n: 'E02', title: 'Hoje e progresso', desc: 'A home do dia fecha o balanço: meta, consumido, treino e atalhos. O dashboard mostra a projeção com premissas e os insights só usam o que foi registrado.', steps: ['F-10', 'F-11', 'F-12'] },
  { id: 'e03', n: 'E03', title: 'Dieta pelo estoque', desc: 'Informe o que tem em casa; o plano usa só isso e respeita a meta. Marque cada refeição e veja se cumpriu, ficou abaixo ou estourou.', steps: ['F-20', 'F-21', 'F-22', 'F-23', 'F-24'] },
  { id: 'e04', n: 'E04', title: 'Treino do dia', desc: 'Musculação e calistenia no mesmo modelo. Cada exercício tem detalhe, visualização do movimento e estimativa de calorias que entra no balanço.', steps: ['F-30', 'F-31', 'F-32'] },
  { id: 'e05', n: 'E05', title: 'Avaliação física', desc: 'Fita métrica, peso e fotos datadas numa timeline. Compare dois pontos lado a lado.', steps: ['F-40', 'F-41', 'F-42', 'F-43'] },
  { id: 'e06', n: 'E06', title: 'Vitrine e personagens', desc: '“Strava de academia” com opt-in: personagem público sem conta, feed de resultados reais, busca e perfil com só o que a pessoa escolheu mostrar.', steps: ['F-50', 'F-51', 'F-52', 'F-53', 'F-54'] },
  { id: 'e07', n: 'E07', title: 'Academias próximas', desc: 'GPS com permissão ou busca por bairro. Vincule seu personagem a uma academia e veja a atividade local.', steps: ['F-55', 'F-56'] },
  { id: 'e08', n: 'E08', title: 'Perfil e estados', desc: 'Recálculo ao mudar peso ou objetivo, limites seguros, sem rede e troca de aparelho.', steps: ['F-60', 'F-61', 'F-62'] },
];
