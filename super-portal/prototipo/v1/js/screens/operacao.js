/* E · Operação: checklist, parados, fluxograma, logística, transportadoras. */
(() => {
const e = v => SP.esc(v), I = (n, s) => SP.icon(n, s), db = () => SP.S.db;
const meus = l => SP.S.persona === 'vendedor' ? l.filter(x => x.vendedor === 'v1') : l;
const podeEtapas = () => ['admin', 'logistica'].includes(SP.S.persona);
const optV = () => db().vendedores.map(v => [v.id, v.nome]);

/* ---------- checklist ---------- */
const detalhePed = (p, ctx) => {
  const pode = podeEtapas(), chegou = p.itens.length && p.itens.every(i => i.chegou), fat = chegou && p.nf && p.boleto;
  const finais = [['nf', 'Nota fiscal emitida', chegou], ['boleto', 'Boleto emitido', chegou], ['enviado', 'Enviado ao cliente', fat], ['recebido', 'Recebido pelo cliente', fat && p.enviado], ['pago', 'Pagamento confirmado', fat && p.enviado && p.recebido]];
  return `<div class="ck-d">${pode ? '' : SP.aviso('Etapas atualizadas só por administrador ou logística. Você recebe aviso quando mudar.', 'info')}
  <div class="grade g2"><label class="f"><span>Data do pedido</span><input type="date" value="${p.data}" data-ped="${p.id}" data-k="data"${pode ? '' : ' disabled'}></label><label class="f"><span>Vendedor</span><select data-ped="${p.id}" data-k="vendedor"${pode ? '' : ' disabled'}>${optV().map(([v, n]) => `<option value="${v}"${v === p.vendedor ? ' selected' : ''}>${e(n)}</option>`).join('')}</select></label></div>
  <label class="f"><span>Observação do pedido</span><textarea rows="2" data-ped="${p.id}" data-k="obsPedido" placeholder="Ex.: entregar até dia 25, falar com a compradora">${e(p.obsPedido)}</textarea></label>
  <ul class="ck-itens">${p.itens.map((i, k) => `<li><div class="ck-n"><b>${i.qtd}× ${e(i.nome)}</b><input data-item="${p.id}:${k}" data-k="obs" value="${e(i.obs)}" placeholder="Observação do item" aria-label="Observação do item">${SP.atrasado(i) ? `<span class="pill t-bad"><i></i>Atrasado ${SP.dias(i.previsao)} d</span>` : ''}</div>
    ${SP.check(i.comprado, 'marcar', p.id, 'comprado:' + k, 'Comprado', !pode)}
    <label class="f prev"><span>Previsão</span><input type="date" data-item="${p.id}:${k}" data-k="previsao" value="${i.previsao}"${i.comprado && pode ? '' : ' disabled'}></label>
    ${SP.check(i.chegou, 'marcar', p.id, 'chegou:' + k, 'Chegou', !i.comprado || !pode)}
    ${pode ? SP.btn('', { icon: 'trash', a: 'ckRm', p: p.id, v: k, title: 'Remover item', kind: 'quiet', sm: true }) : ''}</li>`).join('')}</ul>
  ${pode ? `<div class="add-p"><select data-ckadd="${p.id}" aria-label="Adicionar item"><option value="">Adicionar item…</option>${db().produtos.map(x => `<option value="${x.id}">${e(x.nome)}</option>`).join('')}</select></div>` : ''}
  <div class="finais">${finais.map(([k, l, ok], i) => SP.check(p[k], 'marcar', p.id, k, (i + 3) + '. ' + l, !pode || !ok)).join('')}</div>
  <div class="row fim">${SP.btn('Dados do pedido', { go: 'pedEditar', id: p.id, icon: 'edit', sm: true })}${pode ? SP.btn('Excluir pedido', { a: 'ckExcluir', p: p.id, sm: true, kind: 'quiet', icon: 'trash' }) : ''}</div></div>`;
};
SP.screen('checklist', {
  code: 'E-40', nome: 'Checklist de pedidos', flow: 'E', src: ['proc:Ped. Checklist', 'proc:Backup', 'proc:Compra', 'proc:Recebimento'],
  nota: 'Por item: comprado, previsão e chegou (com atraso); depois NF, boleto, enviado, recebido e pago. A etapa muda sozinha e dispara as regras. Filtros, ocultar concluídos, expandir, backup e novo pedido interno.',
  render(ctx) {
    const q = SP.fq('ck'), ocultar = SP.S.tab.ckOcultar !== 'nao';
    const base = meus(SP.ativos()).filter(p => (!ocultar || SP.etapa(p) !== 'ok') && (!q.vendedor || p.vendedor === q.vendedor) && (!q.busca || SP.contem([p.numero, SP.cli(p.cliente).nome, SP.vend(p.vendedor).nome, p.obsPedido, p.ocNum, ...p.itens.map(i => i.nome + i.obs)].join(' '), q.busca)));
    const ets = ['compra', 'chegada', 'fat', 'envio', 'recebido'], atual = SP.visao('ck');
    const rows = base.filter(p => atual === 'Todos' || SP.ETAPAS[SP.etapa(p)][0] === atual).sort((a, b) => a.numero - b.numero);
    const exp = SP.S.tab.ck || {}, abertoPadrao = ctx.preview ? rows[0]?.id : null;
    const lista = rows.map(p => { const a = exp[p.id] ?? p.id === abertoPadrao, parado = SP.parado(p);
      return `<li class="ck${a ? ' aberto' : ''}"><button type="button" class="ck-h" data-a="ckAbrir" data-p="${p.id}" aria-expanded="${a}"><span class="chev">${I('next', 15)}</span><span class="ck-id"><b>Nº ${p.numero}</b><small>${SP.dataCurta(p.data)} · ${e(SP.vend(p.vendedor).nome.split(' ')[0])}</small></span><span class="ck-cli">${p.obsPedido ? I('info', 13) : ''}${e(SP.cli(p.cliente).nome)}</span>${SP.etapaPill(p)}<span class="ck-pg">${SP.barra(SP.progresso(p))}<small>${SP.progresso(p)}% · ${p.itens.filter(i => i.chegou).length}/${p.itens.length} itens</small></span><span class="ck-at${parado ? ' t-bad txt' : ''}">${parado ? SP.dias(p.atualizado) + ' d parado' : SP.dataCurta(p.atualizado)}</span></button>${a ? detalhePed(p, ctx) : ''}</li>`; }).join('');
    const novo = SP.S.tab.ckNovo;
    return { titulo: 'Checklist', sub: SP.plural(rows.length, 'pedido em andamento', 'pedidos em andamento'),
      acoes: SP.btn('', { a: 'backup', icon: 'download', title: 'Exportar backup' }) + `<label class="btn ghost icon" title="Importar backup">${I('upload', 17)}<input type="file" accept=".json" hidden data-file="importar"></label>` + (podeEtapas() ? SP.btn(ctx.m ? '' : 'Novo pedido', { a: 'ckNovo', icon: 'plus', kind: 'primary', title: 'Novo pedido' }) : ''),
      corpo: SP.visoes('ck', ets.map(k => SP.ETAPAS[k][0]), p => SP.ETAPAS[SP.etapa(p)][0], base)
        + `<div class="barra-f"><label class="busca">${I('search', 16)}<input data-q="ck.busca" value="${e(q.busca)}" placeholder="Pedido, cliente, item, OC"></label><select data-q="ck.vendedor" aria-label="Vendedor"><option value="">Todos os vendedores</option>${optV().map(([v, n]) => `<option value="${v}"${q.vendedor === v ? ' selected' : ''}>${e(n)}</option>`).join('')}</select>${SP.check(ocultar, 'ckOcultar', '', '', 'Ocultar concluídos')}${SP.btn('Expandir', { a: 'ckTodos', v: 1, sm: true, kind: 'quiet' })}${SP.btn('Recolher', { a: 'ckTodos', v: 0, sm: true, kind: 'quiet' })}</div>`
        + (novo && !ctx.preview ? SP.card(SP.grade(SP.campo(SP.draft(ctx, 'ckNovo', () => ({ numero: '', data: SP.HOJE, vendedor: 'v1', cliente: 'c1', itens: '' })), 'numero', 'Nº do pedido') + SP.campo(SP.S.draft.v, 'data', 'Data', { type: 'date' }) + SP.campo(SP.S.draft.v, 'vendedor', 'Vendedor', { options: optV() }) + SP.campo(SP.S.draft.v, 'cliente', 'Cliente', { options: db().clientes.map(c => [c.id, c.nome]) }) + SP.campo(SP.S.draft.v, 'itens', 'Itens (separe por ;)', { span: 2, ph: '2x Monitor; 1x Nobreak' }), ctx.m ? 1 : 3) + `<div class="row fim">${SP.btn('Cancelar', { a: 'ckNovo' })}${SP.btn('Adicionar', { a: 'ckSalvar', kind: 'primary' })}</div>`, { title: 'Novo pedido interno' }) : '')
        + (rows.length ? `<ul class="cks">${lista}</ul>` : SP.vazio('Nenhum pedido aqui', 'Troque a etapa ou limpe a busca.', '', 'checklist')) };
  },
});

/* ---------- o que está parado ---------- */
SP.screen('parados', {
  code: 'E-41', nome: 'O que está parado', flow: 'E', src: ['proc:O que está parado', 'visao:Automação'],
  nota: 'Prazo configurável, quantidade por etapa, pedidos parados e pendências item a item, com atraso em destaque.',
  render() {
    const l = meus(SP.ativos()), par = l.filter(SP.parado).sort((a, b) => a.atualizado.localeCompare(b.atualizado));
    const pend = [];
    l.forEach(p => { const et = SP.etapa(p); p.itens.forEach(i => { if (!i.comprado) pend.push({ p, tom: 'bad', icon: 'cart', t: `${i.qtd}× ${i.nome}`, s: 'falta comprar' }); else if (!i.chegou) pend.push({ p, tom: SP.atrasado(i) ? 'bad' : 'warn', icon: 'clock', t: `${i.qtd}× ${i.nome}`, s: i.previsao ? 'previsão ' + SP.data(i.previsao) + (SP.atrasado(i) ? ' · atrasado' : '') : 'sem previsão' }); });
      if (et === 'fat') { if (!p.nf) pend.push({ p, tom: 'info', icon: 'nf', t: 'Emitir nota fiscal', s: '' }); if (!p.boleto) pend.push({ p, tom: 'info', icon: 'barcode', t: 'Emitir boleto', s: '' }); }
      if (et === 'envio') pend.push({ p, tom: 'alt', icon: 'truck', t: p.enviado ? 'Confirmar recebimento' : 'Enviar NF e boleto', s: '' });
      if (et === 'recebido') pend.push({ p, tom: 'teal', icon: 'money', t: 'Aguardando pagamento', s: '' }); });
    const filtro = SP.visao('pend'), grupos = { Todas: null, Comprar: 'cart', Receber: 'clock', Faturar: 'nf', Entregar: 'truck', Receber$: 'money' };
    return { titulo: 'O que está parado', sub: 'Sem atualização há ' + db().params.diasParado + ' dias ou mais.',
      acoes: `<label class="f inline"><span>Parado após (dias)</span><input type="number" min="0" data-param="diasParado" value="${db().params.diasParado}" style="width:72px"></label>`,
      corpo: `<div class="stats six">${SP.stat('Pedidos parados', par.length, '', { tom: 'bad' })}${Object.entries(SP.ETAPAS).filter(([k]) => k !== 'novo').map(([k, [n]]) => SP.stat(n, l.filter(p => SP.etapa(p) === k).length, '', { go: 'checklist' })).join('')}</div>
      <div class="cols c2">${SP.card(par.length ? SP.linha(par.map(p => ({ titulo: `Pedido ${p.numero} · ${e(SP.cli(p.cliente).nome)}`, sub: `${e(SP.rotulo(p))} · parado há ${SP.dias(p.atualizado)} dias${p.obsPedido ? ' · ' + e(p.obsPedido) : ''}`, icon: 'clock', tom: 'humano', acao: SP.btn('Abrir', { a: 'irChecklist', p: p.id, sm: true }) }))) : SP.vazio('Nada parado', 'Todos os pedidos tiveram andamento.'), { title: `Pedidos parados <em class="cont">${par.length}</em>` })}
      ${SP.card(SP.linha(pend.map(x => ({ titulo: e(x.t), sub: `Pedido ${x.p.numero}${x.s ? ' · ' + x.s : ''}`, icon: x.icon, tom: 't-' + x.tom, acao: SP.btn('', { a: 'irChecklist', p: x.p.id, icon: 'next', title: 'Abrir no checklist', sm: true, kind: 'quiet' }) }))), { title: `Pendências por item <em class="cont">${pend.length}</em>` })}</div>` };
  },
});

/* ---------- fluxograma ---------- */
const FLUXO = [
  ['Prospecção', [['Conexão com o decisor', 'humano'], ['Mensagem de apresentação', 'preparar'], ['Resposta do cliente', 'humano']]],
  ['Comercial', [['E-mail de prospecção', 'executar', 'tp11'], ['Receber a lista do cliente', 'preparar'], ['Cotar, definir margem e enviar', 'humano'], ['Receber ordem de compra', 'preparar']]],
  ['Pedido e compra', [['Gerar pedido', 'executar', null, 'novo'], ['Comprar os produtos', 'humano', null, 'compra'], ['Receber e conferir', 'humano', null, 'chegada']]],
  ['Faturamento', [['Emitir nota fiscal', 'preparar', null, 'fat'], ['Emitir boleto', 'executar']]],
  ['Expedição', [['Embalar', 'humano'], ['Cotar transportadora ou Correios', 'preparar'], ['Enviar e avisar o cliente', 'executar', 'tp5', 'envio']]],
  ['Financeiro', [['Receber o valor', 'executar', 'tp6', 'recebido'], ['Cobrar se não pagar', 'preparar', 'tp7']]],
];
const NIVEL = { executar: ['Automático', 'ok', 'bolt'], preparar: ['Prepara e pede aprovação', 'warn', 'eye'], humano: ['Pessoa', 'info', 'user'] };
SP.screen('fluxo', {
  code: 'E-42', nome: 'Fluxograma do processo', flow: 'E', src: ['proc:Fluxograma', 'visao:Automação', 'visao:Handoff humano'],
  nota: 'As 17 etapas, da prospecção ao recebimento, com quantos pedidos estão em cada uma e quem faz: automático, preparado para aprovação ou pessoa.',
  render() {
    let n = 0; const cont = k => SP.ativos().filter(p => SP.etapa(p) === k).length;
    const todas = FLUXO.flatMap(f => f[1]), pct = Math.round(todas.filter(s => s[1] !== 'humano').length / todas.length * 100);
    return { titulo: 'Fluxo do processo', sub: pct + '% das etapas sem trabalho manual.', acoes: SP.btn('Regras', { go: 'automacoes', icon: 'bolt' }),
      corpo: `<div class="leg">${Object.values(NIVEL).map(v => `<span class="pill t-${v[1]}"><i></i>${v[0]}</span>`).join('')}</div><div class="fluxo">${FLUXO.map(([fase, passos]) => `<section><h3>${fase}</h3><ol>${passos.map(([t, nv, tpl, k]) => { n++; const c = k && cont(k); const v = NIVEL[nv]; return `<li class="t-${v[1]}"><span class="fx-i" title="${v[0]}">${I(v[2], 15)}</span><div><b>${n}. ${t}</b><small>${v[0]}</small>${tpl ? SP.btn('Template', { go: 'template', id: tpl, sm: true, kind: 'quiet', icon: 'template' }) : ''}</div>${c ? `<button type="button" class="fx-c" data-go="checklist" title="${c} pedidos nesta etapa">${c}</button>` : ''}</li>`; }).join('')}</ol></section>`).join('')}</div>` };
  },
});

/* ---------- logística ---------- */
const filtrosLog = () => [{ k: 'nota', label: 'Nota' }, { k: 'cliente', label: 'Cliente' }, { k: 'oc', label: 'Ordem de compra' }, { k: 'valor', label: 'Valor' }, { k: 'numero', label: 'Número do pedido' }, { k: 'status', label: 'Status', options: SP.LOG }, { k: 'cep', label: 'CEP' }, { k: 'vendedor', label: 'Vendedor', options: optV() }, { k: 'de', label: 'Data inicial', type: 'date' }, { k: 'ate', label: 'Data final', type: 'date' }];
const nfDe = p => db().notas.find(n => n.pedido === p.numero && n.status === 'Enviado')?.numero;
const LOGM = { rastreio: ['truck', 'Rastreio'], frete: ['money', 'Frete'], emails: ['mail', 'E-mails'], anexos: ['clip', 'Anexos'], etiqueta: ['tag', 'Etiqueta'] };
const cartaoLog = p => { const st = SP.logStatus(p); const val = { rastreio: p.rastreio.codigo, frete: p.frete_valor ? SP.brl(p.frete_valor) : '', emails: p.emails.filter(Boolean).length || '', anexos: p.anexos.length || '', etiqueta: p.etiqueta ? 'ok' : '' };
  return `<article class="kc" draggable="${podeEtapas()}" data-drag="${p.id}"><header><button type="button" class="lk" data-peek="ped:${p.id}">Nº ${p.numero}</button><button type="button" class="st-b" data-a="menuStatus" data-p="log:${p.id}">${SP.pill(st)}${I('down', 12)}</button></header><p>${e(SP.cli(p.cliente).nome)}</p><div class="kc-i"><span>${SP.dataCurta(p.data)}${nfDe(p) ? ' · NF ' + nfDe(p) : ''}</span><b>${SP.brl(SP.total(p))}</b></div><div class="kc-a">${Object.entries(LOGM).map(([k, [ic, l]]) => `<button type="button" class="${val[k] ? 'on' : ''}" data-a="logModal" data-p="${p.id}" data-v="${k}" title="${l}${val[k] ? ': ' + e(val[k]) : ''}" aria-label="${l}">${I(ic, 15)}${(k === 'emails' || k === 'anexos') && val[k] ? `<small>${val[k]}</small>` : ''}</button>`).join('')}</div></article>`; };
const logistica = ctx => {
  const barra = SP.filtros(ctx, 'log', 'Pedido ou cliente', filtrosLog());
  const l = SP.filtrar('log', db().pedidos.filter(p => !['Cancelado', 'Rascunho', 'Reprovado'].includes(p.status)), p => p.numero + ' ' + SP.cli(p.cliente).nome, { nota: (p, v) => String(nfDe(p) || '').includes(v), cliente: (p, v) => SP.contem(SP.cli(p.cliente).nome, v), oc: (p, v) => SP.contem(p.ocNum, v), valor: (p, v) => SP.soDig(SP.total(p).toFixed(2)).includes(SP.soDig(v)), numero: (p, v) => String(p.numero).includes(v), status: (p, v) => SP.logStatus(p) === v, cep: (p, v) => SP.soDig((p.cep || '') + (p.etiqueta?.cep || '')).includes(SP.soDig(v)), vendedor: (p, v) => p.vendedor === v, ...SP.periodo(p => p.data) }).sort((a, b) => b.numero - a.numero);
  const col = SP.S.tab.log || SP.LOG[0];
  const coluna = s => { const ps = l.filter(p => SP.logStatus(p) === s); return `<section class="kb-c t-${SP.TOM[s]}" data-drop="${s}"><header><i></i><b>${s}</b><em>${ps.length}</em><small>${SP.brlk(ps.reduce((t, p) => t + SP.total(p), 0))}</small></header><div>${ps.map(cartaoLog).join('') || '<p class="mute pad">Nenhum pedido</p>'}</div></section>`; };
  const corpo = ctx.m ? `<div class="seg-w">${SP.seg(col, SP.LOG.map(s => [s, `${s.replace('Em separação', 'Separação')} <em>${l.filter(p => SP.logStatus(p) === s).length}</em>`]), 'tab', 'log')}</div><div class="kb-m">${coluna(col)}</div>` : `<div class="kb">${SP.LOG.map(coluna).join('')}</div>`;
  return { titulo: 'Logística', sub: 'O status nunca fica atrás do checklist.', larga: true, corpo: barra + corpo };
};
SP.screen('logistica', { code: 'E-43', nome: 'Logística (quadro)', flow: 'E', src: ['proc:Logística', 'proc:Expedição'], nota: 'Quadro Em separação, Faturado, Enviado e Entregue; arraste no desktop ou troque o status na etiqueta. Cada cartão tem rastreio, frete, e-mails, anexos e etiqueta.', render: logistica });
SP.screen('logEtiqueta', { code: 'E-44', nome: 'Etiqueta de envio', flow: 'E', pai: 'logistica', base: 'logistica', modal: { type: 'log', data: { id: 'd17143', k: 'etiqueta' } }, src: ['proc:Etiqueta', 'proc:CEP'], nota: 'Endereço preenchido pelo pedido ou pelo CEP, com prévia e impressão.', render: logistica });
SP.screen('logRastreio', { code: 'E-45', nome: 'Rastreio e aviso ao cliente', flow: 'E', pai: 'logistica', base: 'logistica', modal: { type: 'log', data: { id: 'd17135', k: 'rastreio' } }, src: ['proc:Rastreio', 'visao:Templates'], nota: 'Código e link; a mensagem sai pelo template quando o pedido é marcado como enviado.', render: logistica });

SP.modals.log = (data, ctx) => {
  const p = SP.ped(data.id), k = data.k;
  const d = SP.draft(ctx, 'log:' + p.id + k, () => ({ rastreio: SP.clone(p.rastreio), frete_valor: p.frete_valor, emails: [0, 1, 2].map(i => p.emails[i] ?? (i === 0 ? p.email : '')), anexos: [...p.anexos], etiqueta: SP.clone(p.etiqueta || { cep: p.cep, endereco: p.endereco, numeroEnd: p.numeroEnd, complemento: p.complemento, bairro: p.bairro, cidade: p.cidade, uf: p.uf }) }));
  let corpo = '';
  if (k === 'rastreio') corpo = SP.grade(SP.campo(d, 'rastreio.codigo', 'Código de rastreio') + SP.campo(d, 'rastreio.link', 'Link de rastreio', { ph: 'https://' }), 1) + `<h4>Mensagem automática</h4><blockquote class="pre">${e(SP.preencher(SP.by('templates', 'tp5').corpo, { pedido: { ...p, rastreio: d.rastreio } }))}</blockquote>`;
  if (k === 'frete') corpo = SP.campo(d, 'frete_valor', 'Valor do frete (R$)', { money: true });
  if (k === 'emails') corpo = SP.grade([0, 1, 2].map(i => SP.campo(d, 'emails.' + i, 'E-mail ' + (i + 1), { type: 'email' })).join(''), 1);
  if (k === 'anexos') corpo = SP.anexos(d.anexos, 'anexoLog', p.id);
  if (k === 'etiqueta') { const x = d.etiqueta; corpo = SP.grade(SP.campo(d, 'etiqueta.cep', 'CEP') + SP.campo(d, 'etiqueta.endereco', 'Endereço', { span: 2 }) + SP.campo(d, 'etiqueta.numeroEnd', 'Número') + SP.campo(d, 'etiqueta.complemento', 'Complemento') + SP.campo(d, 'etiqueta.bairro', 'Bairro') + SP.campo(d, 'etiqueta.cidade', 'Cidade') + SP.campo(d, 'etiqueta.uf', 'Estado'), ctx.m ? 1 : 3) + `<div class="row">${SP.btn('Buscar pelo CEP', { a: 'cep', v: 'etiqueta', sm: true, icon: 'pin' })}</div><div class="etiqueta" data-print><small>DESTINATÁRIO</small><b>${e(SP.cli(p.cliente).nome)}</b><span>${e([x.endereco, x.numeroEnd, x.complemento].filter(Boolean).join(', ') || 'Endereço não informado')}</span><span>${e([x.bairro, x.cidade, x.uf].filter(Boolean).join(' · '))}</span><span>CEP ${e(x.cep || '—')}</span><hr><small>REMETENTE</small><span>${e(SP.tenant().razao)} · pedido ${p.numero}</span></div>`; }
  return { titulo: `${LOGM[k][1]} · pedido ${p.numero}`, corpo, largo: k === 'etiqueta', rodape: (k === 'etiqueta' ? SP.btn('Imprimir', { a: 'imprimir', icon: 'download' }) : '') + SP.btn('Cancelar', { a: 'fechar' }) + SP.btn('Salvar', { a: 'salvarLog', p: p.id, v: k, kind: 'primary' }) };
};

/* ---------- transportadoras ---------- */
SP.screen('transp', {
  code: 'E-46', nome: 'Transportadoras', flow: 'E', src: ['proc:Transportadoras'], nota: 'Busca, seleção em massa, novo e editar.',
  render(ctx) {
    const rows = SP.filtrar('transp', db().transportadoras, t => Object.values(t).join(' ')).sort((a, b) => a.nome.localeCompare(b.nome));
    return { titulo: 'Transportadoras', sub: SP.plural(rows.length, 'cadastro', 'cadastros'), acoes: SP.btn(ctx.m ? '' : 'Nova transportadora', { go: 'transpForm', id: 'novo', icon: 'plus', kind: 'primary', title: 'Nova transportadora' }),
      corpo: SP.filtros(ctx, 'transp', 'Nome, CNPJ ou cidade') + SP.lista(ctx, { key: 'transp', rows, select: 'transp', massa: SP.btn('Excluir', { a: 'excluirSel', p: 'transportadoras:transp', sm: true, kind: 'danger' }), abrir: t => ({ go: 'transpForm', id: t.id }),
        cols: [{ h: 'Nome', c: t => `<b class="l1">${e(t.nome)}</b>` }, { h: 'CNPJ/CPF', c: t => e(t.cnpj) }, { h: 'Telefone', c: t => e(t.telefone) }, { h: 'Cidade/UF', c: t => e(t.cidade + '/' + t.uf) }, { h: '', r: 1, c: t => SP.btn('Editar', { go: 'transpForm', id: t.id, sm: true, icon: 'edit' }) }],
        card: t => SP.regLinha(e(t.nome), '', e(t.cnpj), `<small class="mute">${e(t.telefone)} · ${e(t.cidade)}/${t.uf}</small>`) }) };
  },
});
SP.UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
SP.cadastro({ key: 'transpForm', code: 'E-47', nome: 'Cadastro de transportadora', flow: 'E', col: 'transportadoras', lista: 'transp', exemplo: 't02', src: ['proc:Transportadoras'], nota: 'Nome, e-mail, documento, inscrição, telefone e endereço.', titulo: ['Nova transportadora', 'Editar transportadora'],
  novo: { nome: '', email: '', cnpj: '', ie: '', telefone: '', endereco: '', cidade: '', uf: 'SP' }, maiusculo: 'nome',
  campos: () => [['nome', 'Nome', { req: true, span: 2 }], ['email', 'E-mail', { type: 'email' }], ['cnpj', 'CNPJ/CPF'], ['ie', 'Inscrição estadual'], ['telefone', 'Telefone'], ['endereco', 'Endereço', { span: 2 }], ['cidade', 'Cidade'], ['uf', 'Estado', { options: SP.UFS }]] });

/* ---------- ações ---------- */
Object.assign(SP.actions, {
  ckAbrir: el => { const t = SP.S.tab.ck ||= {}; t[el.dataset.p] = !t[el.dataset.p]; },
  ckTodos: el => { SP.S.tab.ck = Object.fromEntries(db().pedidos.map(p => [p.id, !!+el.dataset.v])); },
  ckOcultar: () => { SP.S.tab.ckOcultar = SP.S.tab.ckOcultar === 'nao' ? 'sim' : 'nao'; },
  ckNovo: () => { SP.S.tab.ckNovo = !SP.S.tab.ckNovo; SP.S.draft = null; },
  ckSalvar: () => { const d = SP.S.draft.v; if (!+d.numero) return SP.toast('Informe o número do pedido.'); if (SP.pedNum(+d.numero)) return SP.toast('Já existe um pedido com esse número.');
    SP.feito('Pedido ' + d.numero + ' adicionado.', () => { const c = SP.cli(d.cliente), base = SP.clone(db().pedidos[0]); Object.assign(base, { id: SP.uid('d'), numero: +d.numero, data: d.data, vendedor: d.vendedor, cliente: d.cliente, doc: c.cnpj, nome: c.nome, orc: null, ocNum: '', ocArq: '', status: 'Aprovado', nf: false, boleto: false, enviado: false, recebido: false, pago: false, obsPedido: '', atualizado: SP.HOJE, rastreio: { codigo: '', link: '' }, anexos: [], hist: [], itens: d.itens.split(';').map(s => s.trim()).filter(Boolean).map(s => { const m = s.match(/^(\d+)\s*x\s*(.+)$/i); return { produto: null, nome: m ? m[2] : s, ncm: '', qtd: m ? +m[1] : 1, valor: 0, margem: db().params.margemMin, extra: 0, obs: '', comprado: false, chegou: false, previsao: '' }; }) }); db().pedidos.unshift(base); });
    SP.S.tab.ckNovo = false; SP.S.draft = null; },
  marcar: el => { const [campo, k] = el.dataset.v.split(':'); SP.feito('Checklist atualizado.', () => SP.marcar(SP.ped(el.dataset.p), campo, k === undefined ? null : +k)); },
  ckRm: el => SP.feito('Item removido.', () => { const p = SP.ped(el.dataset.p); p.itens.splice(+el.dataset.v, 1); p.atualizado = SP.HOJE; }),
  ckExcluir: el => { SP.S.modal = { type: 'confirmar', data: { texto: 'Excluir o pedido ' + SP.ped(el.dataset.p).numero + ' e todo o checklist?', a: 'excluirReg', p: 'pedidos:' + el.dataset.p } }; },
  irChecklist: el => { SP.S.tab.ck = { [el.dataset.p]: true }; SP.S.view.ck = 'Todos'; SP.S.tab.ckOcultar = 'nao'; SP.S.q.ck = { busca: String(SP.ped(el.dataset.p).numero) }; SP.ir('checklist'); },
  backup: () => { SP.baixar('super-portal-backup-' + SP.HOJE + '.json', JSON.stringify(db(), null, 1), 'application/json'); SP.toast('Backup exportado.'); },
  logModal: el => { SP.S.modal = { type: 'log', data: { id: el.dataset.p, k: el.dataset.v } }; SP.S.mdraft = null; },
  salvarLog: el => { const d = SP.S.mdraft.v, k = el.dataset.v; SP.feito('Salvo.', () => { const p = SP.ped(el.dataset.p); if (k === 'frete') p.frete_valor = SP.parseNum(d.frete_valor); else p[k] = SP.clone(d[k]); p.atualizado = SP.HOJE; }); SP.S.modal = null; SP.S.mdraft = null; SP.fecharTela(); },
  trocarLog: el => { const p = SP.ped(el.dataset.p), s = el.dataset.v; SP.S.pop = null; SP.moverLog(p.id, s); },
});
SP.moverLog = (id, s) => { const p = SP.ped(id), i = SP.LOG.indexOf(s); if (i < SP.logAuto(p)) return SP.toast(`O checklist já marca “${SP.LOG[SP.logAuto(p)]}”. Para voltar, desmarque lá.`);
  SP.feito('Pedido ' + p.numero + ' em “' + s + '”.', () => { const x = SP.ped(id); x.logSt = s; if (i >= 2 && !x.enviado) SP.marcar(x, 'enviado'); if (i === 3 && !x.recebido) SP.marcar(x, 'recebido'); x.atualizado = SP.HOJE; }); };
})();
