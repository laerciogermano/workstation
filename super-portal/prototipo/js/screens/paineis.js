/* Q · Dashboards: comercial, operação, financeiro e um painel montado pela pessoa. */
(() => {
const e = v => SP.esc(v), db = () => SP.S.db;
const meu = l => SP.S.persona === 'vendedor' ? l.filter(o => o.vendedor === 'v1') : l;
const soma = (l, f) => l.reduce((s, x) => s + f(x), 0);
const contagem = v => SP.num(v);
const barras = (titulo, itens, fmt) => SP.card(itens.some(i => i.v) ? SP.barrasH(itens, fmt) : '<p class="mute">Sem dados.</p>', { title: titulo });
const vendas = () => meu(db().pedidos).filter(p => !['Cancelado', 'Rascunho', 'Reprovado'].includes(p.status));
const abertas = () => meu(db().orcamentos).filter(o => ['Em aberto', 'Enviado', 'Contra proposta'].includes(o.status));
const receber = () => db().contas.filter(c => !['Quitada', 'Estornada'].includes(c.status));
const vencidos = () => db().contas.filter(c => SP.contaStatus(c) === 'Vencida');
const parados = () => SP.ativos().filter(SP.parado);
const andando = () => SP.ativos().filter(p => SP.etapa(p) !== 'ok');
const baixar = ctx => SP.btn(ctx.m ? '' : 'Baixar relatório', { a: 'imprimir', icon: 'download', title: 'Baixar relatório' });

/* indicadores reaproveitados pelos painéis e pelo painel montável */
const IND = {
  propostas: ['Propostas abertas', 'dashComercial', () => SP.stat('Propostas abertas', SP.brlk(soma(abertas(), SP.total)), SP.plural(abertas().length, 'proposta', 'propostas'))],
  aprovacao: ['Taxa de aprovação', 'dashComercial', () => { const a = meu(db().orcamentos).filter(o => o.status === 'Aprovado').length, d = a + meu(db().orcamentos).filter(o => ['Reprovado', 'Cancelado'].includes(o.status)).length; return SP.stat('Taxa de aprovação', d ? Math.round(a / d * 100) + '%' : '—', `${a} de ${d} decididas`); }],
  ticket: ['Ticket médio', 'dashComercial', () => SP.stat('Ticket médio', SP.brlk(vendas().length ? soma(vendas(), SP.total) / vendas().length : 0), SP.plural(vendas().length, 'pedido', 'pedidos'))],
  parados: ['Pedidos parados', 'dashOperacao', () => SP.stat('Pedidos parados', parados().length, 'há ' + db().params.diasParado + ' dias ou mais', { tom: parados().length ? 'bad' : 'ok' })],
  receber: ['A receber', 'dashFin', () => SP.stat('A receber', SP.brlk(soma(receber(), c => c.valor)), SP.plural(receber().length, 'título', 'títulos'))],
  vencido: ['Vencido', 'dashFin', () => SP.stat('Vencido', SP.brlk(soma(vencidos(), c => c.valor)), SP.plural(vencidos().length, 'título', 'títulos'), { tom: vencidos().length ? 'bad' : 'ok' })],
};
const stats = ks => `<div class="stats">${ks.map(k => IND[k][2]()).join('')}</div>`;
const GRAF = {
  status: ['Propostas por status', 'dashComercial', () => barras('Propostas por status', ['Em aberto', 'Enviado', 'Contra proposta', 'Aprovado', 'Reprovado'].map(s => ({ n: s, v: soma(meu(db().orcamentos).filter(o => o.status === s), SP.total) })))],
  vendedores: ['Vendas por vendedor', 'dashComercial', () => barras('Vendas em novembro por vendedor', db().vendedores.filter(v => v.ativo && (SP.S.persona !== 'vendedor' || v.id === 'v1')).map(v => ({ n: v.nome, v: v.vendido })).sort((a, b) => b.v - a.v))],
  clientes: ['Maiores clientes', 'dashComercial', () => barras('Maiores clientes em pedidos', db().clientes.map(c => ({ n: c.nome, v: soma(vendas().filter(p => p.cliente === c.id), SP.total) })).filter(x => x.v).sort((a, b) => b.v - a.v).slice(0, 5))],
  etapas: ['Pedidos por etapa', 'dashOperacao', () => barras('Pedidos por etapa', Object.entries(SP.ETAPAS).filter(([k]) => !['novo', 'ok'].includes(k)).map(([k, [n]]) => ({ n, v: SP.ativos().filter(p => SP.etapa(p) === k).length })), contagem)],
  entrega: ['Entregas por status', 'dashOperacao', () => barras('Entregas por status', SP.LOG.map(s => ({ n: s, v: db().pedidos.filter(p => !['Cancelado', 'Rascunho', 'Reprovado'].includes(p.status) && SP.logStatus(p) === s).length })), contagem)],
  atraso: ['Vencidos por tempo', 'dashFin', () => barras('Vencidos por tempo de atraso', [['Até 7 dias', 1, 7], ['8 a 30 dias', 8, 30], ['Mais de 30 dias', 31, 1e5]].map(([n, de, ate]) => ({ n, v: soma(vencidos().filter(c => SP.dias(c.vencimento) >= de && SP.dias(c.vencimento) <= ate), c => c.valor) })))],
  fluxo: ['Previsto × realizado', 'dashFin', ctx => SP.card(SP.graficoFluxo(ctx, db().faturamentoMes.length - 1), { title: 'Faturamento: previsto × realizado' })],
};
const painel = (o) => SP.screen(o.key, { code: o.code, nome: o.nome, flow: 'Q', src: ['novo:Dashboards por área'], nota: o.nota,
  render(ctx) { return { titulo: o.nome, sub: o.sub, acoes: (o.montar ? SP.btn(ctx.m ? '' : 'Meu painel', { go: 'dashMontar', icon: 'sliders', title: 'Montar meu painel' }) : '') + baixar(ctx), corpo: `<div data-print class="pilha">${o.corpo(ctx)}</div>` }; } });

painel({ key: 'dashComercial', code: 'F95', nome: 'Dashboard comercial', sub: 'Novembro de 2026', montar: true, nota: 'Propostas abertas, aprovação, ticket médio, status, vendedores e maiores clientes. O vendedor vê só o que é dele.',
  corpo: ctx => stats(['propostas', 'aprovacao', 'ticket']) + `<div class="cols c2"><div class="pilha">${GRAF.status[2](ctx)}${GRAF.clientes[2](ctx)}</div>${GRAF.vendedores[2](ctx)}</div>` });
painel({ key: 'dashOperacao', code: 'F96', nome: 'Dashboard de operação', sub: 'Situação de hoje', nota: 'Pedidos parados, etapas, entregas e a lista do que está há mais tempo sem andamento.',
  corpo: ctx => { const l = parados().sort((a, b) => a.atualizado.localeCompare(b.atualizado));
    return `<div class="stats">${SP.stat('Pedidos em andamento', andando().length)}${IND.parados[2]()}${SP.stat('A caminho', db().pedidos.filter(p => p.enviado && !p.recebido).length)}${SP.stat('Itens a comprar', soma(SP.ativos(), p => p.itens.filter(i => !i.comprado).length))}</div><div class="cols c2">${GRAF.etapas[2](ctx)}${GRAF.entrega[2](ctx)}</div>${SP.card(l.length ? SP.linha(l.map(p => ({ titulo: `Pedido ${p.numero} · ${e(SP.cli(p.cliente).nome)}`, sub: e(SP.rotulo(p)) + ' · parado há ' + SP.dias(p.atualizado) + ' dias', icon: 'clock' }))) : '<p class="mute">Nada parado.</p>', { title: 'Há mais tempo sem andamento' })}`; } });
painel({ key: 'dashFin', code: 'F97', nome: 'Dashboard financeiro', sub: 'Posição de hoje', nota: 'A receber, vencido, recebido no mês, previsto × realizado e atraso.',
  corpo: ctx => { const pagos = db().contas.filter(c => c.status === 'Quitada' && c.pagamento.startsWith(SP.HOJE.slice(0, 7))), m = db().faturamentoMes.at(-1);
    return `<div class="stats">${IND.receber[2]()}${IND.vencido[2]()}${SP.stat('Recebido em novembro', SP.brlk(soma(pagos, c => c.valor)), SP.plural(pagos.length, 'título', 'títulos'))}${SP.stat('Faturamento de novembro', SP.brlk(m[2]), Math.round(m[2] / m[1] * 100) + '% do previsto')}</div>${GRAF.fluxo[2](ctx)}${GRAF.atraso[2](ctx)}`; } });

const TODOS = { ...IND, ...GRAF };
SP.screen('dashMontar', { code: 'F98', nome: 'Montar meu painel', flow: 'Q', pai: 'dashComercial', src: ['novo:Painel por pessoa'], nota: 'A pessoa escolhe os indicadores e gráficos que quer ver, entre os que o perfil acessa.',
  render(ctx) {
    const pode = Object.entries(TODOS).filter(([, v]) => SP.pode(v[1])), sel = db().painel.filter(k => pode.some(p => p[0] === k));
    const escolha = SP.card(`<div class="pilha">${pode.map(([k, v]) => SP.check(sel.includes(k), 'painelItem', k, k, v[0])).join('')}</div>`, { title: 'O que aparece' });
    const ind = sel.filter(k => IND[k]), graf = sel.filter(k => GRAF[k]);
    const previa = sel.length ? (ind.length ? stats(ind) : '') + graf.map(k => GRAF[k][2](ctx)).join('') : SP.card(SP.vazio('Painel vazio', 'Marque ao menos um item.', '', 'chart'));
    return { titulo: 'Meu painel', voltar: 'dashComercial', acoes: baixar(ctx), corpo: `<div class="cols montar"><div data-print class="pilha">${previa}</div>${escolha}</div>` };
  } });
SP.actions.painelItem = el => { const l = db().painel, k = el.dataset.p; db().painel = l.includes(k) ? l.filter(x => x !== k) : [...l, k]; };
})();
