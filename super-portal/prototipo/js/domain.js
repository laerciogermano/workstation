/* Regras de negócio e automação (estado em memória). */
(() => {
const S = SP.S = {};
SP.pref = (k, v) => { try { if (v === undefined) return localStorage.getItem('sp.' + k); localStorage.setItem('sp.' + k, v); } catch (_) { return null; } };
SP.reset = () => {
  S.db = SP.seed();
  Object.assign(S, { tenant: 't1', tema: 'light', persona: 'admin', q: {}, view: {}, tab: {}, sel: {}, modal: null, mdraft: null, nav: { screen: 'hoje' }, hist: [], peek: null, epico: null, ordem: {}, pagina: {}, colunas: {}, erros: {}, crit: {}, rede: 'normal', naFila: 0, densidade: SP.pref('densidade') || 'confortavel', pop: null, cmd: null, toast: null, draft: null, pausado: false, impersonar: null, menuFechado: false, undo: null, cliente: 'c1', completa: {}, expand: {}, calMes: null, chart: {} });
};
SP.reset();

const by = (col, id) => S.db[col].find(x => x.id === id);
SP.tenant = () => by('tenants', S.tenant);
SP.cli = id => by('clientes', id) || { nome: '—' };
SP.vend = id => by('vendedores', id) || { nome: '—' };
SP.prod = id => by('produtos', id);
SP.forn = id => by('fornecedores', id) || { nome: '—' };
SP.transp = id => by('transportadoras', id) || { nome: '—' };
SP.orc = id => by('orcamentos', id);
SP.ped = id => by('pedidos', id);
SP.pedNum = n => S.db.pedidos.find(p => p.numero === n);
SP.nfById = id => by('notas', id);
SP.conta = id => by('contas', id);
SP.by = by;
SP.uid = p => p + Math.random().toString(36).slice(2, 8);
SP.prox = (col, min = 0) => Math.max(min, ...S.db[col].map(x => +x.numero || 0)) + 1;

/* ---------- totais: qtd × custo × (1 + margem%) + extra ---------- */
SP.itemTotal = i => (+i.qtd || 0) * (+i.valor || 0) * (1 + (+i.margem || 0) / 100) + (+i.extra || 0);
SP.calc = d => {
  const custo = d.itens.reduce((s, i) => s + (+i.qtd || 0) * (+i.valor || 0), 0);
  const sub = d.itens.reduce((s, i) => s + SP.itemTotal(i), 0);
  const v = +d.desc || 0, desc = d.descTipo === 'valor' ? v : sub * v / 100;
  const total = sub - desc;
  return { custo, sub, desc, total, lucro: total - custo, margem: custo ? (total / custo - 1) * 100 : 0 };
};
SP.total = d => SP.calc(d).total;

/* ---------- etapas do pedido (checklist) ---------- */
SP.ETAPAS = { compra: ['Aguardando compra', 'bad'], chegada: ['Aguardando chegada', 'warn'], fat: ['Emitir NF / boleto', 'info'], envio: ['Enviar ao cliente', 'alt'], recebido: ['Aguardando pagamento', 'teal'], ok: ['Concluído', 'ok'], novo: ['Sem itens', 'mute'] };
SP.etapa = p => !p.itens.length ? 'novo' : p.itens.some(i => !i.comprado) ? 'compra' : p.itens.some(i => !i.chegou) ? 'chegada' : !(p.nf && p.boleto) ? 'fat' : !(p.enviado && p.recebido) ? 'envio' : !p.pago ? 'recebido' : 'ok';
SP.rotulo = p => { const e = SP.etapa(p); return e === 'envio' && p.enviado ? 'Enviado, aguardando cliente' : SP.ETAPAS[e][0]; };
SP.progresso = p => { if (!p.itens.length) return 0; const f = p.itens.reduce((s, i) => s + !!i.comprado + !!i.chegou, 0) + ['nf', 'boleto', 'enviado', 'recebido', 'pago'].reduce((s, k) => s + !!p[k], 0); return Math.round(f / (p.itens.length * 2 + 5) * 100); };
SP.ativos = () => S.db.pedidos.filter(p => !['Cancelado', 'Rascunho', 'Reprovado'].includes(p.status));
SP.parado = p => SP.etapa(p) !== 'ok' && SP.dias(p.atualizado) >= S.db.params.diasParado;
SP.atrasado = i => i.comprado && !i.chegou && i.previsao && i.previsao < SP.HOJE;
SP.LOG = ['Em separação', 'Faturado', 'Enviado', 'Entregue'];
SP.logAuto = p => p.recebido ? 3 : p.enviado ? 2 : p.nf ? 1 : 0;
SP.logStatus = p => SP.LOG[Math.max(SP.logAuto(p), SP.LOG.indexOf(p.logSt))];
SP.contaStatus = c => c.status !== 'Aberta' ? c.status : c.vencimento < SP.HOJE ? 'Vencida' : SP.dias(SP.HOJE, c.vencimento) <= S.db.params.proxVenc ? 'Próxima ao vencimento' : 'Aberta';
SP.TOM = {
  'Em aberto': 'info', 'Enviado': 'alt', 'Contra proposta': 'warn', 'Aprovado': 'ok', 'Reprovado': 'bad', 'Cancelado': 'mute',
  'Rascunho': 'mute', 'Em análise': 'warn', 'Faturado': 'info', 'Em separação': 'warn', 'Entregue': 'ok',
  'Aguardando envio': 'warn', 'Rejeitado': 'bad',
  'Aberta': 'info', 'Quitada': 'ok', 'Vencida': 'bad', 'Próxima ao vencimento': 'warn', 'Estornada': 'mute', 'Falta arquivo': 'alt',
  'Aberto': 'info', 'Aguardando': 'warn', 'Fechado': 'mute', 'pendente': 'warn',
};

/* ---------- templates ---------- */
SP.preencher = (txt, ref = {}) => {
  const t = SP.tenant(), p = ref.pedido, o = ref.orc, c = ref.conta, cl = SP.cli(ref.cliente || p?.cliente || o?.cliente || c?.cliente || 'c1');
  const v = {
    comprador: (cl.comprador || 'cliente').split(' ')[0], cliente: cl.nome, empresa: t.nome,
    orcamento: o?.numero ?? '3650', pedido: p?.numero ?? c?.pedido ?? '17160', nota: ref.nota ?? c?.nota ?? '340',
    total: SP.brl(c ? c.valor : o ? SP.total(o) : p ? SP.total(p) : 2890), titulo: c?.titulo ?? 'Fatura 1',
    vencimento: SP.data(c?.vencimento || SP.addDias(SP.HOJE, S.db.params.vencimento)), validade: o?.validade || S.db.params.validade, prazo: p?.prazo || S.db.params.prazo,
    vendedor: SP.vend(o?.vendedor || p?.vendedor || 'v1').nome.split(' ')[0], rastreio: p?.rastreio?.codigo || 'BR000000000SP', link: 'https://' + t.dominio,
  };
  return String(txt).replace(/\{\{(\w+)\}\}/g, (m, k) => v[k] ?? m);
};

/* ---------- registro de atividade, avisos, desfazer ---------- */
SP.log = (regra, txt, ref, tipo = 'auto', por) => {
  S.db.atividade.unshift({ id: SP.uid('x'), em: SP.agora(), regra, txt, ref, tipo, por: por || (tipo === 'pessoa' ? SP.eu().nome : 'Automação') });
  const r = by('regras', regra); if (r && tipo === 'auto') r.execucoes++;
};
SP.avisar = (assunto, ir, por) => S.db.notificacoes.unshift({ id: SP.uid('a'), assunto, por: por || SP.eu().nome, data: SP.agora(), lida: false, ir });
SP.toast = (msg, undo) => { S.toast = { msg, undo: !!undo, id: SP.uid('t') }; };
/* toda ação relevante gera um recibo e pode ser desfeita */
SP.feito = (msg, fn) => { const antes = JSON.stringify(S.db); const r = fn(); if (r === false) return false; S.undo = antes; if (S.rede === 'offline') { S.naFila++; msg += ' Será enviado quando a conexão voltar.'; } SP.toast(msg, true); return true; };
SP.desfazer = () => { if (!S.undo) return; S.db = JSON.parse(S.undo); S.undo = null; SP.toast('Ação desfeita.'); };
SP.eu = () => ({
  admin: { nome: 'Helena Duarte', cargo: 'Administrador' }, vendedor: { nome: 'Marina Alves', cargo: 'Vendedor', id: 'v1' },
  logistica: { nome: 'Paulo Reis', cargo: 'Logística', id: 'f1' }, investidor: { nome: 'Sérgio Matos', cargo: 'Investidor' },
  cliente: { nome: SP.cli(S.cliente).comprador, cargo: SP.cli(S.cliente).nome },
}[S.persona]);

/* ---------- fila "precisa de você" ---------- */
SP.enfileirar = item => {
  if (S.db.fila.some(f => f.status === 'pendente' && f.tipo === item.tipo && f.ref[1] === item.ref[1])) return;
  S.db.fila.unshift({ id: SP.uid('q'), prio: 'media', status: 'pendente', criado: SP.agora(), fatos: [], premissas: [], valor: 0, ...item });
};
SP.pendentes = () => S.db.fila.filter(f => f.status === 'pendente' && (S.persona !== 'vendedor' || SP.donoRef(f.ref) === 'v1') && (S.persona !== 'logistica' || ['dados', 'compra', 'nf'].includes(f.tipo)));
SP.donoRef = ([t, id]) => t === 'orc' ? SP.orc(id)?.vendedor : t === 'pedido' ? SP.ped(id)?.vendedor : null;

/* ---------- motor de regras ---------- */
SP.regra = (id, valor, executar, preparar) => {
  const r = by('regras', id);
  if (!r || !r.ligada) return;
  if (S.pausado) { S.db.atividade.unshift({ id: SP.uid('x'), em: SP.agora(), regra: id, txt: 'Automação pausada: “' + r.nome + '” não rodou', ref: null, tipo: 'humano', por: 'Automação' }); return; }
  const acimaLimite = r.limite && valor > r.limite;
  if (r.nivel === 'executar' && !acimaLimite) return executar(r);
  preparar(r);
};
const mensagem = (r, ref, refQ, titulo) => () => SP.enfileirar({ tipo: 'followup', prio: 'baixa', titulo, motivo: 'A regra está em modo “' + r.nivel + '”.', ref: refQ, regra: r.id, template: r.template, acao: 'Enviar mensagem' });

SP.FALTA = [['nome', 'nome'], ['doc', 'CNPJ/CPF'], ['cep', 'CEP'], ['endereco', 'endereço'], ['numeroEnd', 'número'], ['bairro', 'bairro'], ['cidade', 'cidade'], ['uf', 'estado']];
SP.faltantes = p => SP.FALTA.filter(([k]) => !String(p[k] || '').trim()).map(x => x[1]);

SP.gerarPedido = (o, por = 'auto') => {
  if (S.db.pedidos.some(p => p.orc === o.numero && p.status !== 'Cancelado')) return;
  const { hist, titulo, status, contra, ...dados } = SP.clone(o);
  const p = { ...dados, id: SP.uid('d'), numero: SP.prox('pedidos', 17000), orc: o.numero, data: SP.HOJE, status: 'Aprovado', ocNum: '', ocArq: '', tabela: '28 dias', primeiro: '', vezes: 1, nf: false, boleto: false, enviado: false, recebido: false, pago: false, rastreio: { codigo: '', link: '' }, frete_valor: 0, emails: [], anexos: [], etiqueta: null, logSt: '', obsPedido: '', cancelObs: '', atualizado: SP.HOJE, hist: [{ txt: 'Pedido gerado do orçamento ' + o.numero, em: SP.agora() }] };
  p.itens.forEach(i => Object.assign(i, { comprado: false, chegou: false, previsao: '' }));
  S.db.pedidos.unshift(p);
  SP.log(por === 'auto' ? 'r1' : '', 'Pedido ' + p.numero + ' criado a partir do orçamento ' + o.numero, ['pedido', p.id], por);
  SP.avisar('Pedido ' + p.numero + ' criado', ['pedVer', p.id], por === 'auto' ? 'Automação' : null);
  SP.pedidoCriado(p);
  return p;
};
SP.pedidoCriado = p => SP.regra('r2', SP.total(p),
  () => SP.log('r2', 'Confirmação do pedido ' + p.numero + ' enviada ao cliente', ['pedido', p.id]),
  r => mensagem(r, { pedido: p }, ['pedido', p.id], 'Confirmar pedido ' + p.numero + ' ao cliente')());

SP.statusOrc = (o, st) => {
  if (o.status === st) return;
  o.status = st; o.hist.unshift({ txt: 'Status alterado para ' + st + ' por ' + SP.eu().nome, em: SP.agora() });
  if (st === 'Aprovado') SP.regra('r1', SP.total(o), () => SP.gerarPedido(o), () => SP.enfileirar({ tipo: 'gerar', titulo: 'Gerar pedido do orçamento ' + o.numero, motivo: 'Orçamento aprovado; a regra pede confirmação.', ref: ['orc', o.id], valor: SP.total(o), acao: 'Gerar pedido', regra: 'r1' }));
  if (['Aprovado', 'Reprovado', 'Cancelado'].includes(st)) S.db.fila.forEach(f => { if (f.ref[1] === o.id && f.tipo !== 'gerar' && f.status === 'pendente') f.status = 'resolvido'; });
};

SP.tudoChegou = p => {
  const f = SP.faltantes(p);
  SP.regra('r5', SP.total(p),
    () => f.length ? SP.semDados(p, f) : SP.emitirNF(p, 'auto'),
    () => f.length ? SP.semDados(p, f) : (SP.enfileirar({ tipo: 'nf', prio: 'alta', titulo: 'Aprovar NF-e do pedido ' + p.numero, motivo: 'NF-e preenchida. Emissão fiscal pede conferência' + (SP.total(p) > 5000 ? ' (acima de R$ 5.000,00).' : '.'), ref: ['pedido', p.id], valor: SP.total(p), acao: 'Emitir NF-e', regra: 'r5', fatos: ['Todos os itens chegaram', 'Dados do destinatário completos'], premissas: ['CFOP 5102 e transportadora padrão'] }), SP.log('r5', 'NF-e do pedido ' + p.numero + ' preparada, aguardando aprovação', ['pedido', p.id], 'humano')));
};
SP.semDados = (p, f) => { SP.enfileirar({ tipo: 'dados', prio: 'alta', titulo: 'Faltam dados para faturar o pedido ' + p.numero, motivo: 'A NF-e não pode ser montada.', ref: ['pedido', p.id], valor: SP.total(p), acao: 'Completar dados', regra: 'r5', fatos: ['Campos vazios: ' + f.join(', ')], premissas: [] }); };

SP.emitirNF = (p, por = 'pessoa') => {
  if (SP.faltantes(p).length) { SP.toast('Complete antes: ' + SP.faltantes(p).join(', ') + '.'); return false; }
  const n = { id: SP.uid('n'), numero: SP.prox('notas'), data: SP.agora(), status: 'Enviado', cliente: p.cliente, pedido: p.numero, total: SP.total(p), transportadora: 't02', tipo: '1 - Saída', cfop: '5102' };
  S.db.notas.unshift(n);
  Object.assign(p, { nf: true, status: 'Faturado', atualizado: SP.HOJE });
  S.db.fila.forEach(f => { if (f.ref[1] === p.id && ['nf', 'dados'].includes(f.tipo)) f.status = 'resolvido'; });
  SP.log(por === 'auto' ? 'r5' : '', 'NF ' + n.numero + ' emitida para o pedido ' + p.numero, ['nf', n.id], por);
  SP.nfAutorizada(n, p);
  return n;
};
SP.nfAutorizada = (n, p) => {
  SP.regra('r6', n.total, () => {
    const dias = ((p?.tabela || '28').match(/\d+/g) || ['28']).map(Number);
    dias.forEach((d, k) => S.db.contas.unshift({ id: SP.uid('cr'), status: 'Aberta', vencimento: SP.addDias(SP.HOJE, d), pagamento: '', titulo: 'Fatura ' + (k + 1) + ' da nota fiscal nº ' + n.numero, cliente: n.cliente, valor: Math.round(n.total / dias.length * 100) / 100, banco: 'b1', descricao: '', anexos: [], boleto: true, pedido: p?.numero, nota: n.numero }));
    if (p) p.boleto = true;
    SP.log('r6', dias.length + ' parcela(s) e boleto gerados para a NF ' + n.numero, ['nf', n.id]);
  }, () => SP.enfileirar({ tipo: 'boleto', titulo: 'Gerar boleto da NF ' + n.numero, motivo: 'A regra pede confirmação.', ref: ['nf', n.id], valor: n.total, acao: 'Gerar boleto', regra: 'r6' }));
  SP.regra('r7', n.total, () => SP.log('r7', 'NF ' + n.numero + ' e boleto enviados ao cliente', ['nf', n.id]), r => mensagem(r, { pedido: p }, ['nf', n.id], 'Enviar NF ' + n.numero + ' ao cliente')());
};

SP.marcar = (p, campo, idx) => {
  const antes = SP.rotulo(p), chegouAntes = p.itens.every(i => i.chegou);
  if (idx != null) {
    const i = p.itens[idx]; i[campo] = !i[campo];
    if (campo === 'comprado' && !i.comprado) i.chegou = false;
  } else p[campo] = !p[campo];
  p.atualizado = SP.HOJE;
  if (!chegouAntes && p.itens.every(i => i.chegou) && !p.nf) SP.tudoChegou(p);
  if (campo === 'enviado' && p.enviado) SP.regra('r8', 0, () => SP.log('r8', 'Rastreio do pedido ' + p.numero + ' enviado ao cliente', ['pedido', p.id]), r => mensagem(r, { pedido: p }, ['pedido', p.id], 'Avisar rastreio do pedido ' + p.numero)());
  const depois = SP.rotulo(p);
  if (antes !== depois) SP.avisar('Pedido ' + p.numero + ' passou para “' + depois + '”', ['checklist']);
};

SP.quitar = (ids, data, banco, juros = 0) => ids.forEach(id => {
  const c = SP.conta(id); if (!c || c.status === 'Quitada') return;
  Object.assign(c, { status: 'Quitada', pagamento: data, banco, valor: Math.round((c.valor + juros) * 100) / 100 });
  SP.log('', 'Título quitado: ' + c.titulo, ['conta', c.id], 'pessoa');
  S.db.fila.forEach(f => { if (f.ref[1] === id) f.status = 'resolvido'; });
  const p = SP.pedNum(c.pedido);
  if (p && S.db.contas.filter(x => x.pedido === c.pedido && x.status !== 'Estornada').every(x => x.status === 'Quitada'))
    SP.regra('r12', c.valor, () => { p.pago = true; p.atualizado = SP.HOJE; SP.log('r12', 'Pedido ' + p.numero + ' concluído: todas as parcelas pagas', ['pedido', p.id]); }, () => {});
});

SP.pedidoDaOC = e => {
  const c = SP.cli(e.cliente);
  const itens = e.itens.map(x => { const p = SP.prod(x.produto); return { produto: p.id, nome: p.nome, ncm: p.ncm, qtd: x.qtd, valor: p.custo, margem: p.margem, extra: 0, obs: '', comprado: false, chegou: false, previsao: '' }; });
  const o = SP.clone(S.db.orcamentos[0]);
  Object.assign(o, { cliente: c.id, doc: c.cnpj, nome: c.nome, comprador: c.comprador, email: c.email, telefone: c.telefone, ie: c.ie, isento: c.isento, icms: c.icms, cep: c.cep, endereco: c.endereco, numeroEnd: c.numero, bairro: c.bairro, cidade: c.cidade, uf: c.uf, itens, desc: 0 });
  const num = SP.prox('pedidos', 17000);
  const p = SP.gerarPedido({ ...o, numero: SP.prox('orcamentos') }, 'pessoa');
  Object.assign(p, { numero: num, orc: null, ocNum: e.ocNum, ocArq: e.arquivo });
  e.status = 'convertido';
  return p;
};

SP.resolver = (f, texto) => {
  const [t, id] = f.ref;
  if (f.tipo === 'nf') { if (!SP.emitirNF(SP.ped(id))) return false; }
  else if (f.tipo === 'contra') { const o = SP.orc(id), c = SP.calc(o); o.descTipo = 'valor'; o.desc = Math.round((c.sub - f.valor) * 100) / 100; SP.statusOrc(o, 'Aprovado'); }
  else if (f.tipo === 'oc') SP.pedidoDaOC(SP.by('entradas', id));
  else if (f.tipo === 'gerar') SP.gerarPedido(SP.orc(id), 'pessoa');
  else if (f.tipo === 'compra') { const p = SP.ped(id), d = texto || SP.addDias(SP.HOJE, 3); p.itens.filter(SP.atrasado).forEach(i => i.previsao = d); p.atualizado = SP.HOJE; SP.log('', 'Nova previsão do pedido ' + p.numero + ': ' + SP.data(d), f.ref, 'pessoa'); }
  else if (f.tipo === 'dados') return false;
  else SP.log('', 'Mensagem enviada: ' + f.titulo, f.ref, 'pessoa');
  f.status = 'resolvido'; f.resolvidoPor = SP.eu().nome; f.resolvidoEm = SP.agora();
  return true;
};
})();
