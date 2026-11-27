/* N · Kanban: quadro de vendas (propostas por status) e quadro de tarefas da equipe. */
(() => {
const e = v => SP.esc(v), I = (n, s) => SP.icon(n, s), db = () => SP.S.db;
const meu = l => SP.S.persona === 'vendedor' ? l.filter(o => o.vendedor === 'v1') : l;
const ST = ['Em aberto', 'Enviado', 'Contra proposta', 'Aprovado', 'Reprovado'];
const PRIO = { Alta: 'bad', Média: 'warn', Baixa: 'mute' };

/* quadro genérico: colunas lado a lado no desktop; uma por vez no celular */
const quadro = (ctx, o) => {
  const coluna = c => { const l = o.itens.filter(x => o.de(x) === c.id), cheio = c.limite && l.length > c.limite;
    return `<section class="kb-c t-${c.tom}" data-drop="${e(c.id)}" data-quadro="${o.key}"><header><i></i><b>${e(c.nome)}</b><em>${l.length}${c.limite ? '/' + c.limite : ''}</em><small${cheio ? ' class="cheio"' : ''}>${cheio ? 'acima do limite' : o.soma ? SP.brlk(l.reduce((s, x) => s + o.soma(x), 0)) : ''}</small></header><div>${l.map(o.cartao).join('') || '<p class="mute pad">Vazio</p>'}</div></section>`; };
  if (!ctx.m) return `<div class="kb n" style="--n:${o.colunas.length}">${o.colunas.map(coluna).join('')}</div>`;
  const at = o.colunas.find(c => c.id === SP.S.tab[o.key]) || o.colunas[0];
  return `<div class="seg-w">${SP.seg(at.id, o.colunas.map(c => [c.id, `${e(c.nome)} <em>${o.itens.filter(x => o.de(x) === c.id).length}</em>`]), 'tab', o.key)}</div><div class="kb-m">${coluna(at)}</div>`;
};

/* ---------- vendas ---------- */
const cartaoOrc = o => `<article class="kc" draggable="true" data-drag="${o.id}"><header><button type="button" class="lk" data-peek="orc:${o.id}">Nº ${o.numero}</button><button type="button" class="btn quiet sm icon" data-a="menuStatus" data-p="orc:${o.id}" aria-haspopup="menu" aria-label="Trocar status" title="Trocar status">${I('more', 16)}</button></header><p>${e(SP.cli(o.cliente).nome)}</p><div class="kc-i"><span>${e(SP.vend(o.vendedor).nome.split(' ')[0])} · ${SP.dataCurta(o.data)}</span><b>${SP.brl(SP.total(o))}</b></div></article>`;
SP.screen('quadroVendas', { code: 'F83', nome: 'Kanban de vendas', flow: 'N', src: ['novo:Funil em quadro'], nota: 'Propostas por status, com total por coluna. Arraste no desktop ou troque o status pelo menu do cartão.',
  render(ctx) {
    const l = SP.filtrar('qv', meu(db().orcamentos).filter(o => ST.includes(o.status)), o => o.numero + ' ' + SP.cli(o.cliente).nome + ' ' + o.titulo);
    return { titulo: 'Kanban de vendas', sub: `${SP.plural(l.length, 'proposta', 'propostas')} · ${SP.brl(l.reduce((s, o) => s + SP.total(o), 0))}`, larga: true,
      acoes: SP.btn(ctx.m ? '' : 'Novo orçamento', { go: 'orcNovo', icon: 'plus', kind: 'primary', title: 'Novo orçamento' }),
      corpo: SP.filtros(ctx, 'qv', 'Número, cliente ou nome') + quadro(ctx, { key: 'qv', itens: l, de: o => o.status, soma: SP.total, cartao: cartaoOrc, colunas: ST.map(s => ({ id: s, nome: s, tom: SP.TOM[s] })) }) };
  } });

/* ---------- tarefas ---------- */
const colunasT = () => db().colunas;
const cartaoTar = t => { const atrasada = t.prazo && t.prazo < SP.HOJE && t.coluna !== 'feito';
  SP.menus['tar:' + t.id] = [{ label: 'Abrir', go: 'tarefa', id: t.id, icon: 'edit' }, ...colunasT().filter(c => c.id !== t.coluna).map(c => ({ label: 'Mover para ' + e(c.nome), a: 'tarMover', p: t.id, v: c.id, icon: 'next' }))];
  return `<article class="kc" draggable="true" data-drag="${t.id}"><header><span class="pill t-${PRIO[t.prioridade]}"><i></i>${t.prioridade}</span><button type="button" class="btn quiet sm icon" data-a="linhaMenu" data-p="tar:${t.id}" aria-haspopup="menu" aria-label="Mover ou abrir" title="Mover ou abrir">${I('more', 16)}</button></header><p><button type="button" class="lk" data-go="tarefa" data-id="${t.id}">${e(t.nome)}</button></p><div class="kc-i"><span>${e(t.dono)}</span>${t.prazo ? `<b${atrasada ? ' class="cheio"' : ''}>${atrasada ? 'Atrasada · ' : ''}${SP.dataCurta(t.prazo)}</b>` : ''}</div></article>`; };
SP.screen('quadroTarefas', { code: 'F84', nome: 'Kanban de tarefas', flow: 'N', src: ['novo:Tarefas da equipe'], nota: 'Tarefas por coluna, com dono, prazo e prioridade. Coluna acima do limite avisa. No celular, uma coluna por vez e mover pelo menu.',
  render(ctx) {
    const l = SP.filtrar('qt', db().tarefas, t => t.nome + ' ' + t.dono, { dono: (t, v) => t.dono === v });
    return { titulo: 'Tarefas', sub: SP.plural(l.length, 'tarefa', 'tarefas'), larga: true,
      acoes: SP.btn(ctx.m ? '' : 'Colunas', { go: 'colunas', icon: 'sliders', title: 'Colunas e limites' }) + SP.btn(ctx.m ? '' : 'Nova tarefa', { go: 'tarefa', id: 'novo', icon: 'plus', kind: 'primary', title: 'Nova tarefa' }),
      corpo: SP.filtros(ctx, 'qt', 'Tarefa ou responsável', [{ k: 'dono', label: 'Responsável', options: equipe() }]) + quadro(ctx, { key: 'qt', itens: l, de: t => t.coluna, cartao: cartaoTar, colunas: colunasT() }) };
  } });
const equipe = () => [...db().vendedores.filter(v => v.ativo).map(v => v.nome), ...db().funcionarios.map(f => f.nome)];
SP.cadastro({ key: 'tarefa', code: 'F85', nome: 'Cartão de tarefa', flow: 'N', col: 'tarefas', lista: 'quadroTarefas', exemplo: 'k1', src: ['novo:Tarefas da equipe'], nota: 'Título, responsável, prazo, prioridade, coluna e detalhes.', titulo: ['Nova tarefa', 'Tarefa'],
  novo: { nome: '', dono: 'Marina Alves', prazo: '', prioridade: 'Média', coluna: 'fazer', detalhe: '' }, obrig: [['nome', 'título']],
  campos: () => [['nome', 'Título', { req: true, span: 2 }], ['dono', 'Responsável', { options: equipe() }], ['prazo', 'Prazo', { type: 'date' }], ['prioridade', 'Prioridade', { options: Object.keys(PRIO) }], ['coluna', 'Coluna', { options: colunasT().map(c => [c.id, c.nome]) }], ['detalhe', 'Detalhes', { type: 'area', rows: 4, span: 2 }]] });

SP.screen('colunas', { code: 'F86', nome: 'Colunas e limites', flow: 'N', pai: 'quadroTarefas', src: ['novo:Limite de trabalho em andamento'], nota: 'Nome, ordem e limite de cartões de cada coluna do quadro de tarefas.',
  render(ctx) {
    const l = colunasT();
    const linhas = l.map((c, i) => `<li class="col-l"><label class="f"><span>Nome</span><input data-coluna="${c.id}.nome" value="${e(c.nome)}"></label><label class="f"><span>Limite</span><input type="number" min="0" data-coluna="${c.id}.limite" value="${c.limite || ''}" placeholder="Sem limite"></label><div class="row nw">${SP.btn('', { a: 'colSubir', p: c.id, icon: 'back', title: 'Mover para a esquerda', disabled: !i })}${SP.btn('', { a: 'colRm', p: c.id, icon: 'trash', title: 'Excluir coluna', kind: 'quiet', disabled: l.length < 3 })}</div></li>`).join('');
    return { titulo: 'Colunas e limites', sub: 'Os cartões de uma coluna excluída vão para a primeira.', voltar: 'quadroTarefas', corpo: SP.card(`<ul class="pilha">${linhas}</ul><div class="row">${SP.btn('Nova coluna', { a: 'colNova', icon: 'plus' })}</div>`, { cls: 'estreito' }) };
  } });

const moverTar = (id, col) => { const t = SP.by('tarefas', id); if (!t || t.coluna === col) return; SP.feito('Movida para ' + SP.by('colunas', col).nome + '.', () => { SP.by('tarefas', id).coluna = col; }); };
SP.quadro = quadro; /* usado também pelo funil de leads */
/* soltar um cartão em uma coluna (ver app.js) */
SP.soltar = {
  qv: (id, st) => { const o = SP.orc(id); if (o && o.status !== st) SP.feito('Status: ' + st + '.', () => SP.statusOrc(SP.orc(id), st)); },
  qt: moverTar,
};
Object.assign(SP.actions, {
  tarMover: el => { SP.S.pop = null; moverTar(el.dataset.p, el.dataset.v); },
  colNova: () => { db().colunas.push({ id: SP.uid('co'), nome: 'Nova coluna', limite: 0, tom: 'mute' }); },
  colSubir: el => { const l = db().colunas, i = l.findIndex(c => c.id === el.dataset.p); if (i > 0) [l[i - 1], l[i]] = [l[i], l[i - 1]]; },
  colRm: el => SP.feito('Coluna excluída.', () => { const l = db().colunas.filter(c => c.id !== el.dataset.p); db().colunas = l; db().tarefas.filter(t => t.coluna === el.dataset.p).forEach(t => t.coluna = l[0].id); }),
});
document.addEventListener('change', ev => { const el = ev.target.closest?.('[data-coluna]'); if (!el) return; const [id, k] = el.dataset.coluna.split('.'), c = SP.by('colunas', id); c[k] = k === 'limite' ? Math.max(0, +el.value || 0) : el.value.trim() || c.nome; SP.draw(); });
})();
