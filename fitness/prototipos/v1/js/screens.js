/* Fitness · protótipo v1 — telas. Cada tela declara RF/RN do PRD v1.1 (docs/prd.md). */
'use strict';

/* ---------- derivados do estado ---------- */
const E = () => energy(S.prof);
const PLAN = () => buildPlan(S.stock, E(), S.pref);
const mf = (st) => (st === 'feito' ? 1 : st === 'parcial' ? 0.5 : 0);
function consumed(plan = PLAN()) {
  const parts = plan.meals.map((m) => { const f = mf(S.meals[m.id]); return { kcal: m.tot.kcal * f, p: m.tot.p * f, c: m.tot.c * f, g: m.tot.g * f }; });
  return sum([...parts, ...S.extras]);
}
const SESS = () => SESSIONS[WEEKPLAN[0]];
function train() {
  const s = SESS(), done = s.ex.filter((id) => S.done.includes(id));
  const kcal = done.reduce((a, id) => a + exKcal(EXS[id], S.prof.peso), 0);
  const min = done.reduce((a, id) => a + exMin(EXS[id]), 0);
  const vol = done.reduce((a, id) => a + exVol(EXS[id]), 0);
  const allK = s.ex.reduce((a, id) => a + exKcal(EXS[id], S.prof.peso), 0), allM = s.ex.reduce((a, id) => a + exMin(EXS[id]), 0);
  return { s, done, kcal, min: Math.round(min), vol, allK, allM: Math.round(allM), pr: done.includes('agachamento') };
}
const streak = () => 12 + (S.sessDone ? 1 : 0);
const lastM = () => S.hist[S.hist.length - 1];
const weekTrained = () => WEEK0.slice(1).filter((d) => d.treino).length + (S.sessDone ? 1 : 0);
const weekProt = () => WEEK0.slice(1).filter((d) => d.prot).length + (consumed().p >= E().prot * 0.9 ? 1 : 0);
function challengeProg(c) { return c.base === 'treino' ? weekTrained() : c.base === 'prot' ? weekProt() : daysBetween(lastM().d, TODAY) <= 14 ? 1 : 0; }

function insights() {
  const e = E(), h = S.hist, out = [];
  const a = h[h.length - 3], b = h[h.length - 1], wk = daysBetween(a.d, b.d) / 7;
  const rate = (b.peso - a.peso) / wk, pr = ((e.meta - e.tdee) * 7 * 0.85) / 7700;
  if (e.strat !== 'manutencao') {
    const ratio = pr ? rate / pr : 0;
    out.push({ ico: 'chart', tag: 'Ritmo', tit: ratio > 0.7 && ratio < 1.3 ? 'No ritmo da projeção' : ratio >= 1.3 ? 'Mais rápido que o projetado' : 'Abaixo do ritmo projetado',
      txt: `Últimas ${Math.round(wk)} semanas: ${sgn(rate, (v) => n1(v))} kg/semana. A projeção com 85% de adesão previa ${sgn(pr, (v) => n1(v))} kg/semana.`, go: 'F-11' });
  }
  const ok = WEEK0.filter((d) => d.dieta === 'cumpriu').length;
  out.push({ ico: 'bowl', tag: 'Dieta', tit: `${ok} de ${WEEK0.length} dias na meta`, txt: `Fora da meta: ${WEEK0.filter((d) => d.dieta !== 'cumpriu').map((d) => `${WEEKDAYS[new Date(d.d + 'T12:00').getDay()].toLowerCase()} (${STATUS[d.dieta][0].toLowerCase()})`).join(', ')}.`, go: 'F-23' });
  const lowP = WEEK0.filter((d) => !d.prot).length;
  if (lowP >= 2) {
    const sug = ['ovo', 'iogurte', 'whey', 'queijo'].find((id) => S.stock.includes(id));
    out.push({ ico: 'egg', tag: 'Proteína', tit: `Proteína abaixo em ${lowP} dos últimos 7 dias`, txt: sug ? `Você tem ${food(sug).nome.toLowerCase()} no estoque: ele já entra no lanche do plano de hoje.` : 'Nenhuma fonte rápida de proteína no estoque. Vale incluir ovo ou iogurte.', go: sug ? 'F-21' : 'F-20' });
  }
  const c0 = h[0].cintura, c1 = b.cintura;
  out.push({ ico: 'ruler', tag: 'Medidas', tit: `${sgn(c1 - c0)} cm de cintura desde ${dfmt(h[0].d)}`, txt: `Peso ${sgn(b.peso - h[0].peso)} kg no mesmo período. Braço ${sgn(b.braco - h[0].braco)} cm.`, go: 'F-42' });
  out.push({ ico: 'dumbbell', tag: 'Treino', tit: `${weekTrained()} treinos nos últimos 7 dias`, txt: `Plano da semana: ${WEEKPLAN.filter((x) => x !== 'R').length} sessões. Streak atual: ${streak()} dias com ação registrada.`, go: 'F-30' });
  const since = daysBetween(b.d, TODAY);
  if (since >= 7) out.push({ ico: 'clock', tag: 'Avaliação', tit: since >= 14 ? 'Hora de medir de novo' : `Última medida há ${since} dias`, txt: 'Medir a cada 14 dias, no mesmo horário e em jejum, deixa a tendência mais confiável.', go: 'F-40' });
  return out;
}
const insightCard = (i) => `<article class="ins" ${go(i.go)}><span class="ins-i">${ico(i.ico)}</span><div><p class="tag">${i.tag}</p><h3>${i.tit}</h3><p>${i.txt}</p></div></article>`;

function fcard(f) {
  const c = f.mine ? S.char : charOf(f.nick); const g = gymOf(f.gym || c.gym);
  const k = S.kudos.includes(f.id);
  return `<article class="fc">
    <header ${go('F-53', { nick: f.nick })}>${avatar(f.nick, c.cor)}<div><b>${f.nick}${f.mine ? ' <i class="you-t">você</i>' : ''}</b><span>${g ? g.nome + ' · ' : ''}${f.quando}</span></div><span class="sp"></span>${chip({ treino: 'Treino', dieta: 'Dieta', medida: 'Avaliação', conquista: 'Conquista' }[f.tipo], 'meta')}</header>
    <h3>${f.tit}</h3>
    <div class="fvals">${f.vals.map(([l, v]) => `<div><span>${l}</span><b class="tnum">${v}</b></div>`).join('')}</div>
    ${f.pr ? `<p class="badge pr">${ico('trophy')}Recorde pessoal · ${f.pr}</p>` : ''}${f.conq ? `<p class="badge cq">${ico('spark')}${f.conq}</p>` : ''}
    <footer><button class="kudo${k ? ' on' : ''}" ${act('kudo', f.id)} aria-pressed="${k}">${ico('heart')}<span class="tnum">${f.kudos + (k ? 1 : 0)}</span> apoio${f.kudos + (k ? 1 : 0) === 1 ? '' : 's'}</button></footer>
  </article>`;
}
function feed() { return [...S.posts, ...FEED0]; }
const obDots = (i) => `<div class="obdots" aria-label="Etapa ${i} de 5">${[1, 2, 3, 4, 5].map((k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div>`;
const mealBtns = (id) => { const st = S.meals[id]; return `<div class="mk">${[['feito', 'Comi'], ['parcial', 'Metade'], ['nao', 'Não comi']].map(([v, l]) => `<button class="${st === v ? 'on ' + v : ''}" ${act('meal', id + ':' + v)}>${v === 'feito' ? ico('check') : ''}${l}</button>`).join('')}</div>`; };
const itemTxt = (i) => { const f = food(i.id); return f.un ? `${i.gr / f.un} ${f.unl}${i.gr / f.un > 1 ? 's' : ''}` : `${i.gr} g`; };

const SCREENS = {
/* =================== E01 primeiro uso =================== */
'F-01': { name: 'Boas-vindas sem conta', rf: ['RF-01', 'RF-02', 'RF-05'], rn: ['RN-01', 'RN-02', 'RN-15'],
  notes: 'Primeira abertura: o fingerprint é gerado em silêncio e vira a chave de todos os dados. Não existe login. O app fica bloqueado até o onboarding (RN-02); só a vitrine abre em modo leitura.',
  render() {
    return `<div class="body ob hero">
      <div class="herotop">${wm('lg')}</div>
      <h1 class="h-xl">Treino, dieta e corpo no mesmo lugar.</h1>
      <p class="lede">Uma meta calórica feita para você amarra o que você come, o que treina e como o corpo responde.</p>
      <ul class="pillars"><li>${ico('flame')}<span><b>Base metabólica</b>TMB, gasto e déficit ou superávit</span></li><li>${ico('bowl')}<span><b>Dieta com o que tem em casa</b>e checagem do dia</span></li><li>${ico('dumbbell')}<span><b>Treino com movimento</b>e calorias por exercício</span></li></ul>
      <div class="fpcard">${ico('finger')}<div><b>Sem conta e sem senha</b><p>Este aparelho é a sua identidade: <span class="mono">${S.fp}</span>. Trocar de aparelho ou limpar os dados começa do zero.</p></div></div>
      <p class="fine">Valores são estimativas de apoio e não substituem médico ou nutricionista.</p>
      <div class="cta-col"><button class="btn p" ${go('F-02')}>Começar · leva 1 minuto</button><button class="btn g" ${go('F-51')}>Só olhar a vitrine</button></div>
    </div>`;
  } },
'F-02': { name: 'Sobre você', rf: ['RF-06', 'RF-11'], rn: ['RN-03'],
  notes: 'Dados mínimos obrigatórios para a TMB (RN-03). Os steppers recalculam a TMB ao vivo pela Mifflin–St Jeor. O sexo é pedido só como entrada da fórmula.',
  render() {
    const p = S.prof;
    return `<div class="body ob ft">${topbar('', { right: obDots(1) })}
      <h1 class="h-lg">Sobre você</h1><p class="lede">Só o necessário para estimar quanto seu corpo gasta em repouso.</p>
      <div class="fld"><label>Sexo para o cálculo</label>${seg([['f', 'Feminino'], ['m', 'Masculino']], p.genero, 'sexo')}<p class="hint">A fórmula usa valores diferentes para cada um. Não aparece em lugar nenhum.</p></div>
      <div class="fgrid"><div class="fld"><label>Idade</label>${numstep('idade', p.idade, 'anos')}</div><div class="fld"><label>Altura</label>${numstep('altura', p.altura, 'cm')}</div></div>
      <div class="fld"><label>Peso de hoje</label>${numstep('peso', p.peso, 'kg', 0.5, 1)}</div>
      <div class="live">${ico('flame')}<span>TMB estimada</span><b class="tnum">${n0(tmbOf(p))} kcal</b></div>
      <div class="footcta"><button class="btn p" ${go('F-03')}>Continuar</button></div>
    </div>`;
  } },
'F-03': { name: 'Rotina e atividade', rf: ['RF-07', 'RF-12'], rn: [],
  notes: 'O fator de atividade transforma a TMB em gasto diário (TDEE). O treino registrado no dia entra por fora, no balanço da home.',
  render() {
    const p = S.prof, tmb = tmbOf(p);
    return `<div class="body ob ft">${topbar('', { right: obDots(2) })}
      <h1 class="h-lg">Como é sua semana?</h1><p class="lede">Conte o movimento fora do treino também: trabalho, deslocamento, filhos.</p>
      <div class="opts">${ACTIVITY.map((a) => `<button class="opt${p.ativ === a.id ? ' on' : ''}" ${act('ativ', a.id)}><span class="rd"></span><div><b>${a.nome}</b><span>${a.desc}</span></div><span class="tnum f">× ${n1(a.f).replace(',0', '')}${String(a.f).length > 4 ? '' : ''}</span></button>`).join('')}</div>
      <div class="live">${ico('zap')}<span>Gasto diário estimado</span><b class="tnum">${n0(tmb * actOf(p.ativ).f)} kcal</b></div>
      <div class="footcta"><button class="btn p" ${go('F-04')}>Continuar</button></div>
    </div>`;
  } },
'F-04': { name: 'Objetivo', rf: ['RF-08', 'RF-13'], rn: ['RN-04', 'RN-05', 'RN-06'],
  notes: 'O objetivo decide a estratégia: ganhar músculo → superávit; perder gordura → déficit; manter → meta igual ao gasto. A escolha aparece como etiqueta no card para ser verificável na UI (critério 2).',
  render() {
    return `<div class="body ob ft">${topbar('', { right: obDots(3) })}
      <h1 class="h-lg">O que você quer agora?</h1><p class="lede">Dá para mudar depois. A dieta e o treino se ajustam.</p>
      <div class="goals">${GOALS.map((g) => `<button class="goal${S.prof.obj === g.id ? ' on' : ''}" ${act('obj', g.id)}>${ico(g.ico)}<b>${g.nome}</b><span>${g.sub}</span>${chip(STRAT[g.strat] + (g.def ? ` ${g.strat === 'deficit' ? '−' : '+'}${g.def}%` : ''), g.strat)}</button>`).join('')}</div>
      <div class="footcta"><button class="btn p" ${go('F-05')}>Ver minha base</button></div>
    </div>`;
  } },
'F-05': { name: 'Sua base e estratégia', rf: ['RF-09', 'RF-11', 'RF-12', 'RF-14'], rn: ['RN-15', 'RN-16'],
  notes: 'TMB, gasto e meta com a fórmula aberta. O controle ajusta o tamanho do déficit/superávit dentro de faixas; acima da faixa segura (ou meta abaixo da TMB) pede confirmação explícita (RN-16).',
  render() {
    const e = E(), g = e.g;
    const range = g.strat === 'manutencao' ? '<p class="hint">Na manutenção a meta acompanha o gasto diário.</p>'
      : `<div class="fld"><label>Tamanho do ${g.strat === 'deficit' ? 'déficit' : 'superávit'} <b class="tnum" id="magv">${e.mag}%</b></label>
        <input type="range" class="rng${e.extreme ? ' bad' : ''}" min="${g.min}" max="${g.max}" step="5" value="${e.mag}" data-input="mag" style="--p:${((e.mag - g.min) / (g.max - g.min)) * 100}%">
        <div class="rl"><span>${g.min}% leve</span><span>faixa segura até ${g.safe}%</span><span>${g.max}%</span></div></div>`;
    return `<div class="body ob ft">${topbar('', { right: obDots(4) })}
      <h1 class="h-lg">Sua base</h1>
      <div class="kpis">${stat(n0(e.tmb), 'TMB · kcal em repouso')}${stat(n0(e.tdee), 'Gasto diário estimado')}</div>
      <div class="meta-card ${e.strat}"><p>${chip(STRAT[e.strat], e.strat)} ${g.nome.toLowerCase()}</p><b class="tnum" id="metav">${n0(e.meta)}<i>kcal/dia</i></b><span class="tnum" id="diffv">${e.diff ? `${sgn(e.diff, n0)} kcal vs gasto` : 'igual ao gasto'}</span></div>
      ${range}
      ${e.extreme ? note(e.meta < e.tmb ? 'A meta ficou abaixo da sua TMB. Só seguimos com sua confirmação.' : 'Acima da faixa segura. Só seguimos com sua confirmação.', 'alert', 'warn') : ''}
      <details class="disc"><summary>${ico('info')}Como calculamos</summary><p>TMB pela Mifflin–St Jeor: 10 × peso + 6,25 × altura − 5 × idade ${S.prof.genero === 'm' ? '+ 5' : '− 161'}. Gasto = TMB × ${n1(actOf(S.prof.ativ).f)} (${actOf(S.prof.ativ).nome.toLowerCase()}). São estimativas: o peso real das próximas semanas corrige o rumo.</p></details>
      <div class="footcta"><button class="btn p" ${e.extreme && !S.prof.ok ? act('sheet', 'extreme') : go('F-06')}>${e.extreme && !S.prof.ok ? 'Revisar e confirmar' : 'Ver macros e projeção'}</button></div>
    </div>`;
  } },
'F-06': { name: 'Macros e projeção', rf: ['RF-09', 'RF-15', 'RF-16'], rn: ['RN-08', 'RN-09'],
  notes: 'Macros derivados da meta e do objetivo: proteína por kg, gordura mínima, carbo no restante. A projeção recalcula a TMB a cada semana e mostra as premissas. Concluir libera o app (RF-05).',
  render() {
    const e = E(), pr = projection(S.prof); const k = [e.prot * 4, e.carb * 4, e.fat * 9]; const tot = k[0] + k[1] + k[2];
    const end = pr[pr.length - 1].kg;
    return `<div class="body ob ft">${topbar('', { right: obDots(5) })}
      <h1 class="h-lg">Seu dia em números</h1><p class="lede">${n0(e.meta)} kcal divididas assim:</p>
      <div class="mstack"><i class="mp" style="flex:${k[0]}"></i><i class="mc" style="flex:${k[1]}"></i><i class="mg" style="flex:${k[2]}"></i></div>
      <div class="mleg">${[['Proteína', e.prot, k[0], 'mp', `${n1(e.g.prot)} g/kg`], ['Carbo', e.carb, k[1], 'mc', 'o restante'], ['Gordura', e.fat, k[2], 'mg', `${n1(e.fat / S.prof.peso)} g/kg`]].map(([l, gr, kc, c, s]) => `<div class="${c}"><span>${l}</span><b class="tnum">${gr} g</b><i class="tnum">${Math.round((kc / tot) * 100)}% · ${s}</i></div>`).join('')}</div>
      <section class="card"><h2 class="h-sm">Projeção · 12 semanas</h2>
        ${lineChart({ pts: [], proj: pr.map((p) => ({ x: p.w * 7, y: p.kg })), today: 0, h: 150 })}
        <p class="proj-sum"><b class="tnum">${n1(S.prof.peso)} → ${n1(end)} kg</b> em ${dfmt(new Date(Date.parse(TODAY) + 84 * 864e5).toISOString().slice(0, 10))}</p>
        <ul class="prem"><li>85% de adesão à meta</li><li>Gasto recalculado a cada semana com o peso novo</li>${e.strat === 'superavit' ? '<li>Ganho limitado a 0,35 kg/semana</li>' : ''}<li>Atualiza quando você registra peso</li></ul>
      </section>
      <div class="footcta two"><button class="btn p" ${act('finish', 'F-20')}>Montar dieta com o que tenho</button><button class="btn g" ${act('finish', 'F-10')}>Ir para o dia de hoje</button></div>
    </div>`;
  } },

/* =================== E02 hoje =================== */
'F-10': { name: 'Hoje', rf: ['RF-35', 'RF-36', 'RF-21', 'RF-27', 'RF-12'], rn: ['RN-11', 'RN-12'],
  notes: 'A home fecha o dia: meta, consumido, treino e balanço (gasto + treino − consumido). Marcar refeição aqui mesmo, sem abrir a dieta (RF-36). O insight do topo sai só de dados registrados.',
  render() {
    const e = E(), plan = PLAN(), c = consumed(plan), t = train(), st = dayStatus(c.kcal, e.meta);
    const bal = Math.round(c.kcal - (e.tdee + t.kcal)); const ins = insights()[0];
    const d = new Date(TODAY + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' }).replace('.', '');
    return `<div class="body tb">${brandbar(`<span class="streak" title="Streak">${ico('flame')}<b class="tnum">${streak()}</b></span>`)}
      <p class="date">${d}</p>
      <section class="today">
        ${ring(c.kcal, e.meta, { label: n0(c.kcal), sub: `de ${n0(e.meta)} kcal`, over: st === 'estourou' })}
        <dl class="bal"><div><dt>Meta</dt><dd class="tnum">${n0(e.meta)}</dd></div><div><dt>Comido</dt><dd class="tnum">${n0(c.kcal)}</dd></div><div><dt>Treino</dt><dd class="tnum kc">+${n0(t.kcal)}</dd></div><div class="tot"><dt>Balanço</dt><dd class="tnum">${sgn(bal, n0)}</dd></div></dl>
      </section>
      ${macros3(c, e)}
      ${ins ? `<div class="sec-h"><h2>Insight</h2><button ${go('F-12')}>Ver todos</button></div>${insightCard(ins)}` : ''}
      <div class="sec-h"><h2>Refeições</h2><button ${go('F-21')}>Plano</button></div>
      <div class="qmeals">${plan.meals.map((m) => { const s = S.meals[m.id]; return `<div class="qm${s === 'feito' ? ' done' : ''}"><button class="ck${s === 'feito' ? ' on' : s === 'parcial' ? ' half' : ''}" ${act('qmeal', m.id)} aria-label="Marcar ${m.nome}">${ico('check')}</button><div ${go('F-22', { meal: m.id })}><b>${m.nome}</b><span class="tnum">${m.hora} · ${n0(m.tot.kcal)} kcal${s === 'parcial' ? ' · metade' : s === 'nao' ? ' · pulou' : ''}</span></div></div>`; }).join('')}</div>
      <div class="sec-h"><h2>Treino do dia</h2></div>
      ${t.s.ex.length ? `<article class="tcard" ${go('F-30')}>${figure(EXS[t.s.ex[0]].anim, { cls: 'sm', animate: false })}<div><p class="tag">${t.s.mod}</p><h3>${t.s.nome.split(' · ')[0]}</h3><p class="tnum">${t.done.length}/${t.s.ex.length} exercícios · ${S.sessDone ? 'concluído' : `≈ ${n0(t.allK)} kcal`}</p><div class="bar sm"><i style="width:${(t.done.length / t.s.ex.length) * 100}%"></i></div></div>${ico('next')}</article>` : `<article class="tcard rest">${ico('clock')}<div><h3>Descanso ativo</h3><p>Caminhada leve conta no gasto.</p></div></article>`}
      <div class="shortcuts">
        <button ${go('F-40')}>${ico('ruler')}<span>Medida</span></button><button ${go('F-41')}>${ico('camera')}<span>Foto</span></button>
        <button ${go('F-51')}>${ico('trophy')}<span>Vitrine</span></button><button ${go('F-55')}>${ico('pin')}<span>Academias</span></button>
      </div>
    </div>${tabbar('F-10')}`;
  } },
'F-11': { name: 'Dashboard de projeção', rf: ['RF-16', 'RF-30', 'RF-33'], rn: ['RN-09', 'RN-13', 'RN-14'],
  notes: 'Pesos registrados (linha cheia) e projeção a partir de hoje (tracejada, com faixa de incerteza que abre com o tempo). Premissas visíveis e ritmo real vs projetado.',
  render() {
    const e = E(), h = S.hist, t0 = h[0].d; const pr = projection(S.prof);
    const pts = h.map((m) => ({ x: daysBetween(t0, m.d), y: m.peso, d: m.d })); const td = daysBetween(t0, TODAY);
    const a = h[h.length - 3], b = h[h.length - 1], rate = (b.peso - a.peso) / (daysBetween(a.d, b.d) / 7), prr = ((e.meta - e.tdee) * 7 * 0.85) / 7700;
    return `<div class="body">${topbar('Progresso', { sub: `${goalOf(S.prof.obj).nome} · ${STRAT[e.strat].toLowerCase()} ${e.mag ? e.mag + '%' : ''}` })}
      <section class="card flush-b"><div class="ch-h"><h2 class="h-sm">Peso</h2>${chip('estimativa', 'meta')}</div>
        ${lineChart({ pts, proj: pr.map((p) => ({ x: td + p.w * 7, y: p.kg })), today: td, h: 190 })}
        <div class="lg"><span class="l1">registrado</span><span class="l2">projeção</span></div></section>
      <div class="kpis three">${stat(sgn(rate) + ' kg', 'por semana · real')}${stat(sgn(prr) + ' kg', 'por semana · previsto')}${stat(n1(pr[pr.length - 1].kg) + ' kg', 'em 12 semanas')}</div>
      <section class="card"><h2 class="h-sm">Estratégia</h2>
        <dl class="kv"><div><dt>TMB</dt><dd class="tnum">${n0(e.tmb)} kcal</dd></div><div><dt>Gasto diário</dt><dd class="tnum">${n0(e.tdee)} kcal</dd></div><div><dt>Meta</dt><dd class="tnum">${n0(e.meta)} kcal (${sgn(e.diff, n0)})</dd></div><div><dt>Macros</dt><dd class="tnum">P ${e.prot} · C ${e.carb} · G ${e.fat} g</dd></div></dl>
        <button class="btn s sm" ${go('F-60')}>Ajustar estratégia</button></section>
      <section class="card"><h2 class="h-sm">Premissas</h2><ul class="prem"><li>Adesão de 85% à meta calórica</li><li>1 kg de gordura ≈ 7.700 kcal</li><li>Gasto recalculado semanalmente com o peso projetado</li><li>Água e intestino mexem no peso diário: olhe a tendência</li></ul></section>
      <div class="sec-h"><h2>Insights</h2><button ${go('F-12')}>Todos</button></div>${insights().slice(0, 2).map(insightCard).join('')}
    </div>`;
  } },
'F-12': { name: 'Insights', rf: ['RF-33', 'RF-34'], rn: ['RN-14', 'RN-15'],
  notes: 'Cada insight cruza adesão (dieta/treino) com tendência (peso/medidas) e aponta a tela onde agir. Tom factual, sem diagnóstico. Mude o estoque ou marque refeições e eles mudam.',
  render() {
    return `<div class="body">${topbar('Insights', { sub: 'Últimos 7 dias e tendência das medidas' })}
      ${insights().map(insightCard).join('')}
      ${note('Insights usam só o que você registrou. Não são diagnóstico nem orientação clínica.', 'shield')}
    </div>`;
  } },

/* =================== E03 dieta =================== */
'F-20': { name: 'Estoque de ingredientes', rf: ['RF-17', 'RF-22'], rn: ['RN-10'],
  notes: 'O estoque é a fronteira do plano: nada fora daqui entra (RN-10). Ligue/desligue itens e gere de novo; com estoque pobre o gerador avisa (F-24).',
  render() {
    const q = S.fq.trim().toLowerCase(), list = FOODS.filter((f) => !q || f.nome.toLowerCase().includes(q));
    return `<div class="body ft">${topbar('O que tem em casa', { sub: `${S.stock.length} ingredientes no estoque` })}
      <label class="search">${ico('search')}<input data-input="fq" value="${esc(S.fq)}" placeholder="Buscar alimento" autocomplete="off"></label>
      <div id="stk">${stockList(list)}</div>
      ${note('O plano usa só o que está marcado aqui. Faltou algo? Marque e gere de novo.', 'box')}
      <div class="footcta"><button class="btn p" ${act('gen')}>${ico('refresh')}Gerar plano do dia</button></div>
    </div>`;
  } },
'F-21': { name: 'Plano alimentar do dia', rf: ['RF-18', 'RF-19', 'RF-20', 'RF-21'], rn: ['RN-10', 'RN-11'],
  notes: 'Quatro refeições com porções calculadas para a meta e os macros, só com o estoque. Marque Comi / Metade / Não comi e o total recalcula. Lanche extra fora do plano entra pelo botão de baixo.',
  render() {
    const e = E(), plan = PLAN(), c = consumed(plan), st = dayStatus(c.kcal, e.meta);
    return `<div class="body tb">${topbar('Dieta de hoje', { back: false, sub: `Plano ${n0(plan.tot.kcal)} kcal · meta ${n0(e.meta)}`, right: `<button class="ib" ${go('F-20')} aria-label="Estoque">${ico('box')}</button>` })}
      ${!plan.viable ? `<button class="alert" ${go('F-24')}>${ico('alert')}<span><b>O estoque não fecha a meta</b>Veja o que falta</span>${ico('next')}</button>` : ''}
      <section class="card dsum"><div class="ds-h"><div><span>Comido</span><b class="tnum">${n0(c.kcal)}<i> / ${n0(e.meta)} kcal</i></b></div>${chip(STATUS[st][0], STATUS[st][1])}</div>
        <div class="bar"><i style="width:${Math.min(100, (c.kcal / e.meta) * 100)}%"${st === 'estourou' ? ' class="over"' : ''}></i></div>${macros3(c, e)}</section>
      ${plan.meals.map((m) => `<article class="meal${S.meals[m.id] === 'feito' ? ' done' : ''}">
        <header ${go('F-22', { meal: m.id })}><div><h3>${m.nome}</h3><span class="tnum">${m.hora} · ${n0(m.tot.kcal)} kcal · P ${n0(m.tot.p)} g</span></div>${ico('next')}</header>
        <ul>${m.items.map((i) => `<li><span>${food(i.id).nome}</span><b class="tnum">${itemTxt(i)}</b></li>`).join('') || '<li class="miss">Sem ingredientes no estoque para esta refeição</li>'}</ul>
        ${mealBtns(m.id)}</article>`).join('')}
      ${S.extras.length ? `<div class="extras">${S.extras.map((x, i) => `<div class="xrow"><span>${x.nome}</span><b class="tnum">${n0(x.kcal)} kcal</b><button class="ib sm ghost" ${act('rmextra', i)} aria-label="Remover">${ico('x')}</button></div>`).join('')}</div>` : ''}
      <div class="row2"><button class="btn s" ${act('sheet', 'extra')}>${ico('plus')}Fora do plano</button><button class="btn p" ${go('F-23')}>Fechar o dia</button></div>
    </div>${tabbar('F-21')}`;
  } },
'F-22': { name: 'Detalhe da refeição', rf: ['RF-18', 'RF-20', 'RF-22'], rn: ['RN-10'],
  notes: 'Ingredientes, gramas e macros por item. Trocar a fonte só oferece o que está no estoque e o plano recalcula as porções para manter a meta.',
  render() {
    const plan = PLAN(), m = plan.meals.find((x) => x.id === S.sel.meal) || plan.meals[0];
    const alt = (cat) => m[cat].filter((id) => S.stock.includes(id));
    const cur = (cat) => (m.items.find((i) => food(i.id).cat === cat) || {}).id;
    return `<div class="body ft">${topbar(m.nome, { sub: `${m.hora} · alvo ${n0(m.alvo)} kcal` })}
      <div class="kpis four">${stat(n0(m.tot.kcal), 'kcal')}${stat(n0(m.tot.p) + 'g', 'proteína', 'mp')}${stat(n0(m.tot.c) + 'g', 'carbo', 'mc')}${stat(n0(m.tot.g) + 'g', 'gordura', 'mg')}</div>
      <section class="card"><ul class="items">${m.items.map((i) => { const f = food(i.id), n = nut(f, i.gr); return `<li><div><b>${f.nome}</b><span class="tnum">P ${n1(n.p)} · C ${n1(n.c)} · G ${n1(n.g)}</span></div><b class="tnum">${itemTxt(i)}<i>${n0(n.kcal)} kcal</i></b></li>`; }).join('')}</ul></section>
      ${['prot', 'carb'].map((cat) => alt(cat).length > 1 ? `<div class="fld"><label>Trocar ${cat === 'prot' ? 'proteína' : 'carboidrato'} <span class="hint">só do estoque</span></label><div class="chips">${alt(cat).map((id) => `<button class="fchip${cur(cat) === id ? ' on' : ''}" ${act('pref', m.id + ':' + cat + ':' + id)}>${food(id).nome}</button>`).join('')}</div></div>` : '').join('')}
      <div class="fld"><label>Como foi?</label>${mealBtns(m.id)}</div>
      <div class="footcta"><button class="btn p" ${go('back')}>Pronto</button></div>
    </div>`;
  } },
'F-23': { name: 'Fechamento do dia', rf: ['RF-21', 'RF-40'], rn: ['RN-11', 'RN-22'],
  notes: 'Cumpriu = consumido entre 90% e 105% da meta; abaixo ou estourou fora disso. Macros com o mesmo critério. Fechar o dia cumprido conta no streak e no desafio de proteína.',
  render() {
    const e = E(), plan = PLAN(), c = consumed(plan), st = dayStatus(c.kcal, e.meta);
    const ms = [['Proteína', c.p, e.prot], ['Carbo', c.c, e.carb], ['Gordura', c.g, e.fat]];
    const big = { cumpriu: 'Meta cumprida', abaixo: 'Abaixo da meta', estourou: 'Passou da meta', vazio: 'Nada marcado ainda' }[st];
    const wk = [...WEEK0.slice(1), { d: TODAY, dieta: st === 'vazio' ? null : st, today: true }];
    return `<div class="body ft">${topbar('Fechar o dia')}
      <section class="verdict ${STATUS[st][1]}">${ico(st === 'cumpriu' ? 'check' : st === 'vazio' ? 'info' : 'alert')}<h1>${big}</h1><p class="tnum">${n0(c.kcal)} de ${n0(e.meta)} kcal · ${sgn(Math.round(c.kcal - e.meta), n0)}</p></section>
      <section class="card"><ul class="mstat">${ms.map(([l, v, a]) => { const s = dayStatus(v, a); return `<li><span>${l}</span><b class="tnum">${n0(v)} / ${n0(a)} g</b>${chip(STATUS[s][0], STATUS[s][1])}</li>`; }).join('')}</ul></section>
      <section class="card"><ul class="mstat">${plan.meals.map((m) => `<li><span>${m.nome}</span><b class="tnum">${S.meals[m.id] ? n0(m.tot.kcal * mf(S.meals[m.id])) + ' kcal' : '—'}</b>${chip({ feito: 'Comi', parcial: 'Metade', nao: 'Não comi' }[S.meals[m.id]] || 'Sem marcar', S.meals[m.id] === 'feito' ? 'ok' : S.meals[m.id] ? 'warn' : 'meta')}</li>`).join('')}${S.extras.map((x) => `<li><span>${x.nome}</span><b class="tnum">${n0(x.kcal)} kcal</b>${chip('extra', 'warn')}</li>`).join('')}</ul></section>
      <div class="sec-h"><h2>Semana</h2></div>
      <div class="wk">${wk.map((d) => `<div class="${d.dieta ? STATUS[d.dieta][1] : 'meta'}${d.today ? ' now' : ''}"><span>${WEEKDAYS[new Date(d.d + 'T12:00').getDay()]}</span><i>${d.dieta === 'cumpriu' ? ico('check') : d.dieta ? ico('x') : ''}</i></div>`).join('')}</div>
      <div class="footcta"><button class="btn p" ${act('closeday')} ${st === 'vazio' ? 'disabled' : ''}>Concluir o dia</button></div>
    </div>`;
  } },
'F-24': { name: 'Estoque não fecha a meta', rf: ['RF-19', 'RF-22'], rn: ['RN-10'],
  notes: 'Com o cenário “Estoque pobre” o gerador não acha proteína para as refeições e avisa em vez de inventar alimento. Sugere o que comprar e deixa adicionar direto.',
  render() {
    const e = E(), plan = PLAN();
    const sug = FOODS.filter((f) => !S.stock.includes(f.id) && (plan.missing.includes(f.cat) || f.cat === 'prot')).slice(0, 5);
    return `<div class="body ft">${topbar('Plano incompleto')}
      <section class="verdict warn">${ico('alert')}<h1>Seu estoque não fecha a meta</h1><p class="tnum">Plano possível: ${n0(plan.tot.kcal)} de ${n0(e.meta)} kcal · ${n0(plan.tot.p)} de ${e.prot} g de proteína</p></section>
      <section class="card"><h2 class="h-sm">O que falta</h2><ul class="mstat">${['prot', 'carb'].map((c) => `<li><span>${FCATS.find((x) => x.id === c).nome}</span>${plan.missing.includes(c) ? chip('nenhum no estoque', 'err') : chip('ok', 'ok')}</li>`).join('')}<li><span>Proteína do dia</span>${chip(Math.round(plan.gap.p * 100) + '% da meta', plan.gap.p > 0.85 ? 'ok' : 'err')}</li></ul></section>
      <div class="sec-h"><h2>Adicionar ao estoque</h2></div>
      <div class="chips">${sug.map((f) => `<button class="fchip" ${act('stock', f.id)}>${ico('plus')}${f.nome}</button>`).join('')}</div>
      ${note('Não colocamos no plano nada que você não marcou como disponível.', 'box')}
      <div class="footcta two"><button class="btn p" ${act('gen')}>Gerar de novo</button><button class="btn g" ${go('F-20')}>Editar estoque</button></div>
    </div>`;
  } },

/* =================== E04 treino =================== */
'F-30': { name: 'Treino do dia', rf: ['RF-23', 'RF-24', 'RF-25', 'RF-27', 'RF-28'], rn: ['RN-12'],
  notes: 'Semana A/B (musculação e calistenia no mesmo modelo). Cada exercício com séries, carga e kcal estimadas por MET × peso × tempo. O check soma no balanço do dia.',
  render() {
    const t = train(), sel = SESSIONS[WEEKPLAN[S.day]], isToday = S.day === 0;
    const k = sel.ex.reduce((a, id) => a + exKcal(EXS[id], S.prof.peso), 0), mn = Math.round(sel.ex.reduce((a, id) => a + exMin(EXS[id]), 0));
    const vol = sel.ex.reduce((a, id) => a + exVol(EXS[id]), 0);
    const days = WEEKPLAN.map((s, i) => { const d = new Date(Date.parse(TODAY + 'T12:00') + i * 864e5); return `<button class="${S.day === i ? 'on' : ''}${s === 'R' ? ' rest' : ''}" ${act('day', i)}><span>${i ? WEEKDAYS[d.getDay()] : 'Hoje'}</span><b>${s === 'R' ? '–' : s}</b></button>`; }).join('');
    return `<div class="body tb">${topbar('Treino', { back: false, sub: `${weekTrained()} treinos nos últimos 7 dias` })}
      <div class="days">${days}</div>
      ${sel.ex.length ? `<section class="card sess"><p class="tag">${sel.mod}</p><h2>${sel.nome.split(' · ')[0]}</h2>
        <div class="kpis three plain">${stat('≈ ' + n0(k), 'kcal')}${stat(mn + ' min', 'duração')}${stat(vol ? n0(vol) + ' kg' : '—', 'volume')}</div>
        ${isToday ? `<div class="bar sm"><i style="width:${(t.done.length / sel.ex.length) * 100}%"></i></div><p class="hint tnum">${t.done.length} de ${sel.ex.length} feitos · ${n0(t.kcal)} kcal até agora</p>` : '<p class="hint">Prévia. O check abre no dia.</p>'}</section>
      <ul class="exl">${sel.ex.map((id) => { const x = EXS[id], dn = isToday && S.done.includes(id); return `<li class="${dn ? 'done' : ''}">
        ${isToday ? `<button class="ck${dn ? ' on' : ''}" ${act('ex', id)} aria-label="Marcar ${x.nome}">${ico('check')}</button>` : ''}
        <div class="exm" ${go('F-31', { ex: id })}>${figure(x.anim, { cls: 'xs', animate: false, bar: !x.nobar })}</div>
        <div class="exi" ${go('F-31', { ex: id })}><b>${x.nome}</b><span class="tnum">${exSets(x)}</span><span class="tnum kc">≈ ${exKcal(x, S.prof.peso)} kcal · ${Math.round(exMin(x))} min</span></div>${ico('next')}</li>`; }).join('')}</ul>
      ${isToday ? `<div class="row2"><button class="btn p" ${S.sessDone ? 'disabled' : go('F-32')} ${t.done.length ? '' : 'disabled'}>${S.sessDone ? 'Sessão concluída' : 'Concluir sessão'}</button></div>` : ''}`
      : `<section class="verdict meta">${ico('clock')}<h1>Descanso ativo</h1><p>Caminhada de 30 min ≈ ${n0(3.5 * S.prof.peso * 0.5)} kcal no balanço.</p></section>`}
    </div>${tabbar('F-30')}`;
  } },
'F-31': { name: 'Detalhe do exercício', rf: ['RF-24', 'RF-26', 'RF-27'], rn: ['RN-12'],
  notes: 'Visualização do movimento entre a posição inicial e final, em loop (SVG; sem vídeo no MVP, como o risco do PRD sugere). Com movimento reduzido vira as duas poses sobrepostas. Toque nas séries para marcar.',
  render() {
    const id = S.sel.ex || 'agachamento', x = EXS[id], dn = S.done.includes(id), sd = S.sets[id] || 0, rm = reducedMotion() || S.paused;
    return `<div class="body ft">${topbar(x.nome, { sub: x.grupo })}
      <section class="stagefig${rm ? ' still' : ''}">${figure(x.anim, { cls: 'lg', animate: !rm, bar: !x.nobar })}
        <button class="ib glass" ${act('pause')} aria-label="${rm ? 'Animar' : 'Pausar'}">${ico(rm ? 'play' : 'pause')}</button><span class="figlab">${rm ? 'início e fim do movimento' : 'ritmo: 1 s sobe · 1 s desce'}</span></section>
      <div class="kpis three">${stat(x.series + '×', x.seg ? `${x.seg} s` : `${x.reps} reps`)}${stat(x.kg ? x.kg + ' kg' : 'corpo', 'carga')}${stat('≈ ' + exKcal(x, S.prof.peso), 'kcal')}</div>
      <div class="fld"><label>Séries <span class="hint tnum">${sd}/${x.series}</span></label><div class="sets">${Array.from({ length: x.series }, (_, i) => `<button class="${i < sd || dn ? 'on' : ''}" ${act('set', id + ':' + (i + 1))}><b>${i + 1}</b><span>${x.seg ? x.seg + ' s' : x.reps + (x.kg ? ' × ' + x.kg : '')}</span></button>`).join('')}</div></div>
      <section class="card"><p>${x.desc}</p><h2 class="h-sm" style="margin-top:12px">Pontos de atenção</h2><ul class="prem">${x.dicas.map((d) => `<li>${d}</li>`).join('')}</ul></section>
      ${x.pr ? note('Carga de hoje é recorde pessoal. Concluir com a série completa entra na vitrine se você publicar.', 'trophy') : ''}
      <div class="footcta"><button class="btn ${dn ? 's' : 'p'}" ${act('ex', id)}>${dn ? 'Desmarcar' : ico('check') + 'Marcar como feito'}</button></div>
    </div>`;
  } },
'F-32': { name: 'Sessão concluída', rf: ['RF-27', 'RF-37', 'RF-38', 'RF-39', 'RF-40'], rn: ['RN-12', 'RN-17', 'RN-18', 'RN-22'],
  notes: 'Resumo real da sessão (só exercícios marcados). Publicar na vitrine é opt-in por sessão e só com personagem; o card mostra kcal, volume e PR, nunca peso ou medidas.',
  render() {
    const t = train(), canPub = S.char && S.optIn;
    const card = { id: 'preview', nick: S.char ? S.char.nick : 'você', mine: true, gym: S.char && S.char.gym, tipo: 'treino', tit: t.s.nome, vals: [['Duração', t.min + ' min'], ['Gasto', n0(t.kcal) + ' kcal'], ...(t.vol ? [['Volume', n0(t.vol) + ' kg']] : [])], pr: t.pr ? 'Agachamento · 50 kg' : null, quando: 'agora', kudos: 0 };
    return `<div class="body ft">${topbar('Sessão concluída')}
      <section class="verdict ok">${ico('check')}<h1>${t.done.length} de ${t.s.ex.length} exercícios</h1><p>${t.s.nome}</p></section>
      <div class="kpis three">${stat(t.min + ' min', 'duração')}${stat(n0(t.kcal), 'kcal no balanço')}${stat(t.vol ? n0(t.vol) : '—', 'kg de volume')}</div>
      ${t.pr ? `<p class="badge pr big">${ico('trophy')}Recorde pessoal · Agachamento 50 kg</p>` : ''}
      <p class="streakline">${ico('flame')}Streak vai para <b class="tnum">${streak() + (S.sessDone ? 0 : 1)} dias</b></p>
      <div class="sec-h"><h2>Vitrine</h2></div>
      ${S.char ? `<div class="pubrow"><div><b>Publicar esta sessão</b><span>${canPub ? 'Aparece no feed da vitrine e da sua academia' : 'Sua vitrine está privada. Ligue em Privacidade.'}</span></div>${canPub ? toggle(S.pub, 'pub', 'Publicar') : `<button class="btn s sm" ${go('F-54')}>Privacidade</button>`}</div>
        ${canPub && S.pub ? `<div class="preview">${fcard(card).replace(/data-act="kudo"[^>]*/, 'disabled')}</div>` : ''}`
      : `<div class="pubrow"><div><b>Quer aparecer na vitrine?</b><span>Crie um personagem público. Sem e-mail, sem senha.</span></div><button class="btn s sm" ${go('F-50')}>Criar</button></div>`}
      ${!S.online && S.pub && canPub ? note('Sem internet: a publicação sai quando a rede voltar.', 'wifioff', 'warn') : ''}
      <div class="footcta"><button class="btn p" ${act('finishsess')}>Concluir</button></div>
    </div>`;
  } },

/* =================== E05 avaliação =================== */
'F-40': { name: 'Nova avaliação com fita', rf: ['RF-29', 'RF-30'], rn: ['RN-13', 'RN-07'],
  notes: 'Fita métrica + peso, datados. Cada campo mostra o último valor e a diferença ao vivo. Salvar com peso novo recalcula TMB, meta e macros (RN-07).',
  render() {
    const l = lastM();
    return `<div class="body ft">${topbar('Nova avaliação', { sub: `Hoje · última em ${dfmt(l.d)} (há ${daysBetween(l.d, TODAY)} dias)` })}
      <div class="mgrid">${MEASURES.map((m) => { const v = S.mIn[m.id], dv = v - l[m.id]; const good = m.dir ? Math.sign(dv) === m.dir : null;
        return `<div class="mfld"><label>${m.nome}${m.onde ? `<span>${m.onde}</span>` : ''}</label>${numstep('m.' + m.id, v, m.un, m.id === 'peso' ? 0.1 : 0.5, 1)}<p class="tnum dv ${dv && good !== null ? (good ? 'ok' : 'bad') : ''}" id="dv-${m.id}">${dv ? sgn(dv) + ' ' + m.un : 'igual'} · antes ${n1(l[m.id])}</p></div>`; }).join('')}</div>
      ${note('Meça sempre no mesmo horário, de manhã e antes de comer.', 'clock')}
      <div class="footcta two"><button class="btn p" ${act('savem')}>Salvar avaliação</button><button class="btn g" ${go('F-41')}>${ico('camera')}Adicionar fotos</button></div>
    </div>`;
  } },
'F-41': { name: 'Foto de progresso', rf: ['RF-31'], rn: ['RN-13', 'RN-18'], dark: true,
  notes: 'Câmera com guia de silhueta por pose (frente, lado, costas) para fotos comparáveis. As fotos ficam no aparelho e nunca vão para a vitrine sem toggle explícito (RN-18).',
  render() {
    return `<div class="body dark cam">${topbar('Foto de progresso', { sub: 'Hoje · fica só neste aparelho' })}
      <div class="vf">${silhouette(S.photos.length ? S.photos[S.photos.length - 1].w : 1, S.pose, 'guide')}<span class="vfh">Encaixe o corpo na silhueta · mesma luz e distância</span></div>
      <div class="poses">${seg([['frente', 'Frente'], ['lado', 'Lado'], ['costas', 'Costas']], S.pose, 'pose')}</div>
      <div class="shut"><button class="ib glass" ${go('F-42')} aria-label="Galeria">${ico('image')}</button><button class="shutter" ${act('shot')} aria-label="Tirar foto"><i></i></button><span class="ib ghost"></span></div>
    </div>`;
  } },
'F-42': { name: 'Corpo · timeline', rf: ['RF-30', 'RF-31', 'RF-32'], rn: ['RN-13'],
  notes: 'Gráfico por medida (escolha no seletor) e timeline cronológica de avaliações e fotos. As fotos são ilustrações de silhueta neste protótipo.',
  render() {
    const m = MEASURES.find((x) => x.id === S.metric), h = S.hist, t0 = h[0].d, a = h[0][m.id], b = h[h.length - 1][m.id];
    const tl = [...h.map((x, i) => ({ d: x.d, k: 'm', i })), ...S.photos.map((p, i) => ({ d: p.d, k: 'p', i }))].sort((x, y) => (x.d < y.d ? 1 : x.d > y.d ? -1 : x.k === 'p' ? -1 : 1));
    return `<div class="body tb">${topbar('Corpo', { back: false, sub: `${h.length} avaliações · ${S.photos.length} fotos`, right: `<button class="ib" ${go('F-40')} aria-label="Nova medida">${ico('plus')}</button>` })}
      <div class="chips scroll">${MEASURES.map((x) => `<button class="fchip${x.id === S.metric ? ' on' : ''}" ${act('metric', x.id)}>${x.nome}</button>`).join('')}</div>
      <section class="card flush-b"><div class="ch-h"><h2 class="h-sm">${m.nome}</h2><b class="tnum dv ${m.dir && Math.sign(b - a) === m.dir ? 'ok' : ''}">${sgn(b - a)} ${m.un}</b></div>
        ${lineChart({ pts: h.map((x) => ({ x: daysBetween(t0, x.d), y: x[m.id], d: x.d })), unit: m.un, h: 160, hi: h.length - 1 })}
        <p class="hint tnum">${n1(a)} ${m.un} em ${dfmt(h[0].d)} → ${n1(b)} ${m.un} em ${dfmt(h[h.length - 1].d)}</p></section>
      <div class="sec-h"><h2>Timeline</h2><button ${go('F-43')}>Comparar fotos</button></div>
      <ol class="tl">${tl.map((x) => x.k === 'p'
        ? `<li class="tp" ${act('cmpB', x.i)}><span class="tld">${dfmt(x.d)}</span><div class="thumbs">${['frente', 'lado'].map((ps) => `<div class="thumb">${silhouette(S.photos[x.i].w, ps)}</div>`).join('')}</div><span class="tlt">Fotos · frente e lado</span></li>`
        : `<li><span class="tld">${dfmt(x.d)}</span><div class="tlm"><b class="tnum">${n1(h[x.i].peso)} kg</b><span class="tnum">cintura ${n1(h[x.i].cintura)} · quadril ${n1(h[x.i].quadril)} · braço ${n1(h[x.i].braco)}</span></div></li>`).join('')}</ol>
      <div class="row2"><button class="btn s" ${go('F-41')}>${ico('camera')}Foto</button><button class="btn p" ${go('F-40')}>${ico('ruler')}Medir</button></div>
    </div>${tabbar('F-42')}`;
  } },
'F-43': { name: 'Comparar antes e depois', rf: ['RF-32'], rn: ['RN-13'],
  notes: 'Arraste a divisória para revelar antes/depois. Escolha as datas nos chips; a tabela traz a avaliação mais próxima de cada foto.',
  render() {
    const P = S.photos, A = P[S.cmpA] || P[0], B = P[S.cmpB] || P[P.length - 1];
    const near = (d) => S.hist.reduce((best, x) => (Math.abs(daysBetween(x.d, d)) < Math.abs(daysBetween(best.d, d)) ? x : best), S.hist[0]);
    const ma = near(A.d), mb = near(B.d);
    return `<div class="body ft">${topbar('Comparar', { sub: `${daysBetween(A.d, B.d)} dias entre as fotos` })}
      <div class="wipe" style="--w:${S.wipe}%"><div class="wa">${silhouette(A.w, 'frente')}<span>${dfmt(A.d)}</span></div><div class="wb">${silhouette(B.w, 'frente')}<span>${dfmt(B.d)}</span></div><i class="wl"></i>
        <input type="range" min="5" max="95" value="${S.wipe}" data-input="wipe" aria-label="Divisória antes e depois"></div>
      <div class="fld"><label>Antes</label><div class="chips">${P.map((p, i) => `<button class="fchip${p === A ? ' on' : ''}" ${act('cmpA', i)}>${dfmt(p.d)}</button>`).join('')}</div></div>
      <div class="fld"><label>Depois</label><div class="chips">${P.map((p, i) => `<button class="fchip${p === B ? ' on' : ''}" ${act('cmpB', i)}>${dfmt(p.d)}</button>`).join('')}</div></div>
      <section class="card"><ul class="mstat">${MEASURES.map((m) => { const dv = mb[m.id] - ma[m.id]; return `<li><span>${m.nome}</span><b class="tnum">${n1(ma[m.id])} → ${n1(mb[m.id])}</b><b class="tnum dv ${m.dir && dv && Math.sign(dv) === m.dir ? 'ok' : ''}">${sgn(dv)}</b></li>`; }).join('')}</ul></section>
      <p class="fine">Fotos ilustrativas neste protótipo. No app, são as suas, guardadas só no aparelho.</p>
    </div>`;
  } },

/* =================== E06 vitrine =================== */
'F-50': { name: 'Criar personagem público', rf: ['RF-42', 'RF-46', 'RF-38', 'RF-49'], rn: ['RN-01b', 'RN-17', 'RN-18'],
  notes: 'Identidade pública opcional: apelido + avatar, sem e-mail nem senha (RN-01b). O que compartilhar começa com o sensível desligado e travado por padrão; publicar exige ligar o opt-in.',
  render() {
    const nk = S.nickIn, valid = /^[a-z0-9._]{3,20}$/.test(nk), taken = CHARS.some((c) => c.nick === nk);
    return `<div class="body ft">${topbar('Seu personagem', { sub: 'Público e opcional · não é uma conta' })}
      <div class="avpick">${avatar(nk || 'voce', S.corIn, 'xl')}<div class="pal">${PALETTE.map((c, i) => `<button class="${S.corIn === i ? 'on' : ''}" style="--c:${c}" ${act('cor', i)} aria-label="Cor ${i + 1}"></button>`).join('')}</div></div>
      <div class="fld${nk ? (valid && !taken ? ' ok' : ' bad') : ''}"><label>Apelido</label><label class="inp">@<input data-input="nickIn" value="${esc(nk)}" placeholder="carla.no.ferro" autocomplete="off" maxlength="20"></label><p class="hint" id="nkh">${!nk ? '3 a 20 letras minúsculas, números, ponto ou _' : taken ? 'Já existe alguém com esse apelido' : valid ? 'Disponível' : 'Use só minúsculas, números, ponto ou _'}</p></div>
      <div class="fld"><label>Academia <span class="hint">opcional</span></label><div class="chips">${GYMS.slice(0, 4).map((g) => `<button class="fchip${S.gymIn === g.id ? ' on' : ''}" ${act('gymIn', g.id)}>${g.nome}</button>`).join('')}</div></div>
      <div class="pubrow"><div><b>Publicar resultados na vitrine</b><span>Desligado, ninguém vê nada além do apelido</span></div>${toggle(S.optIn, 'optin', 'Publicar na vitrine')}</div>
      ${note('Peso, medidas, fotos e TMB nunca saem do aparelho sem você ligar um por um.', 'lock')}
      <div class="footcta"><button class="btn p" id="mkchar" ${act('mkchar')} ${valid && !taken ? '' : 'disabled'}>Criar personagem</button></div>
    </div>`;
  } },
'F-51': { name: 'Vitrine', rf: ['RF-37', 'RF-39', 'RF-40', 'RF-41', 'RF-45', 'RF-50'], rn: ['RN-02', 'RN-17', 'RN-22'],
  notes: 'Feed estilo Strava de academia: só ações reais (treino, dieta cumprida, medida, conquista). Apoio (kudos) sem comentários nem DM. Sem personagem, a vitrine é só leitura.',
  render() {
    let list = feed(); if (S.vtab === 'gym' && S.char && S.char.gym) list = list.filter((f) => (f.mine ? S.char.gym : charOf(f.nick).gym) === S.char.gym);
    const banner = !S.char ? `<button class="alert info" ${go(S.onboarded ? 'F-50' : 'F-01')}>${ico('user')}<span><b>Você está só olhando</b>${S.onboarded ? 'Crie um personagem para publicar' : 'Termine o cadastro para publicar'}</span>${ico('next')}</button>`
      : !S.optIn ? `<button class="alert info" ${go('F-54')}>${ico('lock')}<span><b>Sua vitrine está privada</b>Ninguém vê seus treinos</span>${ico('next')}</button>` : '';
    return `<div class="body tb">${brandbar(`<button class="ib" ${go('F-52')} aria-label="Buscar personagens">${ico('search')}</button>`)}
      <h1 class="h-lg tight">Vitrine</h1>
      ${banner}
      <div class="chal">${CHALLENGES.map((c) => { const v = Math.min(c.of, challengeProg(c)); return `<article class="${v >= c.of ? 'ok' : ''}">${ico(c.ico)}<b>${c.nome}</b><div class="bar sm"><i style="width:${(v / c.of) * 100}%"></i></div><span class="tnum">${v}/${c.of}</span></article>`; }).join('')}</div>
      ${S.char && S.char.gym ? seg([['todos', 'Todos'], ['gym', gymOf(S.char.gym).nome]], S.vtab, 'vtab') : ''}
      <button class="gymline" ${go('F-55')}>${ico('pin')}<span>Academias perto de você</span>${ico('next')}</button>
      <div class="feed">${list.map(fcard).join('')}</div>
    </div>${tabbar('F-51')}`;
  } },
'F-52': { name: 'Buscar personagens', rf: ['RF-44', 'RF-45'], rn: ['RN-19'],
  notes: 'Busca por apelido com filtros de objetivo e academia. Só entra quem tem personagem público ativo (RN-19).',
  render() {
    return `<div class="body">${topbar('Buscar personagens')}
      <label class="search">${ico('search')}<input data-input="q" value="${esc(S.q)}" placeholder="Apelido" autocomplete="off"></label>
      <div class="chips scroll">${[['todos', 'Todos'], ...GOALS.filter((g) => g.id !== 'manutencao').map((g) => [g.id, g.nome])].map(([v, l]) => `<button class="fchip${S.qobj === v ? ' on' : ''}" ${act('qobj', v)}>${l}</button>`).join('')}${S.char && S.char.gym ? `<button class="fchip${S.qgym ? ' on' : ''}" ${act('qgym')}>${ico('pin')}Minha academia</button>` : ''}</div>
      <div id="res">${searchResults()}</div>
      ${note('Só aparecem personagens públicos. Quem desliga a vitrine some da busca.', 'eye')}
    </div>`;
  } },
'F-53': { name: 'Perfil público', rf: ['RF-43', 'RF-45', 'RF-46'], rn: ['RN-18'],
  notes: 'Valores e resultados que a pessoa escolheu mostrar: objetivo, streak, PRs, conquistas e, só se ligado, resumo de evolução. Nunca TMB, peso ou medidas por padrão.',
  render() {
    const mine = S.char && S.sel.nick === S.char.nick;
    const c = mine ? { ...S.char, obj: S.prof.obj, streak: streak(), treinos: 87 + (S.sessDone ? 1 : 0), prs: ['Agachamento · 50 kg', 'Supino · 40 kg'], conq: ['Proteína 7/7', '12 dias seguidos'], evol: S.share.evolucao ? `${sgn(lastM().cintura - S.hist[0].cintura)} cm de cintura desde ${dfmt(S.hist[0].d)}` : null } : charOf(S.sel.nick) || CHARS[0];
    const sh = (k) => !mine || S.share[k]; const g = gymOf(c.gym);
    const posts = feed().filter((f) => f.nick === c.nick);
    return `<div class="body">${topbar('', { right: mine ? `<button class="ib" ${go('F-54')} aria-label="Privacidade">${ico('lock')}</button>` : '' })}
      <section class="phead">${avatar(c.nick, c.cor, 'xl')}<h1>@${c.nick}</h1><p>${sh('objetivo') ? chip(goalOf(c.obj).nome, goalOf(c.obj).strat) : ''}${g ? `<button class="gl" ${go('F-56', { gym: g.id })}>${ico('pin')}${g.nome}</button>` : ''}</p></section>
      ${mine && !S.optIn ? note('Assim os outros veriam seu perfil, mas a vitrine está desligada: hoje ninguém vê.', 'lock', 'warn') : ''}
      <div class="kpis three">${sh('streak') ? stat(c.streak, 'dias seguidos') : ''}${sh('treinos') ? stat(c.treinos, 'treinos') : ''}${stat(c.conq.length, 'conquistas')}</div>
      ${sh('prs') && c.prs.length ? `<div class="sec-h"><h2>Recordes</h2></div><div class="card"><ul class="mstat">${c.prs.map((p) => `<li><span>${ico('trophy')}${p.split(' · ')[0]}</span><b class="tnum">${p.split(' · ')[1]}</b></li>`).join('')}</ul></div>` : ''}
      <div class="sec-h"><h2>Conquistas</h2></div><div class="chips">${c.conq.map((q) => chip(ico('spark') + q, 'cq')).join('')}</div>
      ${c.evol ? `<div class="sec-h"><h2>Evolução compartilhada</h2></div><p class="evol">${ico('chart')}${c.evol}</p>` : ''}
      ${posts.length ? `<div class="sec-h"><h2>Atividade</h2></div><div class="feed">${posts.map(fcard).join('')}</div>` : ''}
    </div>`;
  } },
'F-54': { name: 'Privacidade do personagem', rf: ['RF-38', 'RF-46'], rn: ['RN-17', 'RN-18'],
  notes: 'Controle granular do que é público. Sensível (peso, medidas, fotos, TMB) fica em bloco separado e desligado. Desligar a vitrine para as próximas publicações e pode ocultar o histórico (RN-17).',
  render() {
    const row = (k, l, s) => `<div class="pubrow"><div><b>${l}</b><span>${s}</span></div>${toggle(S.share[k], 'share', l, k)}</div>`;
    return `<div class="body">${topbar('Privacidade', { sub: S.char ? '@' + S.char.nick : 'Sem personagem' })}
      <div class="pubrow strong"><div><b>Vitrine ligada</b><span>${S.optIn ? 'Suas ações marcadas como públicas aparecem no feed' : 'Nada novo é publicado'}</span></div>${toggle(S.optIn, 'optin', 'Vitrine')}</div>
      ${!S.optIn ? `<div class="pubrow"><div><b>Ocultar o que já publiquei</b><span>${S.posts.length} publicação${S.posts.length === 1 ? '' : 'ões'} no feed</span></div>${toggle(S.hideOld, 'hideold', 'Ocultar histórico')}</div>` : ''}
      <div class="sec-h"><h2>No perfil e nos cards</h2></div>
      ${row('objetivo', 'Objetivo', 'Ganhar músculo, perder gordura…')}${row('streak', 'Streak', 'Dias seguidos com ação registrada')}${row('treinos', 'Treinos concluídos', 'Duração, kcal e volume')}${row('prs', 'Recordes pessoais', 'Carga e repetições')}${row('dieta', 'Meta da dieta cumprida', 'Só o “cumpriu”, nunca o que comeu')}
      <div class="sec-h"><h2>${ico('lock')} Sensível · desligado por padrão</h2></div>
      ${row('evolucao', 'Resumo de evolução', 'Ex.: “−5 cm de cintura em 10 semanas”')}${row('peso', 'Peso', 'Valor em kg')}${row('medidas', 'Medidas', 'Circunferências')}${row('fotos', 'Fotos de progresso', 'Imagens da timeline')}
      <button class="btn s" ${go('F-53', { nick: S.char ? S.char.nick : '' })} ${S.char ? '' : 'disabled'}>${ico('eye')}Ver como os outros veem</button>
      <button class="btn danger" ${act('rmchar')} ${S.char ? '' : 'disabled'}>${ico('trash')}Apagar personagem</button>
    </div>`;
  } },

/* =================== E07 academias =================== */
'F-55': { name: 'Academias próximas', rf: ['RF-47', 'RF-48'], rn: ['RN-20'],
  notes: 'Com GPS: mapa e lista por distância. Sem permissão (cenário “Sem GPS”): só busca por bairro ou cidade (RN-20). Card com distância, bairro, modalidades e personagens públicos.',
  render() {
    const q = S.gq.trim().toLowerCase(); const list = GYMS.filter((g) => !q || (g.nome + ' ' + g.bairro).toLowerCase().includes(q)).sort((a, b) => a.km - b.km);
    return `<div class="body">${topbar('Academias', { sub: S.gps ? 'Perto de você · São José dos Pinhais' : 'Busca por bairro' })}
      ${S.gps ? fmap(list.map((g) => ({ x: g.x, y: g.y, txt: g.km.toLocaleString('pt-BR') + ' km', cls: S.char && S.char.gym === g.id ? 'mine' : '', attrs: go('F-56', { gym: g.id }), label: g.nome })))
        : `<section class="nogps">${ico('pin')}<div><b>Localização desligada</b><p>Busque pelo bairro ou cidade. Ou ative para ver no mapa.</p></div><button class="btn s sm" ${act('gps')}>Ativar</button></section>`}
      <label class="search">${ico('search')}<input data-input="gq" value="${esc(S.gq)}" placeholder="Bairro, cidade ou nome" autocomplete="off"></label>
      ${!S.gps ? `<div class="chips">${['Centro', 'São Pedro', 'Afonso Pena', 'Cidade Jardim'].map((b) => `<button class="fchip${S.gq === b ? ' on' : ''}" ${act('gq', b)}>${b}</button>`).join('')}</div>` : ''}
      <div id="gres">${gymList(list)}</div>
      ${note('Descoberta e vínculo social. Matrícula e pagamento ficam com a academia.', 'info')}
    </div>`;
  } },
'F-56': { name: 'Academia', rf: ['RF-48', 'RF-49', 'RF-50', 'RF-51'], rn: ['RN-21'],
  notes: '“Treino aqui” vincula o personagem à academia (precisa de personagem). A atividade local vem de personagens públicos vinculados. Sem matrícula ou endosso (RN-21).',
  render() {
    const g = gymOf(S.sel.gym) || GYMS[0], mine = S.char && S.char.gym === g.id;
    const posts = feed().filter((f) => (f.mine ? S.char && S.char.gym : charOf(f.nick).gym) === g.id);
    const people = CHARS.filter((c) => c.gym === g.id);
    return `<div class="body ft">${topbar(g.nome, { sub: `${g.bairro} · ${g.km.toLocaleString('pt-BR')} km` })}
      ${fmap([{ x: 50, y: 50, txt: g.nome, cls: 'big' }], { cls: 'short', you: false })}
      <div class="kpis three">${stat(g.n + (mine ? 1 : 0), 'personagens')}${stat(posts.length, 'atividades hoje')}${stat(g.hora.split('–')[0] === '24 horas' ? '24 h' : g.hora.split('–')[0], 'abre')}</div>
      <div class="chips">${g.mod.map((m) => chip(m, 'meta')).join('')}${chip(ico('clock') + g.hora, 'meta')}</div>
      ${people.length ? `<div class="sec-h"><h2>Quem treina aqui</h2></div><div class="people">${people.map((c) => `<button ${go('F-53', { nick: c.nick })}>${avatar(c.nick, c.cor)}<span>${c.nick}</span></button>`).join('')}${mine ? `<button>${avatar(S.char.nick, S.char.cor)}<span>você</span></button>` : ''}</div>` : ''}
      <div class="sec-h"><h2>Atividade recente</h2></div>
      <div class="feed">${posts.map(fcard).join('') || '<p class="hint">Ninguém publicou daqui ainda.</p>'}</div>
      <div class="footcta">${S.char ? `<button class="btn ${mine ? 's' : 'p'}" ${act('gymlink', g.id)}>${mine ? ico('check') + 'Você treina aqui' : ico('pin') + 'Treino aqui'}</button>` : `<button class="btn s" ${go('F-50')}>Criar personagem para vincular</button>`}</div>
    </div>`;
  } },

/* =================== E08 perfil e estados =================== */
'F-60': { name: 'Você · perfil e recálculo', rf: ['RF-10', 'RF-03', 'RF-14'], rn: ['RN-07', 'RN-08', 'RN-15', 'RN-16'],
  notes: 'Editar peso, objetivo ou atividade mostra antes → depois de meta e macros na hora (RN-07). “Aplicar” troca a estratégia e regenera o plano. O ID do fingerprint fica visível.',
  render() {
    const before = energy(S.base), e = E(), changed = JSON.stringify(S.base) !== JSON.stringify(S.prof);
    const ba = (l, a, b, u = '') => `<li><span>${l}</span><b class="tnum">${a === b ? n0(b) + u : `<s>${n0(a)}</s> → ${n0(b)}${u}`}</b></li>`;
    return `<div class="body ft">${topbar('Você')}
      <div class="fpcard">${ico('finger')}<div><b>Sem conta neste aparelho</b><p>ID <span class="mono">${S.fp}</span> · dados guardados aqui${S.char ? ` · personagem @${S.char.nick}` : ''}</p></div></div>
      <div class="fld"><label>Peso</label>${numstep('peso', S.prof.peso, 'kg', 0.5, 1)}</div>
      <div class="fld"><label>Objetivo</label><div class="chips">${GOALS.map((g) => `<button class="fchip${S.prof.obj === g.id ? ' on' : ''}" ${act('obj', g.id)}>${g.nome}</button>`).join('')}</div></div>
      <div class="fld"><label>Atividade</label><div class="chips">${ACTIVITY.map((a) => `<button class="fchip${S.prof.ativ === a.id ? ' on' : ''}" ${act('ativ', a.id)}>${a.nome}</button>`).join('')}</div></div>
      <section class="card${changed ? ' changed' : ''}"><div class="ch-h"><h2 class="h-sm">${changed ? 'Vai mudar' : 'Estratégia atual'}</h2>${chip(STRAT[e.strat] + (e.mag ? ' ' + e.mag + '%' : ''), e.strat)}</div>
        <ul class="mstat">${ba('TMB', before.tmb, e.tmb, ' kcal')}${ba('Gasto diário', before.tdee, e.tdee, ' kcal')}${ba('Meta', before.meta, e.meta, ' kcal')}${ba('Proteína', before.prot, e.prot, ' g')}${ba('Carbo', before.carb, e.carb, ' g')}${ba('Gordura', before.fat, e.fat, ' g')}</ul></section>
      ${e.extreme ? note('Fora da faixa segura: aplicar pede confirmação.', 'alert', 'warn') : ''}
      <div class="row2"><button class="btn s" ${act('reonb')}>Refazer onboarding</button><button class="btn danger" ${act('sheet', 'wipe')}>${ico('trash')}Apagar dados</button></div>
      <p class="fine">Estimativas de apoio. Não substituem orientação médica ou nutricional.</p>
      <div class="footcta"><button class="btn p" ${act('apply')} ${changed ? '' : 'disabled'}>Aplicar e recalcular plano</button></div>
    </div>`;
  } },
'F-61': { name: 'Vitrine sem internet', rf: ['RF-37'], rn: [], novo: false,
  notes: 'Vitrine, busca e academias precisam de rede (RNF-08). Dieta, treino e avaliação seguem funcionando offline e salvam no aparelho; publicações ficam na fila.',
  render() {
    return `<div class="body">${topbar('Vitrine')}
      <section class="empty">${ico('wifioff')}<h1>A vitrine precisa de internet</h1><p>Treino, dieta e medidas continuam funcionando e ficam salvos neste aparelho.</p>
      ${S.queue ? `<p class="badge cq">${ico('clock')}${S.queue} publicação na fila</p>` : ''}
      <div class="cta-col"><button class="btn p" ${act('retry')}>Tentar de novo</button><button class="btn g" ${go('F-10')}>Ir para hoje</button></div></section>
    </div>`;
  } },
'F-62': { name: 'Aparelho novo', rf: ['RF-04', 'RF-02'], rn: ['RN-01', 'RN-01b'],
  notes: 'Fingerprint diferente = usuário novo. No v1 não existe recuperação (nem pelo personagem, RN-01b). A tela é honesta sobre isso e já leva ao onboarding.',
  render() {
    return `<div class="body ob">${topbar('', { back: false })}
      <section class="empty">${ico('phone')}<h1>Este aparelho é novo para nós</h1><p>Não há dados ligados a <span class="mono">${S.fp}</span>. Como não existe conta, o histórico de outro aparelho não pode ser trazido.</p>
      <details class="disc"><summary>${ico('info')}E o meu personagem?</summary><p>O apelido público não é login. Você pode criar outro aqui; o antigo continua no aparelho anterior. Conta opcional com sincronização está prevista para a v2.</p></details>
      <div class="cta-col"><button class="btn p" ${act('fresh')}>Começar do zero</button></div></section>
    </div>`;
  } },
};

/* listas re-renderizadas no input */
function stockList(list) {
  return FCATS.map((c) => { const fs = list.filter((f) => f.cat === c.id); if (!fs.length) return ''; return `<div class="fld"><label>${c.nome} <span class="hint tnum">${fs.filter((f) => S.stock.includes(f.id)).length}/${fs.length}</span></label><div class="chips">${fs.map((f) => `<button class="fchip${S.stock.includes(f.id) ? ' on' : ''}" ${act('stock', f.id)}>${S.stock.includes(f.id) ? ico('check') : ico('plus')}${f.nome}</button>`).join('')}</div></div>`; }).join('') || '<p class="hint">Nada com esse nome.</p>';
}
function searchResults() {
  const q = S.q.trim().toLowerCase();
  const pool = [...(S.char && S.optIn ? [{ ...S.char, obj: S.prof.obj, streak: streak(), prs: ['Agachamento · 50 kg'], mine: true }] : []), ...CHARS];
  const r = pool.filter((c) => (!q || c.nick.includes(q)) && (S.qobj === 'todos' || c.obj === S.qobj) && (!S.qgym || c.gym === S.char.gym));
  return r.length ? `<ul class="pl">${r.map((c) => `<li ${go('F-53', { nick: c.nick })}>${avatar(c.nick, c.cor)}<div><b>@${c.nick}${c.mine ? ' <i class="you-t">você</i>' : ''}</b><span>${goalOf(c.obj).nome}${c.gym ? ' · ' + gymOf(c.gym).nome : ''}</span>${c.prs[0] ? `<span class="tnum pr">${ico('trophy')}${c.prs[0]}</span>` : ''}</div><span class="streak">${ico('flame')}<b class="tnum">${c.streak}</b></span></li>`).join('')}</ul>`
    : `<section class="empty sm">${ico('search')}<p>Ninguém com “${esc(S.q)}”.</p></section>`;
}
function gymList(list) {
  return list.length ? `<ul class="gl-list">${list.map((g) => `<li ${go('F-56', { gym: g.id })}><span class="gi">${ico('dumbbell')}</span><div><b>${g.nome}${S.char && S.char.gym === g.id ? ' <i class="you-t">você treina</i>' : ''}</b><span>${g.bairro}${S.gps ? ' · ' + g.km.toLocaleString('pt-BR') + ' km' : ''} · ${g.mod.join(', ')}</span><span class="tnum">${g.n} personagens públicos</span></div>${ico('next')}</li>`).join('')}</ul>`
    : `<section class="empty sm">${ico('pin')}<p>Nenhuma academia em “${esc(S.gq)}”.</p></section>`;
}

/* ---------- sheets ---------- */
const EXTRAS = [{ nome: 'Brigadeiro', kcal: 110, p: 1, c: 18, g: 4 }, { nome: 'Pão de queijo · 2 un', kcal: 150, p: 4, c: 20, g: 6 }, { nome: 'Cerveja · lata', kcal: 150, p: 1, c: 13, g: 0 }, { nome: 'Açaí · 300 ml', kcal: 330, p: 3, c: 55, g: 12 }, { nome: 'Whey · 1 scoop', kcal: 120, p: 24, c: 2, g: 2 }];
function sheetHTML() {
  if (!S.sheet) return '';
  let h = '';
  if (S.sheet === 'extra') h = `<h2>Fora do plano</h2><p class="hint">Entra no total do dia.</p><ul class="xlist">${EXTRAS.map((x, i) => `<li><button ${act('extra', i)}><span>${x.nome}</span><b class="tnum">${x.kcal} kcal</b>${ico('plus')}</button></li>`).join('')}</ul>`;
  if (S.sheet === 'extreme') { const e = E(); h = `<h2>${e.meta < e.tmb ? 'Meta abaixo da TMB' : 'Acima da faixa segura'}</h2><p>${n0(e.meta)} kcal/dia é ${e.strat === 'deficit' ? 'um déficit' : 'um superávit'} de ${e.mag}%. Pode funcionar por pouco tempo, mas aumenta perda de massa magra, fome e risco de abandono. Converse com um profissional antes.</p><div class="cta-col"><button class="btn s" ${act('safe')}>Voltar para ${e.g.safe}%</button><button class="btn danger" ${act('confirm')}>Entendo, seguir com ${e.mag}%</button></div>`; }
  if (S.sheet === 'wipe') h = `<h2>Apagar dados deste aparelho?</h2><p>Perfil, dieta, treinos, medidas, fotos e personagem somem. Sem conta, não há como recuperar.</p><div class="cta-col"><button class="btn danger" ${act('wipe')}>Apagar tudo</button><button class="btn g" ${act('sheet-close')}>Cancelar</button></div>`;
  return `<div class="scrim" ${act('sheet-close')}></div><div class="sheet" role="dialog"><i class="grab"></i>${h}</div>`;
}
