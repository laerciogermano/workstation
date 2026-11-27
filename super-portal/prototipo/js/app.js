/* Casca do portal (desktop e celular), roteamento, eventos, galeria e player. */
(() => {
const S = SP.S, e = v => SP.esc(v), I = (n, s) => SP.icon(n, s), db = () => SP.S.db;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const DIM = { d: [1280, 820], m: [390, 844] };

/* ---------- menu e papéis ---------- */
const M = (go, label, icon) => ({ go, label, icon });
SP.menuCompleto = [
  { g: 'Início', itens: [M('hoje', 'Hoje', 'home'), M('fila', 'Precisa de você', 'inbox'), M('atividade', 'Atividade', 'pulse'), M('notificacoes', 'Notificações', 'bell')] },
  { g: 'Comercial', itens: [M('orcLista', 'Orçamentos', 'quote'), M('pedLista', 'Pedidos', 'cart'), M('clientes', 'Clientes', 'users'), M('produtos', 'Produtos', 'tag')] },
  { g: 'Operação', itens: [M('checklist', 'Checklist', 'checklist'), M('parados', 'O que está parado', 'clock'), M('fluxo', 'Fluxo do processo', 'flow'), M('logistica', 'Logística', 'truck'), M('transp', 'Transportadoras', 'carrier'), M('fornecedores', 'Fornecedores', 'factory')] },
  { g: 'Financeiro', itens: [M('nfLista', 'Notas fiscais', 'nf'), M('contas', 'Contas a receber', 'money'), M('cobranca', 'Cobrança', 'pulse'), M('boletos', 'Boletos', 'barcode'), M('bancos', 'Bancos', 'bank'), M('faturamento', 'Faturamento', 'chart'), M('fluxoPrev', 'Fluxo previsto', 'line')] },
  { g: 'Equipe e suporte', itens: [M('vendedores', 'Vendedores', 'team'), M('chamados', 'Chamados', 'support')] },
  { g: 'Quadros', itens: [M('quadroVendas', 'Kanban de vendas', 'kanban'), M('quadroTarefas', 'Tarefas', 'checklist')] },
  { g: 'Inteligência artificial', itens: [M('assistente', 'Copiloto', 'spark')] },
  { g: 'Leads', itens: [M('leads', 'Leads', 'team'), M('funilLeads', 'Funil de leads', 'filter'), M('captacao', 'Captação', 'link')] },
  { g: 'Gamificação', itens: [M('ranking', 'Ranking', 'trophy'), M('meusPontos', 'Pontuação', 'spark'), M('conquistas', 'Conquistas', 'check'), M('desafios', 'Desafios', 'bolt'), M('regrasPontos', 'Regras de pontos', 'sliders')] },
  { g: 'Orçamento automático', itens: [M('pedidosCot', 'Pedidos de cotação', 'inbox'), M('cotFollow', 'Follow-up', 'send'), M('cotPrecos', 'Regras de preço', 'money')] },
  { g: 'Marketing', itens: [M('campanhas', 'Campanhas', 'mail'), M('publicos', 'Públicos', 'users')] },
  { g: 'Dashboards', itens: [M('dashComercial', 'Comercial', 'chart'), M('dashOperacao', 'Operação', 'truck'), M('dashFin', 'Financeiro', 'line')] },
  { g: 'Configuração', itens: [M('ajustes', 'Ajustes', 'sliders'), M('iaConfig', 'Configurar IA', 'spark'), M('marca', 'Marca', 'brush'), M('automacoes', 'Automações', 'bolt'), M('templates', 'Templates', 'template'), M('parametros', 'Parâmetros', 'checklist'), M('integracoes', 'Integrações', 'plug')] },
];
const MENU_CLI = [{ g: 'Minha conta', itens: [M('cliHome', 'Início', 'home'), M('cliPropostas', 'Propostas', 'quote'), M('cliPedidos', 'Pedidos', 'box'), M('cliCobrancas', 'Cobranças', 'money'), M('cliAjuda', 'Ajuda', 'support')] }];
const MENU_INV = [{ g: 'Resultado', itens: [M('investidor', 'Visão geral', 'home'), M('dashFin', 'Dashboard', 'chart'), M('faturamento', 'Faturamento', 'chart'), M('fluxoPrev', 'Fluxo previsto', 'line')] }];
const PERMITE = {
  vendedor: ['hoje', 'fila', 'atividade', 'notificacoes', 'orcLista', 'pedLista', 'checklist', 'parados', 'clientes', 'produtos', 'chamados', 'quadroVendas', 'quadroTarefas', 'assistente', 'campanhas', 'publicos', 'dashComercial', 'leads', 'funilLeads', 'ranking', 'meusPontos', 'conquistas', 'desafios', 'pedidosCot', 'cotFollow'],
  logistica: SP.PADRAO_CARGO['Logística'],
  investidor: ['investidor', 'faturamento', 'fluxoPrev', 'dashFin'],
  cliente: ['cliHome', 'cliPropostas', 'cliPedidos', 'cliCobrancas', 'cliAjuda'],
};
const raiz = k => { const s = SP.screens[k]; return s?.pai || s?.base || k; };
/* barra lateral enxuta: o que se usa todo dia; o resto fica em Ajustes */
const LATERAL = [['Início', ['hoje', 'fila', 'atividade']], ['Comercial', ['orcLista', 'pedLista', 'clientes', 'produtos']], ['Operação', ['checklist', 'parados', 'fluxo', 'logistica']], ['Financeiro', ['nfLista', 'contas', 'cobranca', 'boletos', 'faturamento', 'fluxoPrev']], ['Quadros', ['quadroVendas', 'quadroTarefas']], ['Inteligência artificial', ['assistente']], ['Marketing', ['campanhas', 'publicos']], ['Dashboards', ['dashComercial', 'dashOperacao', 'dashFin']], ['Leads', ['leads', 'funilLeads', 'captacao']], ['Gamificação', ['ranking', 'meusPontos', 'conquistas', 'desafios']], ['Orçamento automático', ['pedidosCot', 'cotFollow']], ['', ['chamados', 'ajustes']]];
const menuLateral = () => { if (['cliente', 'investidor'].includes(S.persona)) return SP.menuDe(); const todos = SP.menuCompleto.flatMap(g => g.itens); const grupos = SP.entregue('ajustes') ? LATERAL : [...LATERAL, ['Parceiros', ['transp', 'fornecedores']], ['Equipe e acesso', ['vendedores']]]; return grupos.map(([g, ks]) => ({ g, itens: ks.filter(SP.pode).map(k => todos.find(i => i.go === k)) })).filter(g => g.itens.length); };
const porPapel = k => { const s = SP.screens[k]; if (!s) return false; if (s.semMenu || ['menu', 'busca', 'minhaConta', 'atalhos'].includes(k) || (k === 'ajustes' && !['cliente', 'investidor'].includes(S.persona))) return true; const r = raiz(k); if (S.persona === 'admin') return s.flow !== 'L'; if (s.soAdmin) return false; return PERMITE[S.persona].includes(r); };
SP.pode = k => SP.entregue(k) && porPapel(k);
SP.menuDe = () => (S.persona === 'cliente' ? MENU_CLI : S.persona === 'investidor' ? MENU_INV : SP.menuCompleto).map(g => ({ g: g.g, itens: g.itens.filter(i => SP.pode(i.go)) })).filter(g => g.itens.length);
/* primeira tela que existe para quem está usando na fase escolhida */
SP.casa = () => [CASA[S.persona], ...SP.menuDe().flatMap(g => g.itens).map(i => i.go), 'minhaConta'].find(k => SP.pode(k));
const ABAS = { admin: ['hoje', 'fila', 'orcLista', 'pedLista', 'menu'], vendedor: ['hoje', 'fila', 'orcLista', 'pedLista', 'menu'], logistica: ['hoje', 'fila', 'checklist', 'logistica', 'menu'], investidor: ['investidor', 'faturamento', 'fluxoPrev', 'menu'], cliente: ['cliHome', 'cliPropostas', 'cliPedidos', 'cliCobrancas', 'cliAjuda'] };
const CURTO = { hoje: 'Hoje', fila: 'Fila', orcLista: 'Orçamentos', pedLista: 'Pedidos', menu: 'Mais', checklist: 'Checklist', logistica: 'Logística', investidor: 'Visão', faturamento: 'Faturamento', fluxoPrev: 'Fluxo', cliHome: 'Início', cliPropostas: 'Propostas', cliPedidos: 'Pedidos', cliCobrancas: 'Cobranças', cliAjuda: 'Ajuda' };
const CASA = { admin: 'hoje', vendedor: 'hoje', logistica: 'hoje', investidor: 'investidor', cliente: 'cliHome' };

/* ---------- overlays ---------- */
SP.modals.confirmar = d => ({ titulo: 'Confirmar', corpo: `<p>${e(d.texto)}</p><p class="mute">Dá para desfazer logo em seguida.</p>`, rodape: SP.btn('Voltar', { a: 'fechar' }) + SP.btn('Confirmar', { a: d.a, p: d.p, kind: 'danger' }) });
SP.modals.filtros = (d, ctx) => ({ titulo: 'Busca completa', corpo: ctx.filtrosDe?.[d.key]?.() || '', rodape: SP.btn('Limpar', { a: 'limpar', p: d.key }) + SP.btn('Ver resultados', { a: 'fechar', kind: 'primary' }) });
const modalHtml = (m, ctx) => { if (!m) return ''; const r = SP.modals[m.type]?.(m.data || {}, { ...ctx, slot: 'mdraft' }); if (!r) return ''; return `<div class="veu" data-a="fechar"></div><div class="modal${r.largo ? ' largo' : ''}${r.classe ? ' ' + r.classe : ''}" role="dialog" aria-modal="true" aria-label="${e(r.titulo)}"><header><h3>${r.titulo}</h3>${SP.btn('', { a: 'fechar', icon: 'x', title: 'Fechar', kind: 'quiet' })}</header><div class="modal-b">${r.corpo}</div><footer>${r.rodape || ''}</footer></div>`; };
const peekHtml = (p, ctx) => { if (!p) return ''; const r = SP.peeks[p.type]?.(p.id, ctx); if (!r) return ''; return `<div class="veu claro" data-a="fechar"></div><aside class="peek" role="dialog" aria-label="${e(r.titulo)}"><header><h3>${r.titulo}</h3>${SP.btn('', { a: 'fechar', icon: 'x', title: 'Fechar', kind: 'quiet' })}</header><div class="peek-b">${r.corpo}</div><footer>${r.rodape}</footer></aside>`; };
const popHtml = ctx => {
  const p = S.pop; if (!p || ctx.preview) return '';
  let corpo = '';
  if (p === 'notif') corpo = `<h4>Notificações</h4><ul>${db().notificacoes.slice(0, 5).map(n => `<li><button type="button" data-a="abrirNotif" data-p="${n.id}" class="${n.lida ? '' : 'novo'}"><b>${e(n.assunto)}</b><small>${e(n.por)} · ${SP.quando(n.data)}</small></button></li>`).join('')}</ul><div class="row entre">${SP.btn('Marcar lidas', { a: 'lerTodas', sm: true, kind: 'quiet' })}${SP.btn('Ver todas', { go: 'notificacoes', sm: true })}</div>`;
  else if (p === 'perfil') { const eu = SP.eu(); corpo = `<div class="row">${SP.avatar(eu.nome)}<div>${SP.duas(e(eu.nome), e(eu.cargo))}</div></div><ul><li><button type="button" data-go="minhaConta">${I('user', 16)}Minha conta</button></li><li><button type="button" data-a="alternarTema">${I(S.tema === 'dark' ? 'sun' : 'moon', 16)}Tema ${S.tema === 'dark' ? 'claro' : 'escuro'}</button></li><li><button type="button" data-a="full">${I('full', 16)}Tela cheia</button></li><li><button type="button" data-go="saiu">${I('logout', 16)}Sair</button></li>${ctx.app ? `<li><button type="button" data-x="sair-app">${I('back', 16)}Voltar à galeria do protótipo</button></li>` : ''}</ul>`; }
  else if (p.startsWith('menu:')) { const k = p.slice(5), l = SP.menus[k] || []; corpo = `${k.startsWith('cols:') ? '<h4>Colunas visíveis</h4>' : ''}<ul role="menu">${l.map(x => `<li><button type="button" role="${x.marcado === undefined ? 'menuitem' : 'menuitemcheckbox'}"${x.marcado === undefined ? '' : ` aria-checked="${x.marcado}"`} class="${x.danger ? 'perigo' : ''}"${SP.attrs({ 'data-a': x.a, 'data-go': x.go, 'data-p': x.p, 'data-id': x.id, 'data-v': x.v, disabled: x.disabled })}>${I(x.marcado === undefined ? x.icon || 'next' : x.marcado ? 'check' : 'x', 16)}${x.label}</button></li>`).join('')}</ul>`; }
  else if (p === 'tenant') corpo = `<h4>Trocar de marca</h4><ul>${db().tenants.map(t => `<li><button type="button" data-a="tenant" data-p="${t.id}"><i class="bolinha" style="background:${t.cor}"></i>${e(t.nome)}${t.id === S.tenant ? I('check', 15) : ''}</button></li>`).join('')}<li><button type="button" data-go="marca">${I('brush', 16)}Configurar marca</button></li></ul>`;
  else if (p.startsWith('st:')) { const [, tipo, id] = p.split(':'); const l = tipo === 'log' ? SP.LOG : ['Em aberto', 'Enviado', 'Contra proposta', 'Aprovado', 'Reprovado', 'Cancelado'], atual = tipo === 'log' ? SP.logStatus(SP.ped(id)) : SP.orc(id).status; corpo = `<h4>Trocar status</h4><ul>${l.filter(s => s !== atual).map(s => `<li><button type="button" data-a="${tipo === 'log' ? 'trocarLog' : 'stMenu'}" data-p="${id}" data-v="${s}">${SP.pill(s)}</button></li>`).join('')}</ul>`; }
  const flutua = p.startsWith('st:') || p.startsWith('menu:');
  const st = flutua && !ctx.m && S.popPos ? `style="left:${S.popPos.x}px;top:${S.popPos.y}px"` : '';
  return `<div class="veu transp" data-a="fechar"></div><div class="pop ${flutua ? 'pop-st' : 'pop-' + p}" ${st}>${corpo}</div>`;
};

/* ---------- casca ---------- */
SP.shell = ctx => {
  const k = ctx.screen, scr = SP.screens[k], base = scr.base ? SP.screens[scr.base] : scr;
  const id = ctx.preview || !ctx.id ? (ctx.id || base.exemplo || scr.exemplo) : ctx.id;
  ctx.id = id;
  SP.somentePreview = !!ctx.preview; if (!ctx.preview) SP.regras = {};
  let r; try { r = base.render(ctx) || {}; } catch (err) { console.error(k, err); r = { titulo: 'Registro não encontrado', corpo: SP.vazio('Não achamos este registro', 'Ele pode ter sido excluído.', SP.btn('Ir para o início', { go: CASA[S.persona] }), 'search') }; }
  const t = SP.tenant(), eu = SP.eu(), ativo = raiz(k), pend = SP.pendentes().length, nl = db().notificacoes.filter(n => !n.lida).length;
  const badge = go => go === 'fila' && pend ? `<em>${pend}</em>` : '';
  const sino = !SP.pode('notificacoes') || ['cliente', 'investidor'].includes(S.persona) ? '' : `<button type="button" class="tb-b" data-a="pop" data-p="notif" aria-label="Notificações, ${nl} não lidas">${I('bell', 19)}${nl ? `<em>${nl}</em>` : ''}</button>`;
  const faixa = S.impersonar && !scr.semMenu ? `<div class="faixa">${I('eye', 15)}<span>Você está acessando como <b>${e(S.impersonar.nome)}</b></span><button type="button" data-a="sairImpersonar">Voltar à minha conta</button></div>` : '';
  const modal = ctx.preview ? scr.modal || (ctx.m && scr.folha ? { type: 'filtros', data: { key: scr.folha } } : null) : S.modal;
  const cmd = ctx.preview ? (scr.paleta != null ? { q: scr.paleta } : null) : S.cmd;
  const overlays = (scr.semMenu ? '' : peekHtml(ctx.preview ? null : S.peek, ctx)) + modalHtml(modal, ctx) + (cmd ? `<div class="veu" data-a="fechar"></div>${SP.paleta(ctx, cmd.q)}` : '') + popHtml(ctx)
    + (!ctx.preview && S.toast ? `<div class="toast" role="status"><span>${e(S.toast.msg)}</span>${S.toast.undo ? `<button type="button" data-a="desfazer">${I('undo', 15)}Desfazer</button>` : ''}<button type="button" data-a="fecharToast" aria-label="Fechar aviso">${I('x', 14)}</button></div>` : '');
  const rede = scr.estado || (ctx.preview ? 'normal' : S.rede), form = !ctx.preview && base.form;
  if ((!ctx.preview && S.carregando) || scr.estado === 'lenta') r = { ...r, corpo: SP.esqueleto(ctx), rodape: '' };
  if (rede === 'erro') r = { ...r, corpo: SP.falha(), rodape: '' };
  const offline = rede === 'offline' ? `<div class="offline" role="status">${I('plug', 15)}<span>Sem conexão. Você pode continuar: ${S.naFila ? SP.plural(S.naFila, 'ação aguarda', 'ações aguardam') + ' para enviar' : 'o que fizer será enviado depois'}.</span>${SP.btn('Reconectar', { a: 'reconectar', sm: true })}</div>` : '';
  const erros = ctx.preview ? '' : SP.resumoErros();
  if (form && r.rodape) r.rodape = `<span class="sujo-i" aria-live="polite"><i></i>Alterações não salvas ${SP.btn('Descartar', { a: 'descartar', sm: true, kind: 'quiet' })}</span>` + r.rodape;
  const pular = ctx.preview ? '' : '<button type="button" class="pular" data-a="pular">Pular para o conteúdo</button>';
  const attrs = `class="sp ${ctx.m ? 'm' : 'd'}${ctx.preview ? ' preview' : ' live'}${ctx.app ? ' app' : ''}${form && SP.sujo() ? ' sujo' : ''}" data-theme="${S.tema}" data-screen="${k}" style="${SP.tokens(t, S.tema)}"`;
  const status = ctx.m && !ctx.app ? `<div class="statusbar" aria-hidden="true"><b>9:41</b><i></i><span><u></u></span></div>` : '';
  if (scr.semMenu) return `<div ${attrs}>${status}<div class="sp-scroll"><div class="view cheia">${r.corpo}</div></div>${overlays}</div>`;
  const voltar = r.voltar ? SP.btn('', { go: r.voltar, icon: 'back', title: 'Voltar', kind: 'quiet' }) : '';
  const corpo = `<div class="view${r.larga || r.registro ? ' larga' : ''}">${erros}${r.corpo || ''}</div>`;
  if (ctx.m) {
    const rod = r.rodape ? `<div class="rodape">${r.rodape}</div>` : '';
    const abas = r.rodape ? '' : `<nav class="abas" aria-label="Principal">${ABAS[S.persona].map(a => { const i = a === 'menu' ? M('menu', 'Mais', 'menu') : SP.menuDe().flatMap(g => g.itens).find(x => x.go === a); if (!i) return ''; const on = a === 'menu' ? !ABAS[S.persona].includes(ativo) : ativo === a; return `<button type="button" data-go="${a}" class="${on ? 'on' : ''}"${on ? ' aria-current="page"' : ''}><span>${I(i.icon, 21)}${badge(a)}</span>${CURTO[a]}</button>`; }).join('')}</nav>`;
    return `<div ${attrs}>${pular}${status}${faixa}<header class="appbar">${voltar || SP.logo(t, S.tema, true)}<b>${r.voltar ? r.titulo : `<span class="ab-m">${t.nome}</span><span class="ab-t" aria-hidden="true">${r.titulo || ''}</span>`}</b><button type="button" class="tb-b" data-a="busca" aria-label="Buscar">${I('search', 19)}</button>${sino}</header>${offline}<div class="sp-scroll${abas ? ' com-abas' : ''}" role="main" tabindex="-1">${r.voltar && !r.sub && !r.acoes ? '' : `<div class="cab">${r.voltar ? '' : `<h1>${r.titulo || ''}</h1>`}${r.sub ? `<p>${r.sub}</p>` : ''}${r.acoes ? `<div class="cab-a">${r.acoes}</div>` : ''}</div>`}${corpo}</div>${rod}${abas}${overlays}</div>`;
  }
  const lateralItens = menuLateral(), visiveis = lateralItens.flatMap(g => g.itens.map(i => i.go)), marcado = visiveis.includes(ativo) ? ativo : ativo !== 'notificacoes' && SP.menuCompleto.some(g => g.itens.some(i => i.go === ativo)) ? 'ajustes' : ativo;
  const troca = S.persona === 'admin';
  const lado = `<aside class="lado"><button type="button" class="lado-logo" ${troca ? 'data-a="pop" data-p="tenant" aria-haspopup="menu" aria-label="Trocar de marca"' : `data-go="${CASA[S.persona]}" aria-label="Início"`}>${SP.logo(t, S.tema, S.menuFechado)}${troca && !S.menuFechado ? I('down', 13) : ''}</button><nav aria-label="Menu">${lateralItens.map(g => `${g.g ? `<h5>${g.g}</h5>` : '<hr>'}${g.itens.map(i => `<button type="button" data-go="${i.go}" class="${marcado === i.go ? 'on' : ''}" title="${i.label}"${marcado === i.go ? ' aria-current="page"' : ''}>${I(i.icon, 17)}<span>${i.label}</span>${badge(i.go)}</button>`).join('')}`).join('')}</nav></aside>`;
  const grupo = SP.menuDe().find(g => g.itens.some(i => i.go === ativo)), item = grupo?.itens.find(i => i.go === ativo);
  const trilha = `<nav class="trilha" aria-label="Você está em">${grupo ? `<span>${grupo.g}</span>` : ''}${item ? (r.voltar || ativo !== k ? `${I('next', 12)}<button type="button" data-go="${item.go}">${item.label}</button>${I('next', 12)}<b>${r.titulo || ''}</b>` : `${I('next', 12)}<b>${item.label}</b>`) : `<b>${r.titulo || ''}</b>`}</nav>`;
  return `<div ${attrs}>${pular}${faixa}<div class="casca${S.menuFechado ? ' fechado' : ''}">${lado}<div class="principal"><header class="topo">${SP.btn('', { a: 'menu', icon: 'sidebar', title: 'Recolher menu', kind: 'quiet' })}${trilha}<span class="esp"></span><button type="button" class="busca-t" data-a="busca">${I('search', 16)}<span>Buscar ou pedir…</span><kbd>⌘K</kbd></button>${S.pausado ? `<button type="button" class="pill t-warn" data-go="atividade"><i></i>Automação pausada</button>` : ''}<button type="button" class="tb-b" data-a="atalhos" aria-label="Atalhos de teclado" title="Atalhos (?)">${I('cmd', 18)}</button><button type="button" class="tb-b" data-a="full" aria-label="Tela cheia">${I('full', 18)}</button>${sino}<button type="button" class="eu" data-a="pop" data-p="perfil" aria-label="Menu do usuário">${SP.avatar(eu.nome, true)}<span><b>${e(eu.nome)}</b><small>${e(eu.cargo)}</small></span>${I('down', 13)}</button></header>${offline}<div class="sp-scroll" role="main" tabindex="-1"><div class="cab">${voltar}<div><h1>${r.titulo || ''}</h1>${r.sub ? `<p>${r.sub}</p>` : ''}</div><div class="cab-a">${r.acoes || ''}</div></div>${corpo}</div>${r.rodape ? `<div class="rodape">${r.rodape}</div>` : ''}</div></div>${overlays}</div>`;
};
const personaDe = (k, atual) => { const f = SP.screens[k].flow; if (f === 'L') return 'cliente'; if (f === 'K') return 'investidor'; const antes = S.persona; S.persona = atual; const ok = porPapel(k); S.persona = antes; return ok ? atual : 'admin'; };
SP.thumb = (k, m) => { const g = { persona: S.persona, view: S.view, q: S.q, sel: S.sel, tab: S.tab, imp: S.impersonar, completa: S.completa, expand: S.expand, calMes: S.calMes, pausado: S.pausado, crit: S.crit, ordem: S.ordem, pagina: S.pagina, colunas: S.colunas, erros: S.erros, epico: S.epico };
  Object.assign(S, { persona: personaDe(k, 'admin'), view: {}, q: {}, sel: {}, tab: {}, impersonar: null, completa: {}, expand: {}, calMes: null, crit: {}, ordem: {}, pagina: {}, colunas: {}, erros: {}, epico: null });
  const h = SP.shell({ screen: k, m, preview: true });
  Object.assign(S, { persona: g.persona, view: g.view, q: g.q, sel: g.sel, tab: g.tab, impersonar: g.imp, completa: g.completa, expand: g.expand, calMes: g.calMes, crit: g.crit, ordem: g.ordem, pagina: g.pagina, colunas: g.colunas, erros: g.erros, epico: g.epico });
  return h; };

/* ---------- navegação ---------- */
const P = { aberto: false, app: false, dev: 'd', notas: true };
SP.P = P;
SP.ir = (k, id, opt = {}) => {
  const s = SP.screens[k]; if (!s) return;
  if (!SP.pode(k)) return SP.toast('Seu perfil não acessa esta tela.');
  const nf = ['nfNova', 'nfImpostos'];
  if (!opt.forcar && SP.sujo() && (S.nav.screen !== k || S.nav.id !== id) && !(nf.includes(k) && nf.includes(S.nav.screen))) { S.modal = { type: 'sair', data: { k, id } }; S.pop = S.cmd = S.peek = null; return; }
  if (!opt.voltando && S.nav.screen !== k) S.hist.push(S.nav);
  S.erros = {}; S.cdraft = null;
  if (S.rede === 'lenta' && (S.nav.screen !== k || S.nav.id !== id)) { S.carregando = true; clearTimeout(SP.tCarga); SP.tCarga = setTimeout(() => { S.carregando = false; SP.draw(); }, 1100); } else S.carregando = false;
  if (!(nf.includes(k) && nf.includes(S.nav.screen))) S.draft = null;
  S.nav = { screen: k, id };
  Object.assign(S, { modal: null, mdraft: null, peek: null, pop: null, cmd: null });
  if (s.modal) S.modal = SP.clone(s.modal);
  if (s.paleta != null) S.cmd = { q: s.paleta };
  if (s.folha && (P.dev === 'm' || (P.app && innerWidth < 860))) S.modal = { type: 'filtros', data: { key: s.folha } };
  SP.entrou = true;
  if (P.aberto || P.app) history.replaceState(null, '', P.app ? '#app/' + s.code : '#' + s.code + (P.dev === 'd' ? '' : ':' + P.dev));
};
SP.fecharTela = () => { const s = SP.screens[S.nav.screen]; if (s.modal || s.paleta != null || s.folha) SP.ir(s.pai || s.base); };

SP.sujo = () => !!(SP.screens[S.nav.screen]?.form && S.draft?.orig && JSON.stringify(S.draft.v) !== S.draft.orig);
SP.modals.sair = d => ({ titulo: 'Sair sem salvar?', corpo: '<p>As alterações deste formulário serão perdidas.</p>', rodape: SP.btn('Continuar editando', { a: 'fechar' }) + SP.btn('Descartar e sair', { a: 'sairSem', p: d.k, v: d.id || '', kind: 'danger' }) });
SP.modals.atalhos = () => ({ titulo: 'Atalhos de teclado', largo: true, corpo: `<div class="atalhos">${[['Geral', [['⌘K', 'Buscar, navegar ou pedir'], ['?', 'Esta ajuda'], ['/', 'Ir para a busca da tela'], ['Esc', 'Fechar']]], ['Ir para', [['G H', 'Hoje'], ['G F', 'Precisa de você'], ['G O', 'Orçamentos'], ['G P', 'Pedidos'], ['G C', 'Checklist'], ['G R', 'Contas a receber']]], ['Em listas', [['J / K', 'Próximo e anterior'], ['Enter', 'Abrir'], ['C', 'Criar novo']]], ['Na fila', [['A', 'Aprovar'], ['R', 'Recusar'], ['J / K', 'Trocar de item']]]].map(([t, l]) => `<section><h4>${t}</h4><dl>${l.map(([k, d]) => `<div><dt>${k.split(' ').map((x, i, l) => x === '/' && l.length > 1 ? '<span>ou</span>' : `<kbd>${x}</kbd>`).join(' ')}</dt><dd>${d}</dd></div>`).join('')}</dl></section>`).join('')}</div>`, rodape: SP.btn('Fechar', { a: 'fechar', kind: 'primary' }) });
SP.esqueleto = ctx => `<div class="esq" role="status" aria-label="Carregando"><div class="esq-s">${'<i></i>'.repeat(ctx.m ? 2 : 4)}</div><div class="esq-f"><i></i><i></i></div><div class="esq-t">${'<div><i></i><i></i><i></i></div>'.repeat(7)}</div></div>`;
SP.falha = () => `<div class="vazio falha" role="alert">${I('alert', 30)}<b>Não conseguimos carregar esta tela</b><p>Seus dados estão salvos. Tente de novo; se continuar, abra um chamado com o código abaixo.</p><code translate="no">SP-503-7F2A</code><div class="row centro">${SP.btn('Tentar de novo', { a: 'reconectar', kind: 'primary', icon: 'undo' })}${SP.btn('Abrir chamado', { go: 'chamadoNovo' })}</div></div>`;

/* ---------- desenho ---------- */
const guardar = host => ({ scroll: ['.sp-scroll', '.peek-b', '.modal-b', '.lado nav', '.cmd ul'].map(q => $(q, host)?.scrollTop || 0), tela: $('.sp', host)?.dataset.screen });
const repor = (host, g) => { ['.sp-scroll', '.peek-b', '.modal-b', '.lado nav', '.cmd ul'].forEach((q, i) => { const el = $(q, host); if (el && (i === 3 || g.tela === S.nav.screen)) el.scrollTop = g.scroll[i]; }); };
const marcaFoco = () => { const a = document.activeElement, sp = a?.closest?.('.sp.live'); if (!sp) return null; const at = ['data-q', 'data-f', 'data-cmd', 'data-tenant', 'data-param'].find(x => a.hasAttribute(x)); const sel = at ? `[${at}="${a.getAttribute(at)}"]` : a.hasAttribute('data-a') ? `[data-a="${a.dataset.a}"]${a.dataset.p ? `[data-p="${a.dataset.p}"]` : ''}${a.dataset.v ? `[data-v="${a.dataset.v}"]` : ''}` : null; return sel && { dev: sp.classList.contains('m') ? 'm' : 'd', sel, ini: a.selectionStart, fim: a.selectionEnd }; };
let tAviso;
SP.draw = () => {
  const foco = marcaFoco(), entrou = SP.entrou; SP.entrou = false;
  $$('[data-live]').filter(h => h.dataset.live !== 'app' || P.app).forEach(host => {
    const m = host.dataset.live === 'app' ? innerWidth < 860 : host.dataset.live === 'm', g = guardar(host);
    const abertos = ['.modal', '.peek', '.cmd', '.pop', '.toast'].filter(q => $(q, host));
    host.innerHTML = SP.shell({ screen: S.nav.screen, id: S.nav.id, m, app: host.dataset.live === 'app' });
    SP.podar(host);
    repor(host, g);
    if (entrou) $('.view', host)?.classList.add('entra');
    abertos.forEach(q => $(q, host)?.classList.add('parado'));
    const novo = ['.modal', '.peek'].find(q => $(q, host) && !abertos.includes(q));
    if (novo) { if (foco) S.retorno = foco.sel; setTimeout(() => { const c = $(novo, host); (c?.querySelector('input:not([type=hidden]),textarea,select') || c?.querySelector('footer .btn') || c?.querySelector('button'))?.focus({ preventScroll: true }); }, 30); }
    if (abertos.some(q => (q === '.modal' || q === '.peek') && !$(q, host)) && S.retorno) { const alvo = S.retorno; S.retorno = null; setTimeout(() => $(`.sp.live ${alvo}`)?.focus({ preventScroll: true }), 30); }
    const sc = $('.sp.m .sp-scroll', host); if (sc) sc.closest('.sp').classList.toggle('rolou', sc.scrollTop > 34);
  });
  if (foco) { const el = $(`.sp.live.${foco.dev} ${foco.sel}`); if (el) { el.focus({ preventScroll: true }); try { if (foco.ini != null) el.setSelectionRange(foco.ini, foco.fim); } catch (_) { } } }
  else if (S.cmd) $('.sp.live [data-cmd]')?.focus({ preventScroll: true });
  if (SP.focarErro) { SP.focarErro = false; const c = $('.sp.live [aria-invalid="true"]'); if (c) { c.closest('details')?.setAttribute('open', ''); c.focus(); c.scrollIntoView({ block: 'center' }); } }
  if (S.toast && S.toast.id !== SP.avisoId) { SP.avisoId = S.toast.id; const v = $('#anuncio'); if (v) v.textContent = S.toast.msg; clearTimeout(tAviso); tAviso = setTimeout(() => { S.toast = null; $$('.sp.live .toast').forEach(x => x.remove()); }, 7000); }
  if (P.aberto) { lateral(); ajustar(); }
  document.body.classList.toggle('sem-mais', !!(SP.screens[S.nav.screen]?.semMenu || S.persona === 'cliente'));
};
let apertado = false, pendente = false;
const desenharDepois = () => { if (apertado) pendente = true; else SP.draw(); };
addEventListener('pointerdown', () => apertado = true, true);
addEventListener('pointerup', () => { apertado = false; setTimeout(() => { if (pendente) { pendente = false; SP.draw(); } }, 30); }, true);

/* ---------- ações genéricas ---------- */
Object.assign(SP.actions, {
  visao: el => { S.view[el.dataset.p] = el.dataset.v; },
  limpar: el => { S.q[el.dataset.p] = {}; S.view[el.dataset.p] = 'Todos'; delete S.crit[el.dataset.p]; S.pagina = {}; },
  ordenar: el => { const k = el.dataset.p, i = +el.dataset.v, o = S.ordem[k]; S.ordem[k] = o?.i !== i ? { i, dir: 1 } : o.dir === 1 ? { i, dir: -1 } : null; S.pagina[k] = 0; },
  pagina: el => { S.pagina[el.dataset.p] = Math.max(0, +el.dataset.v); },
  densidade: () => { S.densidade = S.densidade === 'compacta' ? 'confortavel' : 'compacta'; SP.pref('densidade', S.densidade); },
  coluna: el => { const l = S.colunas[el.dataset.p] ||= [], i = +el.dataset.v; S.colunas[el.dataset.p] = l.includes(i) ? l.filter(x => x !== i) : [...l, i]; const it = SP.menus['cols:' + el.dataset.p]?.find(x => x.v === i); if (it) it.marcado = !it.marcado; },
  linhaMenu: el => { S.pop = S.pop === 'menu:' + el.dataset.p ? null : 'menu:' + el.dataset.p; },
  atalhos: () => { S.pop = null; S.modal = { type: 'atalhos' }; },
  descartar: () => { S.draft = null; S.erros = {}; SP.toast('Alterações descartadas.'); },
  sairSem: el => { S.draft = null; S.modal = null; SP.ir(el.dataset.p, el.dataset.v || undefined, { forcar: true }); },
  reconectar: () => { const n = S.naFila; S.rede = 'normal'; S.naFila = 0; const s = SP.screens[S.nav.screen]; if (s.estado) SP.ir('hoje'); SP.toast(n ? SP.plural(n, 'ação enviada', 'ações enviadas') + '. Tudo sincronizado.' : 'Conexão restabelecida.'); },
  pular: el => { $('.sp-scroll', el.closest('.sp'))?.focus(); },
  irCampo: el => { const c = $(`[data-f="${el.dataset.p}"]`, el.closest('.sp')); if (c) { c.closest('details')?.setAttribute('open', ''); c.focus(); c.scrollIntoView({ block: 'center' }); } },
  aplicarNL: el => { const r = SP.interpretar(el.dataset.p); if (!r) return; S.cmd = null; SP.ir(r.go); S.crit[r.key] = r.crit; S.view[r.key] = r.status; S.q[r.key] = {}; },
  perguntar: el => { S.cmd = { q: el.dataset.p }; },
  marcarPasso: el => SP.feito('Passo registrado.', () => SP.marcar(SP.ped(el.dataset.p), el.dataset.v)),
  comentar: el => { const t = S.cdraft?.v.txt.trim(); if (!t) return SP.toast('Escreva o comentário.'); SP.feito(/@\w/.test(t) ? 'Comentário publicado e pessoa avisada.' : 'Comentário publicado.', () => { db().comentarios.push({ ref: el.dataset.p, txt: t, por: SP.eu().nome, em: SP.agora() }); if (/@\w/.test(t)) SP.avisar(SP.eu().nome + ' mencionou você: ' + t.slice(0, 60), [S.nav.screen, S.nav.id]); }); S.cdraft = null; },
  completa: el => { const k = el.dataset.p; if (SP.screens[S.nav.screen].folha === k) { SP.ir('orcLista'); S.completa[k] = false; } else S.completa[k] = !S.completa[k]; },
  filtroSheet: el => { S.modal = { type: 'filtros', data: { key: el.dataset.p } }; },
  tab: el => { S.tab[el.dataset.p] = el.dataset.v; },
  sel: el => { const l = S.sel[el.dataset.p] ||= []; const v = el.dataset.v; S.sel[el.dataset.p] = l.includes(v) ? l.filter(x => x !== v) : [...l, v]; },
  selTodos: el => { const ids = el.dataset.v.split(','), l = S.sel[el.dataset.p] || []; S.sel[el.dataset.p] = ids.every(i => l.includes(i)) ? [] : ids; },
  selLimpar: el => { S.sel[el.dataset.p] = []; },
  excluirSel: el => { const [col, k] = el.dataset.p.split(':'); S.modal = { type: 'confirmar', data: { texto: 'Excluir ' + SP.plural(S.sel[k].length, 'registro', 'registros') + '?', a: 'confirmarSel', p: el.dataset.p } }; },
  confirmarSel: el => { const [col, k] = el.dataset.p.split(':'); SP.feito('Registros excluídos.', () => { db()[col] = db()[col].filter(x => !S.sel[k].includes(x.id)); }); S.sel[k] = []; S.modal = null; },
  excluirReg: el => { const [col, id, lista] = el.dataset.p.split(':'); SP.feito('Excluído.', () => { db()[col] = db()[col].filter(x => x.id !== id); db().fila.filter(f => f.ref[1] === id).forEach(f => f.status = 'resolvido'); }); S.modal = null; S.draft = null; S.peek = null; if (lista) SP.ir(lista); },
  salvarCad: el => { const c = SP.screens[el.dataset.p].cad, d = S.draft.v; if (!SP.validar(d, Object.fromEntries((c.obrig || [['nome', 'nome']]).map(([k, l]) => [k, { req: true, label: SP.regras[k]?.label || l }])))) return;
    SP.feito('Salvo.', () => { const x = SP.clone(d); (c.numericos || []).forEach(k => x[k] = SP.parseNum(x[k])); if (c.maiusculo) x[c.maiusculo] = x[c.maiusculo].toUpperCase(); c.antesSalvar?.(x); if (el.dataset.v === 'novo') db()[c.col].unshift({ ...x, id: SP.uid(c.col.slice(0, 2)) }); else Object.assign(SP.by(c.col, el.dataset.v), x); if (c.col === 'contas' && x.status === 'Quitada' && !x.pagamento) (el.dataset.v === 'novo' ? db().contas[0] : SP.conta(el.dataset.v)).pagamento = SP.HOJE; }); S.draft = null; SP.ir(c.lista); },
  excluirCad: el => { const c = SP.screens[el.dataset.p].cad; S.modal = { type: 'confirmar', data: { texto: 'Excluir este registro?', a: 'excluirReg', p: `${c.col}:${el.dataset.v}:${c.lista}` } }; },
  stMenu: el => { S.pop = null; SP.feito('Status: ' + el.dataset.v + '.', () => SP.statusOrc(SP.orc(el.dataset.p), el.dataset.v)); },
  fechar: () => { if (S.pop) S.pop = null; else if (S.cmd) { S.cmd = null; SP.fecharTela(); } else if (S.modal) { if (S.modal.type === 'sefaz') return; const t = S.modal.type; S.modal = null; S.mdraft = null; S.erros = {}; if (!['sair', 'atalhos'].includes(t)) SP.fecharTela(); else if (t === 'atalhos' && S.nav.screen === 'atalhos') SP.ir('hoje'); } else S.peek = null; },
  fecharToast: () => { S.toast = null; }, desfazer: () => { SP.desfazer(); S.draft = null; },
  pop: el => { S.pop = S.pop === el.dataset.p ? null : el.dataset.p; },
  busca: () => { S.cmd = { q: '' }; S.pop = null; },
  menu: () => { S.menuFechado = !S.menuFechado; },
  full: el => { S.pop = null; const alvo = el.closest('.palco-dev') || document.documentElement; document.fullscreenElement ? document.exitFullscreen() : alvo.requestFullscreen?.().catch(() => SP.toast('Tela cheia não disponível aqui.')); },
  imprimir: el => { const a = $('[data-print]', el.closest('.sp')); if (!a) return SP.toast('Documento enviado para impressão.'); const p = document.createElement('div'); p.id = 'impressao'; p.className = 'sp d'; p.dataset.theme = 'light'; p.style.cssText = SP.tokens(SP.tenant(), 'light'); p.innerHTML = a.outerHTML; document.body.append(p); window.print(); p.remove(); },
  copiar: el => { navigator.clipboard?.writeText(el.dataset.v).catch(() => { }); SP.toast('Copiado.'); },
  abrirAnexo: el => SP.toast('Prévia do anexo “' + el.dataset.v + '” (arquivo ilustrativo).'),
  anexoDraftRm: el => { SP.rascunho(el).v.anexos.splice(+el.dataset.v, 1); }, anexoLogRm: el => { S.mdraft.v.anexos.splice(+el.dataset.v, 1); }, ocArqRm: () => { S.draft.v.ocArq = ''; },
  irRef: el => { const m = { orc: 'orcEditar', pedido: 'pedVer', conta: 'conta', nf: 'nfEmitida', entrada: 'entrada', cliente: 'cliente' }; SP.ir(m[el.dataset.p], el.dataset.v); },
  sairImpersonar: () => { S.impersonar = null; S.persona = 'admin'; SP.ir('vendedores'); },
  cep: el => { const r = SP.rascunho(el); const d = el.dataset.v === 'etiqueta' ? r.v.etiqueta : r.v; if (SP.soDig(d.cep).length !== 8) return SP.toast('Digite os 8 números do CEP.'); Object.assign(d, { cep: SP.soDig(d.cep).replace(/(\d{5})/, '$1-'), endereco: 'Rua das Acácias', bairro: 'Jardim Central', cidade: 'Campinas', uf: 'SP' }); SP.toast('Endereço preenchido (consulta simulada).'); },
});

/* ---------- filtro por épico: mostra o que existe até a fase escolhida ---------- */
SP.definirEpico = n => {
  S.epico = n || null;
  Object.assign(S, { modal: null, pop: null, peek: null, draft: null, view: {}, tab: {}, q: {}, crit: {}, impersonar: null });
  const atual = S.nav.screen; if (!atual) return;
  if (S.epico === 1) SP.ir('login', undefined, { forcar: true });
  else if (!SP.pode(atual) || SP.screens[atual].semMenu) SP.ir(SP.casa(), undefined, { forcar: true });
};

/* ---------- eventos do portal ---------- */
document.addEventListener('click', ev => {
  const sp = ev.target.closest('.sp.live'); if (!sp) return;
  const sum = ev.target.closest('summary');
  if (sum && !ev.target.closest('[data-a],[data-go]')) { const d = sum.parentElement; if (d.dataset.det) S.expand[d.dataset.det] = !d.open; return; }
  const el = ev.target.closest('[data-a],[data-go],[data-peek],a,button,input,select,textarea,label');
  if (!el || !sp.contains(el) || el.disabled) return;
  const { a, go, id, peek } = el.dataset;
  if (a) { ev.preventDefault(); if (a === 'menuStatus' || a === 'linhaMenu') { const b = sp.getBoundingClientRect(), r = el.getBoundingClientRect(), z = b.width / sp.offsetWidth, alt = a === 'linhaMenu' ? 44 + 38 * (SP.menus[el.dataset.p]?.length || 4) : 270, x = a === 'linhaMenu' ? (r.right - b.left) / z - 220 : (r.left - b.left) / z, y = (r.bottom - b.top) / z + 4; S.popPos = { x: Math.max(8, Math.min(x, sp.offsetWidth - 228)), y: y + alt > sp.offsetHeight ? Math.max(8, (r.top - b.top) / z - alt) : y }; }
    const doMenu = el.closest('.pop') && S.pop?.startsWith('menu:') && !['coluna', 'linhaMenu'].includes(a); if (doMenu) S.pop = null; SP.actions[a]?.(el, ev); }
  else if (go) { ev.preventDefault(); const dentro = el.closest('.cmd'); SP.ir(go, id); if (dentro) S.cmd = SP.screens[go].paleta != null ? S.cmd : null; }
  else if (peek) { const [type, pid] = peek.split(':'); S.peek = { type, id: pid }; S.pop = null; }
  else return;
  if (!P.app && S.persona && sp.dataset.screen !== S.nav.screen && document.startViewTransition && P.dev !== '2' && !matchMedia('(prefers-reduced-motion: reduce)').matches) { SP.entrou = false; document.startViewTransition(() => SP.draw()); } else SP.draw();
});
document.addEventListener('submit', ev => { const f = ev.target.closest('.sp.live form[data-enter]'); if (!f) return; ev.preventDefault(); SP.actions[f.dataset.enter](f); SP.draw(); });
const mascara = el => { const m = el.dataset.mask; if (!m || m === 'email') return; const antes = el.value.slice(0, el.selectionStart ?? el.value.length).replace(/[^0-9a-z]/gi, '').length; el.value = SP.mascarar(m, el.value); let i = 0, n = 0; while (i < el.value.length && n < antes) { if (/[0-9a-z]/i.test(el.value[i])) n++; i++; } try { el.setSelectionRange(i, i); } catch (_) { } };
/* mostra ou tira a mensagem do campo sem redesenhar a tela */
const conferir = (el, aoSair) => { const p = el.dataset.f, r = p && SP.regras[p]; if (!r) return; const msg = SP.erroDe(r, el.value), tinha = !!S.erros[p]; if (!aoSair && !tinha) return; if (aoSair && !el.value.trim() && !tinha) return;
  const campo = el.closest('.f'); campo.querySelector('.erro')?.remove(); campo.classList.toggle('com-erro', !!msg);
  if (msg) { S.erros[p] = msg; el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', el.id + '-e'); el.insertAdjacentHTML('afterend', SP.erroHtml(el.id, msg)); } else { delete S.erros[p]; el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); if (!Object.keys(S.erros).length) $$('.sp.live .resumo-erros').forEach(x => x.remove()); } };
document.addEventListener('focusout', ev => { const el = ev.target; if (el.matches?.('.sp.live [data-f]') && el.isConnected) conferir(el, true); });
const gravar = (o, path, v) => { const k = path.split('.'), u = k.pop(); k.reduce((x, p) => x[p] ||= {}, o)[u] = v; };
const aplicarCampo = el => {
  const r = SP.rascunho(el); if (!r) return;
  const path = el.dataset.f, num = el.hasAttribute('data-money') || /(\.qtd|\.margem|^vezes)$/.test(path) || el.type === 'number';
  gravar(r.v, path, num ? SP.parseNum(el.value) : el.value);
  S.cursor = el.selectionStart;
};
const calculos = () => { $$('.sp.live').forEach(s => s.classList.toggle('sujo', SP.sujo())); $$('.sp.live [data-calc]').forEach(n => { const v = S.draft && SP.calcDraft(S.draft.v, n.dataset.calc); if (v != null) n.textContent = v; }); $$('.sp.live [data-prev]').forEach(n => { if (S.draft) n.textContent = SP.preencher(S.draft.v[n.dataset.prev] || ''); }); };
document.addEventListener('input', ev => {
  const el = ev.target; if (!el.closest('.sp.live')) return;
  if (el.matches('[data-q]') && el.tagName === 'INPUT' && el.type !== 'date') { const [k, f] = el.dataset.q.split('.'); (S.q[k] ||= {})[f] = el.value; SP.draw(); }
  else if (el.matches('[data-cmd]')) { S.cmd = { q: el.value }; SP.draw(); }
  else if (el.matches('[data-f]')) { mascara(el); aplicarCampo(el); conferir(el); calculos(); }
  else if (el.matches('[data-com]')) { if (S.cdraft) S.cdraft.v.txt = el.value; }
  else if (el.matches('[data-tenant]') && el.type === 'color') { SP.tenant()[el.dataset.tenant] = el.value; $$('.sp.live').forEach(s => s.style.cssText = SP.tokens(SP.tenant(), S.tema)); }
});
document.addEventListener('keyup', ev => { if (ev.target.matches?.('.sp.live [data-f]')) S.cursor = ev.target.selectionStart; });
const arquivos = (el, files) => {
  const tipo = el.dataset.file, nomes = files.map(f => f.name);
  if (tipo === 'logo') { const r = new FileReader(); r.onload = () => { SP.tenant()[el.dataset.p] = r.result; SP.draw(); }; r.readAsDataURL(files[0]); return; }
  if (tipo === 'importar') { files[0].text().then(t => { try { const d = JSON.parse(t); if (!d.pedidos || !d.tenants) throw 0; SP.feito('Backup importado.', () => { S.db = d; }); } catch (_) { SP.toast('Este arquivo não é um backup do portal.'); } SP.draw(); }); return; }
  if (tipo === 'ocArq') S.draft.v.ocArq = nomes[0]; else if (tipo === 'itemArq') S.draft.v.itens[+el.dataset.p].arquivo = nomes[0]; else (tipo === 'anexoLog' ? S.mdraft : SP.rascunho(el)).v.anexos.push(...nomes);
  SP.draw();
};
document.addEventListener('change', ev => {
  const el = ev.target; if (!el.closest('.sp.live')) return;
  const imediato = el.tagName === 'SELECT' || ['date', 'color', 'file', 'checkbox'].includes(el.type);
  if (el.matches('[data-file]')) { if (el.files.length) arquivos(el, [...el.files]); return; }
  if (el.matches('[data-q]')) { const [k, f] = el.dataset.q.split('.'); (S.q[k] ||= {})[f] = el.value; if (!imediato) return; }
  else if (el.matches('[data-f]')) {
    aplicarCampo(el); if (!imediato) return calculos();
    const r = SP.rascunho(el), p = el.dataset.f;
    if (p === 'cliente' && r.v.doc !== undefined && el.value) { const c = SP.cli(el.value); Object.assign(r.v, { doc: c.cnpj, nome: c.nome, comprador: c.comprador, email: c.email, telefone: c.telefone, ie: c.ie, isento: c.isento, cep: c.cep, endereco: c.endereco, numeroEnd: c.numero, bairro: c.bairro, cidade: c.cidade, uf: c.uf }); }
  }
  else if (el.matches('[data-add]')) { const p = SP.prod(el.value); if (p) S.draft.v.itens.push({ produto: p.id, nome: p.nome, ncm: p.ncm, qtd: 1, valor: p.custo, margem: p.margem, extra: 0, obs: '', comprado: false, chegou: false, previsao: '' }); }
  else if (el.matches('[data-addnf]')) { const p = SP.prod(el.value); if (p) S.draft.v.itens.push({ produto: p.id, nome: p.nome, cfop: p.cfop, ncm: p.ncm, cest: '', valor: p.preco, desconto: 0, qtd: 1, frete: 0, vtrib: p.preco, tributos: 0, ordem: '' }); }
  else if (el.matches('[data-ckadd]')) { const p = SP.prod(el.value), d = SP.ped(el.dataset.ckadd); if (p) SP.feito('Item adicionado.', () => { const x = SP.ped(d.id); x.itens.push({ produto: p.id, nome: p.nome, ncm: p.ncm, qtd: 1, valor: p.custo, margem: p.margem, extra: 0, obs: '', comprado: false, chegou: false, previsao: '' }); x.atualizado = SP.HOJE; }); }
  else if (el.matches('[data-ped]')) { const p = SP.ped(el.dataset.ped); p[el.dataset.k] = el.value; p.atualizado = SP.HOJE; }
  else if (el.matches('[data-item]')) { const [id, k] = el.dataset.item.split(':'), p = SP.ped(id); p.itens[+k][el.dataset.k] = el.value; p.atualizado = SP.HOJE; }
  else if (el.matches('[data-param]')) db().params[el.dataset.param] = el.type === 'number' ? Math.max(0, +el.value || 0) : el.value;
  else if (el.matches('[data-tenant]')) { const k = el.dataset.tenant; if (['cor', 'destaque'].includes(k) && !/^#[0-9a-f]{6}$/i.test(el.value)) { SP.toast('Use o formato #RRGGBB.'); } else SP.tenant()[k] = el.value; }
  else if (el.matches('[data-tabsel]')) S.tab[el.dataset.tabsel] = el.value;
  else return;
  imediato ? SP.draw() : desenharDepois();
});

/* celular: o título grande passa para a barra ao rolar; deslizar na fila aprova ou adia (com alternativa por toque) */
document.addEventListener('scroll', ev => { const s = ev.target; if (s.classList?.contains('sp-scroll')) s.closest('.sp.m')?.classList.toggle('rolou', s.scrollTop > 34); }, true);
let deslize = null;
document.addEventListener('pointerdown', ev => { const li = ev.target.closest?.('.sp.live [data-swipe]'); if (li) deslize = { li, x: ev.clientX, y: ev.clientY, dx: 0, ativo: false, z: li.getBoundingClientRect().width / li.offsetWidth }; });
document.addEventListener('pointermove', ev => { if (!deslize) return; const dx = (ev.clientX - deslize.x) / deslize.z, dy = (ev.clientY - deslize.y) / deslize.z; if (!deslize.ativo) { if (Math.abs(dy) > 10) return void (deslize = null); if (Math.abs(dx) < 12) return; deslize.ativo = true; } deslize.dx = dx; deslize.li.classList.toggle('vai', dx > 0); deslize.li.classList.toggle('volta', dx < 0); deslize.li.firstElementChild.style.transform = `translateX(${Math.max(-150, Math.min(150, dx))}px)`; });
const soltar = () => { if (!deslize) return; const { li, dx, ativo } = deslize; deslize = null; if (!ativo) return; SP.engolir = true; setTimeout(() => SP.engolir = false, 60);
  const f = db().fila.find(x => x.id === li.dataset.swipe);
  if (f && Math.abs(dx) > 100) { navigator.vibrate?.(12); if (dx < 0) SP.feito('Volta amanhã.', () => { db().fila.find(x => x.id === f.id).status = 'adiado'; }); else if (f.tipo === 'dados') SP.ir('filaItem', f.id); else SP.feito('Feito: ' + f.acao.toLowerCase() + '.', () => SP.resolver(db().fila.find(x => x.id === f.id))); SP.draw(); }
  else { li.firstElementChild.style.transform = ''; li.classList.remove('vai', 'volta'); } };
document.addEventListener('pointerup', soltar); document.addEventListener('pointercancel', soltar);
document.addEventListener('click', ev => { if (SP.engolir && ev.target.closest('[data-swipe]')) { ev.stopPropagation(); ev.preventDefault(); } }, true);

/* dica dos gráficos e arrastar na logística */
document.addEventListener('pointermove', ev => {
  const h = ev.target.closest?.('.hit'); $$('.graf-w').forEach(w => { if (!h || !w.contains(h)) { const t = $('.tip', w); if (t) t.hidden = true; const c = $('.cross', w); if (c) c.style.opacity = 0; } });
  if (!h) return; const w = h.closest('.graf-w'), t = $('.tip', w), [mes, ...r] = h.dataset.tip.split('|'), c = $('.cross', w), x = +h.getAttribute('x') + +h.getAttribute('width') / 2;
  t.innerHTML = `<b>${e(mes)}</b>` + [0, 2].filter(i => r[i]).map(i => `<span><i class="s${i / 2 + 1}"></i>${e(r[i])}<strong>${e(r[i + 1])}</strong></span>`).join('');
  t.hidden = false; t.style.left = h.dataset.x + '%'; t.classList.toggle('esq', +h.dataset.x > 60); c.setAttribute('x1', x); c.setAttribute('x2', x); c.style.opacity = 1;
});
let arrastando = null;
document.addEventListener('dragstart', ev => { const c = ev.target.closest?.('[data-drag]'); if (c) { arrastando = c.dataset.drag; ev.dataTransfer.setData('text/plain', arrastando); } });
document.addEventListener('dragover', ev => { if (arrastando && ev.target.closest?.('[data-drop]')) ev.preventDefault(); });
document.addEventListener('drop', ev => { const z = ev.target.closest?.('[data-drop]'); if (z && arrastando) { ev.preventDefault(); const q = z.dataset.quadro; if (q) SP.soltar[q](arrastando, z.dataset.drop); else if (SP.ped(arrastando) && SP.logStatus(SP.ped(arrastando)) !== z.dataset.drop) SP.moverLog(arrastando, z.dataset.drop); arrastando = null; SP.draw(); } });

/* ---------- apresentação ---------- */
const TENDENCIAS = [
  ['Página de registro com o próximo passo e o porquê, linha do tempo com comentários e trilho lateral', 'F17, F47, F36', [['Próxima melhor ação', 'https://www.opti-software.com/post/step-by-step-seller-next-best-action-b2b/']]],
  ['Tabela com ordenação, cabeçalho fixo, uma ação visível e o resto em menu, colunas, densidade e paginação', 'Todas as listas', [['NN/g, tabelas', 'https://www.nngroup.com/articles/data-tables/'], ['Setproduct, tabelas 2026', 'https://www.setproduct.com/blog/data-table-ui-design']]],
  ['Erro no próprio campo ao sair dele, resumo no envio, foco no primeiro erro e aviso de alterações não salvas', 'Formulários', [['NN/g, erros em formulários', 'https://www.nngroup.com/articles/errors-forms-design-guidelines/'], ['Polaris, barra de salvar', 'https://polaris.shopify.com/components/contextual-save-bar']]],
  ['CNPJ alfanumérico com dígito verificador (ASCII − 48), em uso desde julho de 2026', 'Cadastros, notas, marca', [['Receita Federal', 'https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2024/outubro/cnpj-tera-letras-e-numeros-a-partir-de-julho-de-2026'], ['TecnoSpeed, NT 2026.004', 'https://blog.tecnospeed.com.br/layout-cnpj-alfanumerico/']]],
  ['Pedir em linguagem natural e ver o que o portal entendeu antes de aplicar; resumo do dia calculado', 'F33, F32', [['Padrões de IA em painéis', 'https://www.aufaitux.com/blog/ai-design-patterns-enterprise-dashboards/']]],
  ['Teclado em tudo, foco preso e devolvido nos diálogos, alvos de 24 px, pular para o conteúdo, alternativa a arrastar', 'Todo o portal', [['Vercel, Web Interface Guidelines', 'https://vercel.com/design/guidelines'], ['W3C, WCAG 2.2', 'https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/']]],
  ['Esqueleto, sem conexão com fila de envio, falha com saída e primeira vez que orienta', 'F20, F31, F41, F42, F43', [['Vercel, estados', 'https://vercel.com/design/guidelines']]],
  ['Cobrança por tempo de atraso e fila pelo que vale cobrar primeiro', 'F60', [['Ramp, contas a receber', 'https://ramp.com/blog/accounts-payable/accounts-receivable-management']]],
  ['Celular: título que encolhe, ação principal flutuante, deslizar na fila com alternativa por toque, instalável', 'Celular', [['Vercel, gestos e áreas seguras', 'https://vercel.com/design/guidelines']]],
  ['Interface calma: navegação apagada, poucas linhas, ícones pequenos, conteúdo com o peso', 'Todas as telas', [['Linear, redesign de 2026', 'https://linear.app/now/behind-the-latest-design-refresh']]],
  ['Caixa de aprovações com o conteúdo exato, fatos separados de suposições, recusa com motivo', 'F61, F62', [['HatchWorks, padrões de agentes', 'https://hatchworks.com/blog/ai-agents/agent-ux-patterns/']]],
  ['Autonomia por regra (sugerir, preparar, executar), pausa geral, recibo e desfazer', 'F65, F63', [['HatchWorks', 'https://hatchworks.com/blog/ai-agents/agent-ux-patterns/']]],
  ['Só exceção na fila, com lote para baixo risco, contra a fadiga de aprovação', 'F61', [['StackAI, aprovação humana', 'https://www.stackai.com/insights/human-in-the-loop-ai-agents-how-to-design-approval-workflows-for-safe-and-scalable-automation']]],
  ['Duas etapas antes do irreversível: validar, resumir e só então executar', 'F45, F18, F53', [['HatchWorks', 'https://hatchworks.com/blog/ai-agents/agent-ux-patterns/']]],
  ['Busca e comandos em ⌘K e painel por papel, com a decisão primeiro', 'F33, F32, F82', [['AdminLTE, painéis SaaS 2026', 'https://adminlte.io/blog/saas-dashboard-design-examples/']]],
  ['Visões salvas por status, limpar filtros, painel lateral e registro empilhado no celular', 'Todas as listas', [['SaaSUI, tabelas', 'https://www.saasui.design/blog/saas-data-table-ui-patterns']]],
  ['Leitura de ordem de compra por e-mail, com confiança por campo', 'F64', [['Tekst, quote-to-cash', 'https://www.tekst.com/blogs/quote-to-cash-automation']]],
  ['Barra flutuante translúcida só na navegação, folhas inferiores e ações na zona do polegar', 'Celular', [['Pixelean, tendências 2027', 'https://pixelean.com/blog/ui-ux-design-trends/'], ['9to5Google, Liquid Glass e M3', 'https://9to5google.com/2026/09/26/material-3-liquid-glass/']]],
  ['Tema por tokens a partir de uma cor da marca, com contraste conferido', 'F40', [['Phoenix Studio, tokens e rebrand', 'https://phoenix.studio/blog/design-tokens-survive-rebrand-2026']]],
  ['Transição entre telas com View Transitions e respeito a movimento reduzido', 'Navegação', [['web.dev, Baseline 2026', 'https://web.dev/blog/baseline-digest-may-2026']]],
  ['Fora: degradê roxo, borda lateral colorida, vidro decorativo, tudo como botão principal', 'Direção visual', [['Lista anti “cara de IA”', 'https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list']]],
];
const PRINTS = ['dashboard', 'orcamentos', 'orcamentos_edicao-novo', 'orcamentos_edicao-detalhe', 'orcamento_historico-detalhe', 'pedidos', 'pedidos_edicao-visualizar-detalhe', 'pedidos_edicao-editar-detalhe', 'pedidos_cancelamento-detalhe', 'notas_fiscais', 'notas_fiscais_edicao-novo', 'notas_fiscais_edicao-detalhe', 'contasareceber', 'contasareceber_edicao-novo', 'contasareceber_edicao-detalhe', 'faturamento', 'fluxo_previsto', 'chamados', 'chamados_edicao-novo', 'notificacoes'];
const PROC = ['Login', 'Esqueci minha senha', 'Acesso negado', 'Sair', 'Menu', 'Perfil', 'Notificações', 'O que está parado', 'Ped. Checklist', 'Backup', 'Fluxograma', 'Dashboard', 'Vendedores', 'Acessar como', 'Clientes', 'Orçamentos', 'Pedidos', 'Logística', 'Rastreio', 'Etiqueta', 'CEP', 'Transportadoras', 'Notas fiscais', 'Produtos', 'Fornecedores', 'Contas a receber', 'Bancos', 'Faturamento', 'Boletos', 'Chamados', 'Conexão com o portal', 'E-mail prospecção', 'Receber ordem de compra', 'Compra', 'Recebimento', 'Emissão nota fiscal', 'Emissão boleto', 'Expedição', 'Recebido pelo cliente', 'Cobrança'];
const VISAO = ['Substituição', 'Migração', 'White-label', 'Automação', 'Templates', 'Configuração', 'Handoff humano', 'Investidor', 'Administrador', 'Vendedor', 'Cliente'];
const lista = () => SP.order.map(k => SP.screens[k]).sort((a, b) => a.code.localeCompare(b.code, 'pt', { numeric: true }));
SP.cobertura = () => [['Prints do portal legado', 'print', PRINTS], ['Mapa de processos', 'proc', PROC], ['Documento de visão', 'visao', VISAO]].map(([n, p, l]) => ({ n, itens: l.map(i => ({ i, telas: lista().filter(s => s.src.includes(p + ':' + i)) })) }));

const pagina = () => {
  const todas = lista(), cob = SP.cobertura(), pct = c => c.itens.filter(x => x.telas.length).length + '/' + c.itens.length;
  $('#st-telas').textContent = todas.length; $('#st-print').textContent = pct(cob[0]); $('#st-proc').textContent = pct(cob[1]); $('#st-visao').textContent = pct(cob[2]);
  $('#fluxos').innerHTML = SP.EPICOS.map(x => `<a href="#${x.id}" data-x="ancora" data-v="${x.id}"><b>${x.id}</b>${x.nome}</a>`).join('') + ['tendencias', 'cobertura'].map(x => `<a href="#${x}" data-x="ancora" data-v="${x}">${x === 'tendencias' ? 'Tendências' : 'Cobertura'}</a>`).join('');
  $('#galeria').innerHTML = SP.EPICOS.map(x => `<section class="epico-g" id="${x.id}"><h2><b>${x.id}</b>${x.nome}</h2><p>${x.resumo}</p><div class="cards">${todas.filter(s => SP.epicoDe(s.key) === x.n).map(s => `<article class="par"><header><code>${s.code}</code><h3>${s.nome}</h3></header><div class="par-t"><button type="button" class="mini desk" data-x="abrir" data-v="${s.key}" data-d="d" aria-label="${s.nome} no desktop"><div data-thumb="${s.key}" data-dev="d"></div></button><button type="button" class="mini cel" data-x="abrir" data-v="${s.key}" data-d="m" aria-label="${s.nome} no celular"><div data-thumb="${s.key}" data-dev="m"></div></button></div></article>`).join('')}</div></section>`).join('');
  $('#tend-b').innerHTML = TENDENCIAS.map(([t, onde, f]) => `<tr><td>${t}</td><td>${onde}</td><td>${f.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${n}</a>`).join('<br>')}</td></tr>`).join('');
  $('#cob').innerHTML = cob.map(c => `<div><h3>${c.n} <span>${pct(c)}</span></h3><table class="mt"><tbody>${c.itens.map(x => `<tr><td>${x.i}</td><td>${x.telas.length ? x.telas.map(s => `<button type="button" class="cod" data-x="abrir" data-v="${s.key}" title="${s.nome}">${s.code}</button>`).join('') : '<b class="falta">sem tela</b>'}</td></tr>`).join('')}</tbody></table></div>`).join('');
  miniaturas();
};
let obs;
const miniaturas = () => {
  obs?.disconnect();
  obs = new IntersectionObserver(es => es.forEach(x => { if (!x.isIntersecting) return; const el = x.target, m = el.dataset.dev === 'm', [w, h] = DIM[m ? 'm' : 'd']; el.innerHTML = SP.thumb(el.dataset.thumb, m); const sp = el.firstElementChild; sp.inert = true; sp.style.width = w + 'px'; sp.style.height = h + 'px'; sp.style.transform = `scale(${el.parentElement.clientWidth / w})`; obs.unobserve(el); }), { rootMargin: '500px' });
  $$('[data-thumb]').forEach(el => { el.innerHTML = ''; obs.observe(el); });
};
const temas = () => { $('#temas-b').innerHTML = db().tenants.map(t => `<button type="button" class="tenant-c${t.id === S.tenant ? ' on' : ''}" data-x="tenant" data-v="${t.id}"><span class="cores"><i style="background:${t.cor}"></i><i style="background:${t.destaque}"></i></span><b>${e(t.nome)}</b><small>${t.fonte} · cantos ${t.raio} px</small></button>`).join('') + [['light', 'Claro'], ['dark', 'Escuro']].map(([v, n]) => `<button type="button" class="tema-c${S.tema === v ? ' on' : ''}" data-x="tema" data-v="${v}">${I(v === 'dark' ? 'moon' : 'sun', 16)}${n}</button>`).join(''); };

/* ---------- player ---------- */
const palco = () => { $('#palco').innerHTML = (P.dev !== 'm' ? `<div class="aparelho navegador"><div class="palco-dev"><div class="vp" data-live="d"></div></div></div>` : '') + (P.dev !== 'd' ? `<div class="aparelho fone"><div class="palco-dev"><div class="vp" data-live="m"></div></div></div>` : ''); };
const ajustar = () => {
  const p = $('#palco'); if (!p) return; const W = p.clientWidth - 32, H = p.clientHeight - 24, itens = $$('.aparelho', p), g = 20;
  const nat = itens.map(a => a.classList.contains('fone') ? DIM.m : DIM.d);
  const z = Math.min(1, (W - g * (itens.length - 1)) / nat.reduce((s, n) => s + n[0], 0), H / Math.max(...nat.map(n => n[1])));
  itens.forEach((a, i) => { a.style.width = nat[i][0] * z + 'px'; a.style.height = nat[i][1] * z + 'px'; a.firstElementChild.style.transform = `scale(${z})`; });
};
/* lista do player: o que a persona acessa na fase escolhida, por épico; clicar nela nunca troca a persona */
const porEpico = () => lista().filter(s => SP.pode(s.key)).sort((a, b) => SP.epicoDe(a.key) - SP.epicoDe(b.key));
const lateral = () => {
  const s = SP.screens[S.nav.screen]; let f = 0;
  const nav = $('#plista'), y = nav.scrollTop;
  nav.innerHTML = porEpico().map(x => `${SP.epicoDe(x.key) !== f ? `<h5>${SP.rotEpico(f = SP.epicoDe(x.key))} · ${SP.EPICOS[f - 1].nome}</h5>` : ''}<button type="button" data-x="tela" data-v="${x.key}" class="${x.key === s.key ? 'on' : ''}"><code>${x.code}</code>${x.nome}</button>`).join('');
  nav.scrollTop = y;
  if (lateral.ultimo !== s.key) { lateral.ultimo = s.key; $('button.on', nav)?.scrollIntoView({ block: 'nearest' }); }
  const fontes = { print: 'Print do legado', proc: 'Processos', visao: 'Visão', novo: 'Novo' };
  $('#nota').innerHTML = `<code>${s.code}</code><h2>${s.nome}</h2><p>${s.nota}</p><ul class="fontes">${s.src.map(x => { const [t, ...r] = x.split(':'); return `<li class="f-${t}"><b>${fontes[t]}</b>${r.join(':')}</li>`; }).join('')}</ul>`;
  const seg = (k, atual, ops, cls = '') => `<div class="cen ${cls}"><span>${k[1]}</span><div>${ops.map(([v, n]) => `<button type="button" data-x="${k[0]}" data-v="${v}" class="${String(atual) === String(v) ? 'on' : ''}">${n}</button>`).join('')}</div></div>`;
  $('#cenarios').innerHTML = seg(['persona', 'Personas'], S.persona, [['admin', 'Administrador'], ['vendedor', 'Vendedor'], ['logistica', 'Logística'], ['investidor', 'Investidor'], ['cliente', 'Cliente']])
    + (S.persona === 'cliente' ? seg(['cliente', 'Empresa cliente'], S.cliente, [['c1', 'Alvorada'], ['c3', 'Cidade Viva'], ['c6', 'Transrota'], ['c4', 'Raiz']]) : '')
    + seg(['epico', 'Épico'], S.epico || '', [['', 'Tudo'], ...SP.EPICOS.map(x => [x.n, x.id + ' - ' + x.nome])], 'lista')
    + seg(['rede', 'Rede'], S.rede, [['normal', 'Normal'], ['lenta', 'Lenta'], ['offline', 'Sem conexão'], ['erro', 'Falha']])
    + seg(['tenant', 'Marca (tenant)'], S.tenant, db().tenants.map(t => [t.id, t.nome])) + seg(['tema', 'Tema'], S.tema, [['light', 'Claro'], ['dark', 'Escuro']]) + seg(['pausa', 'Automação'], S.pausado, [[false, 'Ligada'], [true, 'Pausada']]) + seg(['imp', 'Faixa “acessando como”'], !!S.impersonar, [[false, 'Não'], [true, 'Sim']]);
  $$('[data-x="dev"]').forEach(b => b.classList.toggle('on', b.dataset.v === P.dev));
};
const abrirPlayer = (k, dev) => {
  if (!SP.entregue(k)) S.epico = null;
  P.aberto = true; if (dev) P.dev = dev; else if (innerWidth < 860) P.dev = 'm';
  document.body.classList.add('tocando');
  const quer = personaDe(k, S.persona); if (quer !== S.persona) { S.persona = quer; S.impersonar = null; }
  palco(); S.hist = []; S.nav = { screen: '' }; SP.ir(k); S.hist = []; SP.draw();
};
const fecharPlayer = () => { P.aberto = false; document.body.classList.remove('tocando'); $('#palco').innerHTML = ''; history.replaceState(null, '', location.pathname + location.search); S.draft = null; temas(); miniaturas(); };
const abrirApp = k => {
  if (k && !SP.entregue(k)) S.epico = null;
  P.app = true; P.aberto = false; document.body.classList.remove('tocando'); document.body.classList.add('app-on'); $('#palco').innerHTML = '';
  const alvo = k || SP.casa(); const quer = personaDe(alvo, S.persona); S.persona = quer; S.nav = { screen: '' }; SP.ir(alvo); S.hist = []; SP.draw();
};
const fecharApp = () => { P.app = false; document.body.classList.remove('app-on'); $('#app .vp').innerHTML = ''; history.replaceState(null, '', location.pathname + location.search); temas(); miniaturas(); };
const passo = n => { const l = porEpico(), i = l.findIndex(s => s.key === S.nav.screen), s = l[(i + n + l.length) % l.length]; SP.ir(s.key); SP.draw(); };
const X = {
  abrir: el => abrirPlayer(el.dataset.v, el.dataset.d), app: () => abrirApp(), 'sair-app': fecharApp, fechar: fecharPlayer,
  tela: el => { SP.ir(el.dataset.v); SP.draw(); },
  dev: el => { P.dev = el.dataset.v; palco(); SP.ir(S.nav.screen, S.nav.id); SP.draw(); },
  notas: () => { $('#player').classList.toggle('sem-notas'); ajustar(); },
  epico: el => { SP.definirEpico(+el.dataset.v); SP.draw(); },
  persona: el => { S.persona = el.dataset.v; S.impersonar = null; S.view = {}; S.q = {}; S.draft = null; const semMenu = SP.screens[S.nav.screen].semMenu;
    /* na fase de acesso, trocar de papel mantém a tela de entrada */
    if (S.epico !== 1 || !semMenu) { if (!SP.pode(S.nav.screen) || semMenu) SP.ir(SP.casa()); } SP.draw(); },
  cliente: el => { S.cliente = el.dataset.v; S.draft = null; if (S.epico !== 1) SP.ir(SP.casa()); SP.draw(); },
  tenant: el => { S.tenant = el.dataset.v; if (P.aberto) { palco(); SP.draw(); } else { temas(); miniaturas(); } },
  tema: el => { S.tema = el.dataset.v; if (P.aberto) SP.draw(); else { temas(); miniaturas(); } },
  pausa: el => { S.pausado = el.dataset.v === 'true'; SP.draw(); },
  rede: el => { S.rede = el.dataset.v; if (S.rede === 'lenta') { S.carregando = true; clearTimeout(SP.tCarga); SP.tCarga = setTimeout(() => { S.carregando = false; SP.draw(); }, 1100); S.rede = 'lenta'; } if (S.rede === 'normal') S.naFila = 0; SP.draw(); },
  imp: el => { S.impersonar = el.dataset.v === 'true' ? { nome: 'Marina Alves' } : null; if (S.impersonar) { S.persona = 'vendedor'; if (!SP.pode(S.nav.screen)) SP.ir('hoje'); } else S.persona = 'admin'; SP.draw(); },
  reiniciar: () => { const t = S.tenant, tema = S.tema; SP.reset(); S.tenant = t; S.tema = tema; relembrar(); SP.ir(SP.casa()); SP.toast('Dados do protótipo reiniciados.'); SP.draw(); },
  ancora: el => document.getElementById(el.dataset.v)?.scrollIntoView({ behavior: 'smooth' }),
};
document.addEventListener('click', ev => { const el = ev.target.closest('[data-x]'); if (el) { ev.preventDefault(); X[el.dataset.x](el); } });
const IR = { h: 'hoje', f: 'fila', o: 'orcLista', p: 'pedLista', c: 'checklist', r: 'contas' };
const NOVO = { orcLista: ['orcNovo'], nfLista: ['nfNova', 'novo'], contas: ['conta', 'novo'], clientes: ['cliente', 'novo'], produtos: ['produto', 'novo'], fornecedores: ['fornecedor', 'novo'], transp: ['transpForm', 'novo'], chamados: ['chamadoNovo'], templates: ['template', 'novo'] };
let prefixoG = 0;
const atalho = ev => {
  const t = ev.key.toLowerCase(), sp = $('.sp.live'); if (!sp || ev.metaKey || ev.ctrlKey || ev.altKey) return false;
  if (S.modal || S.cmd) return false;
  if (ev.key === '?') { S.modal = { type: 'atalhos' }; return true; }
  if (prefixoG && Date.now() - prefixoG < 1200 && IR[t]) { prefixoG = 0; SP.ir(IR[t]); return true; }
  if (t === 'g') { prefixoG = Date.now(); return false; }
  if (ev.key === '/') { ev.preventDefault(); const b = $('.sp-scroll .busca input', sp); if (b) b.focus(); else { S.cmd = { q: '' }; return true; } return false; }
  if (t === 'c' && NOVO[S.nav.screen]) { SP.ir(...NOVO[S.nav.screen]); return true; }
  if (S.nav.screen === 'fila') { const itens = $$('.sp.d .inbox-l [data-p="fila"]'), i = itens.findIndex(x => x.classList.contains('on'));
    if ((t === 'j' || t === 'k') && itens.length) { S.tab.fila = itens[Math.max(0, Math.min(itens.length - 1, i + (t === 'j' ? 1 : -1)))].dataset.v; return true; }
    if (t === 'a' || t === 'r') { const b = $(`.sp.d .fd-a [data-a="${t === 'a' ? 'resolver' : 'recusar'}"], .sp.d .fd-a ${t === 'a' ? '[data-a="salvarDados"]' : '[data-a="recusar"]'}`); b?.click(); return false; } }
  if (t === 'j' || t === 'k') { const l = $$('[data-nav]', sp), i = l.indexOf(document.activeElement); l[Math.max(0, Math.min(l.length - 1, i + (t === 'j' ? 1 : -1)))]?.focus(); return false; }
  return false;
};
document.addEventListener('keydown', ev => {
  if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k' && (P.aberto || P.app) && SP.tem(5)) { ev.preventDefault(); S.cmd = { q: '' }; S.pop = null; return SP.draw(); }
  if (!P.aberto && !P.app) return;
  if (ev.key === 'Tab') { const cx = ev.target.closest?.('.sp.live')?.querySelector('.modal, .cmd, .peek'); if (cx) { const l = $$('button:not(:disabled),input:not([type=hidden]),select,textarea,[tabindex="0"]', cx).filter(x => x.offsetParent !== null), i = l.indexOf(document.activeElement); if (l.length && (i < 0 || (!ev.shiftKey && i === l.length - 1) || (ev.shiftKey && i === 0))) { ev.preventDefault(); l[ev.shiftKey ? l.length - 1 : 0].focus(); } } return; }
  if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey) && ev.target.matches?.('.sp.live textarea')) { const b = ev.target.closest('.modal, .card, .sp')?.querySelector('.btn.primary'); b?.click(); return; }
  if (SP.tem(5) && !ev.target.matches?.('input,textarea,select') && atalho(ev)) { ev.preventDefault(); return SP.draw(); }
  if (ev.key === 'Escape') { if (S.pop || S.cmd || S.modal || S.peek) SP.actions.fechar(); else if (P.aberto) return fecharPlayer(); return SP.draw(); }
  if (ev.key === 'Enter') { if (ev.target.matches?.('[data-cmd]')) { ev.preventDefault(); $('.sp.live .cmd button.on')?.click(); } else if (ev.target.matches?.('tr[data-go],li[data-go],tr[data-peek],li[data-peek]')) ev.target.click(); return; }
  if (ev.target.matches?.('input,textarea,select') || !P.aberto) return;
  if (ev.key === 'ArrowRight') passo(1); else if (ev.key === 'ArrowLeft') passo(-1);
  else if (ev.key === 'Backspace' && S.hist.length) { const h = S.hist.pop(); SP.ir(h.screen, h.id, { voltando: true }); SP.draw(); }
  else if (ev.key.toLowerCase() === 'd' && !ev.metaKey && !ev.ctrlKey) { P.dev = { d: 'm', m: '2', 2: 'd' }[P.dev]; lembrar(['dev']); palco(); SP.draw(); }
});
let tR; addEventListener('resize', () => { clearTimeout(tR); tR = setTimeout(() => { if (P.app) SP.draw(); else if (P.aberto) ajustar(); else miniaturas(); }, 150); });

/* ---------- memória: o que se escolhe em Cenários volta ao recarregar ---------- */
const VALIDO = {
  persona: v => v in ABAS, cliente: v => !!SP.by('clientes', v), epico: v => v === null || !!SP.EPICOS[v - 1], rede: v => ['normal', 'lenta', 'offline', 'erro'].includes(v),
  tenant: v => !!SP.by('tenants', v), tema: v => ['light', 'dark'].includes(v), pausado: v => typeof v === 'boolean', impersonar: v => v === null || !!v?.nome,
  dev: v => ['d', 'm', '2'].includes(v), semNotas: v => typeof v === 'boolean',
};
const memoria = () => { try { return JSON.parse(SP.pref('cenario')) || {}; } catch (_) { return {}; } };
const lembrar = chaves => { const m = memoria(); chaves.forEach(k => m[k] = k === 'dev' ? P.dev : k === 'semNotas' ? $('#player').classList.contains('sem-notas') : S[k]); SP.pref('cenario', JSON.stringify(m)); };
const relembrar = () => Object.entries(memoria()).forEach(([k, v]) => { if (!VALIDO[k]?.(v)) return; if (k === 'dev') P.dev = v; else if (k === 'semNotas') $('#player').classList.toggle('sem-notas', v); else S[k] = v; });
/* só escolhas feitas pela pessoa são guardadas; ajustes automáticos do player não */
const guardarApos = (alvo, mapa) => Object.entries(mapa).forEach(([nome, chaves]) => { const f = alvo[nome]; alvo[nome] = (...args) => { f(...args); lembrar(chaves); }; });

/* ---------- partida: #F09, #F09:m, #F09:2, #app, #app/F09 ---------- */
SP.partida = () => {
  guardarApos(X, { persona: ['persona', 'impersonar'], cliente: ['cliente'], epico: ['epico', 'impersonar'], rede: ['rede'], tenant: ['tenant'], tema: ['tema'], pausa: ['pausado'], imp: ['impersonar', 'persona'], dev: ['dev'], notas: ['semNotas'] });
  guardarApos(SP.actions, { entrar: ['persona', 'cliente', 'impersonar'], verComo: ['persona', 'cliente'], acessarComo: ['persona', 'impersonar'], sairImpersonar: ['persona', 'impersonar'], tenant: ['tenant'], tema: ['tema'], alternarTema: ['tema'], pausar: ['pausado'] });
  relembrar();
  const q = new URLSearchParams(location.search); if (q.get('tenant') && SP.by('tenants', q.get('tenant'))) S.tenant = q.get('tenant'); if (q.get('tema') === 'dark') S.tema = 'dark';
  temas(); pagina();
  const h = decodeURIComponent(location.hash.slice(1)), porCod = c => lista().find(s => s.code === c)?.key;
  const cabe = k => SP.pode(k) ? k : SP.casa(); /* o link não desfaz a persona nem o épico escolhidos */
  if (h === 'app' || h.startsWith('app/')) { const k = porCod(h.split('/')[1]); abrirApp(k && cabe(k)); }
  else { const [c, d] = h.split(':'), k = porCod(c); if (k) abrirPlayer(cabe(k), d || (innerWidth < 860 ? 'm' : P.dev)); }
};
SP.partida();
addEventListener('hashchange', () => { const [c, d] = location.hash.slice(1).split(':'), s = lista().find(x => x.code === c); if (s) abrirPlayer(SP.pode(s.key) ? s.key : SP.casa(), d || 'd'); });
})();
