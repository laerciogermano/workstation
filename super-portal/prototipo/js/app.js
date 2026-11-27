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
  { g: 'Fiscal e financeiro', itens: [M('nfLista', 'Notas fiscais', 'nf'), M('contas', 'Contas a receber', 'money'), M('boletos', 'Boletos', 'barcode'), M('bancos', 'Bancos', 'bank'), M('faturamento', 'Faturamento', 'chart'), M('fluxoPrev', 'Fluxo previsto', 'line')] },
  { g: 'Equipe e suporte', itens: [M('vendedores', 'Vendedores', 'team'), M('funcionarios', 'Funcionários', 'id'), M('chamados', 'Chamados', 'support')] },
  { g: 'Configuração', itens: [M('marca', 'Marca', 'brush'), M('automacoes', 'Automações', 'bolt'), M('templates', 'Templates', 'template'), M('parametros', 'Parâmetros', 'sliders'), M('integracoes', 'Integrações', 'plug')] },
];
const MENU_CLI = [{ g: 'Minha conta', itens: [M('cliHome', 'Início', 'home'), M('cliPropostas', 'Propostas', 'quote'), M('cliPedidos', 'Pedidos', 'box'), M('cliCobrancas', 'Cobranças', 'money'), M('cliAjuda', 'Ajuda', 'support')] }];
const MENU_INV = [{ g: 'Resultado', itens: [M('investidor', 'Visão geral', 'home'), M('faturamento', 'Faturamento', 'chart'), M('fluxoPrev', 'Fluxo previsto', 'line')] }];
const PERMITE = {
  vendedor: ['hoje', 'fila', 'atividade', 'notificacoes', 'orcLista', 'pedLista', 'checklist', 'parados', 'clientes', 'produtos', 'chamados'],
  logistica: SP.PADRAO_CARGO['Logística'],
  investidor: ['investidor', 'faturamento', 'fluxoPrev', 'notificacoes'],
  cliente: ['cliHome', 'cliPropostas', 'cliPedidos', 'cliCobrancas', 'cliAjuda'],
};
const raiz = k => { const s = SP.screens[k]; return s?.pai || s?.base || k; };
SP.pode = k => { const s = SP.screens[k]; if (!s) return false; if (s.semMenu || ['menu', 'busca', 'minhaConta'].includes(k)) return true; const r = raiz(k); if (S.persona === 'admin') return s.flow !== 'L'; return PERMITE[S.persona].includes(r); };
SP.menuDe = () => S.persona === 'cliente' ? MENU_CLI : S.persona === 'investidor' ? MENU_INV : SP.menuCompleto.map(g => ({ g: g.g, itens: g.itens.filter(i => SP.pode(i.go)) })).filter(g => g.itens.length);
const ABAS = { admin: ['hoje', 'fila', 'orcLista', 'pedLista', 'menu'], vendedor: ['hoje', 'fila', 'orcLista', 'pedLista', 'menu'], logistica: ['hoje', 'fila', 'checklist', 'logistica', 'menu'], investidor: ['investidor', 'faturamento', 'fluxoPrev', 'menu'], cliente: ['cliHome', 'cliPropostas', 'cliPedidos', 'cliCobrancas', 'cliAjuda'] };
const CURTO = { hoje: 'Hoje', fila: 'Fila', orcLista: 'Orçamentos', pedLista: 'Pedidos', menu: 'Mais', checklist: 'Checklist', logistica: 'Logística', investidor: 'Visão', faturamento: 'Faturamento', fluxoPrev: 'Fluxo', cliHome: 'Início', cliPropostas: 'Propostas', cliPedidos: 'Pedidos', cliCobrancas: 'Cobranças', cliAjuda: 'Ajuda' };
const CASA = { admin: 'hoje', vendedor: 'hoje', logistica: 'hoje', investidor: 'investidor', cliente: 'cliHome' };

/* ---------- overlays ---------- */
SP.modals.confirmar = d => ({ titulo: 'Confirmar', corpo: `<p>${e(d.texto)}</p><p class="mute">Dá para desfazer logo em seguida.</p>`, rodape: SP.btn('Voltar', { a: 'fechar' }) + SP.btn('Confirmar', { a: d.a, p: d.p, kind: 'danger' }) });
SP.modals.filtros = (d, ctx) => ({ titulo: 'Busca completa', corpo: ctx.filtrosDe?.[d.key]?.() || '', rodape: SP.btn('Limpar', { a: 'limpar', p: d.key }) + SP.btn('Ver resultados', { a: 'fechar', kind: 'primary' }) });
const modalHtml = (m, ctx) => { if (!m) return ''; const r = SP.modals[m.type]?.(m.data || {}, { ...ctx, slot: 'mdraft' }); if (!r) return ''; return `<div class="veu" data-a="fechar"></div><div class="modal${r.largo ? ' largo' : ''}" role="dialog" aria-modal="true" aria-label="${e(r.titulo)}"><header><h3>${r.titulo}</h3>${SP.btn('', { a: 'fechar', icon: 'x', title: 'Fechar', kind: 'quiet' })}</header><div class="modal-b">${r.corpo}</div><footer>${r.rodape || ''}</footer></div>`; };
const peekHtml = (p, ctx) => { if (!p) return ''; const r = SP.peeks[p.type]?.(p.id, ctx); if (!r) return ''; return `<div class="veu claro" data-a="fechar"></div><aside class="peek" role="dialog" aria-label="${e(r.titulo)}"><header><h3>${r.titulo}</h3>${SP.btn('', { a: 'fechar', icon: 'x', title: 'Fechar', kind: 'quiet' })}</header><div class="peek-b">${r.corpo}</div><footer>${r.rodape}</footer></aside>`; };
const popHtml = ctx => {
  const p = S.pop; if (!p || ctx.preview) return '';
  let corpo = '';
  if (p === 'notif') corpo = `<h4>Notificações</h4><ul>${db().notificacoes.slice(0, 5).map(n => `<li><button type="button" data-a="abrirNotif" data-p="${n.id}" class="${n.lida ? '' : 'novo'}"><b>${e(n.assunto)}</b><small>${e(n.por)} · ${SP.quando(n.data)}</small></button></li>`).join('')}</ul><div class="row entre">${SP.btn('Marcar lidas', { a: 'lerTodas', sm: true, kind: 'quiet' })}${SP.btn('Ver todas', { go: 'notificacoes', sm: true })}</div>`;
  else if (p === 'perfil') { const eu = SP.eu(); corpo = `<div class="row">${SP.avatar(eu.nome)}<div>${SP.duas(e(eu.nome), e(eu.cargo))}</div></div><ul><li><button type="button" data-go="minhaConta">${I('user', 16)}Minha conta</button></li><li><button type="button" data-a="alternarTema">${I(S.tema === 'dark' ? 'sun' : 'moon', 16)}Tema ${S.tema === 'dark' ? 'claro' : 'escuro'}</button></li><li><button type="button" data-a="full">${I('full', 16)}Tela cheia</button></li><li><button type="button" data-go="saiu">${I('logout', 16)}Sair</button></li></ul>`; }
  else if (p.startsWith('st:')) { const [, tipo, id] = p.split(':'); const l = tipo === 'log' ? SP.LOG : ['Em aberto', 'Enviado', 'Contra proposta', 'Aprovado', 'Reprovado', 'Cancelado'], atual = tipo === 'log' ? SP.logStatus(SP.ped(id)) : SP.orc(id).status; corpo = `<h4>Trocar status</h4><ul>${l.filter(s => s !== atual).map(s => `<li><button type="button" data-a="${tipo === 'log' ? 'trocarLog' : 'stMenu'}" data-p="${id}" data-v="${s}">${SP.pill(s)}</button></li>`).join('')}</ul>`; }
  const st = p.startsWith('st:') && !ctx.m && S.popPos ? `style="left:${S.popPos.x}px;top:${S.popPos.y}px"` : '';
  return `<div class="veu transp" data-a="fechar"></div><div class="pop ${p.startsWith('st:') ? 'pop-st' : 'pop-' + p}" ${st}>${corpo}</div>`;
};

/* ---------- casca ---------- */
SP.shell = ctx => {
  const k = ctx.screen, scr = SP.screens[k], base = scr.base ? SP.screens[scr.base] : scr;
  const id = ctx.preview || !ctx.id ? (ctx.id || base.exemplo || scr.exemplo) : ctx.id;
  ctx.id = id;
  let r; try { r = base.render(ctx) || {}; } catch (err) { console.error(k, err); r = { titulo: 'Registro não encontrado', corpo: SP.vazio('Não achamos este registro', 'Ele pode ter sido excluído.', SP.btn('Ir para o início', { go: CASA[S.persona] }), 'search') }; }
  const t = SP.tenant(), eu = SP.eu(), ativo = raiz(k), pend = SP.pendentes().length, nl = db().notificacoes.filter(n => !n.lida).length;
  const badge = go => go === 'fila' && pend ? `<em>${pend}</em>` : '';
  const sino = S.persona === 'cliente' ? '' : `<button type="button" class="tb-b" data-a="pop" data-p="notif" aria-label="Notificações, ${nl} não lidas">${I('bell', 19)}${nl ? `<em>${nl}</em>` : ''}</button>`;
  const faixa = S.impersonar && !scr.semMenu ? `<div class="faixa">${I('eye', 15)}<span>Você está acessando como <b>${e(S.impersonar.nome)}</b></span><button type="button" data-a="sairImpersonar">Voltar à minha conta</button></div>` : '';
  const modal = ctx.preview ? scr.modal || (ctx.m && scr.folha ? { type: 'filtros', data: { key: scr.folha } } : null) : S.modal;
  const cmd = ctx.preview ? (scr.paleta != null ? { q: scr.paleta } : null) : S.cmd;
  const overlays = (scr.semMenu ? '' : peekHtml(ctx.preview ? null : S.peek, ctx)) + modalHtml(modal, ctx) + (cmd ? `<div class="veu" data-a="fechar"></div>${SP.paleta(ctx, cmd.q)}` : '') + popHtml(ctx)
    + (!ctx.preview && S.toast ? `<div class="toast" role="status"><span>${e(S.toast.msg)}</span>${S.toast.undo ? `<button type="button" data-a="desfazer">${I('undo', 15)}Desfazer</button>` : ''}<button type="button" data-a="fecharToast" aria-label="Fechar aviso">${I('x', 14)}</button></div>` : '');
  const attrs = `class="sp ${ctx.m ? 'm' : 'd'}${ctx.preview ? ' preview' : ' live'}${ctx.app ? ' app' : ''}" data-theme="${S.tema}" data-screen="${k}" style="${SP.tokens(t, S.tema)}"`;
  const status = ctx.m && !ctx.app ? `<div class="statusbar" aria-hidden="true"><b>9:41</b><i></i><span><u></u></span></div>` : '';
  if (scr.semMenu) return `<div ${attrs}>${status}<div class="sp-scroll"><div class="view cheia">${r.corpo}</div></div>${overlays}</div>`;
  const voltar = r.voltar ? SP.btn('', { go: r.voltar, icon: 'back', title: 'Voltar', kind: 'quiet' }) : '';
  const corpo = `<div class="view${r.larga ? ' larga' : ''}">${r.corpo || ''}</div>`;
  if (ctx.m) {
    const rod = r.rodape ? `<div class="rodape">${r.rodape}</div>` : '';
    const abas = r.rodape ? '' : `<nav class="abas" aria-label="Principal">${ABAS[S.persona].map(a => { const i = a === 'menu' ? M('menu', 'Mais', 'menu') : SP.menuDe().flatMap(g => g.itens).find(x => x.go === a); if (!i) return ''; const on = a === 'menu' ? !ABAS[S.persona].includes(ativo) : ativo === a; return `<button type="button" data-go="${a}" class="${on ? 'on' : ''}"${on ? ' aria-current="page"' : ''}><span>${I(i.icon, 21)}${badge(a)}</span>${CURTO[a]}</button>`; }).join('')}</nav>`;
    return `<div ${attrs}>${status}${faixa}<header class="appbar">${voltar || SP.logo(t, S.tema, true)}<b>${r.voltar ? r.titulo : t.nome}</b><button type="button" class="tb-b" data-a="busca" aria-label="Buscar">${I('search', 19)}</button>${sino}</header><div class="sp-scroll${abas ? ' com-abas' : ''}">${r.voltar && !r.sub && !r.acoes ? '' : `<div class="cab">${r.voltar ? '' : `<h1>${r.titulo || ''}</h1>`}${r.sub ? `<p>${r.sub}</p>` : ''}${r.acoes ? `<div class="cab-a">${r.acoes}</div>` : ''}</div>`}${corpo}</div>${rod}${abas}${overlays}</div>`;
  }
  const lado = `<aside class="lado"><button type="button" class="lado-logo" data-go="${CASA[S.persona]}" aria-label="Início">${SP.logo(t, S.tema, S.menuFechado)}</button><nav aria-label="Menu">${SP.menuDe().map(g => `<h5>${g.g}</h5>${g.itens.map(i => `<button type="button" data-go="${i.go}" class="${ativo === i.go ? 'on' : ''}" title="${i.label}"${ativo === i.go ? ' aria-current="page"' : ''}>${I(i.icon, 17)}<span>${i.label}</span>${badge(i.go)}</button>`).join('')}`).join('')}</nav></aside>`;
  return `<div ${attrs}>${faixa}<div class="casca${S.menuFechado ? ' fechado' : ''}">${lado}<div class="principal"><header class="topo">${SP.btn('', { a: 'menu', icon: 'sidebar', title: 'Recolher menu', kind: 'quiet' })}<button type="button" class="busca-t" data-a="busca">${I('search', 16)}<span>Buscar ou ir para…</span><kbd>⌘K</kbd></button><span class="esp"></span>${S.pausado ? `<button type="button" class="pill t-warn" data-go="atividade"><i></i>Automação pausada</button>` : ''}<button type="button" class="tb-b" data-a="full" aria-label="Tela cheia">${I('full', 18)}</button>${sino}<button type="button" class="eu" data-a="pop" data-p="perfil" aria-label="Menu do usuário">${SP.avatar(eu.nome, true)}<span><b>${e(eu.nome)}</b><small>${e(eu.cargo)}</small></span>${I('down', 13)}</button></header><div class="sp-scroll"><div class="cab">${voltar}<div><h1>${r.titulo || ''}</h1>${r.sub ? `<p>${r.sub}</p>` : ''}</div><div class="cab-a">${r.acoes || ''}</div></div>${corpo}</div>${r.rodape ? `<div class="rodape">${r.rodape}</div>` : ''}</div></div>${overlays}</div>`;
};
const personaDe = (k, atual) => { const f = SP.screens[k].flow; if (f === 'L') return 'cliente'; if (f === 'K') return 'investidor'; const antes = S.persona; S.persona = atual; const ok = SP.pode(k); S.persona = antes; return ok ? atual : 'admin'; };
SP.thumb = (k, m) => { const g = { persona: S.persona, view: S.view, q: S.q, sel: S.sel, tab: S.tab, imp: S.impersonar, completa: S.completa, expand: S.expand, calMes: S.calMes, pausado: S.pausado };
  Object.assign(S, { persona: personaDe(k, 'admin'), view: {}, q: {}, sel: {}, tab: {}, impersonar: null, completa: {}, expand: {}, calMes: null });
  const h = SP.shell({ screen: k, m, preview: true });
  Object.assign(S, { persona: g.persona, view: g.view, q: g.q, sel: g.sel, tab: g.tab, impersonar: g.imp, completa: g.completa, expand: g.expand, calMes: g.calMes });
  return h; };

/* ---------- navegação ---------- */
const P = { aberto: false, app: false, dev: 'd', notas: true };
SP.P = P;
SP.ir = (k, id, opt = {}) => {
  const s = SP.screens[k]; if (!s) return;
  if (!SP.pode(k)) return SP.toast('Seu perfil não acessa esta tela.');
  if (!opt.voltando && S.nav.screen !== k) S.hist.push(S.nav);
  const nf = ['nfNova', 'nfImpostos'];
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

/* ---------- desenho ---------- */
const guardar = host => ({ scroll: ['.sp-scroll', '.peek-b', '.modal-b', '.lado nav', '.cmd ul'].map(q => $(q, host)?.scrollTop || 0), tela: $('.sp', host)?.dataset.screen });
const repor = (host, g) => { ['.sp-scroll', '.peek-b', '.modal-b', '.lado nav', '.cmd ul'].forEach((q, i) => { const el = $(q, host); if (el && (i === 3 || g.tela === S.nav.screen)) el.scrollTop = g.scroll[i]; }); };
const marcaFoco = () => { const a = document.activeElement, sp = a?.closest?.('.sp.live'); if (!sp) return null; const at = ['data-q', 'data-f', 'data-cmd', 'data-tenant', 'data-param'].find(x => a.hasAttribute(x)); const sel = at ? `[${at}="${a.getAttribute(at)}"]` : a.hasAttribute('data-a') ? `[data-a="${a.dataset.a}"]${a.dataset.p ? `[data-p="${a.dataset.p}"]` : ''}${a.dataset.v ? `[data-v="${a.dataset.v}"]` : ''}` : null; return sel && { dev: sp.classList.contains('m') ? 'm' : 'd', sel, ini: a.selectionStart, fim: a.selectionEnd }; };
let tAviso;
SP.draw = () => {
  const foco = marcaFoco(), entrou = SP.entrou; SP.entrou = false;
  $$('[data-live]').forEach(host => {
    const m = host.dataset.live === 'app' ? innerWidth < 860 : host.dataset.live === 'm', g = guardar(host);
    host.innerHTML = SP.shell({ screen: S.nav.screen, id: S.nav.id, m, app: host.dataset.live === 'app' });
    repor(host, g);
    if (entrou) $('.view', host)?.classList.add('entra');
  });
  if (foco) { const el = $(`.sp.live.${foco.dev} ${foco.sel}`); if (el) { el.focus({ preventScroll: true }); try { if (foco.ini != null) el.setSelectionRange(foco.ini, foco.fim); } catch (_) { } } }
  else if (S.cmd) $('.sp.live [data-cmd]')?.focus({ preventScroll: true });
  if (S.toast && S.toast.id !== SP.avisoId) { SP.avisoId = S.toast.id; clearTimeout(tAviso); tAviso = setTimeout(() => { S.toast = null; $$('.sp.live .toast').forEach(x => x.remove()); }, 7000); }
  if (P.aberto) { lateral(); ajustar(); }
};
let apertado = false, pendente = false;
const desenharDepois = () => { if (apertado) pendente = true; else SP.draw(); };
addEventListener('pointerdown', () => apertado = true, true);
addEventListener('pointerup', () => { apertado = false; setTimeout(() => { if (pendente) { pendente = false; SP.draw(); } }, 30); }, true);

/* ---------- ações genéricas ---------- */
Object.assign(SP.actions, {
  visao: el => { S.view[el.dataset.p] = el.dataset.v; },
  limpar: el => { S.q[el.dataset.p] = {}; S.view[el.dataset.p] = 'Todos'; },
  completa: el => { const k = el.dataset.p; if (SP.screens[S.nav.screen].folha === k) { SP.ir('orcLista'); S.completa[k] = false; } else S.completa[k] = !S.completa[k]; },
  filtroSheet: el => { S.modal = { type: 'filtros', data: { key: el.dataset.p } }; },
  tab: el => { S.tab[el.dataset.p] = el.dataset.v; },
  sel: el => { const l = S.sel[el.dataset.p] ||= []; const v = el.dataset.v; S.sel[el.dataset.p] = l.includes(v) ? l.filter(x => x !== v) : [...l, v]; },
  selTodos: el => { const ids = el.dataset.v.split(','), l = S.sel[el.dataset.p] || []; S.sel[el.dataset.p] = ids.every(i => l.includes(i)) ? [] : ids; },
  selLimpar: el => { S.sel[el.dataset.p] = []; },
  excluirSel: el => { const [col, k] = el.dataset.p.split(':'); S.modal = { type: 'confirmar', data: { texto: 'Excluir ' + SP.plural(S.sel[k].length, 'registro', 'registros') + '?', a: 'confirmarSel', p: el.dataset.p } }; },
  confirmarSel: el => { const [col, k] = el.dataset.p.split(':'); SP.feito('Registros excluídos.', () => { db()[col] = db()[col].filter(x => !S.sel[k].includes(x.id)); }); S.sel[k] = []; S.modal = null; },
  excluirReg: el => { const [col, id, lista] = el.dataset.p.split(':'); SP.feito('Excluído.', () => { db()[col] = db()[col].filter(x => x.id !== id); db().fila.filter(f => f.ref[1] === id).forEach(f => f.status = 'resolvido'); }); S.modal = null; S.draft = null; S.peek = null; if (lista) SP.ir(lista); },
  salvarCad: el => { const c = SP.screens[el.dataset.p].cad, d = S.draft.v; const falta = (c.obrig || [['nome', 'nome']]).filter(([k]) => !String(d[k] || '').trim()); if (falta.length) return SP.toast('Preencha: ' + falta.map(x => x[1]).join(', ') + '.');
    SP.feito('Salvo.', () => { const x = SP.clone(d); (c.numericos || []).forEach(k => x[k] = SP.parseNum(x[k])); if (c.maiusculo) x[c.maiusculo] = x[c.maiusculo].toUpperCase(); c.antesSalvar?.(x); if (el.dataset.v === 'novo') db()[c.col].unshift({ ...x, id: SP.uid(c.col.slice(0, 2)) }); else Object.assign(SP.by(c.col, el.dataset.v), x); if (c.col === 'contas' && x.status === 'Quitada' && !x.pagamento) (el.dataset.v === 'novo' ? db().contas[0] : SP.conta(el.dataset.v)).pagamento = SP.HOJE; }); S.draft = null; SP.ir(c.lista); },
  excluirCad: el => { const c = SP.screens[el.dataset.p].cad; S.modal = { type: 'confirmar', data: { texto: 'Excluir este registro?', a: 'excluirReg', p: `${c.col}:${el.dataset.v}:${c.lista}` } }; },
  stMenu: el => { S.pop = null; SP.feito('Status: ' + el.dataset.v + '.', () => SP.statusOrc(SP.orc(el.dataset.p), el.dataset.v)); },
  fechar: () => { if (S.pop) S.pop = null; else if (S.cmd) { S.cmd = null; SP.fecharTela(); } else if (S.modal) { S.modal = null; S.mdraft = null; SP.fecharTela(); } else S.peek = null; },
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

/* ---------- eventos do portal ---------- */
document.addEventListener('click', ev => {
  const sp = ev.target.closest('.sp.live'); if (!sp) return;
  const sum = ev.target.closest('summary');
  if (sum && !ev.target.closest('[data-a],[data-go]')) { const d = sum.parentElement; if (d.dataset.det) S.expand[d.dataset.det] = !d.open; return; }
  const el = ev.target.closest('[data-a],[data-go],[data-peek],a,button,input,select,textarea,label');
  if (!el || !sp.contains(el) || el.disabled) return;
  const { a, go, id, peek } = el.dataset;
  if (a) { ev.preventDefault(); if (a === 'menuStatus') { const b = sp.getBoundingClientRect(), r = el.getBoundingClientRect(), z = b.width / sp.offsetWidth; S.popPos = { x: Math.min((r.left - b.left) / z, sp.offsetWidth - 220), y: Math.min((r.bottom - b.top) / z + 4, sp.offsetHeight - 270) }; } SP.actions[a]?.(el, ev); }
  else if (go) { ev.preventDefault(); const dentro = el.closest('.cmd'); SP.ir(go, id); if (dentro) S.cmd = SP.screens[go].paleta != null ? S.cmd : null; }
  else if (peek) { const [type, pid] = peek.split(':'); S.peek = { type, id: pid }; S.pop = null; }
  else return;
  if (!P.app && S.persona && sp.dataset.screen !== S.nav.screen && document.startViewTransition && P.dev !== '2' && !matchMedia('(prefers-reduced-motion: reduce)').matches) { SP.entrou = false; document.startViewTransition(() => SP.draw()); } else SP.draw();
});
const gravar = (o, path, v) => { const k = path.split('.'), u = k.pop(); k.reduce((x, p) => x[p] ||= {}, o)[u] = v; };
const aplicarCampo = el => {
  const r = SP.rascunho(el); if (!r) return;
  const path = el.dataset.f, num = el.hasAttribute('data-money') || /(\.qtd|\.margem|^vezes)$/.test(path) || el.type === 'number';
  gravar(r.v, path, num ? SP.parseNum(el.value) : el.value);
  S.cursor = el.selectionStart;
};
const calculos = () => { $$('.sp.live [data-calc]').forEach(n => { const v = S.draft && SP.calcDraft(S.draft.v, n.dataset.calc); if (v != null) n.textContent = v; }); $$('.sp.live [data-prev]').forEach(n => { if (S.draft) n.textContent = SP.preencher(S.draft.v[n.dataset.prev] || ''); }); };
document.addEventListener('input', ev => {
  const el = ev.target; if (!el.closest('.sp.live')) return;
  if (el.matches('[data-q]') && el.tagName === 'INPUT' && el.type !== 'date') { const [k, f] = el.dataset.q.split('.'); (S.q[k] ||= {})[f] = el.value; SP.draw(); }
  else if (el.matches('[data-cmd]')) { S.cmd = { q: el.value }; SP.draw(); }
  else if (el.matches('[data-f]')) { aplicarCampo(el); calculos(); }
  else if (el.matches('[data-tenant]') && el.type === 'color') { SP.tenant()[el.dataset.tenant] = el.value; $$('.sp.live').forEach(s => s.style.cssText = SP.tokens(SP.tenant(), S.tema)); }
});
document.addEventListener('keyup', ev => { if (ev.target.matches?.('.sp.live [data-f]')) S.cursor = ev.target.selectionStart; });
const arquivos = (el, files) => {
  const tipo = el.dataset.file, nomes = files.map(f => f.name);
  if (tipo === 'logo') { const r = new FileReader(); r.onload = () => { SP.tenant()[el.dataset.p] = r.result; SP.draw(); }; r.readAsDataURL(files[0]); return; }
  if (tipo === 'importar') { files[0].text().then(t => { try { const d = JSON.parse(t); if (!d.pedidos || !d.tenants) throw 0; SP.feito('Backup importado.', () => { S.db = d; }); } catch (_) { SP.toast('Este arquivo não é um backup do portal.'); } SP.draw(); }); return; }
  if (tipo === 'ocArq') S.draft.v.ocArq = nomes[0]; else (tipo === 'anexoLog' ? S.mdraft : SP.rascunho(el)).v.anexos.push(...nomes);
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
document.addEventListener('drop', ev => { const z = ev.target.closest?.('[data-drop]'); if (z && arrastando) { ev.preventDefault(); if (SP.logStatus(SP.ped(arrastando)) !== z.dataset.drop) SP.moverLog(arrastando, z.dataset.drop); arrastando = null; SP.draw(); } });

/* ---------- apresentação ---------- */
const FLUXOS = [
  ['A', 'Acesso', 'Entrada com a marca do tenant, recuperação de senha, acesso negado e saída.'],
  ['B', 'Início e fila de decisão', 'O que precisa de uma pessoa vem primeiro; o resto aparece como recibo.'],
  ['C', 'Orçamentos', 'Da ordem de compra lida por e-mail à proposta enviada.'],
  ['D', 'Pedidos', 'Edição completa, PDF, cancelamento e reativação.'],
  ['E', 'Operação', 'Checklist, parados, fluxo do processo, logística e transportadoras.'],
  ['F', 'Notas fiscais', 'Emissão completa, ações da nota e documentos.'],
  ['G', 'Financeiro', 'Contas a receber, boletos, bancos, faturamento e fluxo previsto.'],
  ['H', 'Cadastros e equipe', 'Clientes, produtos, fornecedores, vendedores, funcionários e permissões.'],
  ['I', 'Chamados', 'Suporte e operação interna.'],
  ['J', 'White-label e automação', 'Marca, regras, templates, parâmetros, integrações e migração.'],
  ['K', 'Investidor', 'Resultado sem operar o fluxo.'],
  ['L', 'Portal do cliente', 'Propostas, pedidos, cobranças e ajuda.'],
];
const TENDENCIAS = [
  ['Interface calma: navegação apagada, poucas linhas, ícones pequenos, conteúdo com o peso', 'Todas as telas', [['Linear, redesign de 2026', 'https://linear.app/now/behind-the-latest-design-refresh']]],
  ['Caixa de aprovações com o conteúdo exato, fatos separados de suposições, recusa com motivo', 'B-11, B-12', [['HatchWorks, padrões de agentes', 'https://hatchworks.com/blog/ai-agents/agent-ux-patterns/']]],
  ['Autonomia por regra (sugerir, preparar, executar), pausa geral, recibo e desfazer', 'J-91, B-13', [['HatchWorks', 'https://hatchworks.com/blog/ai-agents/agent-ux-patterns/']]],
  ['Só exceção na fila, com lote para baixo risco, contra a fadiga de aprovação', 'B-11', [['StackAI, aprovação humana', 'https://www.stackai.com/insights/human-in-the-loop-ai-agents-how-to-design-approval-workflows-for-safe-and-scalable-automation']]],
  ['Duas etapas antes do irreversível: validar, resumir e só então executar', 'F-51, D-33, G-62', [['HatchWorks', 'https://hatchworks.com/blog/ai-agents/agent-ux-patterns/']]],
  ['Busca e comandos em ⌘K e painel por papel, com a decisão primeiro', 'B-15, B-10, K-100', [['AdminLTE, painéis SaaS 2026', 'https://adminlte.io/blog/saas-dashboard-design-examples/']]],
  ['Visões salvas por status, limpar filtros, painel lateral e registro empilhado no celular', 'Todas as listas', [['SaaSUI, tabelas', 'https://www.saasui.design/blog/saas-data-table-ui-patterns']]],
  ['Leitura de ordem de compra por e-mail, com confiança por campo', 'C-26', [['Tekst, quote-to-cash', 'https://www.tekst.com/blogs/quote-to-cash-automation']]],
  ['Barra flutuante translúcida só na navegação, folhas inferiores e ações na zona do polegar', 'Celular', [['Pixelean, tendências 2027', 'https://pixelean.com/blog/ui-ux-design-trends/'], ['9to5Google, Liquid Glass e M3', 'https://9to5google.com/2026/09/26/material-3-liquid-glass/']]],
  ['Tema por tokens a partir de uma cor da marca, com contraste conferido', 'J-90', [['Phoenix Studio, tokens e rebrand', 'https://phoenix.studio/blog/design-tokens-survive-rebrand-2026']]],
  ['Transição entre telas com View Transitions e respeito a movimento reduzido', 'Navegação', [['web.dev, Baseline 2026', 'https://web.dev/blog/baseline-digest-may-2026']]],
  ['Fora: degradê roxo, borda lateral colorida, vidro decorativo, tudo como botão principal', 'Direção visual', [['Lista anti “cara de IA”', 'https://github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list']]],
];
const PRINTS = ['dashboard', 'orcamentos', 'orcamentos_edicao-novo', 'orcamentos_edicao-detalhe', 'orcamento_historico-detalhe', 'pedidos', 'pedidos_edicao-visualizar-detalhe', 'pedidos_edicao-editar-detalhe', 'pedidos_cancelamento-detalhe', 'notas_fiscais', 'notas_fiscais_edicao-novo', 'notas_fiscais_edicao-detalhe', 'contasareceber', 'contasareceber_edicao-novo', 'contasareceber_edicao-detalhe', 'faturamento', 'fluxo_previsto', 'chamados', 'chamados_edicao-novo', 'notificacoes'];
const PROC = ['Login', 'Esqueci minha senha', 'Acesso negado', 'Sair', 'Menu', 'Perfil', 'Notificações', 'O que está parado', 'Ped. Checklist', 'Backup', 'Fluxograma', 'Dashboard', 'Vendedores', 'Funcionários', 'Permissões', 'Acessar como', 'Clientes', 'Orçamentos', 'Pedidos', 'Logística', 'Rastreio', 'Etiqueta', 'CEP', 'Transportadoras', 'Notas fiscais', 'Produtos', 'Fornecedores', 'Contas a receber', 'Bancos', 'Faturamento', 'Boletos', 'Chamados', 'Conexão com o portal', 'E-mail prospecção', 'Receber ordem de compra', 'Compra', 'Recebimento', 'Emissão nota fiscal', 'Emissão boleto', 'Expedição', 'Recebido pelo cliente', 'Cobrança'];
const VISAO = ['Substituição', 'Migração', 'White-label', 'Automação', 'Templates', 'Configuração', 'Handoff humano', 'Investidor', 'Administrador', 'Vendedor', 'Cliente'];
const lista = () => SP.order.map(k => SP.screens[k]).sort((a, b) => a.code.localeCompare(b.code, 'pt', { numeric: true }));
SP.cobertura = () => [['Prints do portal legado', 'print', PRINTS], ['Mapa de processos', 'proc', PROC], ['Documento de visão', 'visao', VISAO]].map(([n, p, l]) => ({ n, itens: l.map(i => ({ i, telas: lista().filter(s => s.src.includes(p + ':' + i)) })) }));

const pagina = () => {
  const todas = lista(), cob = SP.cobertura(), pct = c => c.itens.filter(x => x.telas.length).length + '/' + c.itens.length;
  $('#st-telas').textContent = todas.length; $('#st-print').textContent = pct(cob[0]); $('#st-proc').textContent = pct(cob[1]); $('#st-visao').textContent = pct(cob[2]);
  $('#fluxos').innerHTML = FLUXOS.map(([l, n]) => `<a href="#f-${l}" data-x="ancora" data-v="f-${l}"><b>${l}</b>${n}</a>`).join('') + ['tendencias', 'cobertura'].map(x => `<a href="#${x}" data-x="ancora" data-v="${x}">${x === 'tendencias' ? 'Tendências' : 'Cobertura'}</a>`).join('');
  $('#galeria').innerHTML = FLUXOS.map(([l, n, d]) => `<section class="fluxo-g" id="f-${l}"><h2><b>${l}</b>${n}</h2><p>${d}</p><div class="cards">${todas.filter(s => s.flow === l).map(s => `<article class="par"><header><code>${s.code}</code><h3>${s.nome}</h3></header><div class="par-t"><button type="button" class="mini desk" data-x="abrir" data-v="${s.key}" data-d="d" aria-label="${s.nome} no desktop"><div data-thumb="${s.key}" data-dev="d"></div></button><button type="button" class="mini cel" data-x="abrir" data-v="${s.key}" data-d="m" aria-label="${s.nome} no celular"><div data-thumb="${s.key}" data-dev="m"></div></button></div></article>`).join('')}</div></section>`).join('');
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
const palco = () => { $('#palco').innerHTML = (P.dev !== 'm' ? `<div class="aparelho navegador"><div class="palco-dev"><div class="janela"><i></i><i></i><i></i><span>${e(SP.tenant().dominio)}</span></div><div class="vp" data-live="d"></div></div></div>` : '') + (P.dev !== 'd' ? `<div class="aparelho fone"><div class="palco-dev"><div class="vp" data-live="m"></div></div></div>` : ''); };
const ajustar = () => {
  const p = $('#palco'); if (!p) return; const W = p.clientWidth - 32, H = p.clientHeight - 24, itens = $$('.aparelho', p), g = 20;
  const nat = itens.map(a => a.classList.contains('fone') ? [DIM.m[0] + 22, DIM.m[1] + 22] : [DIM.d[0] + 2, DIM.d[1] + 38]);
  const z = Math.min(1, (W - g * (itens.length - 1)) / nat.reduce((s, n) => s + n[0], 0), H / Math.max(...nat.map(n => n[1])));
  itens.forEach((a, i) => { a.style.width = nat[i][0] * z + 'px'; a.style.height = nat[i][1] * z + 'px'; a.firstElementChild.style.transform = `scale(${z})`; });
};
const lateral = () => {
  const s = SP.screens[S.nav.screen]; let f = '';
  const nav = $('#plista'), y = nav.scrollTop;
  nav.innerHTML = lista().map(x => `${x.flow !== f ? `<h5>${(f = x.flow)} · ${FLUXOS.find(y => y[0] === x.flow)[1]}</h5>` : ''}<button type="button" data-x="tela" data-v="${x.key}" class="${x.key === s.key ? 'on' : ''}"><code>${x.code}</code>${x.nome}</button>`).join('');
  nav.scrollTop = y;
  if (lateral.ultimo !== s.key) { lateral.ultimo = s.key; $('button.on', nav)?.scrollIntoView({ block: 'nearest' }); }
  const fontes = { print: 'Print do legado', proc: 'Processos', visao: 'Visão', novo: 'Novo' };
  $('#nota').innerHTML = `<code>${s.code}</code><h2>${s.nome}</h2><p>${s.nota}</p><ul class="fontes">${s.src.map(x => { const [t, ...r] = x.split(':'); return `<li class="f-${t}"><b>${fontes[t]}</b>${r.join(':')}</li>`; }).join('')}</ul>`;
  const seg = (k, atual, ops) => `<div class="cen"><span>${k[1]}</span><div>${ops.map(([v, n]) => `<button type="button" data-x="${k[0]}" data-v="${v}" class="${String(atual) === String(v) ? 'on' : ''}">${n}</button>`).join('')}</div></div>`;
  $('#cenarios').innerHTML = seg(['persona', 'Quem está usando'], S.persona, [['admin', 'Administrador'], ['vendedor', 'Vendedor'], ['logistica', 'Logística'], ['investidor', 'Investidor'], ['cliente', 'Cliente']])
    + (S.persona === 'cliente' ? seg(['cliente', 'Empresa cliente'], S.cliente, [['c1', 'Alvorada'], ['c3', 'Cidade Viva'], ['c6', 'Transrota'], ['c4', 'Raiz']]) : '')
    + seg(['tenant', 'Marca (tenant)'], S.tenant, db().tenants.map(t => [t.id, t.nome])) + seg(['tema', 'Tema'], S.tema, [['light', 'Claro'], ['dark', 'Escuro']]) + seg(['pausa', 'Automação'], S.pausado, [[false, 'Ligada'], [true, 'Pausada']]) + seg(['imp', 'Faixa “acessando como”'], !!S.impersonar, [[false, 'Não'], [true, 'Sim']]);
  $$('[data-x="dev"]').forEach(b => b.classList.toggle('on', b.dataset.v === P.dev));
};
const abrirPlayer = (k, dev) => {
  P.aberto = true; if (dev) P.dev = dev; else if (innerWidth < 860) P.dev = 'm';
  document.body.classList.add('tocando');
  const quer = personaDe(k, S.persona); if (quer !== S.persona) { S.persona = quer; S.impersonar = null; }
  palco(); S.hist = []; S.nav = { screen: '' }; SP.ir(k); S.hist = []; SP.draw();
};
const fecharPlayer = () => { P.aberto = false; document.body.classList.remove('tocando'); $('#palco').innerHTML = ''; history.replaceState(null, '', location.pathname + location.search); S.draft = null; temas(); miniaturas(); };
const abrirApp = k => {
  P.app = true; P.aberto = false; document.body.classList.remove('tocando'); document.body.classList.add('app-on'); $('#palco').innerHTML = '';
  const alvo = k || CASA[S.persona]; const quer = personaDe(alvo, S.persona); S.persona = quer; S.nav = { screen: '' }; SP.ir(alvo); S.hist = []; SP.draw();
};
const fecharApp = () => { P.app = false; document.body.classList.remove('app-on'); $('#app .vp').innerHTML = ''; history.replaceState(null, '', location.pathname + location.search); temas(); miniaturas(); };
const passo = n => { const l = lista(), i = l.findIndex(s => s.key === S.nav.screen), s = l[(i + n + l.length) % l.length]; const q = personaDe(s.key, S.persona); if (q !== S.persona) { S.persona = q; S.impersonar = null; } SP.ir(s.key); SP.draw(); };
const X = {
  abrir: el => abrirPlayer(el.dataset.v, el.dataset.d), app: () => abrirApp(), 'sair-app': fecharApp, fechar: fecharPlayer,
  tela: el => { const k = el.dataset.v, q = personaDe(k, S.persona); if (q !== S.persona) { S.persona = q; S.impersonar = null; } SP.ir(k); SP.draw(); },
  dev: el => { P.dev = el.dataset.v; palco(); SP.ir(S.nav.screen, S.nav.id); SP.draw(); },
  notas: () => { $('#player').classList.toggle('sem-notas'); ajustar(); },
  persona: el => { S.persona = el.dataset.v; S.impersonar = null; S.view = {}; S.q = {}; if (!SP.pode(S.nav.screen) || SP.screens[S.nav.screen].semMenu) SP.ir(CASA[S.persona]); SP.draw(); },
  cliente: el => { S.cliente = el.dataset.v; SP.ir('cliHome'); SP.draw(); },
  tenant: el => { S.tenant = el.dataset.v; if (P.aberto) { palco(); SP.draw(); } else { temas(); miniaturas(); } },
  tema: el => { S.tema = el.dataset.v; if (P.aberto) SP.draw(); else { temas(); miniaturas(); } },
  pausa: el => { S.pausado = el.dataset.v === 'true'; SP.draw(); },
  imp: el => { S.impersonar = el.dataset.v === 'true' ? { nome: 'Marina Alves' } : null; if (S.impersonar) { S.persona = 'vendedor'; if (!SP.pode(S.nav.screen)) SP.ir('hoje'); } else S.persona = 'admin'; SP.draw(); },
  reiniciar: () => { const t = S.tenant, tema = S.tema; SP.reset(); S.tenant = t; S.tema = tema; SP.ir('hoje'); SP.toast('Dados do protótipo reiniciados.'); SP.draw(); },
  ancora: el => document.getElementById(el.dataset.v)?.scrollIntoView({ behavior: 'smooth' }),
};
document.addEventListener('click', ev => { const el = ev.target.closest('[data-x]'); if (el) { ev.preventDefault(); X[el.dataset.x](el); } });
document.addEventListener('keydown', ev => {
  if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k' && (P.aberto || P.app)) { ev.preventDefault(); S.cmd = { q: '' }; S.pop = null; return SP.draw(); }
  if (!P.aberto && !P.app) return;
  if (ev.key === 'Escape') { if (S.pop || S.cmd || S.modal || S.peek) SP.actions.fechar(); else if (P.aberto) return fecharPlayer(); return SP.draw(); }
  if (ev.key === 'Enter') { if (ev.target.matches?.('[data-cmd]')) { ev.preventDefault(); $('.sp.live .cmd button.on')?.click(); } else if (ev.target.matches?.('tr[data-go],li[data-go],tr[data-peek],li[data-peek]')) ev.target.click(); return; }
  if (ev.target.matches?.('input,textarea,select') || !P.aberto) return;
  if (ev.key === 'ArrowRight') passo(1); else if (ev.key === 'ArrowLeft') passo(-1);
  else if (ev.key === 'Backspace' && S.hist.length) { const h = S.hist.pop(); SP.ir(h.screen, h.id, { voltando: true }); SP.draw(); }
  else if (ev.key.toLowerCase() === 'd' && !ev.metaKey && !ev.ctrlKey) { P.dev = { d: 'm', m: '2', 2: 'd' }[P.dev]; palco(); SP.draw(); }
});
let tR; addEventListener('resize', () => { clearTimeout(tR); tR = setTimeout(() => { if (P.app) SP.draw(); else if (P.aberto) ajustar(); else miniaturas(); }, 150); });

/* ---------- partida: #C-20, #C-20:m, #C-20:2, #app, #app/C-20 ---------- */
SP.partida = () => {
  const q = new URLSearchParams(location.search); if (q.get('tenant') && SP.by('tenants', q.get('tenant'))) S.tenant = q.get('tenant'); if (q.get('tema') === 'dark') S.tema = 'dark';
  temas(); pagina();
  const h = decodeURIComponent(location.hash.slice(1)), porCod = c => lista().find(s => s.code === c)?.key;
  if (h === 'app' || h.startsWith('app/')) abrirApp(porCod(h.split('/')[1]));
  else { const [c, d] = h.split(':'), k = porCod(c); if (k) abrirPlayer(k, d || 'd'); }
};
SP.partida();
addEventListener('hashchange', () => { const [c, d] = location.hash.slice(1).split(':'), s = lista().find(x => x.code === c); if (s) abrirPlayer(s.key, d || 'd'); });
})();
