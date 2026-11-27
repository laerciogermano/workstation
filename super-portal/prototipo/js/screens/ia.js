/* O · Copiloto: um chat que lista o que a pessoa pede, ensina a fazer e escreve mensagens.
   No protótipo as respostas são montadas por regras locais sobre os dados de exemplo. */
(() => {
const e = v => SP.esc(v), I = (n, s) => SP.icon(n, s), db = () => SP.S.db;
const meu = l => SP.S.persona === 'vendedor' ? l.filter(o => o.vendedor === 'v1') : l;
const meusLeads = () => SP.S.persona === 'vendedor' ? db().leads.filter(l => !l.dono || l.dono === 'v1') : db().leads;
const abertas = () => db().contas.filter(c => !['Quitada', 'Estornada'].includes(c.status));
const cliente = id => SP.cli(id).nome;
const item = (t, s, go, id) => ({ t, s, go, id });
const lista = (um, varios, vazio, itens) => itens.length ? { txt: `${SP.plural(itens.length, um, varios)}:`, itens } : { txt: vazio };

/* ---------- o que o copiloto lista ---------- */
const LISTAS = [
  { chave: ['hoje', 'prioridade', 'fazer agora'], tela: 'orcLista', f: () => { const itens = [
      ...meu(db().orcamentos).filter(o => o.status === 'Contra proposta').map(o => item('Responder a contra proposta ' + o.numero, cliente(o.cliente), 'orcEditar', o.id)),
      ...meu(SP.ativos()).filter(SP.parado).map(p => item('Destravar o pedido ' + p.numero, `${cliente(p.cliente)} · ${SP.rotulo(p)}`, 'pedVer', p.id)),
      ...(SP.pode('contas') ? abertas().filter(c => SP.contaStatus(c) === 'Vencida').map(c => item('Cobrar ' + cliente(c.cliente), `${SP.brl(c.valor)} · venceu em ${SP.data(c.vencimento)}`, 'conta', c.id)) : [])];
    return itens.length ? { txt: 'Para hoje, nesta ordem:', itens } : { txt: 'Nada urgente para hoje.' }; } },
  { chave: ['parad', 'atrasad'], le: 'pedidos', tela: 'parados', f: () => lista('pedido parado', 'pedidos parados', 'Nenhum pedido parado.', meu(SP.ativos()).filter(SP.parado).map(p => item('Pedido ' + p.numero, `${cliente(p.cliente)} · ${SP.rotulo(p)} · há ${SP.dias(p.atualizado)} dias`, 'pedVer', p.id))) },
  { chave: ['tarefa'], tela: 'quadroTarefas', f: () => lista('tarefa em aberto', 'tarefas em aberto', 'Nenhuma tarefa em aberto.', db().tarefas.filter(t => t.coluna !== 'feito' && (SP.S.persona === 'admin' || t.dono === SP.eu().nome)).sort((a, b) => (a.prazo || '9').localeCompare(b.prazo || '9')).map(t => item(t.nome, `${t.dono}${t.prazo ? ' · ' + SP.data(t.prazo) : ''}`, 'tarefa', t.id))) },
  { chave: ['lead'], tela: 'leads', f: q => { const quentes = /quente/i.test(q), l = meusLeads().filter(x => !['Convertido', 'Descartado'].includes(x.status) && (!quentes || SP.notaLead(x) >= 70)).sort((a, b) => SP.notaLead(b) - SP.notaLead(a)); return lista(quentes ? 'lead quente' : 'lead em aberto', quentes ? 'leads quentes' : 'leads em aberto', 'Nenhum lead nesse recorte.', l.map(x => item(x.empresa, `${x.status} · ${SP.brl(x.valor)} · ${x.origem}`, 'lead', x.id))); } },
  { chave: ['receber', 'vencid', 'titulo', 'conta', 'cobran'], le: 'financeiro', tela: 'contas', f: q => { const so = /vencid/i.test(q), l = abertas().filter(c => !so || SP.contaStatus(c) === 'Vencida').sort((a, b) => a.vencimento.localeCompare(b.vencimento)); const r = lista(so ? 'título vencido' : 'título a receber', so ? 'títulos vencidos' : 'títulos a receber', so ? 'Nenhum título vencido.' : 'Nada a receber.', l.map(c => item(cliente(c.cliente), `${SP.brl(c.valor)} · vence em ${SP.data(c.vencimento)}`, 'conta', c.id))); if (l.length) r.txt = r.txt.replace(':', `, somando ${SP.brl(l.reduce((s, c) => s + c.valor, 0))}:`); return r; } },
  { chave: ['proposta', 'orcamento', 'resposta'], le: 'orcamentos', tela: 'orcLista', f: () => lista('proposta aguardando resposta', 'propostas aguardando resposta', 'Nenhuma proposta esperando resposta.', meu(db().orcamentos).filter(o => ['Enviado', 'Contra proposta'].includes(o.status)).map(o => item(`Proposta ${o.numero} · ${cliente(o.cliente)}`, `${SP.brl(SP.total(o))} · ${o.status} · ${SP.data(o.data)}`, 'orcEditar', o.id))) },
  { chave: ['estoque', 'produto'], tela: 'produtos', f: () => lista('produto sem estoque', 'produtos sem estoque', 'Todos os produtos têm estoque.', db().produtos.filter(p => !p.estoque).map(p => item(p.nome, 'Sem estoque', 'produto', p.id))) },
  { chave: ['cliente'], tela: 'clientes', f: () => lista('cliente sem pedido', 'clientes sem pedido', 'Todos os clientes já compraram.', db().clientes.filter(c => !db().pedidos.some(p => p.cliente === c.id)).map(c => item(c.nome, `${c.comprador} · ${c.cidade}`, 'cliente', c.id))) },
  { chave: ['pedido'], le: 'pedidos', tela: 'pedLista', f: () => lista('pedido em andamento', 'pedidos em andamento', 'Nenhum pedido em andamento.', meu(SP.ativos()).filter(p => SP.etapa(p) !== 'ok').map(p => item('Pedido ' + p.numero, `${cliente(p.cliente)} · ${SP.rotulo(p)}`, 'pedVer', p.id))) },
  { chave: ['vendeu', 'vendedor', 'ranking', 'meta'], le: 'orcamentos', tela: 'dashComercial', f: () => ({ txt: 'Vendas em novembro:', itens: db().vendedores.filter(v => v.ativo && (SP.S.persona === 'admin' || v.id === 'v1')).sort((a, b) => b.vendido - a.vendido).map(v => item(v.nome, `${SP.brl(v.vendido)} · ${Math.round(v.vendido / v.meta * 100)}% da meta`)) }) },
];

/* ---------- o que o copiloto ensina ---------- */
const AULAS = [
  { chave: ['nota', 'nf'], tela: 'nfNova', id: 'novo', titulo: 'Emitir uma nota fiscal', passos: ['Abra Notas fiscais e escolha Nova nota fiscal.', 'Puxe os dados pelo número do pedido.', 'Confira cliente, CFOP e transportadora.', 'Revise os impostos e valide na SEFAZ.', 'Emita. O boleto e as parcelas saem em seguida.'] },
  { chave: ['lead', 'converter'], tela: 'leads', titulo: 'Converter um lead em cliente', passos: ['Abra Leads e escolha o contato.', 'Registre a conversa no histórico.', 'Marque a etapa como Qualificado.', 'Toque em Converter em cliente.', 'Crie o primeiro orçamento pela própria ficha.'] },
  { chave: ['campanha', 'e-mail', 'email'], tela: 'campanhas', titulo: 'Criar uma campanha de e-mail', passos: ['Abra Campanhas e escolha Nova campanha.', 'Selecione o público e veja quantos vão receber.', 'Escreva o assunto e a mensagem.', 'Envie um teste para você.', 'Envie agora ou agende; o portal pede confirmação.'] },
  { chave: ['tarefa', 'kanban', 'quadro'], tela: 'quadroTarefas', titulo: 'Usar o quadro de tarefas', passos: ['Abra Tarefas e escolha Nova tarefa.', 'Defina responsável, prazo e prioridade.', 'Arraste o cartão conforme avançar, ou use o menu dele.', 'Em Colunas, ajuste nomes e limites.'] },
  { chave: ['cobr', 'boleto', 'receber'], tela: 'cobranca', titulo: 'Cobrar um título vencido', passos: ['Abra Cobrança para ver o que vale cobrar primeiro.', 'Escolha o título.', 'Revise a mensagem sugerida.', 'Envie e acompanhe a régua.'] },
  { chave: ['pedido'], tela: 'orcLista', titulo: 'Gerar um pedido', passos: ['Abra Orçamentos.', 'Mude a proposta para Aprovado.', 'Use Gerar pedido na linha da proposta.', 'Complete os dados fiscais, a entrega e o pagamento.'] },
  { chave: ['orcamento', 'proposta', 'cotacao'], tela: 'orcNovo', titulo: 'Criar um orçamento', passos: ['Abra Orçamentos e escolha Novo orçamento.', 'Selecione o cliente.', 'Adicione os produtos com quantidade e margem.', 'Confira o total e o desconto.', 'Salve e envie a proposta.'] },
  { chave: ['cliente'], tela: 'cliente', id: 'novo', titulo: 'Cadastrar um cliente', passos: ['Abra Clientes e escolha Novo cliente.', 'Informe CNPJ ou CPF; o portal confere os dígitos.', 'Preencha o endereço pelo CEP.', 'Salve.'] },
];

/* ---------- o que o copiloto escreve ---------- */
const escrever = (id, objetivo) => {
  const c = SP.cli(id), nome = String(c.comprador || '').split(' ')[0], tom = db().ia.tom;
  const oi = { Direto: `Oi, ${nome}.`, Cordial: `Olá, ${nome}, tudo bem?`, Formal: `Prezado(a) ${c.comprador},` }[tom];
  const o = db().orcamentos.find(x => x.cliente === id && ['Enviado', 'Contra proposta', 'Em aberto'].includes(x.status)), t = abertas().find(x => x.cliente === id);
  const meio = objetivo === 'cobrar' ? (t ? `Consta em aberto o título “${t.titulo}”, de ${SP.brl(t.valor)}, com vencimento em ${SP.data(t.vencimento)}. Se já pagou, desconsidere; se precisar da segunda via, envio agora.` : 'Não encontrei título em aberto no seu cadastro.')
    : o ? `A proposta ${o.numero}, de ${SP.brl(SP.total(o))}, continua disponível. Posso ajustar quantidade, prazo ou pagamento. O que falta para decidir?` : 'Há alguma compra prevista para os próximos meses? Posso preparar uma cotação.';
  return `${oi}\n\n${meio}\n\n${tom === 'Formal' ? 'Atenciosamente' : 'Abraço'},\n${SP.eu().nome}\n${SP.tenant().nome}`;
};

/* ---------- entender o pedido ---------- */
const tem = (q, l) => l.some(c => SP.contem(q, c));
const negado = tela => SP.entregue(tela) ? 'Seu perfil não acessa isso.' : 'Isso ainda não existe nesta fase do portal.';
const AJUDA = 'Posso listar (pedidos parados, propostas, títulos, leads, tarefas, estoque, clientes e vendas), ensinar a fazer (orçamento, pedido, nota fiscal, cobrança, cliente, lead, campanha e tarefas) e escrever uma mensagem para um cliente.';
const responder = q => {
  /* “como faço…” ensina; “como estão…” é pedido de lista */
  if (tem(q, ['ensin', 'passo a passo', 'aprender', 'explica']) || /como (eu )?(fac|faz|cri|emit|ger|cadastr|us|convert|cobr|envi|mand)/i.test(q.normalize('NFD').replace(/\p{Diacritic}/gu, ''))) {
    const a = AULAS.find(a => tem(q, a.chave));
    if (!a) return { txt: 'Ainda não sei ensinar isso. ' + AJUDA };
    if (!SP.pode(a.tela)) return { txt: negado(a.tela) };
    return { txt: a.titulo + ':', passos: a.passos, tela: a.tela, id: a.id };
  }
  if (tem(q, ['escrev', 'redig', 'redij', 'mensagem', 'follow'])) {
    const c = db().clientes.find(c => c.nome.split(' ').filter(p => p.length > 3).some(p => SP.contem(q, p)) || SP.contem(q, c.comprador.split(' ')[0]));
    if (!c) return { txt: 'Para quem é? Diga o nome do cliente, por exemplo: “escreva um follow-up para a Raiz Educação”.' };
    if (!SP.pode('orcLista')) return { txt: negado('orcLista') };
    const objetivo = tem(q, ['cobr', 'titulo', 'vencid']) ? 'cobrar' : 'retomar';
    if (objetivo === 'cobrar' && !SP.pode('contas')) return { txt: negado('contas') };
    return { txt: `Rascunho para ${c.comprador} (${c.nome}). Revise antes de enviar.`, rascunho: escrever(c.id, objetivo) };
  }
  const l = LISTAS.find(l => tem(q, l.chave));
  if (!l) return { txt: tem(q, ['sabe', 'ajuda', 'pode fazer']) ? AJUDA : 'Não entendi. ' + AJUDA };
  if (l.le && !db().ia.le[l.le]) return { txt: 'A leitura desses dados está desligada em Configurar copiloto.' };
  if (!SP.pode(l.tela)) return { txt: negado(l.tela) };
  return l.f(q);
};

/* ---------- conversa ---------- */
const SUGESTOES = {
  Listar: [['O que faço hoje?', 'orcLista'], ['Liste os pedidos parados', 'parados'], ['Liste as propostas sem resposta', 'orcLista'], ['Liste os títulos vencidos', 'contas'], ['Liste os leads quentes', 'leads']],
  Aprender: [['Como criar um orçamento?', 'orcNovo'], ['Como emitir uma nota fiscal?', 'nfNova'], ['Como converter um lead?', 'leads'], ['Como usar o quadro de tarefas?', 'quadroTarefas']],
  Escrever: [['Escreva um follow-up para a Raiz Educação', 'orcLista']],
};
const sugestoes = () => Object.entries(SUGESTOES).map(([g, l]) => { const v = l.filter(x => SP.pode(x[1])); return v.length ? `<div class="cop-s"><h5>${g}</h5><div class="row">${v.map(([p]) => SP.btn(p, { a: 'iaPerguntar', p, sm: true })).join('')}</div></div>` : ''; }).join('');
const corpoResposta = (r, i) => `<p>${e(r.txt)}</p>`
  + (r.itens ? `<ul class="cop-l">${r.itens.map(x => `<li>${x.go && SP.pode(x.go) ? `<button type="button" data-go="${x.go}" data-id="${x.id}"><span><b>${e(x.t)}</b><small>${e(x.s)}</small></span>${I('next', 15)}</button>` : `<div><span><b>${e(x.t)}</b><small>${e(x.s)}</small></span></div>`}</li>`).join('')}</ul>` : '')
  + (r.passos ? `<ol class="cop-p">${r.passos.map(p => `<li>${e(p)}</li>`).join('')}</ol><div class="row">${SP.btn('Me leve até lá', { go: r.tela, id: r.id, sm: true, icon: 'next', kind: 'primary' })}</div>` : '')
  + (r.rascunho ? `<blockquote class="pre">${e(r.rascunho)}</blockquote><div class="row">${SP.btn('Copiar', { a: 'copiar', v: r.rascunho, sm: true, icon: 'copy' })}${SP.btn('Enviar', { a: 'iaEnviar', p: i, sm: true, icon: 'send', kind: 'primary' })}</div>` : '');
const bolhas = l => l.map((m, i) => `<li class="eu">${SP.avatar(SP.eu().nome, true)}<div><p>${e(m.q)}</p></div></li><li><span class="av sm" aria-hidden="true">${I('spark', 14)}</span><div><b>Copiloto</b>${corpoResposta(m.r, i)}</div></li>`).join('');
const daPersona = () => db().conversa.filter(m => m.persona === SP.S.persona);

SP.screen('assistente', { code: 'F87', nome: 'Copiloto', flow: 'O', src: ['novo:Copiloto em chat'], nota: 'Um chat: a pessoa pede e ele lista, ensina o passo a passo ou escreve a mensagem. Respeita o perfil e o que pode ler. No protótipo, as respostas são simuladas por regras locais.',
  render(ctx) {
    const d = SP.draft(ctx, 'cop', () => ({ pergunta: '' })), demo = SP.screens[ctx.screen].demo;
    const msgs = demo ? demo.map(q => ({ q, r: responder(q) })) : daPersona();
    const inicio = `<div class="cop-o">${I('spark', 28)}<h2>Oi, ${e(SP.eu().nome.split(' ')[0])}. O que você precisa?</h2><p class="mute">Peça uma lista ou pergunte como fazer algo.</p></div>${sugestoes()}`;
    return { titulo: 'Copiloto', voltar: ctx.m ? 'menu' : null,
      acoes: (msgs.length && !demo ? SP.btn(ctx.m ? '' : 'Nova conversa', { a: 'iaNova', icon: 'plus', title: 'Nova conversa' }) : '') + (SP.pode('iaConfig') ? SP.btn(ctx.m ? '' : 'Configurar', { go: 'iaConfig', icon: 'sliders', title: 'Configurar copiloto' }) : ''),
      corpo: `<div class="cop">${msgs.length ? `<ol class="msgs" aria-live="polite">${bolhas(msgs)}</ol>` : inicio}</div>`,
      rodape: `<div class="cop-in">${SP.campo(d, 'pergunta', 'Peça ou pergunte', { type: 'area', rows: 1, ph: 'Ex.: liste os pedidos parados' })}${SP.btn(ctx.m ? '' : 'Enviar', { a: 'iaPerguntar', kind: 'primary', icon: 'send', title: 'Enviar' })}</div>` };
  } });
SP.screen('copListas', { code: 'F88', nome: 'Copiloto · pedir uma lista', flow: 'O', base: 'assistente', demo: ['Liste os pedidos parados'], src: ['novo:Listas por conversa'], nota: 'O pedido vira uma lista com atalho para cada registro.', render: () => ({}) });
SP.screen('copEnsina', { code: 'F89', nome: 'Copiloto · aprender a fazer', flow: 'O', base: 'assistente', demo: ['Como criar um orçamento?'], src: ['novo:Ensino passo a passo'], nota: 'A resposta ensina em passos e leva até a tela.', render: () => ({}) });

/* ---------- configuração ---------- */
const TONS = ['Direto', 'Cordial', 'Formal'];
SP.screen('iaConfig', { code: 'F90', nome: 'Configurar copiloto', flow: 'O', soAdmin: true, src: ['novo:Limites da IA'], nota: 'O que o copiloto pode ler, o tom das mensagens e a garantia de que o envio é sempre de uma pessoa.',
  render() {
    const c = db().ia, linha = (k, t, d) => `<div class="linha-sw"><div><b>${t}</b><small>${d}</small></div>${SP.sw(c.le[k], 'iaLer', k, t)}</div>`;
    return { titulo: 'Configurar copiloto', sub: 'Vale para todos os usuários da marca.', voltar: 'assistente',
      corpo: SP.card(linha('orcamentos', 'Orçamentos e vendas', 'Propostas, valores e vendedores') + linha('pedidos', 'Pedidos', 'Etapas e prazos') + linha('financeiro', 'Financeiro', 'Títulos a receber. Só quem acessa o financeiro pergunta.'), { title: 'O que pode ler', cls: 'estreito' })
        + SP.card(`<h4>Tom das mensagens</h4>${SP.seg(c.tom, TONS, 'iaTom', '')}`, { cls: 'estreito' })
        + SP.aviso('O copiloto lista, ensina e escreve. Quem envia é sempre uma pessoa.') };
  } });

const rolar = () => setTimeout(() => document.querySelectorAll('.sp.live .cop').forEach(c => { const u = c.querySelectorAll('.msgs li.eu'); u[u.length - 1]?.scrollIntoView({ block: 'start' }); }), 40);
Object.assign(SP.actions, {
  iaPerguntar: el => { const q = (el.dataset.p || SP.S.draft?.v.pergunta || '').trim(); if (!q) return SP.toast('Escreva o que você precisa.'); const demo = SP.screens[SP.S.nav.screen].demo;
    if (demo) db().conversa = [...db().conversa.filter(m => m.persona !== SP.S.persona), ...demo.map(d => ({ persona: SP.S.persona, q: d, r: responder(d) }))];
    db().conversa.push({ persona: SP.S.persona, q, r: responder(q) });
    /* esvazia o campo antes do redesenho: o navegador dispara “change” ao removê-lo e devolveria o texto antigo */
    document.querySelectorAll('.sp.live .cop-in textarea').forEach(t => t.value = ''); SP.S.draft = null; if (demo) SP.ir('assistente'); rolar(); },
  iaNova: () => { db().conversa = db().conversa.filter(m => m.persona !== SP.S.persona); },
  iaEnviar: () => SP.toast('Mensagem enviada (simulado).'),
  iaLer: el => { const l = db().ia.le; l[el.dataset.p] = !l[el.dataset.p]; },
  iaTom: el => { db().ia.tom = el.dataset.v; },
});
/* Enter envia; Shift+Enter quebra a linha */
document.addEventListener('keydown', ev => { if (ev.key !== 'Enter' || ev.shiftKey || ev.metaKey || ev.ctrlKey || !ev.target.matches?.('.sp.live .cop-in textarea')) return; ev.preventDefault(); ev.target.closest('.cop-in').querySelector('[data-a="iaPerguntar"]').click(); });
})();
