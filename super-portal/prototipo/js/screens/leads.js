/* R · Leads: captar, qualificar, distribuir e converter em cliente. */
(() => {
const e = v => SP.esc(v), db = () => SP.S.db;
const ST = [['Novo', 'info'], ['Em contato', 'alt'], ['Qualificado', 'warn'], ['Convertido', 'ok'], ['Descartado', 'mute']];
const ORIGEM = { 'Indicação': 30, 'Site': 20, 'Feira': 20, 'WhatsApp': 15, 'LinkedIn': 10, 'E-mail': 10 };
const pill = l => SP.pill(ST.find(s => s[0] === l.status)[1], l.status);
const vendedores = () => db().vendedores.filter(v => v.ativo);
const donoNome = l => l.dono ? SP.vend(l.dono).nome : 'Sem responsável';
/* o vendedor vê os seus e os que ainda não têm responsável */
const meus = () => SP.S.persona === 'vendedor' ? db().leads.filter(l => !l.dono || l.dono === 'v1') : db().leads;
/* pontuação explicada: origem, valor estimado, interações e telefone */
const pontos = l => [['Origem: ' + l.origem, ORIGEM[l.origem] || 0], ['Valor estimado', l.valor >= 10000 ? 30 : l.valor >= 3000 ? 20 : l.valor ? 10 : 0], [SP.plural(l.hist.length, 'interação', 'interações'), Math.min(30, l.hist.length * 10)], ['Tem telefone', l.telefone ? 10 : 0]];
const nota = l => pontos(l).reduce((s, p) => s + p[1], 0);
SP.notaLead = nota; /* usado pelo copiloto */
const temp = n => n >= 70 ? ['ok', 'Quente'] : n >= 45 ? ['warn', 'Morno'] : ['mute', 'Frio'];
const pillNota = l => { const n = nota(l), [tom, t] = temp(n); return SP.pill(tom, t + ' · ' + n); };
const registrar = (l, txt) => l.hist.unshift({ txt, em: SP.agora(), por: SP.eu().nome });
const acoesTopo = ctx => SP.btn(ctx.m ? '' : 'Novo lead', { go: 'leadForm', id: 'novo', icon: 'plus', kind: 'primary', title: 'Novo lead' });

SP.screen('leads', { code: 'F99', nome: 'Leads', flow: 'R', src: ['novo:Gestão de leads'], nota: 'Contatos que ainda não são clientes, com origem, temperatura, responsável e status. O vendedor vê os seus e os sem responsável.',
  render(ctx) {
    const st = SP.visao('lead'), base = SP.filtrar('lead', meus(), l => [l.nome, l.empresa, l.email].join(' '), { origem: (l, v) => l.origem === v, dono: (l, v) => l.dono === v }), rows = base.filter(l => st === 'Todos' || l.status === st).sort((a, b) => nota(b) - nota(a));
    const abertos = base.filter(l => !['Convertido', 'Descartado'].includes(l.status)), conv = base.filter(l => l.status === 'Convertido').length;
    return { titulo: 'Leads', acoes: SP.btn(ctx.m ? '' : 'Funil', { go: 'funilLeads', icon: 'kanban', title: 'Funil de leads' }) + acoesTopo(ctx),
      corpo: `<div class="stats">${SP.stat('Em aberto', abertos.length, SP.brlk(abertos.reduce((s, l) => s + l.valor, 0)) + ' estimados')}${SP.stat('Quentes', abertos.filter(l => nota(l) >= 70).length)}${SP.stat('Sem responsável', abertos.filter(l => !l.dono).length)}${SP.stat('Conversão', base.length ? Math.round(conv / base.length * 100) + '%' : '—', `${conv} de ${base.length}`)}</div>`
        + SP.visoes('lead', ST.map(s => s[0]), l => l.status, base) + SP.filtros(ctx, 'lead', 'Nome, empresa ou e-mail', [{ k: 'origem', label: 'Origem', options: Object.keys(ORIGEM) }, { k: 'dono', label: 'Responsável', options: vendedores().map(v => [v.id, v.nome]) }])
        + SP.lista(ctx, { key: 'lead', rows, abrir: l => ({ go: 'lead', id: l.id }),
          cols: [{ h: 'Lead', c: l => SP.duas(e(l.empresa), e(l.nome)), s: l => l.empresa }, { h: 'Temperatura', c: pillNota, s: nota }, { h: 'Status', c: pill, s: l => l.status }, { h: 'Origem', c: l => e(l.origem), s: l => l.origem }, { h: 'Responsável', c: l => e(donoNome(l)) }, { h: 'Valor estimado', r: 1, c: l => SP.brl(l.valor), s: l => l.valor }, { h: 'Chegou em', c: l => SP.data(l.criado), s: l => l.criado }],
          card: l => SP.regLinha(e(l.empresa), SP.brlk(l.valor), e(l.nome) + ' · ' + e(l.origem), pillNota(l) + pill(l)) }) };
  } });

const cartao = l => { SP.menus['ld:' + l.id] = [{ label: 'Abrir', go: 'lead', id: l.id, icon: 'eye' }, ...ST.filter(s => s[0] !== l.status && s[0] !== 'Convertido').map(([s]) => ({ label: 'Mover para ' + s, a: 'leadMover', p: l.id, v: s, icon: 'next' }))];
  return `<article class="kc" draggable="true" data-drag="${l.id}"><header>${pillNota(l)}<button type="button" class="btn quiet sm icon" data-a="linhaMenu" data-p="ld:${l.id}" aria-haspopup="menu" aria-label="Mover ou abrir" title="Mover ou abrir">${SP.icon('more', 16)}</button></header><p><button type="button" class="lk" data-go="lead" data-id="${l.id}">${e(l.empresa)}</button></p><div class="kc-i"><span>${e(donoNome(l).split(' ')[0] === 'Sem' ? 'Sem responsável' : donoNome(l).split(' ')[0])}</span><b>${SP.brlk(l.valor)}</b></div></article>`; };
SP.screen('funilLeads', { code: 'F100', nome: 'Funil de leads', flow: 'R', pai: 'leads', src: ['novo:Funil de leads'], nota: 'Leads por etapa, com valor estimado. Arraste no desktop ou mova pelo menu. Converter é feito na ficha.',
  render(ctx) {
    const l = SP.filtrar('fl', meus(), x => x.empresa + ' ' + x.nome);
    return { titulo: 'Funil de leads', voltar: 'leads', larga: true, acoes: acoesTopo(ctx), corpo: SP.filtros(ctx, 'fl', 'Empresa ou contato') + SP.quadro(ctx, { key: 'fl', itens: l, de: x => x.status, soma: x => x.valor, cartao, colunas: ST.map(([s, tom]) => ({ id: s, nome: s, tom })) }) };
  } });

SP.screen('lead', { code: 'F101', nome: 'Ficha do lead', flow: 'R', pai: 'leads', exemplo: 'ld1', src: ['novo:Qualificação e conversão'], nota: 'Contato, pontuação explicada, etapa, responsável, histórico e conversão em cliente.',
  render(ctx) {
    const l = SP.by('leads', ctx.id) || db().leads[0], d = SP.draft(ctx, 'lead:' + l.id, () => ({ nota: '' })), fim = l.status === 'Convertido';
    const dados = SP.card(SP.kv([['Contato', e(l.nome)], ['E-mail', e(l.email)], ['Telefone', e(l.telefone)], ['Cidade', e([l.cidade, l.uf].filter(Boolean).join(' · '))], ['Origem', e(l.origem)], ['Interesse', e(l.interesse)], ['Valor estimado', SP.brl(l.valor)]]), { title: 'Dados', actions: fim ? '' : SP.btn('Editar', { go: 'leadForm', id: l.id, sm: true, icon: 'edit' }) });
    const etapa = fim ? SP.aviso('Convertido em cliente.', 'ok') : SP.card(`<h4>Etapa</h4>${SP.radios(l.status, ['Novo', 'Em contato', 'Qualificado', 'Descartado'], 'leadEtapa', l.id)}<h4>Responsável</h4>${SP.seg(l.dono, vendedores().map(v => [v.id, e(v.nome.split(' ')[0])]), 'leadDono', l.id)}`);
    const pts = SP.card(`<table class="tb mini"><tbody>${pontos(l).map(([n, v]) => `<tr><td>${e(n)}</td><td class="r">${v}</td></tr>`).join('')}<tr class="tt"><td>Total</td><td class="r">${nota(l)}</td></tr></tbody></table>`, { title: 'Pontuação', actions: pillNota(l) });
    const hist = SP.card((fim ? '' : SP.campo(d, 'nota', 'Registrar contato', { type: 'area', rows: 2 }) + `<div class="row fim">${SP.btn('Registrar', { a: 'leadNota', p: l.id, icon: 'check' })}</div>`) + SP.linha(l.hist.map(h => ({ titulo: e(h.txt), sub: SP.quando(h.em) + ' · ' + e(h.por), icon: 'user' }))), { title: 'Histórico' });
    return { titulo: e(l.empresa), sub: e(l.nome) + ' · chegou em ' + SP.data(l.criado), voltar: 'leads',
      acoes: fim ? SP.btn('Abrir cliente', { go: 'cliente', id: l.cliente, icon: 'users' }) + SP.btn('Novo orçamento', { a: 'orcDoCliente', p: l.cliente, icon: 'plus', kind: 'primary' }) : SP.btn('Converter em cliente', { a: 'leadConverter', p: l.id, icon: 'check', kind: 'primary', disabled: l.status === 'Descartado' }),
      corpo: `<div class="row">${pill(l)}</div><div class="cols c2"><div class="pilha">${etapa}${hist}</div><div class="pilha">${dados}${pts}</div></div>` };
  } });

SP.cadastro({ key: 'leadForm', code: 'F102', nome: 'Cadastro de lead', flow: 'R', col: 'leads', lista: 'leads', exemplo: 'ld2', src: ['novo:Gestão de leads'], nota: 'Contato, empresa, origem, interesse, valor estimado e responsável.', titulo: ['Novo lead', 'Lead'],
  novo: { nome: '', empresa: '', email: '', telefone: '', cidade: '', uf: 'SP', origem: 'Indicação', interesse: '', valor: 0, dono: '', status: 'Novo', criado: SP.HOJE, hist: [] }, obrig: [['empresa', 'empresa'], ['nome', 'contato'], ['email', 'e-mail']], numericos: ['valor'],
  campos: () => [['empresa', 'Empresa', { req: true, span: 2 }], ['nome', 'Contato', { req: true }], ['email', 'E-mail', { type: 'email', req: true }], ['telefone', 'Telefone'], ['cidade', 'Cidade'], ['uf', 'Estado', { options: SP.UFS }], ['origem', 'Origem', { options: Object.keys(ORIGEM) }], ['valor', 'Valor estimado', { money: true }], ['dono', 'Responsável', { options: [['', 'Sem responsável'], ...vendedores().map(v => [v.id, v.nome])] }], ['interesse', 'Interesse', { type: 'area', rows: 3, span: 2 }]] });

/* ---------- captação ---------- */
/* rodízio: o responsável com menos leads em aberto */
const proximo = () => { const abertos = id => db().leads.filter(l => l.dono === id && !['Convertido', 'Descartado'].includes(l.status)).length; return [...vendedores()].sort((a, b) => abertos(a.id) - abertos(b.id))[0]?.id || ''; };
const PLANILHA = [['Escola Horizonte', 'Renata Dias', 'renata@horizonte.exemplo'], ['Oficina Dois Irmãos', 'Caio Pires', 'caio@doisirmaos.exemplo'], ['Hotel Serra Verde', 'Lúcia Amaral', 'lucia@serraverde.exemplo']];
const entrar = (x, txt) => { const dono = db().captacao.rodizio ? proximo() : ''; db().leads.unshift({ id: SP.uid('ld'), telefone: '', cidade: '', uf: 'SP', interesse: '', valor: 0, dono, status: 'Novo', criado: SP.HOJE, hist: [{ txt, em: SP.agora(), por: 'Captação' }], ...x }); };
SP.screen('captacao', { code: 'F103', nome: 'Captação de leads', flow: 'R', src: ['novo:Formulário do site', 'novo:Consentimento (LGPD)'], nota: 'Formulário do site na marca do tenant, com consentimento, importação de planilha sem duplicar e distribuição em rodízio.',
  render(ctx) {
    const c = db().captacao, d = SP.draft(ctx, 'capt', () => ({ nome: '', empresa: '', email: '', interesse: '', aceite: false })), link = 'https://' + SP.tenant().dominio + '/fale-conosco';
    const form = SP.card(`${SP.logo()}<b>Peça uma cotação</b>${SP.grade(SP.campo(d, 'nome', 'Seu nome', { req: true }) + SP.campo(d, 'empresa', 'Empresa', { req: true }) + SP.campo(d, 'email', 'E-mail', { type: 'email', req: true }) + SP.campo(d, 'interesse', 'O que precisa', { type: 'area', rows: 3 }), 1)}${SP.check(d.aceite, 'leadAceite', '', '', 'Aceito receber contato da ' + e(SP.tenant().nome))}<div class="row fim">${SP.btn('Enviar', { a: 'leadSite', kind: 'primary', icon: 'send' })}</div>`, { title: 'Formulário do site' });
    const lado = SP.card(`<p class="mute">${e(link)}</p><div class="row">${SP.btn('Copiar link', { a: 'copiar', v: link, icon: 'copy', sm: true })}</div>`, { title: 'Onde divulgar' })
      + SP.card(`<div class="linha-sw"><div><b>Rodízio</b><small>Cada lead novo vai para quem tem menos em aberto</small></div>${SP.sw(c.rodizio, 'leadRodizio', '', 'Rodízio')}</div>`, { title: 'Distribuição' })
      + SP.card(`<p class="mute">Colunas: empresa, contato e e-mail. E-mail repetido é ignorado.</p><div class="row">${SP.btn('Importar planilha de exemplo', { a: 'leadImportar', icon: 'upload', sm: true })}</div>`, { title: 'Importar' });
    return { titulo: 'Captação de leads', corpo: `<div class="cols c2">${form}<div class="pilha">${lado}</div></div>` };
  } });

const mover = (id, st) => { const l = SP.by('leads', id); if (!l || l.status === st) return; if (st === 'Convertido') return SP.toast('Para converter, abra a ficha do lead.'); if (l.status === 'Convertido') return SP.toast('Este lead já virou cliente.'); SP.feito('Etapa: ' + st + '.', () => { const x = SP.by('leads', id); x.status = st; registrar(x, 'Etapa mudou para ' + st); }); };
SP.soltar.fl = mover;
Object.assign(SP.actions, {
  leadMover: el => { SP.S.pop = null; mover(el.dataset.p, el.dataset.v); },
  leadEtapa: el => mover(el.dataset.p, el.dataset.v),
  leadDono: el => SP.feito('Responsável definido.', () => { const l = SP.by('leads', el.dataset.p); l.dono = el.dataset.v; registrar(l, 'Responsável: ' + SP.vend(l.dono).nome); }),
  leadNota: el => { const t = SP.S.draft?.v.nota.trim(); if (!t) return SP.toast('Escreva o que foi conversado.'); SP.feito('Contato registrado.', () => { const l = SP.by('leads', el.dataset.p); registrar(l, t); if (l.status === 'Novo') l.status = 'Em contato'; }); SP.S.draft = null; },
  leadConverter: el => SP.feito('Cliente criado.', () => { const l = SP.by('leads', el.dataset.p), igual = db().clientes.find(c => c.email === l.email);
    const id = igual?.id || SP.uid('c');
    if (!igual) db().clientes.push({ id, nome: l.empresa, cnpj: '', comprador: l.nome, email: l.email, telefone: l.telefone, whats: l.telefone, ie: 'Isento', isento: 'Não contribuinte', icms: 'Não', cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: l.cidade, uf: l.uf });
    l.status = 'Convertido'; l.cliente = id; registrar(l, igual ? 'Ligado a um cliente já cadastrado' : 'Convertido em cliente'); }),
  leadAceite: () => { SP.S.draft.v.aceite = !SP.S.draft.v.aceite; },
  leadSite: () => { const d = SP.S.draft.v; if (!SP.validar(d, { nome: { req: true, label: 'o nome' }, empresa: { req: true, label: 'a empresa' }, email: { req: true, label: 'o e-mail', mask: 'email' } })) return; if (!d.aceite) return SP.toast('Marque o aceite para enviar.'); const { aceite, ...x } = SP.clone(d); SP.feito('Lead recebido pelo site (simulado).', () => entrar({ ...x, origem: 'Site' }, 'Enviou o formulário do site, com aceite de contato')); SP.S.draft = null; },
  leadRodizio: () => { db().captacao.rodizio = !db().captacao.rodizio; },
  leadImportar: () => { const novos = PLANILHA.filter(([, , m]) => !db().leads.some(l => l.email === m)); if (!novos.length) return SP.toast('Nenhum lead novo: todos já estão cadastrados.'); SP.feito(SP.plural(novos.length, 'lead importado', 'leads importados') + '.', () => novos.forEach(([empresa, nome, email]) => entrar({ empresa, nome, email, origem: 'Feira' }, 'Importado de planilha'))); },
});
})();
