/* notinhas.shop · protótipo v2.0 — telas T-xx
   Cada tela: metadados de rastreio (US / RN / REQ) + render() a partir do estado S. */
'use strict';

const FLOWS = [
  { id: 'e01', n: 'E01', title: 'Produtos e preços', desc: 'Achar o menor preço de um produto, com loja, data e distância ao lado.', steps: ['T-10', 'T-11', 'T-14', 'T-12', 'T-13', 'T-15'] },
  { id: 'e02', n: 'E02', title: 'Contribuir nota e EAN', desc: 'QR da NFC-e → ingestão → vínculo cooperativo do código de barras → foto do produto. Inclui duplicada e falha da SEFAZ.', steps: ['T-20', 'T-21', 'T-25', 'T-22', 'T-23', 'T-24', 'T-26', 'T-27'] },
  { id: 'e03', n: 'E03', title: 'Estabelecimentos', desc: 'Ranking das mais baratas no raio, mapa, vitrine com progresso de EAN e itens ainda sem código.', steps: ['T-31', 'T-32', 'T-33', 'T-34', 'T-30'] },
  { id: 'e04', n: 'E04', title: 'Listas, notas e gastos', desc: 'Várias listas cotadas numa loja só ou divididas entre lojas; histórico pessoal das notas e gastos.', steps: ['T-40', 'T-42', 'T-41', 'T-50', 'T-55', 'T-52'] },
  { id: 'e05', n: 'E05', title: 'Conta, pontos e privacidade', desc: 'Uso anônimo por fingerprint, conta opcional com merge, pontos por contribuição, gate suave e LGPD.', steps: ['T-51', 'T-53', 'T-54', 'T-02', 'T-03', 'T-04', 'T-05', 'T-56'] },
  { id: 'e06', n: 'E06', title: 'Estados do sistema', desc: 'O que a pessoa vê quando algo não está pronto: câmera negada, sem rede, busca vazia e carregamento.', steps: ['T-70', 'T-71', 'T-72', 'T-73'] },
  { id: 'adm', n: 'ADM', title: 'Backoffice (desktop)', desc: 'Operação do Beta: métricas, fila de notas com falha e moderação de EAN e preços.', steps: ['T-61', 'T-62', 'T-63'], desk: true },
];

const SCREENS = {};
const def = (id, meta, render) => { SCREENS[id] = { id, ...meta, render }; };

/* ============ E01 ============ */
/* destaques = menores preços / promoções: maior queda vs mediana primeiro */
function destaques() {
  return PRODUCTS.filter((p) => S.cat === 'todas' || p.cat === S.cat).map((p) => {
    const l = latestByStore(p.ean, 14); const b = bestOf(p.ean); const med = median(l.map((o) => o.price)) || b.price;
    return { p, b, med, off: (b.price - med) / med, hl: !!highlight(p.ean) };
  }).sort((a, b) => (b.hl - a.hl) || (a.off - b.off));
}
/* mais comprados: frequência nas notas (protótipo: observações × peso) */
const compras = (p) => OBS.filter((o) => o.ean === p.ean).length * 23 + (+p.ean.slice(-2) % 17);
function maisComprados() { return PRODUCTS.filter((p) => S.cat === 'todas' || p.cat === S.cat).sort((a, b) => compras(b) - compras(a)); }
function hcard(p, { tag, tagCls = 'meta', extra = '' } = {}) {
  const b = bestOf(p.ean); const s = storeById(b.store);
  const med = median(latestByStore(p.ean, 14).map((o) => o.price)) || b.price; const off = (b.price - med) / med;
  return `<article class="hcard" ${go('T-14', { ean: p.ean })}>
    <div class="hc-ph">${photo(p, 'hc')}${off < -0.005 ? `<span class="badge-off tnum">${pct(off)}</span>` : ''}<button class="hc-add" ${act('sheet-add', p.ean)} aria-label="Adicionar à lista">${ico('plus')}</button></div>
    ${tag ? `<span class="hc-tag ${tagCls}">${esc(tag)}</span>` : ''}
    <p class="pn">${esc(p.titulo)}</p>
    <p class="pp">${price(b.price, { menor: true })}</p>
    <p class="pm tnum">${extra || `${s.nome} · ${when(b.d)}${S.gps ? ' · ' + fmtKm(distOf(b.store)) : ''}`}</p>
  </article>`;
}
/* mais comprados: cards em lote, rolagem horizontal infinita (cicla a base do lab) */
function maisCards(from, k) {
  const base = maisComprados();
  return Array.from({ length: k }, (_, j) => { const r = from + j; const p = base[r % base.length]; return hcard(p, { tag: `${r + 1}º mais comprado`, extra: `${compras(p)} compras · ${storeById(bestOf(p.ean).store).nome}` }); }).join('');
}
function homeSections() {
  const secs = [{ id: 'promo', nome: 'Promoções', ico: 'down' }, { id: 'mais', nome: 'Mais comprados', ico: 'award' }];
  CATS.filter((c) => c.id !== 'todas' && PRODUCTS.some((p) => p.cat === c.id)).forEach((c) => secs.push({ id: c.id, nome: c.nome, ico: c.ico, cat: c }));
  return secs;
}
function railDots(n) { return `<div class="hdots">${Array.from({ length: n }, (_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</div>`; }
def('T-10', { name: 'Home · Produtos', us: ['US-02.01', 'US-02.04'], rn: ['RN-05', 'RN-11'], req: ['REQ-034', 'REQ-045', 'REQ-049', 'REQ-056'], notes: 'Cada seção ocupa a altura da tela: grade de 2 linhas de cards no tamanho normal, rolando na horizontal (≈2,5 colunas visíveis). Ordem: Promoções (destaques: maior queda vs mediana 14 d — RN-11) → Mais comprados (lateral infinita) → uma seção por categoria canônica. Arrastar para baixo encaixa na próxima seção; os chips do topo pulam entre seções e acompanham a rolagem. Só produtos com EAN (REQ-045). Mapa no ícone do topo.' }, () => {
  const secs = homeSections(); const ds = destaques();
  const promo = ds.map((d, i) => hcard(d.p, { tag: d.hl ? (d.off <= -0.15 ? 'promoção' : 'menor preço') : 'menor da região', tagCls: d.hl ? 'menor' : 'meta' })).join('');
  const sec = (x, i, inner, dots) => `<section class="hsec" data-sec="${i}"><div class="hsec-h"><h2>${x.nome}</h2><span class="meta">${x.id === 'promo' ? 'abaixo da mediana · 14 dias' : x.id === 'mais' ? 'em SJP · 30 dias' : x.cat ? PRODUCTS.filter((p) => p.cat === x.id).length + ' com código de barras' : ''}</span></div>
    <div class="hrail"${x.id === 'mais' ? ' data-inf="1"' : ''}>${inner}</div>${dots}</section>`;
  return `<div class="home-head">${brandbar().replace('<span class="sp"></span>', `<span class="sp"></span><button class="ib" ${go('T-15')} aria-label="Mapa de produtos">${ico('pin')}</button>`)}
  ${!S.online ? `<div class="banner warn">${ico('wifioff')}<span>Sem conexão · preços de há 2 h</span></div>` : ''}
  <button class="search" ${go('T-11')}>${ico('search')}<span>Buscar produto ou código de barras</span></button>
  <div class="chips" id="hchips">${secs.map((x, i) => `<button class="chip${i === (VT_LIVE ? S.homeSec : 0) ? ' on' : ''}" ${act('jump', i)}>${ico(x.ico)}${x.nome}</button>`).join('')}</div></div>
  <div class="body home">
  ${secs.map((x, i) => {
    if (x.id === 'promo') return sec(x, i, promo, railDots(Math.ceil(ds.length / 2)));
    if (x.id === 'mais') return sec(x, i, maisCards(0, 8), '<div class="hdots inf"><span class="meta">arraste para ver mais</span></div>');
    const ps = PRODUCTS.filter((p) => p.cat === x.id).sort((a, b) => bestOf(a.ean).price - bestOf(b.ean).price);
    return sec(x, i, ps.map((p, k) => hcard(p, { tag: p.sub })).join(''), railDots(Math.ceil(ps.length / 2)));
  }).join('')}
  </div>${tabbar('T-10')}`;
});

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function searchResults() {
  const q = S.q.trim();
  if (!q) {
    return `<div class="sec"><h2>Buscas recentes</h2></div><div class="chips wrap">${['coca 2l', 'monster', 'arroz camil', '7896004006277'].map((t) => `<button class="chip" ${act('q', t)}>${ico('history')}${t}</button>`).join('')}</div>
    <div class="sec"><h2>Mais buscados em SJP</h2></div>${PRODUCTS.slice(6, 10).map(resultRow).join('')}`;
  }
  if (/^\d{8,14}$/.test(q)) {
    const p = prodByEan(q);
    if (p) return `<p class="meta mb8">Busca por código de barras · correspondência exata</p>${resultRow(p)}`;
    return `<div class="empty sm">${ico('barcode')}<p><b>EAN ${q} ainda não está no índice.</b><br>${gtinValid(q) ? 'Código válido.' : 'Dígito verificador não confere.'} Ninguém vinculou esse código a uma nota.</p><button class="btn p sm" ${go('T-20')}>Depositar uma nota</button></div>`;
  }
  const t = norm(q);
  const hits = PRODUCTS.filter((p) => norm(p.titulo + ' ' + p.marca + ' ' + p.danfe).includes(t));
  if (S.sort === 'perto') hits.sort((a, b) => distOf(bestOf(a.ean).store) - distOf(bestOf(b.ean).store));
  else hits.sort((a, b) => bestOf(a.ean).price - bestOf(b.ean).price);
  const loose = [];
  Object.entries(NO_EAN).forEach(([sid, arr]) => arr.forEach(([cod, desc, v, d]) => { if (norm(desc).includes(t.split(' ')[0])) loose.push({ sid, cod, desc, v, d }); }));
  if (!hits.length && !loose.length) return `<div class="empty sm">${ico('search')}<p><b>Ninguém registrou “${esc(q)}” ainda.</b><br>Quando uma nota com esse produto entrar, o preço aparece aqui.</p><button class="btn p sm" ${go('T-20')}>Depositar uma nota</button></div>`;
  return `<p class="meta mb8 tnum">${hits.length} com EAN${loose.length ? ` · ${loose.length} só pela descrição` : ''}</p>${hits.map(resultRow).join('')}
  ${loose.length ? `<div class="sec"><h2>Sem código de barras</h2>${chip('confiança menor', 'warn')}</div>
  ${loose.slice(0, 4).map((l) => `<button class="row" ${go('T-34', { store: l.sid, cod: l.cod })}><div class="ph sm ph-empty">${ico('tag')}</div><div class="grow"><p class="b">${esc(humanize(l.desc))}</p><p class="meta">${storeById(l.sid).nome} · só nesta loja · ${when(l.d)}</p></div>${price(l.v)}</button>`).join('')}` : ''}`;
}
function resultRow(p) {
  const b = bestOf(p.ean);
  return `<button class="row" ${go('T-14', { ean: p.ean })}>${photo(p, 'sm')}<div class="grow"><p class="b">${esc(p.titulo)}</p><p class="meta tnum">${storeById(b.store).nome} · ${when(b.d)}${S.gps ? ' · ' + fmtKm(distOf(b.store)) : ''}</p></div>${price(b.price, { menor: true })}</button>`;
}
def('T-11', { name: 'Busca', us: ['US-02.02', 'US-02.03'], rn: ['RN-05'], req: ['REQ-039', 'REQ-045'], notes: 'Campo real: digite nome, marca ou EAN (8–14 dígitos, com checagem do dígito verificador). Itens sem EAN aparecem à parte com “confiança menor” (Q6). Ordenar por menor preço ou mais perto.' }, () => `
  <div class="body">
  <header class="top"><button class="ib" ${go('back')} aria-label="Voltar">${ico('back')}</button>
  <label class="search on grow">${ico('search')}<input data-input="q" value="${esc(S.q)}" placeholder="Produto, marca ou EAN" autocomplete="off" inputmode="search"></label></header>
  <div class="chips"><button class="chip${S.sort !== 'perto' ? ' on' : ''}" ${act('sort', 'preco')}>${ico('down')}Menor preço</button><button class="chip${S.sort === 'perto' ? ' on' : ''}" ${act('sort', 'perto')}>${ico('pin')}Mais perto</button><button class="chip" ${go('T-20')}>${ico('barcode')}Ler código</button></div>
  <div id="res">${searchResults()}</div></div>`);

def('T-14', { name: 'Detalhe do produto', us: ['US-02.04', 'US-02.06', 'US-04.01'], rn: ['RN-05', 'RN-08'], req: ['REQ-028', 'REQ-047', 'REQ-048'], notes: 'Ficha canônica (produtos_ean): título, marca, categoria e foto — não o texto cru da DANFE. Histórico (gráfico de linha) acima da comparação; “Perto de você” com mapa de preços por loja (como em Lojas) + 2 mais próximas. Preço > 14 dias recebe “desatualizado” (Q3). Adicionar à lista abre sheet com quantidade.' }, () => {
  const p = prodByEan(S.sel.ean); const l = latestByStore(p.ean); const b = bestOf(p.ean);
  const med = median(latestByStore(p.ean, 14).map((o) => o.price)); const cat = CATS.find((c) => c.id === p.cat);
  const hist = OBS.filter((o) => o.ean === p.ean).sort((a, x) => x.d - a.d);
  const pts = hist.map((o, i) => `${(i / Math.max(1, hist.length - 1)) * 100},${40 - ((o.price - 5) / 12) * 36}`);
  return `<div class="body ft">
  ${topbar('', { right: `<button class="ib" ${act('sheet', 'add')} aria-label="Adicionar à lista">${ico('list')}</button>` })}
  <div class="hero">${photo(p, 'xl')}</div>
  <h2 class="ptitle">${esc(p.titulo)}</h2>
  <p class="meta">${p.marca} · ${cat ? cat.nome : ''} › ${p.sub} · <span class="mono">EAN ${p.ean}</span></p>
  <div class="bestbox">
    <div><span class="chip menor">menor preço</span>${price(b.price, { menor: true, cls: 'xl' })}</div>
    <p><b>${storeById(b.store).nome}</b> · ${storeById(b.store).bairro} · ${when(b.d)} ${dateOf(b.d)}${S.gps ? ' · ' + fmtKm(distOf(b.store)) : ''}</p>
    <p class="meta tnum">mediana 14 dias ${brl(med)} · ${pct((b.price - med) / med)}</p>
  </div>
  <div class="sec"><h2>Histórico</h2><button class="lnk" ${go('T-13')}>Ampliar</button></div>
  <button class="card spark" ${go('T-13')}><svg viewBox="0 0 100 44" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts.join(' ')}"/></svg><span class="meta tnum">${hist.length} registros · de ${brl(hist[0].price)} a ${brl(hist[hist.length - 1].price)}</span></button>
  <div class="sec"><h2>Comparação</h2><button class="lnk" ${go('T-12')}>Registros</button></div>
  <div class="card list">${l.map((o, i) => `<button class="li" ${go('T-33', { store: o.store })}><div class="grow"><p class="b">${storeById(o.store).nome}</p><p class="meta">${when(o.d)} · NFC-e${S.gps ? ' · ' + fmtKm(distOf(o.store)) : ''} ${freshBadge(o.d)}</p></div>${price(o.price, { menor: i === 0 })}</button>`).join('')}</div>
  <div class="sec"><h2>Perto de você</h2><button class="lnk" ${go('T-30')}>Ver no mapa</button></div>
  <div class="mapbanner sm" ${go('T-30')}>${fmap(l.map((o) => ({ lat: storeById(o.store).lat, lng: storeById(o.store).lng, cls: 'price' + (o.price === b.price ? ' g' : ''), txt: brl(o.price).replace('R$ ', ''), label: storeById(o.store).nome })), { radius: Math.min(S.radius, 4) })}<span class="cap">${ico('expand')}${l.length} lojas com este produto</span></div>
  <div class="card list">${l.slice().sort((a, x) => distOf(a.store) - distOf(x.store)).slice(0, 2).map((o) => `<button class="li" ${go('T-30')}>${ico('pin')}<div class="grow"><p class="b">${storeById(o.store).nome}</p><p class="meta">${fmtKm(distOf(o.store))}</p></div>${price(o.price)}</button>`).join('')}</div>
  <details class="card ficha"><summary>Ficha do produto ${ico('next')}</summary>
    <dl><dt>Na nota</dt><dd class="mono">${esc(p.danfe)}</dd><dt>NCM</dt><dd class="mono">${p.ncm}</dd><dt>Categoria</dt><dd>${cat ? cat.nome : ''} › ${p.sub}</dd><dt>Fontes</dt><dd>${p.fontes.join(' · ')}</dd></dl></details>
  <p class="foot-note">Preço de balcão, das notas fiscais. Não é preço de delivery.</p>
  </div>
  <div class="footbar"><button class="btn p" ${act('sheet', 'add')}>${ico('plus')}Adicionar à lista</button></div>`;
});

def('T-12', { name: 'Últimos registros', us: ['US-02.04', 'US-02.07'], rn: ['RN-03', 'RN-05'], req: ['REQ-012'], notes: 'Cada registro é uma observação de NFC-e (loja + data + valor). Filtro de frescor 7/14/30 dias ou todos (US-02.07).' }, () => {
  const p = prodByEan(S.sel.ean);
  const rows = OBS.filter((o) => o.ean === p.ean && (!S.fresh || o.d <= S.fresh)).sort((a, b) => a.d - b.d);
  const min = Math.min(...rows.map((r) => r.price));
  return `<div class="body">${topbar('Registros', { sub: esc(p.titulo) })}
  <div class="chips">${[7, 14, 30, 0].map((f) => `<button class="chip${S.fresh === f ? ' on' : ''}" ${act('fresh', f)}>${f ? f + ' dias' : 'Todos'}</button>`).join('')}</div>
  <p class="meta mb8 tnum">${rows.length} registros · mais recentes primeiro</p>
  ${rows.length ? rows.map((o) => `<div class="row static${o.price === min ? ' hl' : ''}"><div class="grow"><p class="b">${storeById(o.store).nome}</p><p class="meta">${when(o.d)} · ${dateOf(o.d)} · NFC-e ${freshBadge(o.d)}</p></div>${price(o.price, { menor: o.price === min })}</div>`).join('') : `<div class="empty sm">${ico('clock')}<p>Nenhum registro nesse período.</p></div>`}
  </div>`;
});

def('T-13', { name: 'Histórico de preço', us: ['US-02.05'], rn: ['RN-05'], req: ['REQ-028'], notes: 'Cada ponto = uma observação de NFC-e. Linha contínua = menor preço do dia; tracejada = mediana 14 d. Toque num ponto para ver loja e data.' }, () => {
  const p = prodByEan(S.sel.ean);
  const h = OBS.filter((o) => o.ean === p.ean).sort((a, b) => b.d - a.d);
  const maxD = Math.max(...h.map((o) => o.d), 7), lo = Math.min(...h.map((o) => o.price)) - 1, hi = Math.max(...h.map((o) => o.price)) + 1;
  const X = (d) => 8 + ((maxD - d) / maxD) * 84, Y = (v) => 8 + (1 - (v - lo) / (hi - lo)) * 74;
  const med = median(latestByStore(p.ean, 14).map((o) => o.price));
  const sel = S.histPoint !== null && h[S.histPoint] ? h[S.histPoint] : null;
  return `<div class="body">${topbar('Histórico', { sub: esc(p.titulo) })}
  <div class="card chart"><div class="plot">
    <svg viewBox="0 0 100 90" preserveAspectRatio="none" aria-label="Histórico de preço">
      <line x1="4" x2="96" y1="${Y(med)}" y2="${Y(med)}" class="medline"/>
      <polyline points="${[...new Set(h.map((o) => o.d))].sort((x, y) => y - x).map((d) => X(d) + ',' + Y(Math.min(...h.filter((o) => o.d === d).map((o) => o.price)))).join(' ')}" class="line"/>
    </svg>
    ${h.map((o, i) => `<button class="dot${o.price === Math.min(...h.map((x) => x.price)) ? ' low' : ''}${S.histPoint === i ? ' on' : ''}" style="left:${X(o.d)}%;top:${(Y(o.price) / 90) * 100}%" ${act('hp', i)} aria-label="${brl(o.price)} ${storeById(o.store).nome}"></button>`).join('')}
    ${sel ? `<div class="tip tnum" style="left:${Math.min(70, Math.max(2, X(sel.d) - 14))}%"><b>${brl(sel.price)}</b><br>${storeById(sel.store).nome} · ${dateOf(sel.d)}</div>` : ''}
  </div></div>
  <div class="axis meta tnum"><span>${dateOf(maxD)}</span><span>hoje</span></div>
  <div class="kpis"><div class="kpi"><span>Menor no período</span>${price(Math.min(...h.map((o) => o.price)), { menor: true })}</div><div class="kpi"><span>Mediana 14 d</span><b class="tnum">${brl(med)}</b></div><div class="kpi"><span>Registros</span><b class="tnum">${h.length}</b></div></div>
  </div>`;
});

def('T-15', { name: 'Mapa · produtos', us: ['US-02.01', 'US-03.01'], rn: ['RN-09'], req: ['REQ-013'], notes: 'Pins = produtos (vários por local). Toque num pin para ver o card do produto. Âncora: GPS ou bairro escolhido (RN-09).' }, () => {
  const prods = PRODUCTS.filter((p) => S.cat === 'todas' || p.cat === S.cat);
  const sel = prodByEan(S.mapSel || prods[0].ean); const sb = bestOf(sel.ean);
  const pins = prods.map((p, i) => { const s = storeById(bestOf(p.ean).store); return { lat: s.lat + ((i % 3) - 1) * 0.0012, lng: s.lng + ((i % 2) ? 0.0014 : -0.001), cls: 'price' + (p.ean === sel.ean ? ' on' : ''), txt: brl(bestOf(p.ean).price).replace('R$ ', ''), attrs: act('mapsel', p.ean), label: p.titulo }; });
  return `<div class="body flush">${fmap(pins, { cls: 'full' })}
  <div class="floattop"><button class="ib glassb" ${go('back')} aria-label="Voltar">${ico('back')}</button><button class="search glassb grow" ${go('T-11')}>${ico('search')}<span>Buscar no mapa</span></button></div>
  <button class="mapcard" ${go('T-14', { ean: sel.ean })}>${photo(sel, 'sm')}<div class="grow"><p class="b">${esc(sel.titulo)}</p><p class="meta">${storeById(sb.store).nome} · ${when(sb.d)} · ${fmtKm(distOf(sb.store))}</p></div>${price(sb.price, { menor: true })}</button>
  </div>`;
});

/* ============ E02 ============ */
def('T-20', { name: 'Scan QR · câmera', us: ['US-01.06'], rn: ['RN-01', 'RN-07'], req: ['REQ-001', 'REQ-002'], notes: 'Viewport escuro (única tela dark). Câmera exige HTTPS (RN-07). “Ler QR” simula a detecção. Alternativas: foto do cupom ou colar o link. Cenário “câmera negada” leva a T-70.' }, () => `
  <div class="body flush dark">
  <div class="floattop"><button class="ib glass" ${go('back')} aria-label="Fechar">${ico('x')}</button><span class="sp"></span><button class="ib glass${S.flash ? ' on' : ''}" ${act('flash')} aria-label="Lanterna">${ico('flash')}</button></div>
  <div class="cam"><div class="vf qr"><i></i><i></i><i></i><i></i><span class="laser"></span></div><p>Aponte para o QR do cupom fiscal</p></div>
  <div class="camfoot">
    <button class="btn p" ${act('scan')}>${ico('qr')}Ler QR</button>
    <div class="duo"><button class="btn light" ${go('T-21')}>${ico('image')}Foto do cupom</button><button class="btn light" ${act('sheet', 'url')}>${ico('link')}Colar link</button></div>
  </div></div>`);

def('T-21', { name: 'Scan QR · foto', us: ['US-01.07'], rn: ['RN-01'], req: ['REQ-030'], notes: 'Decodifica QR de imagem estática (galeria ou foto nova). Útil com reflexo, papel amassado ou câmera fraca.' }, () => `
  <div class="body">${topbar('Foto do cupom')}
  <p class="lede">Escolha uma foto em que o QR apareça inteiro.</p>
  <div class="pickgrid">${[0, 1, 2, 3, 4, 5].map((i) => `<button class="rcpt${S.pick === i ? ' on' : ''}" ${act('pick', i)} aria-label="Imagem ${i + 1}"><span class="lines"></span><span class="qrmini"></span>${S.pick === i ? `<span class="okmark">${ico('check')}</span>` : ''}</button>`).join('')}</div>
  </div>
  <div class="footbar"><button class="btn p" ${act('decode')} ${S.pick === null ? 'disabled' : ''}>${ico('qr')}Ler QR da foto</button><button class="btn s" ${act('toast', 'Câmera aberta para nova foto')}>${ico('camera')}Tirar foto</button></div>`);

const PROC = ['Link da NFC-e do Paraná', 'Consulta na SEFAZ PR', 'Itens extraídos · CPF descartado', 'Nota nova (chave de acesso)', 'Índice de preços atualizado'];
def('T-25', { name: 'Processando nota', novo: true, us: ['US-01.06', 'US-01.08'], rn: ['RN-01', 'RN-03', 'RN-06', 'RN-15'], req: ['REQ-003', 'REQ-004'], notes: 'Novo no v2. Progresso real da ingestão em 5 etapas, com skeleton dos itens (sem spinner). Timeout de 10 s na SEFAZ (RN-15). O resultado segue o cenário escolhido no painel: sucesso, duplicada, timeout ou URL inválida.' }, () => {
  const k = VT_LIVE ? S.proc : 2;
  return `<div class="body">${topbar('Lendo sua nota', { back: false })}
  <ol class="steps">${PROC.map((t, i) => `<li class="${i < k ? 'done' : i === k ? 'now' : ''}"><span class="mk">${i < k ? ico('check') : ''}</span>${t}</li>`).join('')}</ol>
  <div class="card pad">${skel(14, '60%')}${skel(10, '40%')}<div class="hr"></div>${[1, 2, 3, 4].map(() => `<div class="skrow">${skel(10, '58%')}${skel(10, '18%')}</div>`).join('')}</div>
  <p class="meta center">Leva até 10 segundos</p></div>`;
});

function scannedNote() { return S.scanned; }
def('T-22', { name: 'Nota ingerida', us: ['US-01.06', 'US-01.10'], rn: ['RN-02', 'RN-04'], req: ['REQ-046', 'REQ-052'], notes: 'Sucesso + progresso de EAN da nota (REQ-046). A NFC-e não traz código de barras (RN-02): cada item pendente tem “Vincular”. +10 pontos pela nota (conta) ou pendentes no navegador (visitante).' }, () => {
  const n = scannedNote(); const s = storeById(n.store);
  const done = n.itens.filter((i) => i.ean).length; const total = n.itens.reduce((a, i) => a + i.v * i.qtd, 0);
  const pend = n.itens.filter((i) => !i.ean);
  return `<div class="body ft">${topbar('Nota recebida', { back: false, right: `<button class="ib" ${go('T-10')} aria-label="Fechar">${ico('x')}</button>` })}
  <div class="okhead"><span class="okbig">${ico('check')}</span><div><p class="b">${s.nome} · ${s.bairro}</p><p class="meta tnum">hoje ${n.hora} · nº ${n.numero} · ${n.itens.length} itens · ${brl(total)}</p></div></div>
  <div class="pts-earned">${ico('award')}<span>${S.session === 'conta' ? '<b>+10 pontos</b> pela nota' : '<b>+10 pontos</b> guardados neste navegador'}</span>${S.session !== 'conta' ? `<button class="lnk" ${go('T-02')}>Criar conta</button>` : ''}</div>
  ${progress(done, n.itens.length)}
  <div class="sec"><h2>Itens</h2><span>${pend.length ? pend.length + ' sem código de barras' : 'todos com EAN'}</span></div>
  <div class="card list">${n.itens.map((it) => { const p = it.ean && prodByEan(it.ean); return `<div class="li">${p ? photo(p, 'xs') : `<div class="ph xs ph-empty">${ico('tag')}</div>`}<div class="grow"><p class="b">${esc(p ? p.titulo : it.ean ? it.titulo || humanize(it.desc) : humanize(it.desc))}</p><p class="meta tnum">${it.qtd} × ${brl(it.v)} · cód. ${it.cod} ${originChip(it.origem)}</p></div>${it.ean ? `<span class="okdot" aria-label="Com EAN">${ico('check')}</span>` : `<button class="btn s xs" ${go('T-23', { cod: it.cod })}>Vincular</button>`}</div>`; }).join('')}</div>
  </div>
  <div class="footbar">${pend.length ? `<button class="btn p" ${go('T-23', { cod: pend[0].cod })}>${ico('barcode')}Vincular ${pend.length} pendente${pend.length > 1 ? 's' : ''}</button>` : `<button class="btn p" ${go('T-10')}>Ver preços</button>`}<button class="btn gh" ${go('T-55', { note: 'n-scan' })}>Ver em Minhas notas</button></div>`;
});

def('T-23', { name: 'Vincular EAN', us: ['US-01.10'], rn: ['RN-02', 'RN-12'], req: ['REQ-011', 'REQ-031', 'REQ-039', 'REQ-043'], notes: 'Câmera já aberta. Três caminhos, com origem gravada: sugestão pela descrição (SI5/SERP, toque vincula), leitura do código (scan) ou digitação com validação do dígito verificador. UPSERT em (empresa, cód. unidade) (RN-12). +5 pontos.' }, () => {
  const n = scannedNote(); const it = n.itens.find((i) => i.cod === S.sel.cod) || n.itens.find((i) => !i.ean) || n.itens[0];
  const sug = suggestFor(it.desc); const ok = gtinValid(S.eanIn);
  return `<div class="body flush">
  <div class="cam short dark"><div class="floattop"><button class="ib glass" ${go('back')} aria-label="Voltar">${ico('back')}</button><span class="sp"></span><span class="pillcam">${ico('camera')}Câmera aberta</span></div>
    <div class="vf bar"><i></i><i></i><i></i><i></i><span class="laser"></span></div>
    <button class="btn light sm simul" ${act('link', 'scan')}>${ico('barcode')}Ler código de barras</button></div>
  <div class="panel">
    <p class="meta">Item da nota · ${storeById(n.store).nome} · cód. ${it.cod}</p>
    <p class="b lg">${esc(it.desc)}</p>
    <div class="sec"><h2>Sugestões pela descrição</h2><span>toque para vincular</span></div>
    ${sug.map((g, i) => `<button class="sug" ${act('link', 'sug:' + i)}>${g.foto ? `<div class="ph sm"><img src="${g.foto}" alt=""></div>` : `<div class="ph sm ph-empty">${ico('box')}</div>`}<div class="grow"><p class="b">${esc(g.titulo)}</p><p class="meta mono">${g.ean} · ${g.fonte}${g.exemplo ? ' · exemplo' : ''}</p><span class="score"><i style="width:${g.score * 100}%"></i></span></div><span class="tnum meta">${Math.round(g.score * 100)}%</span></button>`).join('')}
    <div class="sec"><h2>Ou digite o código</h2></div>
    <div class="field${S.eanIn ? (ok ? ' ok' : ' bad') : ''}"><span>${ico('keyboard')}</span><input data-input="eanIn" value="${esc(S.eanIn)}" inputmode="numeric" maxlength="14" placeholder="EAN de 8 a 14 dígitos" class="mono"></div>
    <p class="hint" id="eanhint">${S.eanIn ? (ok ? 'Código válido' : 'Dígito verificador não confere') : 'Fica no verso da embalagem'}</p>
    <button class="btn s" ${act('link', 'manual')} ${ok ? '' : 'disabled'} id="eansave">Salvar código</button>
  </div></div>`;
});

def('T-24', { name: 'Escolher foto', us: ['US-01.11'], rn: [], req: ['REQ-032', 'REQ-040'], notes: 'Candidatas reais buscadas pelo EAN (Open Food Facts, UPCitemdb, Google Imagens) e salvas localmente em ean-fotos/. A escolhida vira a foto da ficha canônica para todas as lojas.' }, () => {
  const src = ['Open Food Facts', 'Open Food Facts', 'UPCitemdb', 'Google Imagens', 'Google Imagens', 'Google Imagens'];
  return `<div class="body ft">${topbar('Foto do produto', { sub: 'Batata Pringles Original 104g' })}
  <p class="lede">Escolha a foto que mais parece com o produto da prateleira.</p>
  <div class="photogrid">${[1, 2, 3, 4, 5, 6].map((i) => `<button class="cand${S.photo === i ? ' on' : ''}" ${act('photo', i)}><img src="media/cand/pringles-${i}.jpg" alt=""><span>${src[i - 1]}</span>${S.photo === i ? `<span class="okmark">${ico('check')}</span>` : ''}</button>`).join('')}</div>
  </div><div class="footbar"><button class="btn p" ${act('photo-ok')}>Usar esta foto</button><button class="btn gh" ${go('T-22')}>Pular</button></div>`;
});

def('T-26', { name: 'Nota duplicada', novo: true, us: ['US-01.08'], rn: ['RN-03'], req: ['REQ-005', 'REQ-051'], notes: 'Novo no v2. Mesma chave de acesso = nenhuma observação nova no índice (RN-03). A nota ainda entra no histórico pessoal (REQ-051). Sem pontos.' }, () => {
  const s = storeById('formosa');
  return `<div class="body ft center-v">${topbar('', { back: false, right: `<button class="ib" ${go('T-10')} aria-label="Fechar">${ico('x')}</button>` })}
  <div class="state"><span class="sticon info">${ico('receipt')}</span><h2>Essa nota já está no notinhas</h2>
  <p>${s.nome} · ${dateOf(4)} · nº 889120. Os preços dela já contam no índice, nada foi duplicado.</p>
  <div class="card pad left"><p class="meta">Chave de acesso</p><p class="mono sm">4126 1161 0802 6200 0106 6500 1000 8891 2010 0442 1937</p></div>
  <p class="meta">Ela também está em Minhas notas.</p></div>
  </div><div class="footbar"><button class="btn p" ${go('T-20')}>${ico('qr')}Ler outra nota</button><button class="btn gh" ${go('T-55', { note: 'n-formosa' })}>Ver nota</button></div>`;
});

def('T-27', { name: 'Falha na leitura', novo: true, us: ['US-01.06', 'US-ADM.01'], rn: ['RN-01', 'RN-15'], req: ['REQ-003'], notes: 'Novo no v2. Duas variantes pelo cenário: SEFAZ sem resposta em 10 s (link guardado, nova tentativa automática, vai para a fila do ADM) ou link que não é NFC-e do Paraná (RN-01).' }, () => {
  const inv = S.scanResult === 'invalid';
  return `<div class="body ft center-v">${topbar('', { right: `<button class="ib" ${go('T-10')} aria-label="Fechar">${ico('x')}</button>` })}
  <div class="state">${inv ? `<span class="sticon err">${ico('link')}</span><h2>Esse QR não é de uma nota do Paraná</h2>
  <p>Aceitamos a consulta pública da NFC-e da Fazenda PR. Confira se é o QR do cupom fiscal, não de pagamento.</p>
  <div class="card pad left"><p class="meta">Link lido</p><p class="mono sm break">${esc(S.urlIn || 'https://pix.exemplo.com/qr/9f2c…')}</p></div>`
    : `<span class="sticon warn">${ico('clock')}</span><h2>A SEFAZ PR não respondeu</h2>
  <p>A consulta passou de 10 segundos. Guardamos o link e tentamos de novo em 5 minutos. Avisamos quando a nota entrar.</p>
  <div class="card pad left row0">${ico('refresh')}<div><p class="b">1 nota na fila</p><p class="meta">Jupiter · hoje 09:41</p></div></div>`}
  </div></div><div class="footbar">${inv ? `<button class="btn p" ${go('T-20')}>${ico('qr')}Ler de novo</button><button class="btn gh" ${go('T-21')}>Usar foto do cupom</button>` : `<button class="btn p" ${act('retry')}>${ico('refresh')}Tentar agora</button><button class="btn gh" ${go('T-10')}>Voltar aos preços</button>`}</div>`;
});

/* ============ E03 ============ */
def('T-31', { name: 'Lojas · mais baratas', us: ['US-03.02'], rn: ['RN-09', 'RN-10'], req: ['REQ-035', 'REQ-046'], notes: 'Ranking por mediana relativa (RN-10) calculado ao vivo a partir das observações: muda com o raio. Cada linha: “Nª mais barata · Mª mais cara”, índice vs mediana e progresso de EAN (REQ-046). Lojas com poucos EANs comparáveis: “dados insuficientes”.' }, () => {
  const rk = storeRanking(S.radius).filter((r) => !S.qs || norm(r.s.nome).includes(norm(S.qs)));
  const pins = rk.map((r) => ({ lat: r.s.lat, lng: r.s.lng, cls: 'store' + (r.pos === 1 ? ' g' : ''), txt: r.pos || '·', label: r.s.nome }));
  return `<div class="body tb">${brandbar()}
  <div class="h1row"><h1 class="h1">Mais baratas</h1><span class="meta">${S.gps ? 'perto de você' : ANCHOR.label}</span></div>
  <label class="search">${ico('search')}<input data-input="qs" value="${esc(S.qs)}" placeholder="Buscar loja"></label>
  <div class="chips">${[1, 3, 5, 10, 30].map((r) => `<button class="chip${S.radius === r ? ' on' : ''}" ${act('radius', r)}>${r} km</button>`).join('')}</div>
  <div class="mapbanner sm" ${go('T-32')}>${fmap(pins, { radius: Math.min(S.radius, 4) })}<span class="cap">${ico('expand')}${rk.length} lojas no raio</span></div>
  <div id="rk">${rk.map(rankRow).join('') || `<div class="empty sm">${ico('store')}<p>Nenhuma loja nesse raio. Aumente a distância.</p></div>`}</div>
  </div>${tabbar('T-31')}`;
});
function rankRow(r) {
  const s = r.s;
  return `<button class="rrow" ${go('T-33', { store: s.id })}><span class="pos tnum${r.pos === 1 ? ' g' : ''}">${r.pos || '–'}</span>
  <div class="grow"><p class="b">${s.nome}</p><p class="meta">${s.bairro} · ${fmtKm(r.dist)}</p>
  ${r.pos ? `<p class="rk tnum">${r.pos}ª mais barata · ${r.of - r.pos + 1}ª mais cara da região</p>` : `<p class="rk">${chip('dados insuficientes', 'meta')}</p>`}
  ${(() => { const t = storeStats(s); return progress(t.ean, t.itens, { notas: t.notas, compact: true }); })()}</div>
  ${r.idx !== null ? `<span class="idx tnum ${r.idx < 0 ? 'g' : 'w'}">${pct(r.idx)}<small>vs mediana</small></span>` : ''}</button>`;
}

def('T-32', { name: 'Mapa · lojas', us: ['US-03.03'], rn: ['RN-09'], req: ['REQ-013', 'REQ-046'], notes: '1 pin por estabelecimento (geocode Nominatim em cache). Popup com posição no ranking e progresso de EAN.' }, () => {
  const rk = storeRanking(30); const sel = rk.find((r) => r.s.id === (S.mapStore || 'atacadao')) || rk[0];
  const pins = rk.map((r) => ({ lat: r.s.lat, lng: r.s.lng, cls: 'store' + (r.s.id === sel.s.id ? ' on' : '') + (r.pos === 1 ? ' g' : ''), txt: r.pos || '·', attrs: act('mapstore', r.s.id), label: r.s.nome }));
  return `<div class="body flush">${fmap(pins, { cls: 'full' })}
  <div class="floattop"><button class="ib glassb" ${go('back')} aria-label="Voltar">${ico('back')}</button><span class="glassb pill">${ico('pin')}${S.gps ? 'Perto de você' : 'Centro, SJP'}</span></div>
  <div class="mapcard col"><div class="flex"><div class="grow"><p class="b">${sel.s.nome}</p><p class="meta">${sel.s.bairro} · ${fmtKm(sel.dist)}${sel.pos ? ` · ${sel.pos}ª mais barata` : ''}</p></div>${sel.idx !== null ? `<span class="idx tnum ${sel.idx < 0 ? 'g' : 'w'}">${pct(sel.idx)}</span>` : ''}</div>
  ${(() => { const t = storeStats(sel.s); return progress(t.ean, t.itens, { notas: t.notas, compact: true }); })()}<button class="btn p sm" ${go('T-33', { store: sel.s.id })}>Ver vitrine</button></div></div>`;
});

def('T-33', { name: 'Vitrine da loja', us: ['US-03.04', 'US-03.06'], rn: ['RN-05', 'RN-12'], req: ['REQ-018', 'REQ-031', 'REQ-043', 'REQ-046'], notes: 'Cabeçalho com ranking e progresso (notas · itens · EAN). Aba “Com EAN” em grade; aba “Sem EAN” com a descrição crua da DANFE e sugestão inline: toque vincula (origem = sugestão).' }, () => {
  const s = storeById(S.sel.store); const rk = storeRanking(30).find((r) => r.s.id === s.id);
  const withE = PRODUCTS.map((p) => ({ p, o: latestByStore(p.ean).find((o) => o.store === s.id), b: bestOf(p.ean) })).filter((x) => x.o);
  const noE = (NO_EAN[s.id] || []).filter(([cod]) => !S.linkedVitrine.includes(s.id + cod));
  return `<div class="body">${topbar(s.nome, { sub: `${s.bairro} · ${fmtKm(distOf(s.id))}` })}
  <div class="storehead">${rk && rk.pos ? `<span class="chip ${rk.idx < 0 ? 'menor' : 'meta'} tnum">${rk.pos}ª mais barata · ${pct(rk.idx)} vs mediana</span>` : chip('dados insuficientes', 'meta')}
  <p class="meta">${s.razao}<br>${s.end}</p>${(() => { const t = storeStats(s); return progress(t.ean, t.itens, { notas: t.notas }); })()}</div>
  <div class="seg" role="tablist"><button class="${S.vtab === 'ean' ? 'on' : ''}" ${act('vtab', 'ean')}>Com EAN <span class="tnum">${withE.length}</span></button><button class="${S.vtab === 'sem' ? 'on' : ''}" ${act('vtab', 'sem')}>Sem EAN <span class="tnum">${noE.length}</span></button></div>
  ${S.vtab === 'ean' ? (withE.length ? `<div class="pgrid">${withE.map(({ p, o, b }) => `<article class="pc" ${go('T-14', { ean: p.ean })}>${photo(p)}<p class="pn">${esc(p.titulo)}</p><p class="pp">${price(o.price, { menor: o.store === b.store })}</p><p class="pm">${when(o.d)}${o.store === b.store ? ' · menor da região' : ''}</p></article>`).join('')}</div>` : `<div class="empty sm">${ico('barcode')}<p>Nenhum item desta loja tem código de barras ainda.</p></div>`)
    : (noE.length ? noE.map(([cod, desc, v, d]) => { const g = suggestFor(desc)[0]; return `<div class="nrow"><button class="grow left" ${go('T-34', { store: s.id, cod })}><p class="b">${esc(humanize(desc))}</p><p class="meta mono">${esc(desc)} · cód. ${cod}</p><p class="meta">${when(d)}</p></button>${price(v)}
    <div class="suginline"><span>${ico('link')}Sugestão: <b>${esc(g.titulo)}</b> <span class="tnum">${Math.round(g.score * 100)}%</span></span><button class="btn s xs" ${act('vlink', s.id + cod)}>Vincular</button></div></div>`; }).join('') : `<div class="empty sm">${ico('check')}<p>Todos os itens desta loja já têm EAN.</p></div>`)}
  </div>`;
});

def('T-34', { name: 'Item da vitrine (sem EAN)', novo: true, us: ['US-03.05', 'US-03.06'], rn: ['RN-02', 'RN-12'], req: ['REQ-039', 'REQ-043'], notes: 'Novo no v2. Item observado só com código interno: nome humanizado, registros nesta loja, sugestões de EAN e atalho para ler o código na prateleira.' }, () => {
  const s = storeById(S.sel.store || 'atacadao'); const arr = NO_EAN[s.id] || NO_EAN.atacadao;
  const it = arr.find(([c]) => c === S.sel.cod) || arr[0]; const [cod, desc, v, d] = it;
  return `<div class="body ft">${topbar('Item sem código de barras', { sub: s.nome })}
  <div class="hero"><div class="ph xl ph-empty">${ico('tag')}</div></div>
  <h2 class="ptitle">${esc(humanize(desc))}</h2>
  <p class="meta">Na nota: <span class="mono">${esc(desc)}</span> · cód. ${cod}</p>
  <div class="bestbox"><div>${price(v, { cls: 'xl' })}</div><p>${s.nome} · ${when(d)} ${dateOf(d)}</p><p class="meta">Sem EAN não dá para comparar com outras lojas com segurança.</p></div>
  <div class="sec"><h2>É um destes?</h2><span>sugestões pela descrição</span></div>
  ${suggestFor(desc).map((g) => `<button class="sug" ${act('vlink', s.id + cod)}>${g.foto ? `<div class="ph sm"><img src="${g.foto}" alt=""></div>` : `<div class="ph sm ph-empty">${ico('box')}</div>`}<div class="grow"><p class="b">${esc(g.titulo)}</p><p class="meta mono">${g.ean} · ${g.fonte}</p><span class="score"><i style="width:${g.score * 100}%"></i></span></div><span class="tnum meta">${Math.round(g.score * 100)}%</span></button>`).join('')}
  </div><div class="footbar"><button class="btn p" ${go('T-23', { cod: '17038' })}>${ico('barcode')}Ler código na prateleira</button></div>`;
});

def('T-30', { name: 'Onde comprar perto', us: ['US-03.01'], rn: ['RN-05', 'RN-09'], req: ['REQ-035'], notes: 'Item → lojas no raio com distância, preço e frescor. “Rota” abre o app de mapas do celular.' }, () => {
  const p = prodByEan(S.sel.ean); const l = latestByStore(p.ean).filter((o) => distOf(o.store) <= S.radius).sort((a, b) => distOf(a.store) - distOf(b.store));
  const min = Math.min(...l.map((o) => o.price));
  const pins = l.map((o) => ({ lat: storeById(o.store).lat, lng: storeById(o.store).lng, cls: 'price' + (o.price === min ? ' g' : ''), txt: brl(o.price).replace('R$ ', '') }));
  return `<div class="body">${topbar('Perto de você', { sub: esc(p.titulo) })}
  <div class="mapbanner sm">${fmap(pins, { radius: Math.min(S.radius, 4) })}</div>
  <div class="chips">${[1, 3, 5, 10].map((r) => `<button class="chip${S.radius === r ? ' on' : ''}" ${act('radius', r)}>${r} km</button>`).join('')}</div>
  ${l.length ? l.map((o) => `<div class="row static"><div class="grow"><p class="b">${storeById(o.store).nome}</p><p class="meta tnum">${fmtKm(distOf(o.store))} · ${when(o.d)} ${freshBadge(o.d)}</p></div>${price(o.price, { menor: o.price === min })}<button class="ib sm" ${act('toast', 'Abrindo rota no app de mapas')} aria-label="Rota">${ico('nav')}</button></div>`).join('') : `<div class="empty sm">${ico('pin')}<p>Nenhuma loja com esse produto no raio de ${S.radius} km.</p></div>`}
  </div>`;
});

/* ============ E04 ============ */
const listOf = () => S.lists.find((l) => l.id === S.sel.list) || S.lists[0];
def('T-40', { name: 'Minhas listas', us: ['US-04.01', 'US-04.02'], rn: ['RN-13', 'RN-14'], req: ['REQ-050', 'REQ-051'], notes: 'Várias listas (REQ-051). Cada card mostra a melhor loja única e quanto o split economiza, calculados das observações. Visitante: listas presas ao fingerprint até criar conta (REQ-050).' }, () => `
  <div class="body tb">${brandbar()}
  <div class="h1row"><h1 class="h1">Minhas listas</h1><button class="btn s sm" ${act('sheet', 'newlist')}>${ico('plus')}Nova</button></div>
  ${S.session !== 'conta' ? `<button class="banner" ${go('T-02')}>${ico('finger')}<span>Salvas neste navegador. <b>Crie conta</b> para não perder.</span>${ico('next')}</button>` : ''}
  ${S.lists.length ? S.lists.map((l) => { const q = quote(l.items); const n = l.items.reduce((a, i) => a + i.qty, 0); return `<button class="lcard" ${go('T-42', { list: l.id })}>
    <div class="flex"><p class="b lg grow">${esc(l.nome)}</p><span class="meta tnum">${l.items.length} produtos · ${n} un.</span></div>
    <div class="thumbs">${l.items.slice(0, 5).map((i) => photo(prodByEan(i.ean), 'xs')).join('')}</div>
    ${q.ref ? `<div class="lsum"><span class="meta">Uma loja</span><b class="tnum">${brl(q.ref.total)}</b><span class="meta">${q.ref.s.nome}${q.partial ? ` · ${q.ref.found} de ${l.items.length}` : ''}</span></div>
    <div class="lsum"><span class="meta">Dividindo</span>${price(q.splitTotal, { menor: true })}<span class="chip menor tnum">−${brl(Math.max(0, q.saving))}</span></div>` : '<p class="meta">Adicione produtos para cotar</p>'}
  </button>`; }).join('') : `<div class="empty">${ico('list')}<p><b>Nenhuma lista ainda</b><br>Abra um produto e toque em “Adicionar à lista”.</p></div>`}
  </div>${tabbar('T-40')}`);

function listItemsBlock(l) {
  return `<div class="card list">${l.items.map((i) => { const p = prodByEan(i.ean); return `<div class="li">${photo(p, 'xs')}<div class="grow"><p class="b">${esc(p.titulo)}</p><p class="meta tnum">menor ${brl(bestOf(p.ean).price)}</p></div>${stepper(i.qty, i.ean)}<button class="ib sm ghost" ${act('rm', i.ean)} aria-label="Remover">${ico('trash')}</button></div>`; }).join('')}
  <button class="li add" ${go('T-11')}>${ico('plus')}Adicionar produto</button></div>`;
}
const segSplit = (on) => `<div class="seg"><span class="segpill ${on ? 'r' : 'l'}"${vt('segpill')}></span><button class="${on ? '' : 'on'}" ${go('T-42')}>${ico('store')}Uma loja</button><button class="${on ? 'on' : ''}" ${go('T-41')}>${ico('split')}Dividir entre lojas</button></div>`;
def('T-42', { name: 'Lista · uma loja', us: ['US-04.01', 'US-04.02'], rn: ['RN-13'], req: ['REQ-051'], notes: 'Quantidades editáveis (stepper) e remoção recalculam tudo. Total por loja com cobertura “N de M”; item sem preço recente na loja aparece como faltando, nunca estimado (RN-13).' }, () => {
  const l = listOf(); const q = quote(l.items);
  return `<div class="body">${topbar(esc(l.nome), { sub: `${l.items.length} produtos` })}
  ${segSplit(false)}${listItemsBlock(l)}
  <div class="sec"><h2>Onde fica mais barato</h2><span>preços até 30 dias</span></div>
  ${q.byStore.map((r, i) => `<div class="qrow${i === 0 ? ' best' : ''}"><div class="grow"><p class="b">${r.s.nome} ${i === 0 ? chip('melhor loja', 'menor') : ''}</p>
    <p class="meta tnum">${r.found} de ${l.items.length} itens · ${fmtKm(distOf(r.s.id))}</p>
    <div class="cov"><i style="width:${r.cov * 100}%"></i></div>
    ${r.missing.length ? `<p class="miss">sem preço: ${r.missing.map((e) => prodByEan(e).titulo.split(' ').slice(0, 2).join(' ')).join(', ')}</p>` : ''}</div>
    ${price(r.total, { menor: i === 0 })}</div>`).join('')}
  </div>`;
});

def('T-41', { name: 'Lista · dividir entre lojas', us: ['US-04.03'], rn: ['RN-13'], req: ['REQ-051'], notes: 'Split: cada item na loja onde está mais barato. Redução em R$ e % contra a melhor loja única com cobertura total. Mostra quantas paradas e a distância somada, para a pessoa decidir se vale.' }, () => {
  const l = listOf(); const q = quote(l.items); const ref = q.ref;
  const dist = q.split.reduce((a, [sid]) => a + distOf(sid), 0);
  return `<div class="body">${topbar(esc(l.nome), { sub: `${l.items.length} produtos` })}
  ${segSplit(true)}
  <div class="splitsum"><div><span class="meta">Dividindo em ${q.split.length} lojas</span>${price(q.splitTotal, { menor: true, cls: 'xl' })}</div>
  ${ref ? `<div class="save"><b class="tnum">−${brl(Math.max(0, q.saving))}</b><span class="tnum">${pct(-Math.max(0, q.saving) / ref.total)} vs tudo no ${ref.s.nome} (${brl(ref.total)}${q.partial ? `, ${ref.found} de ${l.items.length} itens` : ''})</span></div>` : ''}
  <p class="meta tnum">${q.split.length} paradas · ${fmtKm(dist)} somando as distâncias</p></div>
  ${q.split.map(([sid, its]) => `<div class="card list grp"><div class="li head"><span class="b">${storeById(sid).nome}</span><span class="meta">${fmtKm(distOf(sid))}</span><span class="sp"></span><b class="tnum">${brl(its.reduce((a, i) => a + i.price * i.qty, 0))}</b></div>
  ${its.map((i) => `<div class="li">${photo(prodByEan(i.ean), 'xs')}<div class="grow"><p class="b">${esc(prodByEan(i.ean).titulo)}</p><p class="meta tnum">${i.qty} × ${brl(i.price)} · ${when(i.d)}</p></div>${price(i.price * i.qty, { menor: true })}</div>`).join('')}</div>`).join('')}
  ${q.uncovered.length ? `<div class="banner warn">${ico('alert')}<span>${q.uncovered.length} item sem preço recente em nenhuma loja</span></div>` : ''}
  </div>`;
});

const allNotes = () => (S.scanDone ? [{ id: 'n-scan', store: S.scanned.store, d: 0, total: S.scanned.itens.reduce((a, i) => a + i.v * i.qtd, 0), itens: S.scanned.itens.length, ean: S.scanned.itens.filter((i) => i.ean).length, numero: S.scanned.numero }] : []).concat(MY_NOTES);
def('T-50', { name: 'Minhas notas', us: ['US-01.09', 'US-04.04'], rn: ['RN-14'], req: ['REQ-046', 'REQ-051'], notes: 'Histórico pessoal (fingerprint ou conta; só o titular vê — RN-14). Cada nota com progresso de EAN. Resumo do mês leva aos gastos.' }, () => {
  const ns = allNotes(); const tot = ns.reduce((a, n) => a + n.total, 0);
  return `<div class="body tb">${brandbar()}
  <div class="h1row"><h1 class="h1">Minhas notas</h1><span class="meta">${S.session === 'conta' ? esc(S.email) : 'neste navegador'}</span></div>
  <button class="monthcard" ${go('T-52')}><div><span class="meta">Novembro</span>${price(tot, { cls: 'xl ink' })}<span class="meta tnum">${ns.length} notas · ${ns.reduce((a, n) => a + n.itens, 0)} itens</span></div>${ico('chart')}</button>
  ${ns.map((n) => { const s = storeById(n.store); return `<button class="nrow2" ${go('T-55', { note: n.id })}><div class="flex"><div class="grow"><p class="b">${s.nome}</p><p class="meta tnum">${when(n.d)} · ${dateOf(n.d)} · nº ${n.numero}</p></div><b class="tnum">${brl(n.total)}</b></div>${progress(n.ean, n.itens, { compact: true })}</button>`; }).join('')}
  </div>${tabbar('T-50')}`;
});

function noteDetail(id) {
  if (id === 'n-scan') return { ...S.scanned, total: S.scanned.itens.reduce((a, i) => a + i.v * i.qtd, 0) };
  const n = MY_NOTES.find((x) => x.id === id) || MY_NOTES[1];
  const withE = OBS.filter((o) => o.store === n.store && o.d === n.d).map((o) => ({ cod: '—', desc: prodByEan(o.ean).danfe, qtd: 1, v: o.price, ean: o.ean, origem: 'sugestao' }));
  const raw = (NO_EAN[n.store] || []).map(([cod, desc, v]) => ({ cod, desc, qtd: 1, v, ean: null }));
  const shown = withE.slice(0, n.ean).concat(raw.slice(0, Math.max(0, n.itens - n.ean))).slice(0, 8);
  return { ...n, count: n.itens, itens: shown, hora: '18:22', more: Math.max(0, n.itens - shown.length) };
}
def('T-55', { name: 'Detalhe da nota', us: ['US-04.04'], rn: ['RN-06', 'RN-14'], req: ['REQ-046', 'REQ-025'], notes: 'Cupom com itens, origem do vínculo EAN por item (scan · sugestão · manual) e CTA para os pendentes. O CPF do consumidor é descartado na leitura e nunca exibido (RN-06).' }, () => {
  const n = noteDetail(S.sel.note); const s = storeById(n.store); const done = n.itens.filter((i) => i.ean).length;
  return `<div class="body ft">${topbar('Nota', { sub: `${s.nome} · ${dateOf(n.d)}` })}
  <div class="receipt"><p class="b">${s.razao}</p><p class="meta">CNPJ ${s.cnpj}<br>${s.end} · ${s.bairro}</p>
  <p class="meta tnum">NFC-e nº ${n.numero} · ${dateOf(n.d)} ${n.hora || ''}</p>
  <span class="chip meta">${ico('shield')}CPF do consumidor descartado</span>
  <div class="hr dash"></div>
  ${n.itens.map((i) => { const p = i.ean && prodByEan(i.ean); return `<div class="ritem"><div class="grow"><p>${esc(p ? p.titulo : humanize(i.desc))}</p><p class="meta tnum">${i.qtd} × ${brl(i.v)} ${i.ean ? originChip(i.origem) : `<span class="chip warn">sem EAN</span>`}</p></div><b class="tnum">${brl(i.v * i.qtd)}</b></div>`; }).join('')}
  ${n.more ? `<p class="meta center">+ ${n.more} itens</p>` : ''}
  <div class="hr dash"></div><div class="flex"><b>Total</b><span class="sp"></span><b class="tnum">${brl(n.total)}</b></div></div>
  ${S.sel.note === 'n-scan' ? progress(done, n.itens.length) : progress(n.ean, n.count)}
  </div><div class="footbar">${n.itens.some((i) => !i.ean) ? `<button class="btn p" ${go('T-23', { cod: (n.itens.find((i) => !i.ean) || {}).cod })}>${ico('barcode')}Vincular pendentes</button>` : ''}<button class="btn gh" ${act('toast', 'Abrindo consulta pública da SEFAZ PR')}>Ver na SEFAZ</button></div>`;
});

def('T-52', { name: 'Gastos do mês', us: ['US-04.05', 'US-04.06'], rn: ['RN-14'], req: ['REQ-051'], notes: 'Derivado de Minhas notas. Barras dos últimos 6 meses (mês atual em azul), ranking pessoal por loja (US-04.06) e por categoria. Privado ao titular.' }, () => {
  const max = Math.max(...MONTHS.map((m) => m[1]));
  const byStore = {}; allNotes().forEach((n) => { byStore[n.store] = (byStore[n.store] || 0) + n.total; });
  const st = Object.entries(byStore).sort((a, b) => b[1] - a[1]); const smax = st[0][1];
  const cur = MONTHS[MONTHS.length - 1][1], prev = MONTHS[MONTHS.length - 2][1];
  return `<div class="body">${topbar('Gastos', { sub: 'a partir das suas notas' })}
  <div class="bigstat"><span class="meta">Novembro até hoje</span>${price(cur, { cls: 'xl ink' })}<span class="meta tnum">${pct((cur - prev) / prev)} vs outubro inteiro (${brl(prev)})</span></div>
  <div class="bars" role="img" aria-label="Gasto mensal">${MONTHS.map(([m, v], i) => `<div class="bcol"><span class="bv tnum">${Math.round(v)}</span><i class="${i === MONTHS.length - 1 ? 'cur' : ''}" style="height:${(v / max) * 100}%"></i><span>${m}</span></div>`).join('')}</div>
  <div class="sec"><h2>Por loja</h2></div>
  ${st.map(([sid, v]) => `<div class="hbar"><span class="b">${storeById(sid).nome}</span><span class="tnum">${brl(v)}</span><div class="track"><i style="width:${(v / smax) * 100}%"></i></div></div>`).join('')}
  <div class="sec"><h2>Por categoria</h2></div>
  ${SPEND_CATS.map(([c, v]) => `<div class="hbar"><span>${c}</span><span class="tnum">${brl(v)}</span><div class="track"><i style="width:${(v / SPEND_CATS[0][1]) * 100}%"></i></div></div>`).join('')}
  </div>`;
});

/* ============ E05 ============ */
def('T-51', { name: 'Perfil e configurações', us: ['US-01.02', 'US-01.03', 'US-01.05'], rn: ['RN-14'], req: ['REQ-036', 'REQ-050', 'REQ-052'], notes: 'Acesso pelo topo (não é aba). Visitante: fingerprint + IP registrado pelo servidor e o que está pendente de merge. Conta: e-mail, pontos e sair (revoga sessão). Localização, raio, alertas e privacidade.' }, () => `
  <div class="body">${topbar('Perfil')}
  ${S.session === 'conta' ? `<div class="idcard"><span class="avatar">${esc(S.email[0].toUpperCase())}</span><div class="grow"><p class="b">${esc(S.email)}</p><p class="meta tnum">${S.points} pontos · conta desde hoje</p></div><button class="ib" ${go('T-53')} aria-label="Pontos">${ico('award')}</button></div>`
    : `<div class="idcard"><span class="avatar anon">${ico('finger')}</span><div class="grow"><p class="b">Visitante</p><p class="meta mono">fp_7c1e…a9d4 · IP 177.92.x.x</p><p class="meta tnum">${allNotes().length} notas · ${S.lists.length} listas · ${S.points} pontos neste navegador</p></div></div>
  <div class="duo mb12"><button class="btn p" ${go('T-02')}>Criar conta</button><button class="btn s" ${go('T-03')}>Entrar</button></div>`}
  <div class="sec"><h2>Preferências</h2></div>
  <div class="card list set">
    <button class="li" ${go('T-05')}>${ico('pin')}<div class="grow"><p class="b">Localização</p><p class="meta">${S.gps ? 'GPS ativo' : 'Centro, São José dos Pinhais'} · raio ${S.radius} km</p></div>${ico('next')}</button>
    <div class="li">${ico('bell')}<div class="grow"><p class="b">Alertas de preço</p><p class="meta">quando algo da lista baixar</p></div>${toggle(S.alerts, 'alerts', 'Alertas de preço')}</div>
    <button class="li" ${go('T-53')}>${ico('award')}<div class="grow"><p class="b">Pontos e contribuição</p><p class="meta tnum">${S.points} pontos</p></div>${ico('next')}</button>
  </div>
  <div class="sec"><h2>Privacidade</h2></div>
  <div class="card list set">
    <button class="li" ${act('toast', 'Arquivo com seus dados enviado por e-mail')}>${ico('download')}<div class="grow"><p class="b">Baixar meus dados</p><p class="meta">notas, listas e pontos (LGPD)</p></div></button>
    <button class="li danger" ${go('T-56')}>${ico('trash')}<div class="grow"><p class="b">${S.session === 'conta' ? 'Excluir conta e dados' : 'Apagar dados deste navegador'}</p></div></button>
    ${S.session === 'conta' ? `<button class="li" ${act('logout')}>${ico('logout')}<div class="grow"><p class="b">Sair</p></div></button>` : ''}
  </div>
  <p class="foot-note">notinhas.shop · Beta 1.0 · preços de balcão a partir de notas fiscais do Paraná</p></div>`);

def('T-53', { name: 'Pontos e contribuição', us: ['US-01.06', 'US-01.10'], rn: [], req: ['REQ-052'], notes: '+10 por NFC-e nova, +5 por EAN vinculado. Pontos viram crédito de uso (cotações e split). Opt-in: a loja vê suas compras nela e seus pontos, base para bonificação (B2B).' }, () => {
  const used = S.credits === 'out' ? 30 : 18;
  return `<div class="body">${topbar('Pontos')}
  <div class="ptshead"><span class="meta">${S.session === 'conta' ? 'Seu saldo' : 'Guardados neste navegador'}</span><b class="tnum">${S.points}</b><span class="meta">pontos</span></div>
  ${S.session !== 'conta' ? `<button class="banner" ${go('T-02')}>${ico('award')}<span>Crie conta para os pontos não se perderem</span>${ico('next')}</button>` : ''}
  <div class="card pad"><div class="flex"><p class="b grow">Crédito de cotação</p><span class="tnum meta">${used} de 30 este mês</span></div><div class="meter"><i style="width:${(used / 30) * 100}%" class="${used >= 30 ? 'full' : ''}"></i></div><p class="meta">Cada contribuição libera mais cotações.</p></div>
  <div class="sec"><h2>Como ganhar</h2></div>
  <div class="earn"><div>${ico('qr')}<b>+10</b><span>nota nova</span></div><div>${ico('barcode')}<b>+5</b><span>código vinculado</span></div></div>
  <div class="sec"><h2>Extrato</h2></div>
  <div class="card list">${S.ledger.map(([t, v, d]) => `<div class="li"><div class="grow"><p class="b">${t}</p><p class="meta">${d}</p></div><b class="tnum g">+${v}</b></div>`).join('')}</div>
  <div class="card pad optin"><div class="flex"><div class="grow"><p class="b">Mostrar minhas compras às lojas</p><p class="meta">A loja vê só o que você comprou nela e seus pontos, para oferecer bonificação.</p></div>${toggle(S.optIn, 'optin', 'Opt-in loja')}</div></div>
  </div>`;
});

def('T-54', { name: 'Gate · contribuir', us: ['US-04.02'], rn: [], req: ['REQ-052'], notes: 'Uso sustentado sem contribuir: pedido suave, nunca bloqueia busca de preço. Aparece ao abrir uma cotação com o crédito esgotado (cenário no painel).' }, () => `
  <div class="body ft center-v">${topbar('', { right: `<button class="ib" ${go('back')} aria-label="Fechar">${ico('x')}</button>`, back: false })}
  <div class="state"><span class="sticon">${ico('award')}</span><h2>Suas cotações do mês acabaram</h2>
  <p>O notinhas funciona porque cada pessoa traz um pouco de preço. Uma nota ou três códigos de barras liberam mais 10 cotações.</p>
  <div class="meter lg"><i class="full" style="width:100%"></i></div><p class="meta tnum">30 de 30 usadas · busca de preço continua livre</p></div>
  </div><div class="footbar"><button class="btn p" ${go('T-20')}>${ico('qr')}Depositar uma nota</button><button class="btn s" ${go('T-23')}>${ico('barcode')}Vincular 3 códigos</button><button class="btn gh" ${go('T-10')}>Agora não</button></div>`);

def('T-02', { name: 'Criar conta', us: ['US-01.01'], rn: ['RN-14'], req: ['REQ-050', 'REQ-052'], notes: 'Fora do onboarding (só pelo Perfil, listas ou pontos). Mostra o que será levado do fingerprint para a conta (merge). Senha com medidor. Consentimento LGPD obrigatório; opt-in loja opcional.' }, () => {
  const sc = Math.min(4, Math.floor((S.pw.length >= 8) + /\d/.test(S.pw) + /[A-Z]/.test(S.pw) + /[^\w]/.test(S.pw)));
  const canGo = /.+@.+\..+/.test(S.emailIn) && S.pw.length >= 8 && S.lgpd;
  return `<div class="body ft">${topbar('Criar conta')}
  <div class="merge">${ico('finger')}<div><p class="b">Vamos levar para sua conta</p><p class="meta tnum">${allNotes().length} notas · ${S.lists.length} listas · ${S.points} pontos deste navegador</p></div></div>
  <label class="lbl">E-mail</label><div class="field"><span>${ico('mail')}</span><input data-input="emailIn" type="email" value="${esc(S.emailIn)}" placeholder="voce@email.com" autocomplete="email"></div>
  <label class="lbl">Senha</label><div class="field"><span>${ico('lock')}</span><input data-input="pw" type="password" value="${esc(S.pw)}" placeholder="8 caracteres ou mais" autocomplete="new-password"></div>
  <div class="pwm s${sc}" id="pwm"><i></i><i></i><i></i><i></i></div>
  <button class="check${S.lgpd ? ' on' : ''}" ${act('lgpd')} role="checkbox" aria-checked="${S.lgpd}"><span>${ico('check')}</span>Li e aceito os termos e a política de privacidade</button>
  <div class="flex mt12"><div class="grow"><p class="b">Mostrar minhas compras às lojas</p><p class="meta">opcional · pode mudar depois</p></div>${toggle(S.optIn, 'optin', 'Opt-in loja')}</div>
  </div><div class="footbar"><button class="btn p" id="signup" ${act('signup')} ${canGo ? '' : 'disabled'}>Criar conta</button><button class="btn gh" ${go('T-03')}>Já tenho conta</button></div>`;
});

def('T-03', { name: 'Entrar', us: ['US-01.02'], rn: [], req: ['REQ-050'], notes: 'Erro sempre genérico (não revela se o e-mail existe). Teste: senha “errada” mostra o erro. Login no mesmo navegador também faz merge do fingerprint.' }, () => `
  <div class="body ft">${topbar('Entrar')}
  <div class="center mb12">${wm('md')}</div>
  ${S.loginErr ? `<div class="banner err">${ico('alert')}<span>E-mail ou senha incorretos.</span></div>` : ''}
  <label class="lbl">E-mail</label><div class="field"><span>${ico('mail')}</span><input data-input="emailIn" type="email" value="${esc(S.emailIn)}" placeholder="voce@email.com" autocomplete="email"></div>
  <label class="lbl">Senha</label><div class="field"><span>${ico('lock')}</span><input data-input="pw" type="password" value="${esc(S.pw)}" placeholder="Sua senha" autocomplete="current-password"></div>
  <button class="lnk mt8" ${go('T-04')}>Esqueci a senha</button>
  </div><div class="footbar"><button class="btn p" ${act('login')}>Entrar</button><button class="btn gh" ${go('T-02')}>Criar conta</button></div>`);

def('T-04', { name: 'Recuperar senha', us: ['US-01.04'], rn: [], req: ['REQ-022'], notes: 'Link de uso único válido por 1 h, enviado pelo Mailcow (mail.notinhas.shop). Resposta igual exista ou não a conta.' }, () => `
  <div class="body ft">${topbar('Recuperar senha')}
  ${S.sent ? `<div class="state"><span class="sticon ok">${ico('mail')}</span><h2>Confira seu e-mail</h2><p>Se houver conta com ${esc(S.emailIn || 'esse e-mail')}, enviamos um link que vale por 1 hora.</p></div>`
    : `<p class="lede">Mandamos um link para você criar uma senha nova.</p><label class="lbl">E-mail</label><div class="field"><span>${ico('mail')}</span><input data-input="emailIn" type="email" value="${esc(S.emailIn)}" placeholder="voce@email.com"></div>`}
  </div><div class="footbar">${S.sent ? `<button class="btn p" ${go('T-03')}>Voltar para entrar</button>` : `<button class="btn p" ${act('sent')}>Enviar link</button>`}</div>`);

def('T-05', { name: 'Localização', us: ['US-01.05'], rn: ['RN-09'], req: ['REQ-036'], notes: 'Opcional, nunca bloqueia. GPS com permissão explícita ou bairro; sem nenhum, a âncora é o centro do município (RN-09). Raio padrão de 1 a 30 km.' }, () => `
  <div class="body ft">${topbar('Onde você compra?')}
  <div class="card pad gpsbtn${S.gps ? ' on' : ''}">${ico('nav')}<div class="grow"><p class="b">Usar minha localização</p><p class="meta">${S.gps ? 'Ativo · distância exata até as lojas' : 'Mostra a distância até cada loja'}</p></div>${toggle(S.gps, 'gps', 'GPS')}</div>
  <div class="sec"><h2>Ou escolha o bairro</h2></div>
  <div class="chips wrap">${['Centro', 'Águas Belas', 'Aviação', 'Boneca do Iguaçu', 'São Cristóvão', 'Afonso Pena'].map((b) => `<button class="chip${S.bairro === b ? ' on' : ''}" ${act('bairro', b)}>${b}</button>`).join('')}</div>
  <div class="sec"><h2>Raio padrão</h2><b class="tnum" id="rv">${S.radius} km</b></div>
  <input type="range" min="1" max="30" value="${S.radius}" data-input="radius" class="range" aria-label="Raio em km">
  </div><div class="footbar"><button class="btn p" ${go('T-10')}>Salvar</button><button class="btn gh" ${go('T-10')}>Agora não</button></div>`);

def('T-56', { name: 'Excluir conta (LGPD)', novo: true, us: ['US-01.12'], rn: ['RN-06', 'RN-14'], req: ['REQ-050'], notes: 'Novo no v2. Deixa claro o que some (conta, notas pessoais, listas, pontos, vínculos de fingerprint e IP) e o que fica (preços no índice público, já anônimos — RN-06). Confirmação digitando EXCLUIR.' }, () => `
  <div class="body ft">${topbar(S.session === 'conta' ? 'Excluir conta' : 'Apagar dados')}
  <div class="state left"><span class="sticon err">${ico('trash')}</span><h2>Isso não tem volta</h2></div>
  <div class="card pad"><p class="b mb4">Será apagado</p><ul class="ticks bad"><li>${S.session === 'conta' ? 'Sua conta e e-mail' : 'Identificador deste navegador'}</li><li>Minhas notas e gastos</li><li>Listas e pontos</li><li>Registros de fingerprint e IP</li></ul></div>
  <div class="card pad"><p class="b mb4">Continua no notinhas</p><ul class="ticks"><li>Preços das notas no índice público, sem nada que identifique você</li></ul></div>
  <label class="lbl">Digite EXCLUIR para confirmar</label><div class="field"><input data-input="del" value="${esc(S.del)}" placeholder="EXCLUIR" autocapitalize="characters"></div>
  </div><div class="footbar"><button class="btn danger" id="delbtn" ${act('delete')} ${S.del === 'EXCLUIR' ? '' : 'disabled'}>Apagar tudo</button><button class="btn gh" ${go('back')}>Cancelar</button></div>`);

/* ============ E06 ============ */
def('T-70', { name: 'Câmera negada', novo: true, us: ['US-01.06'], rn: ['RN-07'], req: ['REQ-002', 'REQ-030'], notes: 'Novo no v2. Sem permissão (ou origem sem HTTPS), o fluxo não trava: foto do cupom e colar link continuam disponíveis.' }, () => `
  <div class="body ft">${topbar('Ler nota')}
  <div class="state"><span class="sticon warn">${ico('camera')}</span><h2>Sem acesso à câmera</h2><p>Libere em <b>Ajustes › Navegador › Câmera</b> e volte aqui. Enquanto isso, dá para usar uma foto ou o link.</p></div>
  </div><div class="footbar"><button class="btn p" ${go('T-21')}>${ico('image')}Usar foto do cupom</button><button class="btn s" ${act('sheet', 'url')}>${ico('link')}Colar link da nota</button><button class="btn gh" ${act('cam-ok')}>Tentar câmera de novo</button></div>`);

def('T-71', { name: 'Sem conexão', novo: true, us: ['US-02.01'], rn: ['RN-15'], req: ['REQ-019'], notes: 'Novo no v2. Mostra os últimos preços em cache com a idade explícita; nota lida offline entra na fila e sobe quando a rede volta.' }, () => `
  <div class="body tb">${brandbar()}
  <div class="banner warn">${ico('wifioff')}<span><b>Sem conexão</b><br>Mostrando preços salvos há 2 h</span></div>
  <div class="card pad row0">${ico('refresh')}<div class="grow"><p class="b">1 nota na fila</p><p class="meta">Enviamos quando a internet voltar</p></div></div>
  <div class="sec"><h2>Salvos no aparelho</h2></div>
  <div class="pgrid dim">${PRODUCTS.slice(6, 10).map((p) => pcard(p)).join('')}</div>
  </div>${tabbar('T-10')}`);

def('T-72', { name: 'Busca sem resultado', novo: true, us: ['US-02.03'], rn: ['RN-02'], req: ['REQ-045'], notes: 'Novo no v2. Explica por que não há preço (ninguém registrou) e oferece contribuir ou ser avisado. Itens parecidos sem EAN aparecem com confiança menor.' }, () => `
  <div class="body">
  <header class="top"><button class="ib" ${go('back')} aria-label="Voltar">${ico('back')}</button><div class="search on grow">${ico('search')}<span class="ink">requeijão cremoso 200g</span></div></header>
  <div class="state"><span class="sticon">${ico('search')}</span><h2>Ninguém registrou esse produto ainda</h2><p>Quando uma nota com ele entrar, o preço aparece aqui.</p>
  <div class="duo"><button class="btn p" ${go('T-20')}>${ico('qr')}Depositar nota</button><button class="btn s" ${act('toast', 'Avisaremos quando houver preço')}>${ico('bell')}Me avise</button></div></div>
  <div class="sec"><h2>Parecido, sem código de barras</h2>${chip('confiança menor', 'warn')}</div>
  <div class="row static"><div class="ph sm ph-empty">${ico('tag')}</div><div class="grow"><p class="b">Req. Vigor</p><p class="meta">Atacadão · só nesta loja · ${when(3)}</p></div>${price(6.99)}</div>
  </div>`);

def('T-73', { name: 'Carregando', novo: true, us: ['US-02.01'], rn: [], req: [], notes: 'Novo no v2. Skeleton com a forma real da home (busca, chips, card de destaque) no lugar de spinner. Shimmer desliga com movimento reduzido.' }, () => `
  <div class="body tb">${brandbar()}
  ${skel(44, '100%', 999)}<div class="flex gap8 mt12">${skel(32, '22%', 999)}${skel(32, '26%', 999)}${skel(32, '22%', 999)}${skel(32, '20%', 999)}</div>
  <div class="hrail mt12" style="height:520px;flex:none"><div class="hcard sk">${skel(24, '30%', 999)}${skel(240, '100%', 16)}${skel(16, '80%')}${skel(34, '45%')}${skel(12, '60%')}${skel(52, '100%', 999)}</div><div class="hcard sk">${skel(24, '30%', 999)}${skel(240, '100%', 16)}</div></div>
  </div>${tabbar('T-10')}`);

/* ============ ADM (desktop) ============ */
function desk(on, content) {
  const it = (id, i, l) => `<button class="dnav${on === id ? ' on' : ''}" ${go(id)}>${ico(i)}${l}</button>`;
  return `<div class="deskapp"><aside>${wm('sm')}<span class="admtag">admin</span>${it('T-61', 'chart', 'Métricas')}${it('T-62', 'refresh', 'Fila de falhas')}${it('T-63', 'shield', 'Moderação')}</aside><main>${content}</main></div>`;
}
def('T-61', { name: 'Admin · métricas', kind: 'desk', us: ['US-ADM.03'], rn: [], req: ['REQ-046', 'REQ-047'], notes: 'Números da base real do lab (2026-11-08): 7 lojas, 11 notas, 188 itens, 6 vínculos EAN, 39 fichas. Mostra onde o gargalo está: cobertura de EAN.' }, () => desk('T-61', `
  <h1 class="dh">Beta · São José dos Pinhais</h1><p class="meta">últimos 30 dias</p>
  <div class="dkpis">
   <div class="dk"><span>Notas ingeridas</span><b class="tnum">11</b><em class="g">92% sucesso</em></div>
   <div class="dk"><span>Itens observados</span><b class="tnum">188</b><em>7 lojas</em></div>
   <div class="dk"><span>Itens com EAN</span><b class="tnum">3%</b><em class="w">6 de 188</em></div>
   <div class="dk"><span>Fichas de produto</span><b class="tnum">39</b><em>enrich 7 d</em></div>
   <div class="dk"><span>Lojas geocodificadas</span><b class="tnum">7/7</b><em class="g">Nominatim</em></div>
  </div>
  <div class="dgrid"><div class="dcard"><h3>Notas por dia</h3><div class="bars d">${[1, 0, 3, 2, 0, 0, 1, 0, 0, 2, 1, 1].map((v, i) => `<div class="bcol"><i class="${i === 11 ? 'cur' : ''}" style="height:${(v / 3) * 100 || 2}%"></i></div>`).join('')}</div></div>
  <div class="dcard"><h3>Cobertura de EAN por loja</h3>${STORES.map((s) => `<div class="hbar"><span>${s.nome}</span><span class="tnum">${s.ean}/${s.itens}</span><div class="track"><i style="width:${(s.ean / s.itens) * 100 || 0}%"></i></div></div>`).join('')}</div></div>`));

def('T-62', { name: 'Admin · fila de falhas', kind: 'desk', us: ['US-ADM.01'], rn: ['RN-15'], req: ['REQ-003'], notes: 'Notas que falharam na SEFAZ (timeout, HTML sem itens, captcha). Reprocessar é idempotente (dedupe por chave).' }, () => desk('T-62', `
  <h1 class="dh">Fila de falhas</h1><p class="meta tnum">${S.admFails.filter((f) => !f.ok).length} pendentes</p>
  <table class="dt"><thead><tr><th>Chave</th><th>Erro</th><th>Quando</th><th>Tentativas</th><th></th></tr></thead><tbody>
  ${S.admFails.map((f, i) => `<tr class="${f.ok ? 'done' : ''}"><td class="mono">${f.chave}</td><td>${f.erro}</td><td>${f.quando}</td><td class="tnum">${f.tent}</td><td>${f.ok ? `<span class="chip menor">${ico('check')}ingerida</span>` : `<button class="btn s xs" ${act('adm-retry', i)}>${ico('refresh')}Reprocessar</button>`}</td></tr>`).join('')}
  </tbody></table>`));

def('T-63', { name: 'Admin · moderação', kind: 'desk', us: ['US-ADM.02'], rn: ['RN-12'], req: ['REQ-043'], notes: 'Conflitos de vínculo EAN entre usuários (Q2) e preços fora da curva (ex.: fardo registrado como unidade, casos reais da base). Ocultar remove do índice público sem apagar a nota.' }, () => desk('T-63', `
  <h1 class="dh">Moderação</h1><p class="meta">vínculos divergentes e preços fora da curva</p>
  <table class="dt"><thead><tr><th>Tipo</th><th>Alvo</th><th>Sinais</th><th>Quando</th><th></th></tr></thead><tbody>
  ${S.admFlags.map((f, i) => `<tr class="${f.res ? 'done' : ''}"><td>${chip(f.tipo, f.tipo.startsWith('EAN') ? 'meta' : 'warn')}</td><td>${f.alvo}</td><td class="tnum">${f.votos}</td><td>${f.quando}</td><td>${f.res ? `<span class="meta">${f.res}</span>` : `<div class="flex gap8"><button class="btn s xs" ${act('adm-flag', i + ':mantido')}>Manter</button><button class="btn s xs" ${act('adm-flag', i + ':oculto do índice')}>${ico('eyeoff')}Ocultar</button></div>`}</td></tr>`).join('')}
  </tbody></table>`));

/* ---------- sheets ---------- */
function sheetHTML() {
  if (!S.sheet) return '';
  let inner = '';
  if (S.sheet === 'add') {
    const p = prodByEan(S.sel.ean);
    inner = `<div class="flex gap8">${photo(p, 'sm')}<div class="grow"><p class="b">${esc(p.titulo)}</p><p class="meta">menor ${brl(bestOf(p.ean).price)}</p></div>${stepper(S.addQty, 'add')}</div>
    <p class="lbl mt12">Em qual lista?</p>${S.lists.map((l) => `<button class="radio${S.addList === l.id ? ' on' : ''}" ${act('addlist', l.id)}><span></span>${esc(l.nome)}<em class="meta tnum">${l.items.length}</em></button>`).join('')}
    <button class="btn p mt12" ${act('add-ok')}>Adicionar</button>`;
  } else if (S.sheet === 'url') {
    inner = `<p class="b lg">Colar link da nota</p><p class="meta mb8">O link que aparece ao ler o QR do cupom</p>
    <div class="field"><span>${ico('link')}</span><input data-input="urlIn" value="${esc(S.urlIn)}" placeholder="http://www.fazenda.pr.gov.br/nfce/qrcode?p=…"></div>
    <div class="duo mt8"><button class="chip" ${act('urlfill', 'ok')}>Exemplo válido</button><button class="chip" ${act('urlfill', 'bad')}>Exemplo inválido</button></div>
    <button class="btn p mt12" ${act('url-ok')}>Ler nota</button>`;
  } else if (S.sheet === 'newlist') {
    inner = `<p class="b lg">Nova lista</p><div class="field mt8"><input data-input="newName" value="${esc(S.newName)}" placeholder="Ex.: Churrasco de sábado"></div><button class="btn p mt12" ${act('newlist-ok')}>Criar</button>`;
  }
  return `<div class="scrim" ${act('sheet-close')}></div><div class="sheet" role="dialog" aria-modal="true"><span class="grab"></span>${inner}</div>`;
}
