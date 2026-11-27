/* B · Início: Hoje, Precisa de você, Atividade, Notificações, Busca, Menu. */
(() => {
const e = v => SP.esc(v), I = (n, s) => SP.icon(n, s), db = () => SP.S.db;
const TIPOS = { dados: ['Dados faltando', 'edit'], nf: ['Aprovar NF-e', 'nf'], contra: ['Negociação', 'transfer'], cobranca: ['Cobrança', 'money'], oc: ['OC recebida', 'mail'], followup: ['Follow-up', 'send'], compra: ['Compra atrasada', 'clock'], gerar: ['Gerar pedido', 'cart'], boleto: ['Boleto', 'barcode'] };
const PRIO = { alta: ['Urgente', 'bad'], media: ['Hoje', 'warn'], baixa: ['Quando der', 'mute'] };
const ordem = { alta: 0, media: 1, baixa: 2 };
const itensFila = () => SP.pendentes().sort((a, b) => ordem[a.prio] - ordem[b.prio]);
const cartaoFila = (f, ativo, go) => `<li><button type="button" class="fi${ativo ? ' on' : ''}" ${go}><span class="fi-i t-${PRIO[f.prio][1]}">${I(TIPOS[f.tipo]?.[1] || 'alert', 17)}</span><span class="fi-c"><b>${e(f.titulo)}</b><small><span class="t-${PRIO[f.prio][1]} txt">${PRIO[f.prio][0]}</span> · ${TIPOS[f.tipo]?.[0] || ''}${f.valor ? ' · ' + SP.brl(f.valor) : ''}</small></span>${I('next', 15)}</button></li>`;

/* ---------- calendário: feriados nacionais e datas do comércio ---------- */
const pascoa = a => { const b = a % 19, c = Math.floor(a / 100), d = a % 100, f = Math.floor((c + 8) / 25), h = (19 * b + c - Math.floor(c / 4) - Math.floor((c - f + 1) / 3) + 15) % 30, l = (32 + 2 * (c % 4) + 2 * Math.floor(d / 4) - h - d % 4) % 7, m = Math.floor((b + 11 * h + 22 * l) / 451); return new Date(a, Math.floor((h + l - 7 * m + 114) / 31) - 1, (h + l - 7 * m + 114) % 31 + 1); };
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const eventos = a => {
  const p = pascoa(a), mv = n => { const d = new Date(p); d.setDate(d.getDate() + n); return d; }, fx = (m, d) => new Date(a, m - 1, d);
  const nDom = (m, n) => { const d = fx(m, 1); d.setDate(1 + (7 - d.getDay()) % 7 + 7 * (n - 1)); return d; };
  const bf = new Date(a, 11, 0); bf.setDate(bf.getDate() - ((bf.getDay() - 5 + 7) % 7)); const cm = new Date(bf); cm.setDate(cm.getDate() + 3);
  const f = [[fx(1, 1), 'Confraternização Universal'], [mv(-2), 'Sexta-feira Santa'], [fx(4, 21), 'Tiradentes'], [fx(5, 1), 'Dia do Trabalho'], [fx(9, 7), 'Independência'], [fx(10, 12), 'Nossa Senhora Aparecida'], [fx(11, 2), 'Finados'], [fx(11, 15), 'Proclamação da República'], [fx(11, 20), 'Consciência Negra'], [fx(12, 25), 'Natal']].map(([d, n]) => [iso(d), n, 'fer']);
  const fac = [[mv(-48), 'Carnaval'], [mv(-47), 'Carnaval'], [mv(-46), 'Cinzas (até 14h)'], [mv(60), 'Corpus Christi']].map(([d, n]) => [iso(d), n, 'fac']);
  const pro = [[fx(3, 15), 'Dia do Consumidor'], [fx(4, 28), 'Dia do Frete Grátis'], [nDom(5, 2), 'Dia das Mães'], [fx(6, 12), 'Dia dos Namorados'], [nDom(8, 2), 'Dia dos Pais'], [fx(9, 15), 'Dia do Cliente'], [fx(10, 12), 'Dia das Crianças'], [fx(10, 31), 'Halloween'], [bf, 'Black Friday'], [cm, 'Cyber Monday'], [fx(12, 25), 'Natal']].map(([d, n]) => [iso(d), n, 'pro']);
  return [...f, ...fac, ...pro].sort((x, y) => x[0].localeCompare(y[0]));
};
const ROT = { fer: ['Feriado', 'bad'], fac: ['Facultativo', 'warn'], pro: ['Comércio', 'alt'] };
SP.calendario = () => {
  const [a, m] = (SP.S.calMes || SP.HOJE.slice(0, 7)).split('-').map(Number);
  const ev = eventos(a), ini = new Date(a, m - 1, 1).getDay(), n = new Date(a, m, 0).getDate(), pref = `${a}-${String(m).padStart(2, '0')}`;
  const dias = Array.from({ length: n }, (_, i) => { const k = pref + '-' + String(i + 1).padStart(2, '0'), x = ev.filter(v => v[0] === k); return `<span class="${x.length ? 'ev t-' + ROT[x[0][2]][1] : ''}${k === SP.HOJE ? ' hoje' : ''}"${x.length ? ` title="${x.map(v => v[1]).join(', ')}"` : ''}>${i + 1}</span>`; }).join('');
  const prox = ev.concat(eventos(a + 1)).filter(v => v[0] >= (pref === SP.HOJE.slice(0, 7) ? SP.HOJE : pref + '-01')).slice(0, 4);
  const nome = new Date(a, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return SP.card(`<div class="cal"><div class="cal-s">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => `<em>${d}</em>`).join('')}${'<span></span>'.repeat(ini)}${dias}</div><ul class="cal-l">${prox.map(v => `<li><b>${SP.dataCurta(v[0])}</b><span>${v[1]}</span><span class="pill t-${ROT[v[2]][1]}"><i></i>${ROT[v[2]][0]}</span></li>`).join('')}</ul></div>`, { title: nome[0].toUpperCase() + nome.slice(1), actions: SP.btn('', { icon: 'back', title: 'Mês anterior', a: 'cal', v: -1, kind: 'quiet', sm: true }) + SP.btn('', { icon: 'next', title: 'Próximo mês', a: 'cal', v: 1, kind: 'quiet', sm: true }) });
};

const funil = () => {
  const o = db().orcamentos.filter(x => ['Em aberto', 'Enviado', 'Contra proposta'].includes(x.status)), at = SP.ativos();
  const cont = k => at.filter(p => k.includes(SP.etapa(p)));
  const et = [['Propostas abertas', o, 'orcLista'], ['Comprar', cont(['compra']), 'checklist'], ['Receber', cont(['chegada']), 'checklist'], ['Faturar', cont(['fat']), 'checklist'], ['Entregar', cont(['envio']), 'logistica'], ['A receber', cont(['recebido']), 'contas']];
  return `<div class="funil">${et.map(([n, l, go]) => `<button type="button" data-go="${go}"><span>${n}</span><b>${l.length}</b><small>${SP.brlk(l.reduce((s, x) => s + SP.total(x), 0))}</small></button>`).join('')}</div>`;
};
SP.ranking = () => SP.card(`<ol class="rank">${db().vendedores.filter(v => v.ativo).sort((a, b) => b.vendido - a.vendido).map((v, i) => `<li><em>${i + 1}º</em>${SP.avatar(v.nome, true)}<div><b>${e(v.nome)}</b>${SP.barra(Math.round(v.vendido / v.meta * 100))}</div><span><b>${SP.brlk(v.vendido)}</b><small>${Math.round(v.vendido / v.meta * 100)}% da meta</small></span></li>`).join('')}</ol>`, { title: 'Vendedores em novembro' });

SP.screen('hoje', {
  code: 'B-10', nome: 'Hoje', flow: 'B', exemplo: null, src: ['print:dashboard', 'proc:Dashboard', 'visao:Handoff humano', 'visao:Vendedor'],
  nota: 'Abre pelo que depende de uma pessoa; depois mostra o que o portal fez sozinho, o funil, o resultado do mês, o ranking e o calendário. Cada papel vê o próprio recorte.',
  render(ctx) {
    const eu = SP.eu(), fila = itensFila(), vend = SP.S.persona === 'vendedor', log = SP.S.persona === 'logistica';
    const auto = db().atividade.filter(a => a.tipo === 'auto' && SP.dias(a.em.slice(0, 10)) <= 1);
    const ab = db().contas.filter(c => !['Quitada', 'Estornada'].includes(c.status));
    const venc = ab.filter(c => SP.contaStatus(c) === 'Vencida');
    const mes = db().faturamentoMes, real = mes.at(-1)[2], meta = mes.at(-1)[1], v = db().vendedores[0];
    const stats = vend ? SP.stat('Meu faturamento do mês', SP.brlk(v.vendido), Math.round(v.vendido / v.meta * 100) + '% da meta de ' + SP.brlk(v.meta), { extra: SP.barra(v.vendido / v.meta * 100) }) + SP.stat('Propostas em aberto', db().orcamentos.filter(o => o.vendedor === 'v1' && ['Em aberto', 'Enviado', 'Contra proposta'].includes(o.status)).length, 'esperando o cliente ou você', { go: 'orcLista' })
      : log ? SP.stat('Pedidos para expedir', SP.ativos().filter(p => SP.etapa(p) === 'envio').length, 'NF e boleto prontos', { go: 'logistica' }) + SP.stat('Parados há ' + db().params.diasParado + '+ dias', SP.ativos().filter(SP.parado).length, 'precisam de ação', { go: 'parados', tom: 'bad' })
        : SP.stat('Faturamento de novembro', SP.brlk(real), Math.round(real / meta * 100) + '% do previsto', { go: 'faturamento', extra: SP.spark(mes.map(m => m[2])) }) + SP.stat('A receber', SP.brlk(ab.reduce((s, c) => s + c.valor, 0)), SP.plural(venc.length, 'título vencido', 'títulos vencidos') + ' · ' + SP.brl(venc.reduce((s, c) => s + c.valor, 0)), { go: 'contas', tom: venc.length ? 'bad' : '' });
    const precisa = SP.card(fila.length ? `<ul class="fila">${fila.slice(0, ctx.m ? 3 : 5).map(f => cartaoFila(f, false, `data-go="filaItem" data-id="${f.id}"`)).join('')}</ul>` : SP.vazio('Nada esperando você', 'O que for automático segue sozinho.'), { title: `Precisa de você <em class="cont">${fila.length}</em>`, actions: SP.btn('Ver tudo', { go: 'fila', sm: true, kind: 'quiet' }) });
    const feito = SP.card(SP.linha(auto.slice(0, ctx.m ? 3 : 5).map(SP.recibo)), { title: SP.S.pausado ? 'Automação pausada' : `O portal fez sozinho <em class="cont">${auto.length}</em>`, actions: SP.btn('Atividade', { go: 'atividade', sm: true, kind: 'quiet' }) });
    const pausa = SP.S.pausado ? SP.aviso('As regras automáticas estão <b>pausadas</b>. Nada é enviado nem emitido.', 'warn', SP.btn('Retomar', { a: 'pausar', sm: true })) : '';
    return {
      titulo: 'Bom dia, ' + eu.nome.split(' ')[0], sub: fila.length ? SP.plural(fila.length, 'item precisa', 'itens precisam') + ' de uma pessoa hoje, ' + SP.data(SP.HOJE) : 'Tudo em dia, ' + SP.data(SP.HOJE),
      acoes: SP.btn('Novo orçamento', { icon: 'plus', go: log ? 'pedLista' : 'orcNovo', kind: 'primary' }),
      corpo: `${pausa}<div class="stats">${stats}</div>${funil()}<div class="cols c2"><div class="pilha">${precisa}${feito}</div><div class="pilha">${log ? '' : SP.ranking()}${SP.calendario()}</div></div>`,
    };
  },
});

/* ---------- Precisa de você ---------- */
const payload = (f, ctx) => {
  const [t, id] = f.ref;
  if (f.tipo === 'dados') {
    const p = SP.ped(id); const d = SP.draft(ctx, 'dados:' + id, () => SP.clone(p));
    return `<h4>Complete e o portal continua</h4>${SP.grade(SP.campo(d, 'cep', 'CEP', { ph: '00000-000' }) + SP.campo(d, 'endereco', 'Endereço', { span: 2 }) + SP.campo(d, 'numeroEnd', 'Número') + SP.campo(d, 'bairro', 'Bairro') + SP.campo(d, 'cidade', 'Cidade') + SP.campo(d, 'uf', 'Estado'))}<div class="row">${SP.btn('Buscar pelo CEP', { icon: 'pin', a: 'cep', sm: true })}</div>`;
  }
  if (f.tipo === 'nf') { const p = SP.ped(id), cl = SP.cli(p.cliente); return `<h4>O que será emitido</h4>${SP.kv([['Destinatário', e(cl.nome)], ['CNPJ', e(p.doc)], ['Natureza', 'Venda de mercadoria · CFOP 5102'], ['Itens', p.itens.map(i => `${i.qtd}× ${e(i.nome)}`).join('<br>')], ['Total da NF', `<b>${SP.brl(SP.total(p))}</b>`], ['Depois de autorizar', 'Gera parcelas e boleto e envia ao cliente']])}`; }
  if (f.tipo === 'contra') { const o = SP.orc(id), c = SP.calc(o), nm = (f.valor / c.custo - 1) * 100; return `<h4>Comparação</h4><div class="comp"><div><span>Proposta atual</span><b>${SP.brl(c.total)}</b><small>margem ${SP.num(Math.round(c.margem))}%</small></div>${I('next')}<div><span>Pedido do cliente</span><b>${SP.brl(f.valor)}</b><small class="${nm < db().params.margemMin ? 't-bad txt' : ''}">margem ${SP.num(Math.round(nm))}%</small></div></div><blockquote>${e(o.contra?.msg || '')}</blockquote>${nm < db().params.margemMin ? SP.aviso(`Abaixo da margem mínima de ${db().params.margemMin}%. Menor valor dentro da regra: <b>${SP.brl(c.custo * (1 + db().params.margemMin / 100))}</b>.`, 'warn') : ''}`; }
  if (f.tipo === 'oc') { const en = SP.by('entradas', id), p = en.itens; return `<h4>Leitura do anexo ${e(en.arquivo)}</h4><table class="tb mini"><thead><tr><th>Lido na OC</th><th>Produto do catálogo</th><th class="r">Qtd</th><th class="r">Confiança</th></tr></thead><tbody>${p.map(x => `<tr><td>${e(x.lido)}</td><td>${e(SP.prod(x.produto).nome)}</td><td class="r">${x.qtd}</td><td class="r"><span class="pill t-${x.conf > 85 ? 'ok' : 'warn'}"><i></i>${x.conf}%</span></td></tr>`).join('')}</tbody></table><div class="row">${SP.btn('Conferir campo a campo', { go: 'entrada', id, sm: true, icon: 'eye' })}</div>`; }
  if (f.tipo === 'compra') { const p = SP.ped(id); const d = SP.draft(ctx, 'compra:' + id, () => ({ previsao: SP.addDias(SP.HOJE, 3) })); return `<h4>Itens atrasados</h4>${SP.kv(p.itens.filter(SP.atrasado).map(i => [`${i.qtd}× ${e(i.nome)}`, 'previsto ' + SP.data(i.previsao) + ' · ' + SP.dias(i.previsao) + ' dias']))}${SP.grade(SP.campo(d, 'previsao', 'Nova previsão de entrega', { type: 'date' }), 2)}`; }
  const o = t === 'orc' ? SP.orc(id) : null, c = t === 'conta' ? SP.conta(id) : null, p = t === 'pedido' ? SP.ped(id) : c ? SP.pedNum(c.pedido) : null;
  const tpl = SP.by('templates', f.template || 'tp3');
  const d = SP.draft(ctx, 'msg:' + f.id, () => ({ texto: SP.preencher(tpl.corpo, { orc: o, conta: c, pedido: p }) }));
  const cl = SP.cli(o?.cliente || c?.cliente || p?.cliente);
  return `<h4>Mensagem que será enviada <small>· ${tpl.canal} para ${e(tpl.canal === 'WhatsApp' ? cl.whats : cl.email)}</small></h4>${SP.campo(d, 'texto', 'Edite antes de enviar, se quiser', { type: 'area', rows: 6 })}<div class="row">${SP.btn('Template “' + e(tpl.nome) + '”', { go: 'template', id: tpl.id, sm: true, kind: 'quiet', icon: 'template' })}</div>`;
};
const alvo = ([t, id]) => ({ orc: ['orcEditar', id], pedido: ['pedVer', id], conta: ['conta', id], nf: ['nfEmitida', id], entrada: ['entrada', id] }[t]);
const detalhe = (f, ctx) => {
  if (!f) return SP.vazio('Nada esperando você', 'Quando uma regra precisar de decisão, aparece aqui com o contexto pronto.');
  const r = f.regra && SP.by('regras', f.regra), a = alvo(f.ref), pend = f.status === 'pendente';
  return `<article class="fd"><header><span class="pill t-${PRIO[f.prio][1]}"><i></i>${PRIO[f.prio][0]}</span><span class="mute">${TIPOS[f.tipo]?.[0]} · ${SP.quando(f.criado)}</span></header><h2>${e(f.titulo)}</h2><p class="porque">${e(f.motivo)}</p>
  <div class="evid">${f.fatos.length ? `<div><h4>Fatos</h4><ul>${f.fatos.map(x => `<li>${I('check', 14)}${e(x)}</li>`).join('')}</ul></div>` : ''}${f.premissas.length ? `<div><h4>Suposições do portal</h4><ul class="sup">${f.premissas.map(x => `<li>${I('info', 14)}${e(x)}</li>`).join('')}</ul></div>` : ''}</div>
  <div class="payload">${pend ? payload(f, ctx) : SP.aviso('Resolvido' + (f.resolvidoPor ? ' por ' + e(f.resolvidoPor) : '') + '.', 'ok')}</div>
  ${r ? `<p class="mute regra-l">${I('bolt', 14)} Veio da regra “${e(r.nome)}” ${SP.btn('Ajustar regra', { go: 'regra', id: r.id, sm: true, kind: 'quiet' })}</p>` : ''}
  ${pend ? `<footer class="fd-a">${SP.btn(f.tipo === 'dados' ? 'Salvar e continuar' : f.acao, { a: f.tipo === 'dados' ? 'salvarDados' : 'resolver', p: f.id, kind: 'primary', icon: 'check' })}${SP.btn('Recusar', { a: 'recusar', p: f.id })}${SP.btn('Amanhã', { a: 'adiar', p: f.id, kind: 'quiet' })}${a ? SP.btn('Abrir registro', { go: a[0], id: a[1], kind: 'quiet', icon: 'link' }) : ''}</footer>` : ''}</article>`;
};
const TIPO_FILA = { Todos: null, Fiscal: ['nf', 'dados', 'boleto'], Vendas: ['contra', 'followup', 'oc', 'gerar'], Financeiro: ['cobranca'], Compras: ['compra'] };
SP.screen('fila', {
  code: 'B-11', nome: 'Precisa de você', flow: 'B', src: ['visao:Handoff humano', 'visao:Automação', 'novo:Caixa de aprovações'],
  nota: 'Coração do handoff: só entra o que exige julgamento. No desktop é caixa de entrada com lista e detalhe; no celular, lista e tela de decisão. Itens de baixo risco podem ser aprovados em lote.',
  render(ctx) {
    const todos = itensFila(), cat = SP.visao('fila'), l = TIPO_FILA[cat] ? todos.filter(f => TIPO_FILA[cat].includes(f.tipo)) : todos;
    const atual = l.find(f => f.id === SP.S.tab.fila) || l[0], baixos = l.filter(f => f.prio === 'baixa' && f.tipo === 'followup');
    const chips = `<div class="visoes">${Object.keys(TIPO_FILA).map(k => { const n = TIPO_FILA[k] ? todos.filter(f => TIPO_FILA[k].includes(f.tipo)).length : todos.length; return `<button type="button" class="visao${k === cat ? ' on' : ''}" data-a="visao" data-p="fila" data-v="${k}"><span>${k}<em>${n}</em></span></button>`; }).join('')}</div>`;
    const lote = baixos.length > 1 ? SP.btn(`Aprovar ${baixos.length} de baixo risco`, { a: 'lote', icon: 'check', block: true }) : '';
    const lista = l.length ? `<ul class="fila">${l.map(f => cartaoFila(f, !ctx.m && f.id === atual?.id, ctx.m ? `data-go="filaItem" data-id="${f.id}"` : `data-a="tab" data-p="fila" data-v="${f.id}"`)).join('')}</ul>` : '';
    return { titulo: 'Precisa de você', sub: 'O resto o portal resolve sozinho.', acoes: SP.btn(SP.S.pausado ? 'Retomar automação' : 'Pausar automação', { a: 'pausar', icon: SP.S.pausado ? 'play' : 'pause' }),
      corpo: chips + (ctx.m || !l.length ? (lote + (lista || SP.card(detalhe(null, ctx)))) : `<div class="inbox"><div class="inbox-l">${lote}${lista}</div><div class="inbox-d card">${detalhe(atual, ctx)}</div></div>`) };
  },
});
SP.screen('filaItem', { code: 'B-12', nome: 'Decidir item', flow: 'B', exemplo: 'q2', pai: 'fila', src: ['visao:Handoff humano', 'novo:Aprovação com conteúdo exato'], nota: 'Mostra motivo, fatos, suposições e exatamente o que vai acontecer. Aprovar, editar, recusar com motivo ou adiar. Toda decisão gera recibo e pode ser desfeita.',
  render(ctx) { const f = db().fila.find(x => x.id === ctx.id); return { titulo: 'Decisão', voltar: 'fila', corpo: SP.card(detalhe(f, ctx)) }; } });

SP.screen('atividade', {
  code: 'B-13', nome: 'Atividade e recibos', flow: 'B', src: ['visao:Automação', 'novo:Recibos, pausa e desfazer'],
  nota: 'Linha do tempo do que foi feito, por quem e por qual regra. Botão de pausa geral.',
  render(ctx) {
    const f = SP.visao('ativ'), m = { Automação: 'auto', Pessoas: 'pessoa', 'Passou para pessoa': 'humano' };
    const l = db().atividade.filter(a => f === 'Todos' || a.tipo === m[f]);
    const chips = `<div class="visoes">${['Todos', ...Object.keys(m)].map(k => `<button type="button" class="visao${k === f ? ' on' : ''}" data-a="visao" data-p="ativ" data-v="${k}"><span>${k}<em>${k === 'Todos' ? db().atividade.length : db().atividade.filter(a => a.tipo === m[k]).length}</em></span></button>`).join('')}</div>`;
    const sw = SP.card(`<div class="linha-sw"><div><b>Automação ${SP.S.pausado ? 'pausada' : 'ligada'}</b><small>${SP.S.pausado ? 'Nenhuma regra executa até você retomar.' : db().regras.filter(r => r.ligada).length + ' regras ativas'}</small></div>${SP.sw(!SP.S.pausado, 'pausar', '', 'Automação')}</div>`);
    return { titulo: 'Atividade', voltar: ctx.m ? 'hoje' : null, sub: 'Recibo de cada ação.', acoes: SP.btn('Regras', { go: 'automacoes', icon: 'bolt' }), corpo: sw + chips + SP.card(SP.linha(l.map(SP.recibo))) };
  },
});

SP.screen('notificacoes', {
  code: 'B-14', nome: 'Notificações', flow: 'B', src: ['print:notificacoes', 'proc:Notificações'],
  nota: 'Caixa de avisos com filtro por data, enviado por, abrir e marcar como lida. O sino do topo mostra as últimas.',
  render(ctx) {
    const l = SP.filtrar('notif', db().notificacoes, x => x.assunto + ' ' + x.por, SP.periodo(x => x.data));
    const q = SP.fq('notif');
    return { titulo: 'Notificações', sub: SP.plural(db().notificacoes.filter(n => !n.lida).length, 'não lida', 'não lidas'), acoes: SP.btn(ctx.m ? '' : 'Marcar todas como lidas', { a: 'lerTodas', icon: 'check', title: 'Marcar todas como lidas' }),
      corpo: `<div class="barra-f"><label class="busca">${I('search', 16)}<input data-q="notif.busca" value="${e(q.busca)}" placeholder="Assunto ou remetente"></label><label class="f inline"><span>De</span><input type="date" data-q="notif.de" value="${e(q.de)}"></label><label class="f inline"><span>Até</span><input type="date" data-q="notif.ate" value="${e(q.ate)}"></label></div>` +
        SP.lista(ctx, { key: 'notif', rows: l, cls: n => n.lida ? '' : 'novo', abrir: () => null,
          cols: [{ h: 'Assunto', c: n => `${n.lida ? '' : '<i class="ponto"></i>'}<b class="l1">${e(n.assunto)}</b>` }, { h: 'Enviado por', c: n => e(n.por) }, { h: 'Data', c: n => SP.quando(n.data) }, { h: '', r: 1, c: n => SP.btn('Abrir', { a: 'abrirNotif', p: n.id, sm: true }) + (n.lida ? '' : SP.btn('', { a: 'ler', p: n.id, sm: true, icon: 'check', title: 'Marcar como lida', kind: 'quiet' })) }],
          card: n => `<div class="reg-t"><b>${n.lida ? '' : '<i class="ponto"></i>'}${e(n.assunto)}</b></div><div class="reg-s">${e(n.por)} · ${SP.quando(n.data)}</div><div class="reg-p">${SP.btn('Abrir', { a: 'abrirNotif', p: n.id, sm: true })}${n.lida ? '' : SP.btn('Marcar lida', { a: 'ler', p: n.id, sm: true, kind: 'quiet' })}</div>` }) };
  },
});

/* ---------- busca global (⌘K) ---------- */
SP.resultados = q => {
  const menu = SP.menuDe().flatMap(g => g.itens).map(i => ({ g: 'Ir para', t: i.label, s: '', go: i.go, icon: i.icon }));
  const acoes = [['Novo orçamento', 'orcNovo', 'plus', ['admin', 'vendedor']], ['Nova nota fiscal', 'nfNova', 'nf', ['admin', 'logistica']], ['Nova conta a receber', 'conta', 'money', ['admin'], 'novo'], ['Novo chamado', 'chamadoNovo', 'support', ['admin', 'vendedor', 'logistica']]].filter(a => a[3].includes(SP.S.persona)).map(a => ({ g: 'Ações', t: a[0], go: a[1], icon: a[2], id: a[4] }));
  const regs = [
    ...db().orcamentos.map(o => ({ g: 'Orçamentos', t: 'Orçamento ' + o.numero, s: SP.cli(o.cliente).nome + ' · ' + o.status, go: 'orcEditar', id: o.id, icon: 'quote' })),
    ...db().pedidos.map(p => ({ g: 'Pedidos', t: 'Pedido ' + p.numero, s: SP.cli(p.cliente).nome + ' · ' + SP.rotulo(p), go: 'pedVer', id: p.id, icon: 'cart' })),
    ...db().notas.map(n => ({ g: 'Notas', t: 'NF ' + n.numero, s: SP.cli(n.cliente).nome, go: 'nfEmitida', id: n.id, icon: 'nf' })),
    ...db().clientes.map(c => ({ g: 'Clientes', t: c.nome, s: c.cnpj, go: 'cliente', id: c.id, icon: 'users' })),
    ...db().produtos.map(p => ({ g: 'Produtos', t: p.nome, s: 'NCM ' + p.ncm, go: 'produto', id: p.id, icon: 'tag' })),
  ].filter(r => SP.pode(r.go));
  if (!q) return [...acoes, ...menu.slice(0, 6)];
  return [...acoes, ...menu, ...regs].filter(r => SP.contem(r.t + ' ' + (r.s || ''), q)).slice(0, 12);
};
SP.paleta = (ctx, q = '') => { const r = SP.resultados(q); let g = ''; return `<div class="cmd" role="dialog" aria-label="Busca e comandos"><label class="cmd-i">${I('search', 18)}<input data-cmd value="${e(q)}" placeholder="Buscar pedido, cliente, nota ou comando" aria-label="Buscar">${SP.btn(ctx.m ? 'Fechar' : 'esc', { a: 'fechar', sm: true, kind: 'quiet' })}</label><ul>${r.map((x, i) => `${x.g !== g ? `<li class="cmd-g">${g = x.g}</li>` : ''}<li><button type="button" class="${i === 0 ? 'on' : ''}" data-go="${x.go}"${x.id ? ` data-id="${x.id}"` : ''}>${I(x.icon, 16)}<span><b>${e(x.t)}</b><small>${e(x.s || '')}</small></span></button></li>`).join('') || '<li class="mute pad">Nada encontrado.</li>'}</ul></div>`; };
SP.screen('busca', { code: 'B-15', nome: 'Busca global (⌘K)', flow: 'B', pai: 'hoje', base: 'hoje', paleta: 'pedido', src: ['novo:Command palette'], nota: 'Uma busca para navegar, agir e achar qualquer registro. Atalho ⌘K ou Ctrl+K; no celular, ícone de lupa.', render: () => ({}) });
SP.screen('menu', { code: 'B-16', nome: 'Menu completo (celular)', flow: 'B', src: ['proc:Menu', 'novo:Navegação na zona do polegar'], nota: 'No celular, as cinco áreas mais usadas ficam na barra flutuante; o restante aqui, agrupado como no desktop.',
  render(ctx) { return { titulo: 'Menu', corpo: `<div class="menu-g">${SP.menuDe().map(g => `<h4>${g.g}</h4><div class="menu-l">${g.itens.map(i => `<button type="button" data-go="${i.go}">${I(i.icon, 20)}<span>${i.label}</span></button>`).join('')}</div>`).join('')}</div><div class="pad">${SP.btn('Minha conta', { go: 'minhaConta', block: true, icon: 'user' })}${SP.btn('Sair', { go: 'saiu', block: true, icon: 'logout', kind: 'quiet' })}${ctx.app ? '<button type="button" class="btn quiet block" data-x="sair-app">Voltar à galeria do protótipo</button>' : ''}</div>` }; } });

/* ---------- ações ---------- */
Object.assign(SP.actions, {
  cal: el => { const [a, m] = (SP.S.calMes || SP.HOJE.slice(0, 7)).split('-').map(Number); const d = new Date(a, m - 1 + +el.dataset.v, 15); SP.S.calMes = iso(d).slice(0, 7); },
  pausar: () => { SP.S.pausado = !SP.S.pausado; SP.toast(SP.S.pausado ? 'Automação pausada.' : 'Automação retomada.'); },
  resolver: el => { const f = db().fila.find(x => x.id === el.dataset.p); const d = SP.S.draft?.v; if (SP.feito('Feito: ' + f.acao.toLowerCase() + '.', () => SP.resolver(db().fila.find(x => x.id === f.id), d?.previsao))) { SP.S.draft = null; if (SP.S.nav.screen === 'filaItem') SP.ir('fila'); } },
  salvarDados: el => { const f = db().fila.find(x => x.id === el.dataset.p), d = SP.S.draft?.v, p = SP.ped(f.ref[1]); const falta = SP.faltantes(d || p); if (falta.length) return SP.toast('Ainda falta: ' + falta.join(', ') + '.'); SP.feito('Dados salvos. NF-e preparada para aprovação.', () => { const x = SP.ped(p.id); ['cep', 'endereco', 'numeroEnd', 'bairro', 'cidade', 'uf'].forEach(k => x[k] = d[k]); db().fila.find(i => i.id === f.id).status = 'resolvido'; SP.tudoChegou(x); }); SP.S.draft = null; if (SP.S.nav.screen === 'filaItem') SP.ir('fila'); },
  recusar: el => { SP.S.modal = { type: 'recusar', data: { id: el.dataset.p } }; },
  confirmarRecusa: el => { const d = SP.S.mdraft?.v; if (!d?.motivo?.trim()) return SP.toast('Escreva o motivo.'); SP.feito('Item recusado.', () => { const f = db().fila.find(x => x.id === el.dataset.p); f.status = 'recusado'; SP.log(f.regra || '', 'Recusado: ' + f.titulo + ' · motivo: ' + d.motivo, f.ref, 'pessoa'); }); SP.S.modal = null; SP.S.draft = null; SP.S.mdraft = null; if (SP.S.nav.screen === 'filaItem') SP.ir('fila'); },
  adiar: el => { SP.feito('Volta amanhã.', () => { db().fila.find(x => x.id === el.dataset.p).status = 'adiado'; }); if (SP.S.nav.screen === 'filaItem') SP.ir('fila'); },
  lote: () => SP.feito('Mensagens de baixo risco enviadas.', () => SP.pendentes().filter(f => f.prio === 'baixa' && f.tipo === 'followup').forEach(f => SP.resolver(f))),
  ler: el => { SP.by('notificacoes', el.dataset.p).lida = true; },
  lerTodas: () => db().notificacoes.forEach(n => n.lida = true),
  abrirNotif: el => { const n = SP.by('notificacoes', el.dataset.p); n.lida = true; SP.ir(...n.ir); },
});
SP.modals.recusar = (data, ctx) => { const d = SP.draft(ctx, 'recusa:' + data.id, () => ({ motivo: '' })); return { titulo: 'Recusar item', corpo: SP.campo(d, 'motivo', 'Motivo (fica no recibo)', { type: 'area', req: true, ph: 'Ex.: margem baixa demais' }), rodape: SP.btn('Voltar', { a: 'fechar' }) + SP.btn('Recusar', { a: 'confirmarRecusa', p: data.id, kind: 'danger' }) }; };
})();
