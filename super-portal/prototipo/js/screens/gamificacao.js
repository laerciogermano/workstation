/* S · Gamificação dos vendedores: pontos calculados do que acontece no portal, ranking, conquistas e desafios. */
(() => {
const e = v => SP.esc(v), I = (n, s) => SP.icon(n, s), db = () => SP.S.db;
const MES = () => SP.HOJE.slice(0, 7);
const vendedores = () => db().vendedores.filter(v => v.ativo);
const regra = id => db().regrasPontos.find(r => r.id === id);
const NIVEIS = [['Bronze', 0], ['Prata', 100], ['Ouro', 250], ['Diamante', 500]];
const nivel = p => { const i = NIVEIS.findLastIndex(n => p >= n[1]); return { nome: NIVEIS[i][0], prox: NIVEIS[i + 1], pct: NIVEIS[i + 1] ? Math.round((p - NIVEIS[i][1]) / (NIVEIS[i + 1][1] - NIVEIS[i][1]) * 100) : 100 }; };
const pillNivel = p => { const n = nivel(p).nome; return SP.pill({ Bronze: 'mute', Prata: 'info', Ouro: 'warn', Diamante: 'ok' }[n], n); };

/* cada acontecimento do mês que vale ponto; regra desligada não conta */
const eventos = v => {
  const l = [], add = (id, txt, em) => { const r = regra(id); if (r?.ligada && (!em || em.startsWith(MES()))) l.push({ regra: id, txt, em, pontos: r.pontos }); };
  db().orcamentos.filter(o => o.vendedor === v.id).forEach(o => { const quem = o.numero + ' · ' + SP.cli(o.cliente).nome;
    if (['Enviado', 'Contra proposta', 'Aprovado', 'Reprovado'].includes(o.status)) add('enviada', 'Proposta ' + quem, o.data);
    if (o.status === 'Aprovado') add('aprovada', 'Proposta ' + quem, o.data); });
  db().pedidos.filter(p => p.vendedor === v.id && p.pago).forEach(p => add('pago', 'Pedido ' + p.numero + ' · ' + SP.cli(p.cliente).nome, p.data));
  db().leads.forEach(x => { x.hist.filter(h => h.por === v.nome && !/^Convertido|^Ligado|^Etapa|^Responsável|^Fora/.test(h.txt)).forEach(h => add('contato', x.empresa + ' · ' + h.txt, h.em));
    if (x.status === 'Convertido' && x.dono === v.id) add('convertido', x.empresa, x.hist[0]?.em || x.criado); });
  db().tarefas.filter(t => t.dono === v.nome && t.coluna === 'feito').forEach(t => add('tarefa', t.nome, t.prazo));
  return l.sort((a, b) => String(b.em).localeCompare(String(a.em)));
};
const pontos = v => eventos(v).reduce((s, x) => s + x.pontos, 0);
const ranking = () => vendedores().map(v => ({ ...v, pts: pontos(v) })).sort((a, b) => b.pts - a.pts || a.nome.localeCompare(b.nome)).map((v, i) => ({ ...v, pos: i + 1 }));
/* o vendedor vê a si; o administrador escolhe quem olhar */
const quem = () => SP.by('vendedores', SP.S.persona === 'vendedor' ? 'v1' : SP.S.tab.gami || 'v1') || vendedores()[0];
const seletor = () => SP.S.persona === 'vendedor' ? '' : SP.seg(quem().id, vendedores().map(v => [v.id, e(v.nome.split(' ')[0])]), 'tab', 'gami');
const conta = (v, id) => eventos(v).filter(x => x.regra === id).length;

/* ---------- ranking ---------- */
SP.screen('ranking', { code: 'F104', nome: 'Ranking de vendedores', flow: 'S', src: ['novo:Gamificação'], nota: 'Posição, pontos e nível de cada vendedor no mês. Os pontos saem do que acontece no portal.',
  render(ctx) {
    const l = ranking(), lider = l[0], eu = SP.S.persona === 'vendedor' ? l.find(v => v.id === 'v1') : null;
    return { titulo: 'Ranking', sub: 'Novembro de 2026', acoes: SP.btn(ctx.m ? '' : 'Desafios', { go: 'desafios', icon: 'trophy', title: 'Desafios' }) + (SP.pode('regrasPontos') ? SP.btn(ctx.m ? '' : 'Regras', { go: 'regrasPontos', icon: 'sliders', title: 'Regras de pontuação' }) : ''),
      corpo: `<div class="stats">${eu ? SP.stat('Sua posição', eu.pos + 'º', eu.pos > 1 ? 'faltam ' + (l[eu.pos - 2].pts - eu.pts + 1) + ' pontos para subir' : 'você lidera', { go: 'meusPontos' }) : SP.stat('Na frente', e(lider.nome.split(' ')[0]), lider.pts + ' pontos')}${SP.stat('Pontos do time', l.reduce((s, v) => s + v.pts, 0))}${SP.stat('Desafios abertos', db().desafios.filter(d => d.fim >= SP.HOJE).length, '', { go: 'desafios' })}</div>`
        + SP.card(`<ol class="podio">${l.map(v => `<li class="${v.id === eu?.id ? 'eu' : ''}"><b class="pos">${v.pos}º</b>${SP.avatar(v.nome)}<div><b>${e(v.nome)}</b>${SP.barra(Math.round(v.pts / Math.max(1, lider.pts) * 100))}</div>${pillNivel(v.pts)}<strong>${v.pts}</strong></li>`).join('')}</ol>`, { title: 'Pontos no mês' }) };
  } });

/* ---------- minha pontuação ---------- */
SP.screen('meusPontos', { code: 'F105', nome: 'Minha pontuação', flow: 'S', src: ['novo:Extrato de pontos'], nota: 'Total, nível, quanto falta para o próximo e o extrato com a origem de cada ponto.',
  render(ctx) {
    const v = quem(), ev = eventos(v), total = ev.reduce((s, x) => s + x.pontos, 0), n = nivel(total), pos = ranking().find(x => x.id === v.id)?.pos;
    return { titulo: SP.S.persona === 'vendedor' ? 'Minha pontuação' : 'Pontuação · ' + e(v.nome), sub: 'Novembro de 2026', acoes: SP.btn(ctx.m ? '' : 'Conquistas', { go: 'conquistas', icon: 'trophy', title: 'Conquistas' }),
      corpo: seletor() + `<div class="stats">${SP.stat('Pontos', total)}${SP.stat('Posição', pos + 'º', 'de ' + vendedores().length)}${SP.stat('Nível', n.nome, n.prox ? `faltam ${n.prox[1] - total} para ${n.prox[0]}` : 'nível máximo', { extra: SP.barra(n.pct) })}</div>`
        + SP.card(ev.length ? SP.linha(ev.map(x => ({ titulo: `+${x.pontos} · ${e(regra(x.regra).nome)}`, sub: e(x.txt) + (x.em ? ' · ' + SP.data(x.em) : ''), icon: 'check' }))) : '<p class="mute">Nenhum ponto neste mês.</p>', { title: 'Extrato' }) };
  } });

/* ---------- conquistas ---------- */
const CONQUISTAS = [
  ['Primeira venda', 'Ter uma proposta aprovada', 1, v => conta(v, 'aprovada')],
  ['Ritmo forte', 'Enviar 3 propostas no mês', 3, v => conta(v, 'enviada')],
  ['Caçador de leads', 'Converter um lead em cliente', 1, v => conta(v, 'convertido')],
  ['Presença constante', 'Registrar 3 contatos com leads', 3, v => conta(v, 'contato')],
  ['Dinheiro no caixa', 'Ter um pedido pago', 1, v => conta(v, 'pago')],
  ['Meta batida', 'Chegar a 100% da meta de vendas', 100, v => Math.round(v.vendido / (v.meta || 1) * 100)],
];
SP.screen('conquistas', { code: 'F106', nome: 'Conquistas', flow: 'S', src: ['novo:Medalhas'], nota: 'Medalhas liberadas e o progresso das que faltam.',
  render() {
    const v = quem(), l = CONQUISTAS.map(([nome, desc, alvo, f]) => ({ nome, desc, alvo, tem: Math.min(alvo, f(v)) })).sort((a, b) => b.tem / b.alvo - a.tem / a.alvo), ok = l.filter(c => c.tem >= c.alvo).length;
    return { titulo: 'Conquistas', sub: `${e(v.nome)} · ${ok} de ${l.length} liberadas`,
      corpo: seletor() + `<div class="tiles curtos">${l.map(c => SP.card(`<div class="row nw medalha${c.tem >= c.alvo ? ' ok' : ''}"><i>${I(c.tem >= c.alvo ? 'trophy' : 'lock', 20)}</i><div><b>${c.nome}</b><p class="mute">${c.desc}</p></div></div>${SP.barra(Math.round(c.tem / c.alvo * 100))}<small class="mute">${c.tem >= c.alvo ? 'Liberada' : c.tem + ' de ' + c.alvo + (c.alvo === 100 ? '%' : '')}</small>`)).join('')}</div>` };
  } });

/* ---------- desafios ---------- */
SP.screen('desafios', { code: 'F107', nome: 'Desafios e prêmios', flow: 'S', src: ['novo:Desafios por período'], nota: 'Cada desafio tem ação, quantidade, prazo e prêmio, com o progresso de cada vendedor.',
  render(ctx) {
    const edita = SP.pode('desafioForm'), vs = SP.S.persona === 'vendedor' ? vendedores().filter(v => v.id === 'v1') : vendedores();
    const cartao = d => { const fim = d.fim < SP.HOJE;
      return SP.card(`<p class="mute">${d.meta} × ${e(regra(d.regra).nome.toLowerCase())} · ${fim ? 'encerrado em' : 'até'} ${SP.data(d.fim)}</p><p><b>Prêmio:</b> ${e(d.premio)}</p><ul class="pilha">${vs.map(v => { const n = conta(v, d.regra); return `<li class="prog"><span>${e(v.nome.split(' ')[0])}</span>${SP.barra(Math.round(n / d.meta * 100))}<b>${n >= d.meta ? 'Concluído' : n + ' de ' + d.meta}</b></li>`; }).join('')}</ul>`, { title: e(d.nome), actions: edita ? SP.btn('Editar', { go: 'desafioForm', id: d.id, sm: true, icon: 'edit' }) : '' }); };
    return { titulo: 'Desafios', acoes: edita ? SP.btn(ctx.m ? '' : 'Novo desafio', { go: 'desafioForm', id: 'novo', icon: 'plus', kind: 'primary', title: 'Novo desafio' }) : '',
      corpo: db().desafios.length ? `<div class="tiles">${db().desafios.map(cartao).join('')}</div>` : SP.vazio('Nenhum desafio', 'Crie um desafio para o time.', '', 'trophy') };
  } });
SP.cadastro({ key: 'desafioForm', code: 'F108', nome: 'Cadastro de desafio', flow: 'S', col: 'desafios', lista: 'desafios', exemplo: 'g1', src: ['novo:Desafios por período'], nota: 'Só o administrador cria e edita.', titulo: ['Novo desafio', 'Desafio'],
  novo: { nome: '', regra: 'aprovada', meta: 3, fim: '2026-11-30', premio: '' }, obrig: [['nome', 'nome'], ['premio', 'prêmio']], numericos: ['meta'],
  antesSalvar: x => { x.meta = Math.max(1, Math.round(x.meta) || 1); },
  campos: () => [['nome', 'Nome', { req: true, span: 2 }], ['regra', 'Ação que conta', { options: db().regrasPontos.map(r => [r.id, r.nome]) }], ['meta', 'Quantidade', { type: 'number' }], ['fim', 'Termina em', { type: 'date' }], ['premio', 'Prêmio', { req: true, span: 2 }]] });
SP.screens.desafioForm.soAdmin = true;

/* ---------- regras ---------- */
SP.screen('regrasPontos', { code: 'F109', nome: 'Regras de pontuação', flow: 'S', soAdmin: true, src: ['novo:Pontos configuráveis'], nota: 'Quanto vale cada ação, liga e desliga, e os níveis. Mudou aqui, o ranking recalcula.',
  render() {
    return { titulo: 'Regras de pontuação', sub: 'Vale para o mês corrente.',
      corpo: SP.card(`<ul class="pilha">${db().regrasPontos.map(r => `<li class="regra-p">${SP.sw(r.ligada, 'gamiLigar', r.id, 'Ligar ' + r.nome)}<div><b>${e(r.nome)}</b><small>${e(r.quando)}</small></div><label class="f inline"><input type="number" min="0" data-pontos="${r.id}" value="${r.pontos}" aria-label="Pontos de ${e(r.nome)}"><span>pontos</span></label></li>`).join('')}</ul>`, { title: 'Ações que valem ponto', cls: 'estreito' })
        + SP.card(`<table class="tb mini"><thead><tr><th>Nível</th><th class="r">A partir de</th></tr></thead><tbody>${NIVEIS.map(([n, p]) => `<tr><td>${n}</td><td class="r">${p} pontos</td></tr>`).join('')}</tbody></table>`, { title: 'Níveis', cls: 'estreito' }) };
  } });
SP.actions.gamiLigar = el => { const r = regra(el.dataset.p); r.ligada = !r.ligada; };
document.addEventListener('change', ev => { const el = ev.target.closest?.('[data-pontos]'); if (!el) return; regra(el.dataset.pontos).pontos = Math.max(0, Math.round(+el.value) || 0); SP.toast('Pontos atualizados.'); SP.draw(); });
})();
