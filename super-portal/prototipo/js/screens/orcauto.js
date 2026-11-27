/* T · Automação de orçamentos: do pedido que chega à proposta enviada. Leitura e fornecedores são simulados. */
(() => {
const e = v => SP.esc(v), I = (n, s) => SP.icon(n, s), db = () => SP.S.db;
const ST = { Novo: 'info', 'Orçamento gerado': 'ok', Descartado: 'mute' };
const norm = t => String(t).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const termos = t => norm(t).split(/[^a-z0-9]+/).filter(p => p.length > 1).map(p => p.replace(/s$/, ''));

/* ---------- leitura do pedido: “30 mouses sem fio” → produto do catálogo, com confiança ---------- */
const casar = txt => {
  const q = termos(txt);
  const l = db().produtos.map(p => { const n = termos(p.nome), achou = q.filter(t => n.some(x => x.startsWith(t) || t.startsWith(x))).length; return { id: p.id, nota: q.length ? achou / q.length : 0, achou }; }).sort((a, b) => b.nota - a.nota || b.achou - a.achou);
  const m = l[0]; if (!m?.achou) return { produto: '', conf: 0 };
  const empate = l[1] && l[1].nota === m.nota && l[1].achou === m.achou;
  return { produto: m.id, conf: Math.round(40 + 58 * m.nota) - (empate ? 20 : 0) };
};
const ler = texto => String(texto).split(/\n|;/).map(l => l.trim().match(/^[-•*]?\s*(\d+)\s*(?:x|un\.?|unidades?|pe[cç]as?)?\s+(.+)$/i)).filter(Boolean).map(m => ({ lido: m[2].trim(), qtd: +m[1], ...casar(m[2]), fornecedor: '' }));

/* ---------- preço: margem do produto menos descontos, nunca abaixo da mínima ---------- */
const ofertas = pid => { const p = SP.prod(pid), base = db().fornecedores, i = Math.max(0, base.findIndex(f => f.id === p.fornecedor)), n = +pid.slice(1);
  return [0, 1, 2].map(k => { const f = base[(i + k) % base.length]; return { id: f.id, nome: f.nome, custo: k ? Math.round(p.custo * (1 + (((n * 7 + k * 5) % 13) - 6) / 100) * 100) / 100 : p.custo, prazo: f.prazo }; }); };
const custoDe = i => (i.fornecedor && ofertas(i.produto).find(o => o.id === i.fornecedor)?.custo) || SP.prod(i.produto).custo;
const preco = (cliente, i) => {
  const p = SP.prod(i.produto), r = db().precos, motivos = [`Margem do produto ${p.margem}%`]; let desc = 0;
  const faixa = [...r.volume].filter(v => i.qtd >= v.qtd).sort((a, b) => b.qtd - a.qtd)[0];
  if (faixa?.desc) { desc += faixa.desc; motivos.push(`−${faixa.desc} por volume (${faixa.qtd}+)`); }
  if (r.recorrente && db().pedidos.some(x => x.cliente === cliente)) { desc += r.recorrente; motivos.push(`−${r.recorrente} cliente que já comprou`); }
  const piso = Math.min(p.margem, db().params.margemMin), margem = Math.max(p.margem - desc, piso);
  if (p.margem - desc < piso) motivos.push(`travada na mínima de ${piso}%`);
  const custo = custoDe(i);
  return { custo, margem, motivos, total: i.qtd * custo * (1 + margem / 100) };
};
const validos = c => c.itens.filter(i => i.produto && i.qtd > 0);
const total = c => validos(c).reduce((s, i) => s + preco(c.cliente, i).total, 0);
const duvidas = c => c.itens.filter(i => !i.produto || i.conf < 80).length;
const direto = c => db().precos.limite > 0 && total(c) <= db().precos.limite && !duvidas(c) && validos(c).length > 0;
const pill = c => SP.pill(ST[c.status], c.status);
const confPill = i => !i.produto ? SP.pill('bad', 'Não achei') : i.conf >= 80 ? SP.pill('ok', i.conf + '% certo') : SP.pill('warn', 'Conferir · ' + i.conf + '%');
const atual = ctx => SP.by('cotacoes', ctx.id) || db().cotacoes[0];

/* ---------- caixa de entrada ---------- */
SP.screen('pedidosCot', { code: 'F110', nome: 'Pedidos de cotação', flow: 'T', src: ['novo:Entrada de cotações'], nota: 'O que chega por e-mail, WhatsApp ou site vira itens do catálogo. Também dá para colar o texto.',
  render(ctx) {
    const st = SP.visao('cot'), base = SP.filtrar('cot', db().cotacoes, c => SP.cli(c.cliente).nome + ' ' + c.assunto), rows = base.filter(c => st === 'Todos' || c.status === st);
    const novos = db().cotacoes.filter(c => c.status === 'Novo');
    const d = SP.draft(ctx, 'colar', () => ({ cliente: 'c1', texto: '' }));
    return { titulo: 'Pedidos de cotação', acoes: SP.btn(ctx.m ? '' : 'Follow-up', { go: 'cotFollow', icon: 'send', title: 'Follow-up automático' }) + (SP.pode('cotPrecos') ? SP.btn(ctx.m ? '' : 'Regras de preço', { go: 'cotPrecos', icon: 'sliders', title: 'Regras de preço' }) : ''),
      corpo: `<div class="stats">${SP.stat('Aguardando', novos.length, SP.brlk(novos.reduce((s, c) => s + total(c), 0)) + ' estimados')}${SP.stat('Prontos sem dúvida', novos.filter(c => !duvidas(c)).length)}${SP.stat('Com item para conferir', novos.filter(duvidas).length)}${SP.stat('Orçamentos gerados', db().cotacoes.filter(c => c.status === 'Orçamento gerado').length)}</div>`
        + SP.visoes('cot', Object.keys(ST), c => c.status, base) + SP.lista(ctx, { key: 'cot', rows, abrir: c => ({ go: 'cotRevisar', id: c.id }),
          cols: [{ h: 'Pedido', c: c => SP.duas(e(c.assunto), e(c.canal) + ' · ' + SP.quando(c.recebido)) }, { h: 'Cliente', c: c => e(SP.cli(c.cliente).nome) }, { h: 'Itens', r: 1, c: c => c.itens.length }, { h: 'Leitura', c: c => duvidas(c) ? SP.pill('warn', SP.plural(duvidas(c), 'item para conferir', 'itens para conferir')) : SP.pill('ok', 'Completa') }, { h: 'Estimado', r: 1, c: c => SP.brl(total(c)), s: total }, { h: 'Status', c: pill }],
          card: c => SP.regLinha(e(c.assunto), SP.brlk(total(c)), e(SP.cli(c.cliente).nome) + ' · ' + e(c.canal), pill(c) + (duvidas(c) ? SP.pill('warn', duvidas(c) + ' para conferir') : '')) })
        + SP.card(SP.grade(SP.campo(d, 'cliente', 'Cliente', { options: db().clientes.map(c => [c.id, c.nome]) }) + SP.campo(d, 'texto', 'Texto do pedido', { type: 'area', rows: 4, ph: '30 mouses sem fio\n10 ssd 1tb', hint: 'Um item por linha, começando pela quantidade.' }), 1) + `<div class="row fim">${SP.btn('Ler e montar', { a: 'cotLer', kind: 'primary', icon: 'spark' })}</div>`, { title: 'Colar um pedido' }) };
  } });

SP.screen('cotRevisar', { code: 'F111', nome: 'Revisar e gerar orçamento', flow: 'T', pai: 'pedidosCot', exemplo: 'ct1', src: ['novo:Leitura com confiança', 'novo:Preço automático'], nota: 'O texto original ao lado dos itens lidos. Cada preço mostra como a margem foi calculada. Gera o orçamento em um toque.',
  render(ctx) {
    const c = atual(ctx), feito = c.status !== 'Novo';
    const item = (i, n) => { const p = i.produto && preco(c.cliente, i);
      return `<li class="cot-i"><div class="reg-t"><b>“${e(i.lido)}”</b>${confPill(i)}</div><div class="cot-c"><label class="f"><span>Produto</span><select data-cot="${c.id}.${n}.produto"${feito ? ' disabled' : ''}><option value="">Escolher…</option>${db().produtos.map(x => `<option value="${x.id}"${x.id === i.produto ? ' selected' : ''}>${e(x.nome)}</option>`).join('')}</select></label><label class="f"><span>Quantidade</span><input type="number" min="0" data-cot="${c.id}.${n}.qtd" value="${i.qtd}"${feito ? ' disabled' : ''}></label></div>${p ? `<div class="reg-t"><small class="mute">${p.motivos.join(' · ')} = <b>${p.margem}%</b>${i.fornecedor ? ' · fornecedor escolhido' : ''}</small><strong>${SP.brl(p.total)}</strong></div>` : '<small class="mute">Sem produto, este item fica fora do orçamento.</small>'}</li>`; };
    const o = c.orc && SP.orc(c.orc);
    return { titulo: e(c.assunto), sub: `${e(SP.cli(c.cliente).nome)} · ${e(c.canal)} · ${SP.quando(c.recebido)}`, voltar: 'pedidosCot',
      acoes: feito ? '' : SP.btn(ctx.m ? '' : 'Cotar com fornecedores', { go: 'cotFornecedores', id: c.id, icon: 'factory', title: 'Cotar com fornecedores' }),
      corpo: (o ? SP.aviso(`Orçamento ${o.numero} criado a partir deste pedido.`, 'ok', SP.btn('Abrir', { go: 'orcEditar', id: o.id, sm: true })) : '')
        + `<div class="cols c2">${SP.card(`<ul class="pilha">${c.itens.map(item).join('')}</ul><div class="reg-t"><b>Total</b><strong>${SP.brl(total(c))}</strong></div>`, { title: 'Itens lidos' })}${SP.card(`<blockquote class="pre">${e(c.texto)}</blockquote>${feito ? '' : `<p class="mute">${direto(c) ? `Abaixo de ${SP.brl(db().precos.limite)} e sem dúvidas: pode ser gerado e enviado.` : 'Fica em aberto para revisão antes do envio.'}</p>`}`, { title: 'Pedido original' })}</div>`,
      rodape: feito ? '' : SP.btn('Descartar', { a: 'cotDescartar', p: c.id, kind: 'quiet', icon: 'trash' }) + SP.btn(direto(c) ? 'Gerar e enviar' : 'Gerar orçamento', { a: 'cotGerar', p: c.id, kind: 'primary', icon: 'check', disabled: !validos(c).length }) };
  } });

SP.screen('cotPrecos', { code: 'F112', nome: 'Regras de preço', flow: 'T', soAdmin: true, src: ['novo:Política de preço'], nota: 'Descontos de margem por volume e por cliente, margem mínima e o valor até onde o envio é direto.',
  render(ctx) {
    const r = db().precos, num = (k, l, v, suf) => `<label class="f"><span>${l}</span><input type="number" min="0" data-preco="${k}" value="${v}">${suf ? `<small>${suf}</small>` : ''}</label>`;
    return { titulo: 'Regras de preço', sub: 'Valem para os próximos orçamentos gerados.',
      corpo: SP.card(r.volume.map((v, i) => SP.grade(num('volume.' + i + '.qtd', 'A partir de (unidades)', v.qtd) + num('volume.' + i + '.desc', 'Reduz a margem em', v.desc, 'pontos'), 2)).join(''), { title: 'Desconto por volume', cls: 'estreito' })
        + SP.card(SP.grade(num('recorrente', 'Cliente que já comprou', r.recorrente, 'pontos a menos') + num('margemMin', 'Margem mínima (%)', db().params.margemMin, 'Nenhum desconto passa daqui'), ctx.m ? 1 : 2), { title: 'Cliente e limite', cls: 'estreito' })
        + SP.card(num('limite', 'Enviar direto até (R$)', r.limite, '0 = sempre revisar. Só vale quando não há item para conferir.'), { title: 'Envio', cls: 'estreito' }) };
  } });

SP.screen('cotFornecedores', { code: 'F113', nome: 'Cotação com fornecedores', flow: 'T', pai: 'pedidosCot', exemplo: 'ct1', src: ['novo:Comparação de fornecedores'], nota: 'Preço e prazo de três fornecedores por item. Escolha um a um ou use sempre o menor.',
  render(ctx) {
    const c = atual(ctx), feito = c.status !== 'Novo';
    const bloco = (i, n) => { if (!i.produto) return ''; const l = ofertas(i.produto), menor = Math.min(...l.map(o => o.custo)), sel = i.fornecedor || SP.prod(i.produto).fornecedor;
      return SP.card(`<ul class="cop-l">${l.map(o => `<li><button type="button" data-a="cotForn" data-p="${c.id}.${n}" data-v="${o.id}" aria-pressed="${o.id === sel}"${feito ? ' disabled' : ''}><span class="row nw">${I(o.id === sel ? 'check' : 'factory', 16)}<span><b>${e(o.nome)}</b><small>${SP.plural(o.prazo, 'dia', 'dias')} de prazo</small></span></span><span class="row nw">${o.custo === menor ? SP.pill('ok', 'Menor preço') : ''}<b>${SP.brl(o.custo)}</b></span></button></li>`).join('')}</ul>`, { title: `${i.qtd} × ${e(SP.prod(i.produto).nome)}`, cls: 'estreito' }); };
    return { titulo: 'Cotação com fornecedores', sub: e(c.assunto), voltar: 'pedidosCot', acoes: feito ? '' : SP.btn(ctx.m ? '' : 'Usar menores preços', { a: 'cotMenores', p: c.id, icon: 'money', title: 'Usar menores preços' }),
      corpo: c.itens.map(bloco).join('') || SP.vazio('Nenhum item com produto', 'Escolha os produtos na revisão.', '', 'search'), rodape: SP.btn('Voltar à revisão', { go: 'cotRevisar', id: c.id, kind: 'primary' }) };
  } });

/* ---------- follow-up ---------- */
const meus = l => SP.S.persona === 'vendedor' ? l.filter(o => o.vendedor === 'v1') : l;
SP.screen('cotFollow', { code: 'F114', nome: 'Follow-up automático', flow: 'T', pai: 'pedidosCot', src: ['novo:Sequência de lembretes', 'visao:Templates'], nota: 'Depois do envio, lembretes em dias marcados até o cliente responder. Dá para pausar uma proposta.',
  render(ctx) {
    const f = db().follow, passos = [...f.passos].sort((a, b) => a.dias - b.dias);
    const fila = meus(db().orcamentos).filter(o => o.status === 'Enviado').map(o => { const idade = SP.dias(o.data), prox = passos.find(p => p.ligado && p.dias >= idade), pausado = f.pausados.includes(o.id);
      return { titulo: `Proposta ${o.numero} · ${e(SP.cli(o.cliente).nome)}`, sub: !f.ligado || pausado ? 'Pausado' : prox ? `${prox.canal} ${prox.dias === idade ? 'hoje' : 'em ' + SP.data(SP.addDias(o.data, prox.dias))} · ${e(prox.nome)}` : 'Sequência concluída: vale ligar', icon: pausado || !f.ligado ? 'pause' : 'send', acao: SP.btn(pausado ? 'Retomar' : 'Pausar', { a: 'cotPausar', p: o.id, sm: true }) }; });
    return { titulo: 'Follow-up automático', voltar: 'pedidosCot',
      corpo: SP.card(`<div class="linha-sw"><div><b>Enviar lembretes</b><small>Param sozinhos quando o cliente responde</small></div>${SP.sw(f.ligado, 'cotFollowLigar', '', 'Enviar lembretes')}</div><ul class="pilha">${passos.map(p => `<li class="regra-p">${SP.sw(p.ligado, 'cotPasso', p.id, 'Ligar ' + p.nome)}<div><b>${e(p.nome)}</b><small>${p.canal}</small></div><label class="f inline"><input type="number" min="1" data-passo="${p.id}" value="${p.dias}" aria-label="Dias de ${e(p.nome)}"><span>dias</span></label></li>`).join('')}</ul>`, { title: 'Sequência', cls: 'estreito' })
        + SP.card(fila.length ? SP.linha(fila) : '<p class="mute">Nenhuma proposta esperando resposta.</p>', { title: 'Próximos envios', cls: 'estreito' }) };
  } });

const gerar = c => {
  const x = SP.cli(c.cliente), n = SP.prox('orcamentos'), enviar = direto(c);
  const vendedor = SP.S.persona === 'vendedor' ? 'v1' : db().orcamentos.find(o => o.cliente === c.cliente)?.vendedor || 'v1';
  const itens = validos(c).map(i => { const p = SP.prod(i.produto), v = preco(c.cliente, i); return { produto: p.id, nome: p.nome, ncm: p.ncm, qtd: i.qtd, valor: v.custo, margem: v.margem, extra: 0, obs: '', comprado: false, chegou: false, previsao: '' }; });
  const o = { id: 'o' + n, numero: n, data: SP.HOJE, status: 'Em aberto', titulo: c.assunto, cliente: c.cliente, vendedor, cnpjEmp: SP.tenant().cnpjs[0], doc: x.cnpj, ie: x.ie, isento: x.isento, icms: x.icms, nome: x.nome, comprador: x.comprador, email: x.email, telefone: x.telefone, cep: x.cep, endereco: x.endereco, numeroEnd: x.numero, complemento: '', bairro: x.bairro, cidade: x.cidade, uf: x.uf, prazo: db().params.prazo, forma: 'Boleto', pagamento: '28 dias', frete: 'CIF', validade: db().params.validade, local: '', obs: '', obsInt: 'Gerado do pedido de cotação (' + c.canal + ')', descTipo: 'pct', desc: 0, itens, hist: [{ txt: 'Orçamento montado automaticamente a partir de ' + c.canal, em: SP.agora() }] };
  db().orcamentos.unshift(o); c.status = 'Orçamento gerado'; c.orc = o.id; if (enviar) SP.statusOrc(o, 'Enviado');
};
Object.assign(SP.actions, {
  cotLer: () => { const d = SP.S.draft.v, itens = ler(d.texto); if (!itens.length) return SP.toast('Escreva um item por linha, começando pela quantidade.'); const id = SP.uid('ct');
    SP.feito(SP.plural(itens.length, 'item lido', 'itens lidos') + '.', () => { db().cotacoes.unshift({ id, canal: 'Colado', cliente: d.cliente, assunto: 'Cotação de ' + SP.plural(itens.length, 'item', 'itens'), texto: d.texto, recebido: SP.agora(), status: 'Novo', itens }); }); SP.S.draft = null; SP.ir('cotRevisar', id); },
  cotGerar: el => { const c = SP.by('cotacoes', el.dataset.p), env = direto(c); SP.feito(env ? 'Orçamento gerado e enviado (simulado).' : 'Orçamento gerado.', () => gerar(SP.by('cotacoes', el.dataset.p))); },
  cotDescartar: el => { SP.feito('Pedido descartado.', () => { SP.by('cotacoes', el.dataset.p).status = 'Descartado'; }); SP.ir('pedidosCot'); },
  cotForn: el => { const [id, n] = el.dataset.p.split('.'); SP.by('cotacoes', id).itens[+n].fornecedor = el.dataset.v; },
  cotMenores: el => SP.feito('Menores preços aplicados.', () => SP.by('cotacoes', el.dataset.p).itens.forEach(i => { if (i.produto) i.fornecedor = ofertas(i.produto).sort((a, b) => a.custo - b.custo || a.prazo - b.prazo)[0].id; })),
  cotFollowLigar: () => { db().follow.ligado = !db().follow.ligado; },
  cotPasso: el => { const p = db().follow.passos.find(x => x.id === el.dataset.p); p.ligado = !p.ligado; },
  cotPausar: el => { const f = db().follow, id = el.dataset.p; f.pausados = f.pausados.includes(id) ? f.pausados.filter(x => x !== id) : [...f.pausados, id]; },
});
document.addEventListener('change', ev => {
  const el = ev.target.closest?.('[data-cot],[data-preco],[data-passo]'); if (!el) return; const n = Math.max(0, +el.value || 0);
  if (el.dataset.cot) { const [id, i, k] = el.dataset.cot.split('.'), item = SP.by('cotacoes', id).itens[+i]; if (k === 'qtd') item.qtd = Math.round(n); else Object.assign(item, { produto: el.value, conf: el.value ? 100 : 0, fornecedor: '' }); }
  else if (el.dataset.passo) db().follow.passos.find(p => p.id === el.dataset.passo).dias = Math.max(1, Math.round(n));
  else { const k = el.dataset.preco.split('.'); if (k[0] === 'volume') db().precos.volume[+k[1]][k[2]] = n; else if (k[0] === 'margemMin') db().params.margemMin = n; else db().precos[k[0]] = n; SP.toast('Regra atualizada.'); }
  SP.draw();
});
})();
