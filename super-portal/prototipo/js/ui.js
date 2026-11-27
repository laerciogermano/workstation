/* Componentes. Cada um devolve HTML; interação é por data-attributes (ver app.js). */
(() => {
const S = () => SP.S, e = v => SP.esc(v), I = (n, s) => SP.icon(n, s);

SP.attrs = o => Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== false).map(([k, v]) => ` ${k}="${e(v === true ? '' : v)}"`).join('');
/* kind: primary | accent | ghost | quiet | danger */
SP.btn = (label, o = {}) => `<button type="button" class="btn ${o.kind || 'ghost'}${o.sm ? ' sm' : ''}${o.block ? ' block' : ''}${!label ? ' icon' : ''}"${SP.attrs({ 'data-a': o.a, 'data-p': o.p, 'data-v': o.v, 'data-go': o.go, 'data-id': o.id, disabled: o.disabled, title: o.title, 'aria-label': !label ? o.title : undefined })}>${o.icon ? I(o.icon, o.sm ? 15 : 17) : ''}${label ? `<span>${label}</span>` : ''}</button>`;
SP.pill = (st, label) => `<span class="pill t-${SP.TOM[st] || SP.ETAPAS[st]?.[1] || st || 'mute'}"><i></i>${e(label ?? st)}</span>`;
SP.etapaPill = p => `<span class="pill t-${SP.ETAPAS[SP.etapa(p)][1]}"><i></i>${e(SP.rotulo(p))}</span>`;
SP.avatar = (n, sm) => `<span class="av${sm ? ' sm' : ''}" aria-hidden="true">${e(SP.iniciais(n))}</span>`;
SP.card = (body, o = {}) => `<section class="card ${o.cls || ''}">${o.title ? `<header class="card-h"><h3>${o.title}</h3>${o.actions ? `<div class="row">${o.actions}</div>` : ''}</header>` : ''}${body}</section>`;
SP.vazio = (titulo, texto, acao = '', icon = 'check') => `<div class="vazio">${I(icon, 28)}<b>${titulo}</b><p>${texto}</p>${acao}</div>`;
SP.kv = pares => `<dl class="kv">${pares.filter(Boolean).map(([k, v]) => `<div><dt>${k}</dt><dd>${v === '' || v == null ? '—' : v}</dd></div>`).join('')}</dl>`;
SP.aviso = (txt, tom = 'info', acao = '') => `<div class="aviso t-${tom}">${I(tom === 'warn' || tom === 'bad' ? 'alert' : 'info', 17)}<div>${txt}</div>${acao}</div>`;
SP.stat = (label, valor, sub = '', o = {}) => `<${o.go ? 'button type="button"' : 'div'} class="stat"${SP.attrs({ 'data-go': o.go, 'data-id': o.id })}><span>${label}</span><b>${valor}</b>${sub ? `<small class="${o.tom ? 't-' + o.tom : ''}">${sub}</small>` : ''}${o.extra || ''}</${o.go ? 'button' : 'div'}>`;
SP.barra = pct => `<span class="barra" role="img" aria-label="${pct}%"><i style="width:${Math.min(100, pct)}%"></i></span>`;
SP.sw = (on, a, p, label, disabled) => `<button type="button" class="sw${on ? ' on' : ''}" role="switch" aria-checked="${!!on}"${SP.attrs({ 'data-a': a, 'data-p': p, 'aria-label': label, disabled })}><i></i></button>`;
SP.check = (on, a, p, v, label, disabled, rotulo) => `<button type="button" class="cb${on ? ' on' : ''}" role="checkbox" aria-checked="${!!on}"${SP.attrs({ 'data-a': a, 'data-p': p, 'data-v': v, 'aria-label': rotulo || label || 'Selecionar', disabled })}><i>${on ? I('check', 13) : ''}</i>${label ? `<span>${label}</span>` : ''}</button>`;
SP.seg = (atual, opcoes, a, p) => `<div class="seg" role="radiogroup">${opcoes.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<button type="button" role="radio" aria-checked="${v == atual}" class="${v == atual ? 'on' : ''}"${SP.attrs({ 'data-a': a, 'data-p': p, 'data-v': v })}>${l}</button>`; }).join('')}</div>`;
SP.radios = (atual, opcoes, a, p, disabled) => `<div class="radios" role="radiogroup">${opcoes.map(v => `<button type="button" role="radio" aria-checked="${v === atual}" class="rd t-${SP.TOM[v] || 'mute'}${v === atual ? ' on' : ''}"${SP.attrs({ 'data-a': a, 'data-p': p, 'data-v': v, disabled })}><i></i>${v}</button>`).join('')}</div>`;
SP.tabs = (key, abas) => { const at = S().tab[key] || abas[0][0]; return `<div class="tabs" role="tablist">${abas.map(([v, l]) => `<button type="button" role="tab" aria-selected="${v === at}" class="${v === at ? 'on' : ''}" data-a="tab" data-p="${key}" data-v="${v}">${l}</button>`).join('')}</div>`; };

/* ---------- visões salvas por status (chips com contagem e total) ---------- */
SP.visao = key => S().view[key] || 'Todos';
SP.visoes = (key, itens, status, lista, valor) => {
  const at = SP.visao(key);
  const um = v => { const l = v === 'Todos' ? lista : lista.filter(x => status(x) === v); const t = valor ? l.reduce((s, x) => s + valor(x), 0) : null; return `<button type="button" class="visao${v === at ? ' on' : ''} t-${SP.TOM[v] || 'mute'}" data-a="visao" data-p="${key}" data-v="${v}" aria-pressed="${v === at}"><span>${v !== 'Todos' ? '<i></i>' : ''}${v}<em>${l.length}</em></span>${valor ? `<small>${SP.brlk(t)}</small>` : ''}</button>`; };
  return `<div class="visoes">${['Todos', ...itens].map(um).join('')}</div>`;
};

/* ---------- filtros: busca rápida + busca completa ---------- */
SP.fq = key => S().q[key] || {};
const entrada = (attr, valor, o = {}) => {
  if (o.options) return `<select ${attr}${o.ro ? ' disabled' : ''}>${o.vazio !== undefined ? `<option value="">${o.vazio}</option>` : ''}${o.options.map(x => { const [v, l] = Array.isArray(x) ? x : [x, x]; return `<option value="${e(v)}"${String(v) === String(valor ?? '') ? ' selected' : ''}>${e(l)}</option>`; }).join('')}</select>`;
  if (o.type === 'area') return `<textarea ${attr} rows="${o.rows || 3}"${o.ro ? ' disabled' : ''} placeholder="${e(o.ph || '')}">${e(valor)}</textarea>`;
  return `<input ${attr} type="${o.type || 'text'}" value="${e(valor)}" placeholder="${e(o.ph || '')}"${o.ro ? ' disabled' : ''}${o.type === 'number' ? ' inputmode="decimal"' : ''}>`;
};
SP.filtros = (ctx, key, rapidos, completos = []) => {
  const q = SP.fq(key), campo = f => `<label class="f"><span>${f.label}</span>${entrada(`data-q="${key}.${f.k}"`, q[f.k], { ...f, vazio: f.options ? 'Todos' : undefined })}</label>`;
  const n = completos.filter(f => q[f.k]).length, algum = Object.values(q).some(Boolean), aberto = S().completa[key] || ctx.completa;
  const busca = `<label class="busca">${I('search', 16)}<input data-q="${key}.busca" value="${e(q.busca)}" placeholder="${rapidos}" aria-label="${rapidos}"></label>`;
  const bot = completos.length ? SP.btn(ctx.m ? '' : 'Busca completa' + (n ? ' · ' + n : ''), { icon: 'filter', title: 'Busca completa', a: ctx.m ? 'filtroSheet' : 'completa', p: key, kind: aberto || n ? 'ghost ativo' : 'ghost' }) : '';
  ctx.filtrosDe = ctx.filtrosDe || {}; ctx.filtrosDe[key] = () => `<div class="grid2">${completos.map(campo).join('')}</div>`;
  const cr = S().crit[key];
  const chip = cr ? `<button type="button" class="chip-crit" data-a="limpar" data-p="${key}" title="Remover filtro">${I('spark', 14)}<span>${e(cr.texto)}</span>${I('x', 13)}</button>` : '';
  return `<div class="barra-f">${busca}${bot}${chip}${algum ? SP.btn('Limpar', { a: 'limpar', p: key, kind: 'quiet', sm: true }) : ''}</div>${aberto && !ctx.m ? `<div class="completa">${completos.map(campo).join('')}</div>` : ''}`;
};
/* aplica busca geral (texto) + campos: mapa campo → função(item, valor) */
SP.filtrar = (key, lista, texto, mapa = {}) => {
  const q = SP.fq(key), c = S().crit[key];
  return lista.filter(x => (!q.busca || SP.contem(texto(x), q.busca)) && Object.entries(mapa).every(([k, f]) => !q[k] || f(x, q[k])) && (!c || SP.atende(key, x, c)));
};
SP.periodo = (campo) => ({ de: (x, v) => campo(x).slice(0, 10) >= v, ate: (x, v) => campo(x).slice(0, 10) <= v });

/* ---------- lista: tabela no desktop, registros empilhados no celular ----------
   colunas: { h, c(linha), s(linha)=valor para ordenar, r=alinhar à direita, fixa=não pode ocultar }
   acoes(linha): [{ label, icon, a | go, p, id, v, principal, danger }] */
SP.menus = {};
const POR_PAGINA = 12;
const acaoBtn = (x, kind) => SP.btn(x.label, { a: x.a, go: x.go, p: x.p, id: x.id, v: x.v, sm: true, kind, icon: x.curta ? null : x.icon });
const celAcoes = (o, k, r) => {
  const l = (o.acoes?.(r) || []).filter(Boolean); if (!l.length) return '';
  const prim = l.find(x => x.principal), resto = l.filter(x => x !== prim); SP.menus[k + ':' + r.id] = resto;
  return `<div class="acoes">${prim ? acaoBtn({ ...prim, curta: true }, 'ghost') : ''}${resto.length ? `<button type="button" class="btn quiet sm icon mais" data-a="linhaMenu" data-p="${k}:${r.id}" aria-haspopup="menu" aria-label="Mais ações" title="Mais ações">${I('more', 18)}</button>` : ''}</div>`;
};
SP.ordenar = (k, rows, cols) => { const o = S().ordem[k]; if (!o || !cols[o.i]?.s) return rows; const f = cols[o.i].s; return [...rows].sort((a, b) => { const x = f(a), y = f(b); return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'pt')) * o.dir; }); };
SP.lista = (ctx, o) => {
  const k = o.key || ctx.screen;
  if (!o.rows.length) return SP.vazio('Nada encontrado', 'Ajuste a busca ou limpe os filtros.', o.key ? SP.btn('Limpar filtros', { a: 'limpar', p: o.key, sm: true }) : '', 'search');
  const sel = o.select ? (S().sel[o.select] || []) : [];
  const abrir = r => { const x = o.abrir?.(r); return x ? SP.attrs({ 'data-go': x.go, 'data-id': x.id, 'data-peek': x.peek, 'data-nav': 1, tabindex: 0 }) : ''; };
  const barra = sel.length ? `<div class="massa" role="region" aria-label="Ações em lote"><b>${SP.plural(sel.length, 'selecionado', 'selecionados')}</b>${o.massa || ''}${SP.btn('Limpar seleção', { a: 'selLimpar', p: o.select, sm: true, kind: 'quiet' })}</div>` : '';
  const rows = SP.ordenar(k, o.rows, o.cols), porPag = ctx.m ? 15 : POR_PAGINA, paginas = Math.ceil(rows.length / porPag);
  const pag = Math.min(S().pagina[k] || 0, paginas - 1);
  const vis = ctx.m ? rows.slice(0, porPag * (pag + 1)) : rows.slice(pag * porPag, (pag + 1) * porPag);
  const soma = o.soma ? SP.brl(rows.reduce((s, r) => s + o.soma(r), 0)) : '';
  if (ctx.m) return barra + `<ul class="regs">${vis.map(r => `<li class="reg${sel.includes(r.id) ? ' sel' : ''}${o.cls ? ' ' + o.cls(r) : ''}"${abrir(r)}>${o.select ? SP.check(sel.includes(r.id), 'sel', o.select, r.id) : ''}<div class="reg-c">${o.card(r)}</div>${o.acoes ? celAcoes({ acoes: x => o.acoes(x).map(a => a && { ...a, principal: false }) }, k, r) : ''}</li>`).join('')}</ul>${rows.length > vis.length ? SP.btn(`Mostrar mais ${Math.min(porPag, rows.length - vis.length)}`, { a: 'pagina', p: k, v: pag + 1, block: true }) : ''}<p class="pe-lista">${vis.length} de ${rows.length}${soma ? ' · total ' + soma : ''}</p>`;
  const ocultas = S().colunas[k] || [], cols = o.cols.map((c, i) => ({ ...c, i })).filter(c => !ocultas.includes(c.i));
  const ids = vis.map(r => r.id), todos = o.select && ids.every(id => sel.includes(id)), ord = S().ordem[k];
  const th = c => { const on = ord?.i === c.i; return `<th scope="col" class="${c.r ? 'r' : ''}"${c.w ? ` style="width:${c.w}"` : ''}${c.s ? ` aria-sort="${on ? (ord.dir > 0 ? 'ascending' : 'descending') : 'none'}"` : ''}>${c.s ? `<button type="button" class="ord${on ? ' on' : ''}" data-a="ordenar" data-p="${k}" data-v="${c.i}">${c.h}<span aria-hidden="true">${on ? (ord.dir > 0 ? '↑' : '↓') : '↕'}</span></button>` : c.h}</th>`; };
  SP.menus['cols:' + k] = o.cols.map((c, i) => c.h && !c.fixa && i > 0 ? { label: c.h, a: 'coluna', p: k, v: i, marcado: !ocultas.includes(i) } : null).filter(Boolean);
  return barra + `<div class="tab-w"><table class="tb${S().densidade === 'compacta' ? ' compacta' : ''}"><thead><tr>${o.select ? `<th class="c0">${SP.check(todos, 'selTodos', o.select, ids.join(','), '', false, 'Selecionar todos desta página')}</th>` : ''}${cols.map(th).join('')}${o.acoes ? '<th class="r"><span class="so-leitor">Ações</span></th>' : ''}</tr></thead><tbody>${vis.map(r => `<tr class="${sel.includes(r.id) ? 'sel ' : ''}${S().peek?.id === r.id ? 'ativo ' : ''}${o.cls?.(r) || ''}"${abrir(r)}>${o.select ? `<td class="c0">${SP.check(sel.includes(r.id), 'sel', o.select, r.id)}</td>` : ''}${cols.map(c => `<td class="${c.r ? 'r' : ''}">${c.c(r)}</td>`).join('')}${o.acoes ? `<td class="r">${celAcoes(o, k, r)}</td>` : ''}</tr>`).join('')}</tbody></table>
    <footer class="tab-pe"><span>${pag * porPag + 1}–${pag * porPag + vis.length} de ${rows.length}${soma ? ` · total <b>${soma}</b>` : ''}</span><span class="esp"></span>${SP.menus['cols:' + k].length ? `<button type="button" class="btn quiet sm" data-a="linhaMenu" data-p="cols:${k}" aria-haspopup="menu">${I('sliders', 15)}<span>Colunas${ocultas.length ? ' · ' + ocultas.length + ' ocultas' : ''}</span></button>` : ''}${SP.btn(S().densidade === 'compacta' ? 'Confortável' : 'Compacta', { a: 'densidade', sm: true, kind: 'quiet', icon: 'menu' })}${paginas > 1 ? SP.btn('', { a: 'pagina', p: k, v: pag - 1, sm: true, icon: 'back', title: 'Página anterior', disabled: pag === 0 }) + SP.btn('', { a: 'pagina', p: k, v: pag + 1, sm: true, icon: 'next', title: 'Próxima página', disabled: pag >= paginas - 1 }) : ''}</footer></div>`;
};
SP.duas = (a, b) => `<b class="l1">${a}</b>${b ? `<small class="l2">${b}</small>` : ''}`;
SP.regLinha = (a, b, c, d) => `<div class="reg-t"><b>${a}</b><strong>${b}</strong></div><div class="reg-s">${c}</div>${d ? `<div class="reg-p">${d}</div>` : ''}`;

/* ---------- formulários ligados ao rascunho ---------- */
SP.draft = (ctx, key, fabrica) => { if (ctx.preview) return fabrica(); const slot = ctx.slot || 'draft'; if (!S()[slot] || S()[slot].key !== key) { const v = fabrica(); S()[slot] = { key, v, orig: JSON.stringify(v) }; } return S()[slot].v; };
SP.rascunho = el => el.closest('.modal') ? S().mdraft : S().draft;
SP.ler = (o, path) => path.split('.').reduce((x, k) => x?.[k], o);
SP.campo = (d, path, label, o = {}) => {
  const mask = o.mask !== undefined ? o.mask : o.ro || o.options ? '' : SP.mascaraDe(path), id = 'f-' + path.replace(/\W/g, '-');
  if (!o.ro && !SP.somentePreview) SP.regras[path] = { label, req: !!o.req, mask, min: o.min };
  const erro = !o.ro && S().erros[path];
  const tipo = o.type || { email: 'email', tel: 'tel' }[mask];
  const attrs = `data-f="${path}"${o.ro ? '' : ` id="${id}"`}${o.money ? ' data-money inputmode="decimal"' : ''}${SP.attrsMask(mask)}${o.req ? ' required' : ''}${erro ? ` aria-invalid="true" aria-describedby="${id}-e"` : ''}`;
  const valor = o.money ? SP.dinheiro(SP.ler(d, path)) : mask ? SP.mascarar(mask, SP.ler(d, path)) : SP.ler(d, path);
  return `<label class="f${o.span ? ' s' + o.span : ''}${erro ? ' com-erro' : ''}"><span>${label}${o.req ? ' <b aria-hidden="true">*</b>' : ''}</span>${entrada(attrs, valor, { ...o, type: tipo, ph: o.ph || SP.exemplo(mask) })}${erro ? SP.erroHtml(id, erro) : ''}${o.hint ? `<small>${o.hint}</small>` : ''}</label>`;
};
SP.grade = (campos, n = 3) => `<div class="grade g${n}">${campos}</div>`;
SP.sec = (key, titulo, body, aberto = true, resumo = '') => { const a = S().expand[key] ?? aberto; return `<details class="sec" data-det="${key}"${a ? ' open' : ''}><summary><h3>${titulo}</h3><small>${resumo}</small>${I('down', 16)}</summary><div class="sec-b">${body}</div></details>`; };
SP.anexos = (lista, a, p, ro) => `<div class="anexos">${(lista || []).map((n, i) => `<span class="anexo">${I('clip', 14)}<button type="button" data-a="abrirAnexo" data-v="${e(n)}">${e(n)}</button>${ro ? '' : `<button type="button" aria-label="Remover ${e(n)}" data-a="${a}Rm" data-p="${p}" data-v="${i}">${I('x', 13)}</button>`}</span>`).join('')}${ro ? (lista?.length ? '' : '<span class="mute">Nenhum anexo.</span>') : `<label class="btn ghost sm">${I('upload', 15)}<span>Adicionar arquivo</span><input type="file" hidden data-file="${a}" data-p="${p || ''}" multiple></label>`}</div>`;

/* ---------- linha do tempo / recibos ---------- */
SP.linha = (itens) => itens.length ? `<ol class="linha">${itens.map(x => `<li class="${x.tom || ''}"><i>${I(x.icon || 'check', 13)}</i><div><b>${x.titulo}</b><small>${x.sub || ''}</small></div>${x.acao || ''}</li>`).join('')}</ol>` : `<p class="mute pad">Sem registros.</p>`;
SP.recibo = a => ({ titulo: e(a.txt), sub: `${SP.quando(a.em)} · ${e(a.por)}${a.regra && SP.by('regras', a.regra) ? ' · regra “' + e(SP.by('regras', a.regra).nome) + '”' : ''}`, icon: a.tipo === 'auto' ? 'bolt' : a.tipo === 'pessoa' ? 'user' : 'alert', tom: a.tipo, acao: a.ref ? SP.btn('', { icon: 'next', title: 'Abrir', a: 'irRef', p: a.ref[0], v: a.ref[1], kind: 'quiet', sm: true }) : '' });
SP.passos = (passos, atual) => `<ol class="passos">${passos.map((p, i) => `<li class="${i < atual ? 'feito' : i === atual ? 'agora' : ''}"><i>${i < atual ? I('check', 13) : i + 1}</i><span>${p}</span></li>`).join('')}</ol>`;

/* ---------- gráficos (paleta validada; previsto tracejado + legenda + tabela) ---------- */
const ticks = max => { const passo = [1, 2, 2.5, 5, 10].map(m => m * 10 ** Math.floor(Math.log10(max / 4))).find(s => max / s <= 5) || max / 4; const t = []; for (let v = 0; v <= max + passo * .99; v += passo) t.push(v); return t; };
const eixoK = v => v >= 1000 ? SP.num(v / 1000) + 'k' : SP.num(v);
SP.grafLinha = (ctx, rotulos, series) => {
  const W = ctx.m ? 340 : 860, H = ctx.m ? 210 : 280, L = 36, R = ctx.m ? 8 : 62, T = 10, B = 24;
  const tk = ticks(Math.max(...series.flatMap(s => s.dados))), max = tk[tk.length - 1];
  const x = i => L + i * (W - L - R) / (rotulos.length - 1), y = v => T + (H - T - B) * (1 - v / max);
  const grade = tk.map(v => `<line class="gr" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L - 6}" y="${y(v) + 3.5}" text-anchor="end">${eixoK(v)}</text>`).join('');
  const eixo = rotulos.map((r, i) => (!ctx.m || i % 2 === 1) ? `<text class="ax" x="${x(i)}" y="${H - 6}" text-anchor="middle">${r}</text>` : '').join('');
  const linhas = series.map(s => `<polyline class="sr ${s.cls}" points="${s.dados.map((v, i) => x(i) + ',' + y(v)).join(' ')}"/>${s.dados.map((v, i) => i === s.dados.length - 1 ? `<circle class="pt ${s.cls}" cx="${x(i)}" cy="${y(v)}" r="4"/>` : '').join('')}`).join('');
  const fim = ctx.m ? '' : series.map((s, k) => { const v = s.dados.at(-1), outro = series[1 - k]?.dados.at(-1) ?? v; return `<text class="rot" x="${x(rotulos.length - 1) + 9}" y="${y(v) + (v >= outro ? -2 : 10)}">${eixoK(Math.round(v / 100) * 100)}</text>`; }).join('');
  const alvos = rotulos.map((r, i) => `<rect class="hit" x="${x(i) - (W - L - R) / (rotulos.length - 1) / 2}" y="${T}" width="${(W - L - R) / (rotulos.length - 1)}" height="${H - T - B}" data-tip="${e(r + '|' + series.map(s => s.nome + '|' + SP.brl(s.dados[i])).join('|'))}" data-x="${x(i) / W * 100}"/>`).join('');
  return `<figure class="graf"><div class="leg">${series.map(s => `<span><i class="${s.cls}"></i>${s.nome}</span>`).join('')}</div><div class="graf-w"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${e(series.map(s => s.nome).join(' e '))} por mês">${grade}${eixo}<line class="cross" y1="${T}" y2="${H - B}"/>${linhas}${fim}${alvos}</svg><div class="tip" hidden></div></div></figure>`;
};
SP.barrasH = (itens, fmt) => { const max = Math.max(...itens.map(i => i.v), 1); return `<div class="barras">${itens.map(i => `<div class="bh" title="${e(i.n)}: ${(fmt || SP.brl)(i.v)}"><span>${e(i.n)}</span><div><i style="width:${i.v / max * 100}%"></i></div><b>${(fmt || SP.brlk)(i.v)}</b></div>`).join('')}</div>`; };
SP.spark = (dados) => { const W = 120, H = 32, max = Math.max(...dados), min = Math.min(...dados); return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${dados.map((v, i) => i * (W - 6) / (dados.length - 1) + 3 + ',' + (3 + (H - 6) * (1 - (v - min) / (max - min || 1)))).join(' ')}"/></svg>`; };
SP.qr = (seed = 'pix') => { let h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7), r = ''; const N = 25; const canto = (x, y) => (x < 7 && y < 7) || (x > N - 8 && y < 7) || (x < 7 && y > N - 8); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { h = (h * 1103515245 + 12345) >>> 0; if (!canto(x, y) && (h >>> 16) % 2) r += `M${x} ${y}h1v1h-1z`; } const olho = (x, y) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`; return `<svg class="qr" viewBox="-1 -1 ${N + 2} ${N + 2}" role="img" aria-label="QR Code Pix ilustrativo"><path fill-rule="evenodd" d="${r}${olho(0, 0)}${olho(N - 7, 0)}${olho(0, N - 7)}"/></svg>`; };

/* ---------- marca do tenant ---------- */
SP.logo = (t = SP.tenant(), tema = S().tema, compacto) => {
  const img = tema === 'dark' ? (t.logoEscuro || t.logo) : t.logo;
  if (compacto) return t.icone ? `<img class="logo-ic" src="${t.icone}" alt="${e(t.nome)}">` : `<span class="logo-sq">${e(t.nome[0])}</span>`;
  return img ? `<img class="logo" src="${img}" alt="${e(t.nome)}">` : `<span class="logo-tx"><span class="logo-sq">${e(t.nome[0])}</span><b>${e(t.nome)}</b></span>`;
};
})();

/* ---------- registro de telas e cadastro genérico ---------- */
SP.screen = (key, o) => { SP.screens[key] = { key, ...o }; SP.order.push(key); };
/* cria a tela de formulário (novo/editar/excluir) de um cadastro simples */
SP.cadastro = c => SP.screen(c.key, {
  form: true, code: c.code, nome: c.nome, flow: c.flow, pai: c.lista, exemplo: c.exemplo, src: c.src, nota: c.nota, cad: c,
  render(ctx) {
    const reg = SP.by(c.col, ctx.id), novo = !reg;
    const d = SP.draft(ctx, c.key + ':' + (ctx.id || 'novo'), () => SP.clone(reg || c.novo));
    const campos = c.campos(d, ctx).map(([p, l, o]) => SP.campo(d, p, l, o || {})).join('');
    return { titulo: novo ? c.titulo[0] : c.titulo[1], sub: reg ? SP.esc(reg.nome) : '', voltar: c.lista,
      corpo: (c.antes ? c.antes(reg, ctx) : '') + SP.card(SP.grade(campos, ctx.m ? 1 : 3)) + (c.extra ? c.extra(d, ctx, reg) : '') + (c.depois && reg ? c.depois(reg, ctx) : ''),
      rodape: (novo ? '' : SP.btn('Excluir', { a: 'excluirCad', p: c.key, v: reg.id, kind: 'quiet', icon: 'trash' })) + SP.btn('Cancelar', { go: c.lista }) + SP.btn('Salvar', { a: 'salvarCad', p: c.key, v: reg?.id || 'novo', kind: 'primary', icon: 'check' }) };
  },
});
