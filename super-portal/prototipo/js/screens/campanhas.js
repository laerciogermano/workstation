/* P · Campanhas de e-mail marketing. Envio simulado. */
(() => {
const e = v => SP.esc(v), db = () => SP.S.db;
const PUBLICOS = [
  ['todos', 'Todos os clientes', 'Toda a base', () => true],
  ['aberta', 'Com proposta em andamento', 'Proposta enviada ou em negociação', c => db().orcamentos.some(o => o.cliente === c.id && ['Enviado', 'Contra proposta'].includes(o.status))],
  ['sem', 'Sem pedido', 'Nunca compraram', c => !db().pedidos.some(p => p.cliente === c.id)],
  ['sp', 'Clientes de São Paulo', 'Estado de SP', c => c.uf === 'SP'],
  ['fora', 'Fora de São Paulo', 'Demais estados', c => c.uf !== 'SP'],
];
const publico = id => PUBLICOS.find(p => p[0] === id) || PUBLICOS[0];
const alcance = id => db().clientes.filter(c => publico(id)[3](c) && !db().descadastros.includes(c.id));
const ST = { Enviada: 'ok', Agendada: 'info', Rascunho: 'mute' };
const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '—';
const pill = c => SP.pill(ST[c.status], c.status);
const quandoC = c => c.status === 'Rascunho' ? '—' : SP.data(c.data);
const abrirC = c => ({ go: c.status === 'Enviada' ? 'campanhaVer' : 'campanhaForm', id: c.id });

SP.screen('campanhas', { code: 'F91', nome: 'Campanhas', flow: 'P', src: ['novo:E-mail marketing'], nota: 'Campanhas com status, público, data, abertura e cliques.',
  render(ctx) {
    const st = SP.visao('camp'), base = SP.filtrar('camp', db().campanhas, c => c.nome + ' ' + c.assunto), rows = base.filter(c => st === 'Todos' || c.status === st);
    const env = db().campanhas.filter(c => c.status === 'Enviada'), soma = k => env.reduce((s, c) => s + c[k], 0);
    return { titulo: 'Campanhas', acoes: SP.btn(ctx.m ? '' : 'Públicos', { go: 'publicos', icon: 'users', title: 'Públicos' }) + SP.btn(ctx.m ? '' : 'Nova campanha', { go: 'campanhaForm', id: 'novo', icon: 'plus', kind: 'primary', title: 'Nova campanha' }),
      corpo: `<div class="stats">${SP.stat('E-mails entregues', soma('entregues'), SP.plural(env.length, 'campanha enviada', 'campanhas enviadas'))}${SP.stat('Abertura média', pct(soma('aberturas'), soma('entregues')))}${SP.stat('Cliques', pct(soma('cliques'), soma('entregues')), 'sobre os entregues')}${SP.stat('Descadastros', soma('saidas'))}</div>`
        + SP.visoes('camp', Object.keys(ST), c => c.status, base) + SP.filtros(ctx, 'camp', 'Nome ou assunto') + SP.lista(ctx, { key: 'camp', rows, abrir: abrirC,
          cols: [{ h: 'Campanha', c: c => SP.duas(e(c.nome), e(c.assunto)), s: c => c.nome }, { h: 'Status', c: pill }, { h: 'Público', c: c => publico(c.publico)[1] }, { h: 'Data', c: quandoC, s: c => c.data }, { h: 'Abertura', r: 1, c: c => pct(c.aberturas, c.entregues) }, { h: 'Cliques', r: 1, c: c => pct(c.cliques, c.entregues) }],
          card: c => SP.regLinha(e(c.nome), c.status === 'Enviada' ? pct(c.aberturas, c.entregues) : '', publico(c.publico)[1] + ' · ' + quandoC(c), pill(c)) }) };
  } });

const NOVA = { nome: '', assunto: '', publico: 'todos', mensagem: '', data: '', status: 'Rascunho' };
SP.screen('campanhaForm', { code: 'F92', nome: 'Nova campanha', flow: 'P', pai: 'campanhas', form: true, exemplo: 'm3', src: ['novo:E-mail marketing', 'visao:Templates'], nota: 'Público com contagem, assunto, mensagem com prévia na marca do tenant, teste, agendamento e confirmação antes de enviar.',
  render(ctx) {
    const reg = SP.by('campanhas', ctx.id), d = SP.draft(ctx, 'camp:' + (ctx.id || 'novo'), () => SP.clone(reg || NOVA)), n = alcance(d.publico).length;
    const ex = alcance(d.publico)[0], texto = (d.mensagem || 'Escreva a mensagem.').replace(/\{comprador\}/g, ex ? ex.comprador.split(' ')[0] : 'cliente');
    const form = SP.card(SP.grade(SP.campo(d, 'nome', 'Nome da campanha', { req: true }) + SP.campo(d, 'publico', 'Público', { options: PUBLICOS.map(p => [p[0], p[1]]), hint: SP.plural(n, 'destinatário', 'destinatários') }) + SP.campo(d, 'assunto', 'Assunto', { req: true }) + SP.campo(d, 'mensagem', 'Mensagem', { type: 'area', rows: 6, req: true, hint: 'Use {comprador} para o primeiro nome.' }) + SP.campo(d, 'data', 'Agendar para', { type: 'date', hint: 'Deixe em branco para enviar agora' }), 1));
    const previa = SP.card(`<div class="msg-p">${SP.logo()}<b>${e(d.assunto || 'Assunto')}</b><p>${e(texto)}</p><small class="mute">${e(SP.tenant().razao)} · Cancelar o recebimento</small></div>`, { title: 'Prévia' });
    return { titulo: reg ? 'Campanha' : 'Nova campanha', sub: e(reg?.nome || ''), voltar: 'campanhas', corpo: `<div class="cols c2">${form}${previa}</div>`,
      rodape: (reg ? SP.btn('Excluir', { a: 'campExcluir', p: reg.id, kind: 'quiet', icon: 'trash' }) : '') + SP.btn('Enviar teste', { a: 'campTeste' }) + SP.btn('Salvar rascunho', { a: 'campSalvar', p: reg?.id || 'novo' }) + SP.btn(d.data ? 'Agendar' : 'Enviar', { a: 'campRevisar', p: reg?.id || 'novo', kind: 'primary', icon: 'send' }) };
  } });
SP.modals.campEnviar = d => ({ titulo: d.data ? 'Agendar campanha?' : 'Enviar campanha?', corpo: `<p><b>${e(d.assunto)}</b></p><p>${SP.plural(d.n, 'destinatário', 'destinatários')} · ${publico(d.publico)[1]}${d.data ? ' · em ' + SP.data(d.data) : ' · agora'}</p><p class="mute">Quem cancelou o recebimento fica de fora.</p>`, rodape: SP.btn('Voltar', { a: 'fechar' }) + SP.btn(d.data ? 'Agendar' : 'Enviar agora', { a: 'campConfirmar', p: d.id, kind: 'primary', icon: 'send' }) });

SP.screen('publicos', { code: 'F93', nome: 'Públicos', flow: 'P', pai: 'campanhas', src: ['novo:Segmentação', 'novo:Descadastro (LGPD)'], nota: 'Segmentos calculados a partir dos clientes e a lista de quem cancelou o recebimento.',
  render() {
    const fora = db().descadastros.map(SP.cli);
    return { titulo: 'Públicos', voltar: 'campanhas', corpo: `<div class="tiles">${PUBLICOS.map(p => SP.card(`<div class="reg-t"><b>${p[1]}</b><strong>${alcance(p[0]).length}</strong></div><p class="mute">${p[2]}</p><div class="row">${SP.btn('Criar campanha', { a: 'campPara', p: p[0], sm: true })}</div>`)).join('')}</div>`
      + SP.card(fora.length ? SP.linha(fora.map(c => ({ titulo: e(c.nome), sub: e(c.email), icon: 'x' }))) : '<p class="mute">Ninguém cancelou.</p>', { title: 'Cancelaram o recebimento' }) };
  } });

SP.screen('campanhaVer', { code: 'F94', nome: 'Resultado da campanha', flow: 'P', pai: 'campanhas', exemplo: 'm1', src: ['novo:E-mail marketing'], nota: 'Do envio ao clique, com a situação de cada destinatário.',
  render(ctx) {
    const c = SP.by('campanhas', ctx.id) || db().campanhas.find(x => x.status === 'Enviada');
    const passos = [['Enviados', c.enviados], ['Entregues', c.entregues], ['Abertos', c.aberturas], ['Cliques', c.cliques]];
    const dest = c.destinatarios.map(([id, sit]) => ({ titulo: e(SP.cli(id).nome), sub: e(SP.cli(id).email) + ' · ' + sit, icon: sit === 'clicou' ? 'check' : sit === 'não entregue' ? 'alert' : 'mail' }));
    return { titulo: e(c.nome), sub: e(c.assunto) + ' · ' + SP.data(c.data), voltar: 'campanhas', acoes: SP.btn(ctx.m ? '' : 'Duplicar', { a: 'campDuplicar', p: c.id, icon: 'copy', title: 'Duplicar' }),
      corpo: `<div class="stats">${SP.stat('Entregues', pct(c.entregues, c.enviados), c.entregues + ' de ' + c.enviados)}${SP.stat('Abertura', pct(c.aberturas, c.entregues))}${SP.stat('Cliques', pct(c.cliques, c.entregues))}${SP.stat('Descadastros', c.saidas)}</div><div class="cols c2">${SP.card(SP.linha(dest), { title: 'Destinatários' })}${SP.card(SP.barrasH(passos.map(([n, v]) => ({ n, v })), SP.num), { title: 'Do envio ao clique' })}</div>` };
  } });

const salvar = (id, extra = {}) => { const x = { ...SP.clone(SP.S.draft.v), ...extra }; const novo = id === 'novo'; if (novo) { x.id = SP.uid('m'); db().campanhas.unshift({ enviados: 0, entregues: 0, aberturas: 0, cliques: 0, saidas: 0, destinatarios: [], ...x }); } else Object.assign(SP.by('campanhas', id), x); };
const valida = d => SP.validar(d, { nome: { req: true, label: 'o nome' }, assunto: { req: true, label: 'o assunto' }, mensagem: { req: true, label: 'a mensagem' } });
Object.assign(SP.actions, {
  campTeste: () => SP.toast('Teste enviado para ' + SP.emailDe(SP.S.persona) + ' (simulado).'),
  campSalvar: el => { if (!valida(SP.S.draft.v)) return; SP.feito('Rascunho salvo.', () => salvar(el.dataset.p, { status: 'Rascunho' })); SP.S.draft = null; SP.ir('campanhas'); },
  campRevisar: el => { const d = SP.S.draft.v; if (!valida(d)) return; if (d.data && d.data <= SP.HOJE) return SP.toast('Escolha uma data futura ou deixe em branco.'); const n = alcance(d.publico).length; if (!n) return SP.toast('Este público não tem destinatários.'); SP.S.modal = { type: 'campEnviar', data: { id: el.dataset.p, n, assunto: d.assunto, publico: d.publico, data: d.data } }; },
  campConfirmar: el => { const d = SP.S.draft.v, l = alcance(d.publico);
    SP.feito(d.data ? 'Campanha agendada.' : 'Campanha enviada (simulado).', () => salvar(el.dataset.p, d.data ? { status: 'Agendada' } : { status: 'Enviada', data: SP.HOJE, enviados: l.length, entregues: l.length, aberturas: 0, cliques: 0, saidas: 0, destinatarios: l.map(c => [c.id, 'entregue']) }));
    SP.S.modal = null; SP.S.draft = null; SP.ir('campanhas'); },
  campExcluir: el => { SP.S.modal = { type: 'confirmar', data: { texto: 'Excluir esta campanha?', a: 'excluirReg', p: 'campanhas:' + el.dataset.p + ':campanhas' } }; },
  campPara: el => { const v = { ...NOVA, publico: el.dataset.p }; SP.ir('campanhaForm', 'novo'); SP.S.draft = { key: 'camp:novo', v, orig: JSON.stringify(v) }; },
  campDuplicar: el => { const c = SP.by('campanhas', el.dataset.p), v = { ...NOVA, nome: c.nome + ' (cópia)', assunto: c.assunto, publico: c.publico, mensagem: c.mensagem }; SP.ir('campanhaForm', 'novo'); SP.S.draft = { key: 'camp:novo', v, orig: JSON.stringify(v) }; },
});
})();
