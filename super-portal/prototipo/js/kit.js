/* Kit profissional: máscaras e validação, risco, próximo passo, registro em duas colunas, busca em linguagem natural. */
(() => {
const e = v => SP.esc(v), I = (n, s) => SP.icon(n, s), S = () => SP.S, db = () => SP.S.db, alnum = SP.alnum;

/* ---------- validação: no fim do campo e no envio, com mensagem que diz como corrigir ---------- */
SP.regras = {};
SP.erroDe = (r, v) => {
  const s = String(v ?? '').trim();
  if (r.req && !s) { const l = r.label.replace(/\s*\(.*\)/, ''); return /^(o|a) /.test(l) ? `Preencha ${l}.` : `Preencha o campo ${l}.`; }
  if (!s) return '';
  if (r.min && s.length < r.min) return `Escreva ao menos ${r.min} caracteres (faltam ${r.min - s.length}).`;
  if (r.mask === 'doc') { const c = alnum(s); if (/^\d{11}$/.test(c)) return SP.cpfValido(c) ? '' : 'CPF não confere. Revise os dois últimos dígitos.'; if (c.length !== 14) return 'Informe 11 caracteres (CPF) ou 14 (CNPJ).'; return SP.cnpjValido(c) ? '' : 'CNPJ não confere. Revise os dois últimos dígitos.'; }
  if (r.mask === 'cep' && SP.soDig(s).length !== 8) return 'O CEP tem 8 números.';
  if (r.mask === 'tel' && SP.soDig(s).length < 10) return 'Inclua o DDD: (11) 90000-0000.';
  if (r.mask === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return 'Falta algo no e-mail. Ex.: nome@empresa.com.br';
  return '';
};
SP.erroHtml = (id, t) => `<em class="erro" id="${id}-e">${I('alert', 13)}<span>${e(t)}</span></em>`;
/* valida o formulário na tela; devolve true se pode salvar */
SP.validar = (d, extra = {}) => {
  const regras = { ...SP.regras }; Object.entries(extra).forEach(([k, r]) => regras[k] = { ...regras[k], ...r });
  const erros = {}; Object.entries(regras).forEach(([p, r]) => { const v = SP.ler(d, p); const m = SP.erroDe(r, v); if (m) erros[p] = m; });
  S().erros = erros; if (Object.keys(erros).length) { SP.focarErro = true; S().toast = null; } return !Object.keys(erros).length;
};
SP.resumoErros = () => { const l = Object.entries(S().erros); return l.length ? `<div class="aviso t-bad resumo-erros" role="alert">${I('alert', 17)}<div><b>${SP.plural(l.length, 'campo precisa', 'campos precisam')} de correção</b><ul>${l.map(([p, t]) => `<li><button type="button" data-a="irCampo" data-p="${p}">${e(t)}</button></li>`).join('')}</ul></div></div>` : ''; };

/* ---------- risco do cliente, calculado e explicado ---------- */
SP.risco = id => {
  const l = db().contas.filter(c => c.cliente === id && c.status !== 'Estornada'), venc = l.filter(c => SP.contaStatus(c) === 'Vencida');
  const pagas = l.filter(c => c.status === 'Quitada' && c.pagamento), atraso = pagas.length ? Math.round(pagas.reduce((s, c) => s + Math.max(0, SP.dias(c.vencimento, c.pagamento)), 0) / pagas.length * 10) / 10 : 0;
  const maior = venc.reduce((m, c) => Math.max(m, SP.dias(c.vencimento)), 0), aberto = venc.reduce((s, c) => s + c.valor, 0);
  const nivel = maior > 7 || aberto > 3000 ? ['Alto', 'bad'] : venc.length || atraso > 2 ? ['Atenção', 'warn'] : ['Baixo', 'ok'];
  const motivo = venc.length ? `${SP.plural(venc.length, 'título vencido', 'títulos vencidos')} (${SP.brl(aberto)}), o mais antigo há ${SP.diasTxt(maior)}` : pagas.length ? `Sem vencidos; paga em média ${atraso ? SP.num(atraso) + (atraso === 1 ? ' dia' : ' dias') + ' após o vencimento' : 'em dia'}` : 'Sem histórico de pagamento';
  return { nivel: nivel[0], tom: nivel[1], motivo, atraso, vencidos: venc.length };
};
SP.riscoPill = id => { const r = SP.risco(id); return `<span class="pill t-${r.tom}" title="${e(r.motivo)}"><i></i>${r.nivel === 'Atenção' ? 'Atenção' : 'Risco ' + r.nivel.toLowerCase()}</span>`; };

/* ---------- próximo passo do pedido (uma ação, com o porquê) ---------- */
SP.proximoPasso = p => {
  if (p.status === 'Cancelado') return { titulo: 'Reativar o pedido', motivo: p.cancelObs || 'Pedido cancelado.', label: 'Reativar', a: 'reativar', p: p.id, icon: 'undo' };
  if (p.status === 'Rascunho') return { titulo: 'Completar o rascunho', motivo: 'Ainda não entrou na operação.', label: 'Editar pedido', go: 'pedEditar', id: p.id, icon: 'edit' };
  const e2 = SP.etapa(p), falta = SP.faltantes(p), semC = p.itens.filter(i => !i.comprado).length, semR = p.itens.filter(i => !i.chegou).length, atr = p.itens.filter(SP.atrasado);
  if (e2 === 'compra') return { titulo: 'Comprar os produtos', motivo: SP.plural(semC, 'item ainda não foi comprado', 'itens ainda não foram comprados') + '.', label: 'Registrar compra', a: 'irChecklist', p: p.id, icon: 'cart' };
  if (e2 === 'chegada') return { titulo: atr.length ? 'Cobrar o fornecedor' : 'Conferir o recebimento', motivo: atr.length ? `Previsão era ${SP.data(atr[0].previsao)}, há ${SP.diasTxt(SP.dias(atr[0].previsao))}.` : SP.plural(semR, 'item a caminho', 'itens a caminho') + '.', label: 'Abrir checklist', a: 'irChecklist', p: p.id, icon: 'checklist' };
  if (e2 === 'fat' && !p.nf) return falta.length ? { titulo: 'Completar dados para faturar', motivo: 'Faltam: ' + falta.join(', ') + '.', label: 'Completar dados', go: 'pedEditar', id: p.id, icon: 'edit' } : { titulo: 'Emitir a nota fiscal', motivo: 'Itens conferidos e dados completos.', label: 'Preparar NF-e', go: 'nfNova', id: p.id, icon: 'nf' };
  if (e2 === 'fat') return { titulo: 'Registrar o boleto', motivo: 'A nota saiu sem boleto.', label: 'Ver cobranças', go: 'boletos', icon: 'barcode' };
  if (e2 === 'envio') return !p.enviado ? { titulo: 'Despachar o pedido', motivo: 'NF e boleto prontos. O cliente recebe o rastreio sozinho.', label: 'Marcar como enviado', a: 'marcarPasso', p: p.id, v: 'enviado', icon: 'truck' } : { titulo: 'Confirmar o recebimento', motivo: 'Enviado' + (p.rastreio.codigo ? ' com rastreio ' + p.rastreio.codigo : '') + '.', label: 'Confirmar recebimento', a: 'marcarPasso', p: p.id, v: 'recebido', icon: 'check' };
  if (e2 === 'recebido') { const c = db().contas.find(x => x.pedido === p.numero && x.status === 'Aberta'); return { titulo: 'Acompanhar o pagamento', motivo: c ? `Próxima parcela de ${SP.brl(c.valor)} vence em ${SP.data(c.vencimento)}. A baixa é automática.` : 'Aguardando baixa.', label: 'Ver cobrança', go: c ? 'conta' : 'contas', id: c?.id, icon: 'money' }; }
  return { titulo: 'Pedido concluído', motivo: 'Entregue e pago.', label: 'Duplicar para recompra', a: 'dupPed', p: p.id, icon: 'copy' };
};
SP.passoCard = x => `<section class="passo" aria-label="Próximo passo"><span class="passo-i">${I(x.icon, 19)}</span><div><small>Próximo passo</small><b>${x.titulo}</b><p>${e(x.motivo)}</p></div>${SP.btn(x.label, { a: x.a, go: x.go, p: x.p, id: x.id, v: x.v, kind: 'primary' })}</section>`;

/* ---------- página de registro: cabeçalho, conteúdo e trilho lateral ---------- */
SP.registro = ({ topo = '', main = '', lado = '' }) => `${topo}<div class="registro"><div class="pilha">${main}</div><aside class="pilha trilho">${lado}</aside></div>`;
SP.destaque = pares => `<dl class="destaque">${pares.filter(Boolean).map(([k, v, s]) => `<div><dt>${k}</dt><dd>${v}</dd>${s ? `<small>${s}</small>` : ''}</div>`).join('')}</dl>`;
SP.tabelaItens = (ctx, d) => { const c = SP.calc(d); return `<div class="rol-x"><table class="tb mini"><thead><tr><th>Produto</th><th class="r">Qtd</th>${ctx.m ? '' : '<th class="r">Unitário</th>'}<th class="r">Total</th></tr></thead><tbody>${d.itens.map(i => `<tr><td>${SP.duas(e(i.nome), 'NCM ' + e(i.ncm || '—') + (i.obs ? ' · ' + e(i.obs) : ''))}</td><td class="r">${i.qtd}</td>${ctx.m ? '' : `<td class="r">${SP.brl(i.qtd ? SP.itemTotal(i) / i.qtd : 0)}</td>`}<td class="r"><b>${SP.brl(SP.itemTotal(i))}</b></td></tr>`).join('')}</tbody></table></div><dl class="soma">${c.desc ? `<div><dt>Subtotal</dt><dd>${SP.brl(c.sub)}</dd></div><div><dt>Desconto</dt><dd>− ${SP.brl(c.desc)}</dd></div>` : ''}<div class="tt"><dt>Total</dt><dd>${SP.brl(c.total)}</dd></div></dl>`; };
/* linha do tempo única do registro: histórico, recibos e comentários */
SP.tempo = (ctx, ref, hist = []) => {
  const l = [...hist.map(h => ({ em: h.em, titulo: e(h.txt), icon: 'history' })), ...db().atividade.filter(a => a.ref?.[1] === ref).map(a => ({ em: a.em, titulo: e(a.txt), icon: a.tipo === 'auto' ? 'bolt' : a.tipo === 'pessoa' ? 'user' : 'alert', tom: a.tipo, por: a.por })), ...db().comentarios.filter(c => c.ref === ref).map(c => ({ em: c.em, titulo: `<span class="coment">${e(c.txt).replace(/@([\wÀ-ú]+)/g, '<mark>@$1</mark>')}</span>`, icon: 'user', tom: 'pessoa', por: c.por }))].sort((a, b) => b.em.localeCompare(a.em));
  const d = SP.draft({ ...ctx, slot: 'cdraft' }, 'com:' + ref, () => ({ txt: '' }));
  return `<form class="comentar" data-enter="comentar" data-p="${ref}">${SP.avatar(SP.eu().nome, true)}<input data-com value="${e(d.txt)}" placeholder="Comentar… use @ para avisar alguém" aria-label="Escrever comentário">${SP.btn('', { a: 'comentar', p: ref, icon: 'send', title: 'Enviar comentário' })}</form>${SP.linha(l.map(x => ({ titulo: x.titulo, sub: SP.quando(x.em) + (x.por ? ' · ' + e(x.por) : ''), icon: x.icon, tom: x.tom })))}`;
};

/* ---------- busca em linguagem natural: mostra o que entendeu antes de aplicar ---------- */
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const valorDe = (key, x) => key === 'cr' ? x.valor : key === 'nf' ? x.total : SP.total(x);
SP.atende = (key, x, c) => (!c.cliente || x.cliente === c.cliente) && (!c.vendedor || (x.vendedor || SP.pedNum(x.pedido)?.vendedor) === c.vendedor) && (c.min == null || valorDe(key, x) >= c.min) && (c.max == null || valorDe(key, x) <= c.max) && (!c.parado || SP.parado(x)) && (!c.atrasado || x.itens.some(SP.atrasado)) && (!c.desde || (x.data || x.vencimento).slice(0, 10) >= c.desde);
const ENT = [
  { re: /\b(pedidos?)\b/, key: 'ped', go: 'pedLista', n: 'Pedidos', st: { aprovad: 'Aprovado', faturad: 'Faturado', cancelad: 'Cancelado', rascunho: 'Rascunho', analise: 'Em análise' } },
  { re: /\b(orcamentos?|propostas?|cotacoes)\b/, key: 'orc', go: 'orcLista', n: 'Orçamentos', st: { abert: 'Em aberto', enviad: 'Enviado', contra: 'Contra proposta', aprovad: 'Aprovado', reprovad: 'Reprovado', cancelad: 'Cancelado' } },
  { re: /\b(notas?|nfe?s?)\b/, key: 'nf', go: 'nfLista', n: 'Notas fiscais', st: { aguardando: 'Aguardando envio', enviad: 'Enviado', rejeitad: 'Rejeitado', cancelad: 'Cancelado' } },
  { re: /\b(contas?|titulos?|boletos?|receber|vencid\w*|inadimpl\w*|devendo)\b/, key: 'cr', go: 'contas', n: 'Contas a receber', st: { vencid: 'Vencida', inadimpl: 'Vencida', devendo: 'Vencida', quitad: 'Quitada', pag: 'Quitada', proxim: 'Próxima ao vencimento', abert: 'Aberta' } },
];
SP.interpretar = q => {
  const t = norm(q); if (t.length < 5) return null;
  let en = ENT.find(x => x.re.test(t));
  if (!en && /\b(parad|atrasad)/.test(t)) en = ENT[0];
  if (!en || !SP.pode(en.go)) return null;
  const c = {}, partes = [en.n];
  const st = Object.entries(en.st).find(([k]) => t.includes(k)); if (st) partes.push(st[1]);
  const nomes = (l, f) => l.find(x => norm(f(x)).split(/\s+/).filter(w => w.length > 3).slice(0, 2).some(w => new RegExp('\\b' + w).test(t)));
  const v = nomes(db().vendedores, x => x.nome); if (v) { c.vendedor = v.id; partes.push('de ' + v.nome.split(' ')[0]); }
  const cl = nomes(db().clientes, x => x.nome.replace(/(ltda|s\.?a\.?)$/i, '')); if (cl) { c.cliente = cl.id; partes.push(cl.nome); }
  const num = s => { const m = t.match(new RegExp('(?:' + s + ')\\s*(?:de\\s*)?(?:r\\$\\s*)?([\\d.]+(?:,\\d+)?)\\s*(mil)?')); return m ? SP.parseNum(m[1]) * (m[2] ? 1000 : 1) : null; };
  const mi = num('acima|maior(?:es)? que|mais de'); if (mi != null) { c.min = mi; partes.push('acima de ' + SP.brl(mi)); }
  const ma = num('abaixo|menor(?:es)? que|menos de|ate'); if (ma != null) { c.max = ma; partes.push('até ' + SP.brl(ma)); }
  if (en.key === 'ped' && /parad/.test(t)) { c.parado = true; partes.push('parados'); }
  if (en.key === 'ped' && /atrasad/.test(t)) { c.atrasado = true; partes.push('com compra atrasada'); }
  if (/\b(este mes|do mes)\b/.test(t)) { c.desde = SP.HOJE.slice(0, 8) + '01'; partes.push('deste mês'); }
  if (/\bhoje\b/.test(t)) { c.desde = SP.HOJE; partes.push('de hoje'); }
  if (partes.length < 2) return null;
  c.texto = partes.slice(1).join(' · ');
  return { go: en.go, key: en.key, status: st?.[1] || 'Todos', crit: c, resumo: partes.join(' · ') };
};
})();
