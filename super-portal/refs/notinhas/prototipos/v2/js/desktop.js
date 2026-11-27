/* notinhas.shop · protótipo v2.0 — web desktop (D-xx)
   Mesmo modelo do celular: mesmos dados, estado, regras, temas e cenários.
   Layout de desktop: navegação no topo, colunas lado a lado, Home em seções da altura da janela. */
'use strict';

/* tela de celular → equivalente no desktop (navegação a partir de uma tela D-xx) */
const WMAP = {
  'T-10': 'D-10', 'T-73': 'D-10', 'T-71': 'D-10', 'T-15': 'D-31', 'T-11': 'D-11', 'T-72': 'D-11', 'T-14': 'D-14', 'T-12': 'D-14', 'T-13': 'D-14', 'T-30': 'D-14',
  'T-20': 'D-20', 'T-21': 'D-20', 'T-70': 'D-20', 'T-25': 'D-25', 'T-22': 'D-22', 'T-23': 'D-23', 'T-24': 'D-24', 'T-26': 'D-27', 'T-27': 'D-27',
  'T-31': 'D-31', 'T-32': 'D-31', 'T-33': 'D-33', 'T-34': 'D-33',
  'T-40': 'D-40', 'T-42': 'D-42', 'T-41': 'D-42', 'T-50': 'D-50', 'T-55': 'D-50', 'T-52': 'D-52',
  'T-51': 'D-51', 'T-53': 'D-51', 'T-05': 'D-51', 'T-56': 'D-51', 'T-02': 'D-02', 'T-03': 'D-02', 'T-04': 'D-02', 'T-54': 'D-54',
};
/* desktop → celular (botão “Ver no celular”) */
const WBACK = (id) => ({ 'D-27': S.scanResult === 'dup' ? 'T-26' : 'T-27', 'D-42': S.wsplit ? 'T-41' : 'T-42', 'D-02': S.authTab === 'entrar' ? 'T-03' : 'T-02' }[id] || id.replace('D-', 'T-'));

function wnav(on) {
  const l = (id, txt) => `<button class="wlink${on === id ? ' on' : ''}" ${go(id)}>${txt}</button>`;
  return `<header class="wnav"${vt('webnav')}>
    <button class="wlogo" ${go('D-10')} aria-label="Início">${wm()}</button>
    <nav>${l('D-10', 'Produtos')}${l('D-31', 'Lojas')}${l('D-40', 'Listas')}${l('D-50', 'Notas')}</nav>
    <button class="search wsearch" ${go('D-11')}>${ico('search')}<span>Buscar produto ou código de barras</span><kbd>/</kbd></button>
    <span class="sp"></span>
    ${S.session === 'conta' ? `<button class="ptschip" ${go('D-51')} aria-label="Pontos">${ico('award')}<span class="tnum">${S.points}</span></button>` : `<button class="btn gh sm" ${go('D-02')}>Entrar</button>`}
    <button class="btn p sm" ${go('D-20')}>${ico('qr')}Depositar nota</button>
    <button class="ib" ${go('D-51')} aria-label="Perfil">${ico('user')}</button>
  </header>`;
}
const wbanner = () => (!S.online ? `<div class="wbanner">${ico('wifioff')}<span><b>Sem conexão</b> · mostrando preços salvos há 2 h · 1 nota na fila</span></div>` : '');
const wshell = (on, body, cls = '') => `<div class="wapp">${wnav(on)}${wbanner()}<main class="wmain ${cls}">${body}</main></div>`;
const wdef = (id, path, meta, render) => def(id, { ...meta, kind: 'web', path }, render);

/* gráfico de histórico reaproveitável (T-13 / D-14) */
function histPlot(p) {
  const h = OBS.filter((o) => o.ean === p.ean).sort((a, b) => b.d - a.d);
  const maxD = Math.max(...h.map((o) => o.d), 7), lo = Math.min(...h.map((o) => o.price)) - 1, hi = Math.max(...h.map((o) => o.price)) + 1;
  const X = (d) => 6 + ((maxD - d) / maxD) * 88, Y = (v) => 8 + (1 - (v - lo) / (hi - lo)) * 74;
  const med = median(latestByStore(p.ean, 14).map((o) => o.price)); const min = Math.min(...h.map((o) => o.price));
  const sel = S.histPoint !== null && h[S.histPoint] ? h[S.histPoint] : null;
  return `<div class="chart wplot"><div class="plot">
    <svg viewBox="0 0 100 90" preserveAspectRatio="none" aria-label="Histórico de preço">
      <line x1="2" x2="98" y1="${Y(med)}" y2="${Y(med)}" class="medline"/>
      <polyline points="${[...new Set(h.map((o) => o.d))].sort((x, y) => y - x).map((d) => X(d) + ',' + Y(Math.min(...h.filter((o) => o.d === d).map((o) => o.price)))).join(' ')}" class="line"/>
    </svg>
    ${h.map((o, i) => `<button class="dot${o.price === min ? ' low' : ''}${S.histPoint === i ? ' on' : ''}" style="left:${X(o.d)}%;top:${(Y(o.price) / 90) * 100}%" ${act('hp', i)} aria-label="${brl(o.price)} ${storeById(o.store).nome}"></button>`).join('')}
    ${sel ? `<div class="tip tnum" style="left:${Math.min(80, Math.max(1, X(sel.d) - 8))}%"><b>${brl(sel.price)}</b> · ${storeById(sel.store).nome} · ${dateOf(sel.d)}</div>` : ''}
  </div></div>
  <div class="axis meta tnum"><span>${dateOf(maxD)}</span><span>linha: menor preço do dia · tracejada: mediana 14 d ${brl(med)}</span><span>hoje</span></div>`;
}

/* ============ Descoberta ============ */
wdef('D-10', '/', { name: 'Home · Produtos', us: ['US-02.01', 'US-02.04'], rn: ['RN-05', 'RN-11'], req: ['REQ-045', 'REQ-049', 'REQ-056', 'REQ-057'], notes: 'Mesmo modelo do celular: cada seção ocupa a altura da janela e rola na horizontal (2 linhas de cards). Promoções → Mais comprados (lateral infinita) → categorias. Chips pulam entre seções; setas ‹ › rolam a seção; roda do mouse = uma seção.' }, () => {
  const secs = homeSections(); const ds = destaques();
  const inner = (x) => {
    if (x.id === 'promo') return ds.map((d) => hcard(d.p, { tag: d.hl ? (d.off <= -0.15 ? 'promoção' : 'menor preço') : 'menor da região', tagCls: d.hl ? 'menor' : 'meta' })).join('');
    if (x.id === 'mais') return maisCards(0, 16);
    return PRODUCTS.filter((p) => p.cat === x.id).sort((a, b) => bestOf(a.ean).price - bestOf(b.ean).price).map((p) => hcard(p, { tag: p.sub })).join('');
  };
  const meta = (x) => (x.id === 'promo' ? 'abaixo da mediana · 14 dias' : x.id === 'mais' ? 'em SJP · 30 dias' : PRODUCTS.filter((p) => p.cat === x.id).length + ' com código de barras');
  return `<div class="wapp">${wnav('D-10')}${wbanner()}
  <div class="wsub"><div class="chips" id="hchips">${secs.map((x, i) => `<button class="chip${i === (VT_LIVE ? S.homeSec : 0) ? ' on' : ''}" ${act('jump', i)}>${ico(x.ico)}${x.nome}</button>`).join('')}</div></div>
  <main class="wmain home">${secs.map((x, i) => `<section class="hsec" data-sec="${i}">
    <div class="hsec-h"><h2>${x.nome}</h2><span class="meta">${meta(x)}</span><span class="hsec-nav"><button class="ib sm" ${act('rail', i + ':-1')} aria-label="Anteriores">${ico('back')}</button><button class="ib sm" ${act('rail', i + ':1')} aria-label="Próximos">${ico('next')}</button></span></div>
    <div class="hrail"${x.id === 'mais' ? ' data-inf="1"' : ''}>${inner(x)}</div></section>`).join('')}</main></div>`;
});

function webResults() {
  const q = S.q.trim(); const t = norm(q);
  const inCat = (p) => S.cat === 'todas' || p.cat === S.cat;
  if (/^\d{8,14}$/.test(q)) {
    const p = prodByEan(q);
    return p ? `<p class="meta mb12">Correspondência exata pelo código de barras</p><div class="pgrid wgrid">${pcard(p)}</div>`
      : `<div class="empty">${ico('barcode')}<p><b>EAN ${q} ainda não está no índice.</b><br>${gtinValid(q) ? 'Código válido.' : 'Dígito verificador não confere.'}</p><button class="btn p sm" ${go('D-20')}>Depositar uma nota</button></div>`;
  }
  let hits = PRODUCTS.filter((p) => inCat(p) && (!t || norm(p.titulo + ' ' + p.marca + ' ' + p.danfe).includes(t)));
  hits = S.sort === 'perto' ? hits.sort((a, b) => distOf(bestOf(a.ean).store) - distOf(bestOf(b.ean).store)) : hits.sort((a, b) => bestOf(a.ean).price - bestOf(b.ean).price);
  const loose = [];
  if (t) Object.entries(NO_EAN).forEach(([sid, arr]) => arr.forEach(([cod, desc, v, d]) => { if (norm(desc).includes(t.split(' ')[0])) loose.push({ sid, cod, desc, v, d }); }));
  if (!hits.length && !loose.length) return `<div class="empty">${ico('search')}<p><b>Ninguém registrou “${esc(q)}” ainda.</b><br>Quando uma nota com esse produto entrar, o preço aparece aqui.</p><div class="flex"><button class="btn p sm" ${go('D-20')}>Depositar uma nota</button><button class="btn s sm" ${act('toast', 'Avisaremos quando houver preço')}>${ico('bell')}Me avise</button></div></div>`;
  return `<p class="meta mb12 tnum">${q ? `${hits.length} com código de barras${loose.length ? ` · ${loose.length} só pela descrição` : ''}` : `${hits.length} produtos com código de barras`}</p>
  ${hits.length ? `<div class="pgrid wgrid">${hits.map((p) => pcard(p)).join('')}</div>` : ''}
  ${loose.length ? `<div class="sec"><h2>Sem código de barras</h2>${chip('confiança menor', 'warn')}</div>
  <table class="wt"><tbody>${loose.map((l) => `<tr ${go('T-34', { store: l.sid, cod: l.cod })}><td><b>${esc(humanize(l.desc))}</b><br><span class="meta mono">${esc(l.desc)}</span></td><td>${storeById(l.sid).nome}<br><span class="meta">só nesta loja · ${when(l.d)}</span></td><td class="r">${price(l.v)}</td></tr>`).join('')}</tbody></table>` : ''}`;
}
wdef('D-11', '/busca', { name: 'Busca', us: ['US-02.02', 'US-02.03'], rn: ['RN-05'], req: ['REQ-039', 'REQ-045'], notes: 'Filtros na lateral (categoria canônica, ordenação, raio); campo grande com resultado ao vivo em grade. EAN com dígito verificador. Itens sem EAN em tabela à parte, “confiança menor”.' }, () => wshell('D-11', `<div class="wsplit">
  <aside class="wfilters">
    <h3>Categoria</h3>${CATS.map((c) => `<button class="radio${S.cat === c.id ? ' on' : ''}" ${act('cat', c.id)}><span></span>${c.nome}</button>`).join('')}
    <h3>Ordenar</h3><div class="chips wrap"><button class="chip${S.sort !== 'perto' ? ' on' : ''}" ${act('sort', 'preco')}>Menor preço</button><button class="chip${S.sort === 'perto' ? ' on' : ''}" ${act('sort', 'perto')}>Mais perto</button></div>
    <h3>Raio</h3><div class="chips wrap">${[1, 3, 5, 10, 30].map((r) => `<button class="chip${S.radius === r ? ' on' : ''}" ${act('radius', r)}>${r} km</button>`).join('')}</div>
  </aside>
  <section><label class="search on wbig">${ico('search')}<input data-input="q" value="${esc(S.q)}" placeholder="Produto, marca ou código de barras" autocomplete="off"></label><div id="res">${webResults()}</div></section></div>`));

wdef('D-14', '/produto', { name: 'Detalhe do produto', us: ['US-02.04', 'US-02.05', 'US-02.06', 'US-02.07', 'US-03.01', 'US-04.01'], rn: ['RN-05', 'RN-08'], req: ['REQ-028', 'REQ-047', 'REQ-048'], notes: 'Duas colunas: produto e menor preço fixos à esquerda; à direita histórico (gráfico de linha, acima da comparação), comparação em tabela com frescor e “perto de você” com mapa. Clique nos pontos do gráfico.' }, () => {
  const p = prodByEan(S.sel.ean); const l = latestByStore(p.ean); const b = bestOf(p.ean);
  const med = median(latestByStore(p.ean, 14).map((o) => o.price)); const cat = CATS.find((c) => c.id === p.cat);
  const near = l.filter((o) => distOf(o.store) <= S.radius);
  const pins = near.map((o) => ({ lat: storeById(o.store).lat, lng: storeById(o.store).lng, cls: 'price' + (o.store === b.store ? ' g' : ''), txt: brl(o.price).replace('R$ ', '') }));
  return wshell('D-14', `<div class="wcrumb"><button ${go('D-10')}>Produtos</button>›<span>${cat ? cat.nome : ''}</span>›<span>${p.sub}</span></div>
  <div class="wprod">
    <aside class="wprod-l">
      ${photo(p, 'wxl')}
      <h1 class="ptitle">${esc(p.titulo)}</h1>
      <p class="meta">${p.marca} · <span class="mono">EAN ${p.ean}</span></p>
      <div class="bestbox"><div><span class="chip menor">menor preço</span>${price(b.price, { menor: true, cls: 'xl' })}</div>
        <p><b>${storeById(b.store).nome}</b> · ${storeById(b.store).bairro} · ${when(b.d)} ${dateOf(b.d)}${S.gps ? ' · ' + fmtKm(distOf(b.store)) : ''}</p>
        <p class="meta tnum">mediana 14 dias ${brl(med)} · ${pct((b.price - med) / med)}</p></div>
      <div class="duo"><button class="btn p" ${act('sheet', 'add')}>${ico('plus')}Adicionar à lista</button><button class="btn s" ${act('toast', 'Abrindo rota no mapa')}>${ico('nav')}Como chegar</button></div>
      <details class="card ficha"><summary>Ficha do produto ${ico('next')}</summary>
        <dl><dt>Na nota</dt><dd class="mono">${esc(p.danfe)}</dd><dt>NCM</dt><dd class="mono">${p.ncm}</dd><dt>Categoria</dt><dd>${cat ? cat.nome : ''} › ${p.sub}</dd><dt>Fontes</dt><dd>${p.fontes.join(' · ')}</dd></dl></details>
      <p class="meta">Preço de balcão, das notas fiscais. Não é preço de delivery.</p>
    </aside>
    <section>
      <div class="wcard"><div class="sec"><h2>Histórico de preço</h2><span>cada ponto = uma NFC-e</span></div>${histPlot(p)}</div>
      <div class="wcard"><div class="sec"><h2>Comparação</h2><span class="chips"><button class="chip${S.fresh === 7 ? ' on' : ''}" ${act('fresh', 7)}>7 dias</button><button class="chip${S.fresh === 14 ? ' on' : ''}" ${act('fresh', 14)}>14 dias</button><button class="chip${!S.fresh ? ' on' : ''}" ${act('fresh', 0)}>Todos</button></span></div>
        <table class="wt"><thead><tr><th>Loja</th><th>Bairro</th><th>Distância</th><th>Registro</th><th class="r">Preço</th></tr></thead><tbody>
        ${l.filter((o) => !S.fresh || o.d <= S.fresh).map((o, i) => `<tr class="${i === 0 ? 'hl' : ''}" ${go('D-33', { store: o.store })}><td><b>${storeById(o.store).nome}</b></td><td>${storeById(o.store).bairro}</td><td class="tnum">${fmtKm(distOf(o.store))}</td><td>${when(o.d)} · ${dateOf(o.d)} ${freshBadge(o.d)}</td><td class="r">${price(o.price, { menor: i === 0 })}</td></tr>`).join('')}
        </tbody></table></div>
      <div class="wcard"><div class="sec"><h2>Perto de você</h2><span>${near.length} lojas em ${S.radius} km</span></div><div class="mapbanner wmap">${fmap(pins, { radius: Math.min(S.radius, 4) })}</div></div>
    </section>
  </div>`);
});

/* ============ Contribuir ============ */
wdef('D-20', '/nota', { name: 'Depositar nota', us: ['US-01.06', 'US-01.07'], rn: ['RN-01', 'RN-07'], req: ['REQ-001', 'REQ-030'], notes: 'No desktop, três entradas lado a lado: arrastar a foto do cupom, colar o link do QR (validação RN-01) ou ler pela webcam. Mesmo pipeline e cenários do celular.' }, () => wshell('D-20', `<div class="wnarrow">
  <h1 class="h1">Depositar nota</h1><p class="lede">Os preços da sua compra entram no índice. A NFC-e não traz código de barras: depois você vincula os que faltarem.</p>
  <div class="wdep">
    <button class="drop" ${act('decode')}>${ico('image')}<b>Arraste a foto do cupom aqui</b><span>ou clique para escolher · JPG, PNG, HEIC</span></button>
    <div class="wcard"><h3>Colar link da nota</h3><p class="meta mb8">O link que aparece ao ler o QR do cupom</p>
      <div class="field"><span>${ico('link')}</span><input data-input="urlIn" value="${esc(S.urlIn)}" placeholder="fazenda.pr.gov.br/nfce/qrcode?p=…"></div>
      <div class="chips wrap mt8"><button class="chip" ${act('urlfill', 'ok')}>Exemplo válido</button><button class="chip" ${act('urlfill', 'bad')}>Exemplo inválido</button></div>
      <button class="btn p" ${act('url-ok')}>Ler nota</button></div>
    <div class="wcard"><h3>Webcam</h3><div class="wcam"><div class="vf qr"><i></i><i></i><i></i><i></i><span class="laser"></span></div></div>
      <button class="btn s" ${act('scan')}>${ico('qr')}Ler QR pela webcam</button></div>
  </div>
  <p class="meta mt16">Aceitamos a consulta pública da NFC-e da Fazenda do Paraná. O CPF da nota é descartado na leitura.</p></div>`));

wdef('D-25', '/nota/lendo', { name: 'Processando nota', novo: true, us: ['US-01.06', 'US-01.08'], rn: ['RN-01', 'RN-03', 'RN-06', 'RN-15'], req: ['REQ-003', 'REQ-004'], notes: 'Mesmas 5 etapas reais do celular, com skeleton dos itens. Resultado segue o cenário do painel.' }, () => {
  const k = VT_LIVE ? S.proc : 2;
  return wshell('D-20', `<div class="wcenter"><div class="wcard pad-l"><h1 class="h1 mb12">Lendo sua nota</h1>
  <ol class="steps">${PROC.map((t, i) => `<li class="${i < k ? 'done' : i === k ? 'now' : ''}"><span class="mk">${i < k ? ico('check') : ''}</span>${t}</li>`).join('')}</ol>
  ${[1, 2, 3, 4, 5].map(() => `<div class="skrow">${skel(12, '55%')}${skel(12, '14%')}</div>`).join('')}<p class="meta center mt12">Leva até 10 segundos</p></div></div>`);
});

wdef('D-22', '/nota/48271', { name: 'Nota recebida', us: ['US-01.06', 'US-01.10'], rn: ['RN-02', 'RN-04'], req: ['REQ-046', 'REQ-052'], notes: 'Resumo, pontos e progresso de EAN à esquerda; itens em tabela à direita com “Vincular” nos pendentes.' }, () => {
  const n = S.scanned; const s = storeById(n.store); const done = n.itens.filter((i) => i.ean).length;
  const total = n.itens.reduce((a, i) => a + i.v * i.qtd, 0); const pend = n.itens.filter((i) => !i.ean);
  return wshell('D-50', `<div class="wtwo r rev">
  <aside class="wcard">
    <div class="okhead"><span class="okbig">${ico('check')}</span><div><h1 class="h1">Nota recebida</h1><p class="meta tnum">${s.nome} · ${s.bairro} · hoje ${n.hora} · nº ${n.numero}</p></div></div>
    <p class="price xl ink tnum">${brl(total)}</p><p class="meta mb12">${n.itens.length} itens</p>
    <div class="pts-earned">${ico('award')}<span>${S.session === 'conta' ? '<b>+10 pontos</b> pela nota' : '<b>+10 pontos</b> guardados neste navegador'}</span>${S.session !== 'conta' ? `<button class="lnk" ${go('D-02')}>Criar conta</button>` : ''}</div>
    ${progress(done, n.itens.length)}
    ${pend.length ? `<button class="btn p mt8" ${go('D-23', { cod: pend[0].cod })}>${ico('barcode')}Vincular ${pend.length} pendente${pend.length > 1 ? 's' : ''}</button>` : `<button class="btn p mt8" ${go('D-10')}>Ver preços</button>`}
    <button class="btn gh" ${go('D-50', { note: 'n-scan' })}>Ver em Minhas notas</button>
  </aside>
  <section class="wcard"><div class="sec"><h2>Itens</h2><span>${pend.length ? pend.length + ' sem código de barras' : 'todos com EAN'}</span></div>
    <table class="wt"><thead><tr><th>Item</th><th>Cód.</th><th>Qtd × unit.</th><th>Código de barras</th><th class="r">Total</th></tr></thead><tbody>
    ${n.itens.map((it) => { const p = it.ean && prodByEan(it.ean); return `<tr><td><div class="flex">${p ? photo(p, 'xs') : `<div class="ph xs ph-empty">${ico('tag')}</div>`}<b>${esc(p ? p.titulo : it.titulo || humanize(it.desc))}</b></div></td><td class="mono">${it.cod}</td><td class="tnum">${it.qtd} × ${brl(it.v)}</td><td>${it.ean ? `<span class="mono">${it.ean}</span> ${originChip(it.origem)}` : `<button class="btn s xs" ${go('D-23', { cod: it.cod })}>Vincular</button>`}</td><td class="r tnum">${brl(it.v * it.qtd)}</td></tr>`; }).join('')}
    </tbody></table></section></div>`);
});

wdef('D-23', '/nota/48271/vincular', { name: 'Vincular EAN', us: ['US-01.10'], rn: ['RN-02', 'RN-12'], req: ['REQ-031', 'REQ-039', 'REQ-043'], notes: 'Item à esquerda com webcam e digitação (dígito verificador ao vivo); sugestões pela descrição à direita — clique vincula com origem “sugestão”.' }, () => {
  const it = S.scanned.itens.find((i) => i.cod === S.sel.cod) || S.scanned.itens.find((i) => !i.ean) || S.scanned.itens[0];
  const sug = suggestFor(it.desc); const ok = gtinValid(S.eanIn);
  return wshell('D-50', `<div class="wcrumb"><button ${go('D-22')}>Nota nº ${S.scanned.numero}</button>›<span>Vincular código de barras</span></div>
  <div class="wtwo">
    <section class="wcard"><p class="meta">Item da nota · ${storeById(S.scanned.store).nome} · cód. ${it.cod}</p><h1 class="h1 mb12">${esc(it.desc)}</h1>
      <div class="wcam"><div class="vf bar"><i></i><i></i><i></i><i></i><span class="laser"></span></div></div>
      <button class="btn s mb12" ${act('link', 'scan')}>${ico('barcode')}Ler código pela webcam</button>
      <label class="lbl">Ou digite o código</label>
      <div class="field${S.eanIn ? (ok ? ' ok' : ' bad') : ''}"><span>${ico('keyboard')}</span><input data-input="eanIn" value="${esc(S.eanIn)}" inputmode="numeric" maxlength="14" placeholder="EAN de 8 a 14 dígitos" class="mono"></div>
      <p class="hint" id="eanhint">${S.eanIn ? (ok ? 'Código válido' : 'Dígito verificador não confere') : 'Fica no verso da embalagem'}</p>
      <button class="btn p" ${act('link', 'manual')} ${ok ? '' : 'disabled'} id="eansave">Salvar código</button></section>
    <section class="wcard"><div class="sec"><h2>Sugestões pela descrição</h2><span>clique para vincular</span></div>
      ${sug.map((g, i) => `<button class="sug" ${act('link', 'sug:' + i)}>${g.foto ? `<div class="ph sm"><img src="${g.foto}" alt=""></div>` : `<div class="ph sm ph-empty">${ico('box')}</div>`}<div class="grow"><p class="b">${esc(g.titulo)}</p><p class="meta mono">${g.ean} · ${g.fonte}${g.exemplo ? ' · exemplo' : ''}</p><span class="score"><i style="width:${g.score * 100}%"></i></span></div><span class="tnum meta">${Math.round(g.score * 100)}%</span></button>`).join('')}
    </section></div>`);
});

wdef('D-24', '/produto/foto', { name: 'Escolher foto', us: ['US-01.11'], rn: [], req: ['REQ-032', 'REQ-040'], notes: 'Candidatas reais pelo EAN, em grade larga. A escolhida vira a foto da ficha canônica.' }, () => {
  const src = ['Open Food Facts', 'Open Food Facts', 'UPCitemdb', 'Google Imagens', 'Google Imagens', 'Google Imagens'];
  return wshell('D-50', `<div class="wnarrow"><h1 class="h1">Foto do produto</h1><p class="lede">Batata Pringles Original 104g · escolha a que mais parece com a prateleira.</p>
  <div class="photogrid wphotos">${[1, 2, 3, 4, 5, 6].map((i) => `<button class="cand${S.photo === i ? ' on' : ''}" ${act('photo', i)}><img src="media/cand/pringles-${i}.jpg" alt=""><span>${src[i - 1]}</span>${S.photo === i ? `<span class="okmark">${ico('check')}</span>` : ''}</button>`).join('')}</div>
  <div class="flex mt16"><button class="btn p sm" ${act('photo-ok')}>Usar esta foto</button><button class="btn gh sm" ${go('D-22')}>Pular</button></div></div>`);
});

wdef('D-27', '/nota/aviso', { name: 'Nota duplicada ou falha', novo: true, us: ['US-01.08', 'US-01.06'], rn: ['RN-01', 'RN-03', 'RN-15'], req: ['REQ-003', 'REQ-005'], notes: 'Uma tela para os três avisos, conforme o cenário: duplicada (nada é recontado), SEFAZ lenta (link na fila) ou link que não é NFC-e do PR.' }, () => {
  const r = S.scanResult;
  const v = r === 'dup' ? { c: 'info', i: 'receipt', h: 'Essa nota já está no notinhas', p: 'Formosa · 04/11 · nº 889120. Os preços dela já contam no índice, nada foi duplicado. Ela também está em Minhas notas.', a: `<button class="btn p sm" ${go('D-20')}>Ler outra nota</button><button class="btn s sm" ${go('D-50', { note: 'n-formosa' })}>Ver nota</button>` }
    : r === 'invalid' ? { c: 'err', i: 'link', h: 'Esse link não é de uma nota do Paraná', p: 'Aceitamos a consulta pública da NFC-e da Fazenda PR. Confira se é o QR do cupom fiscal, não de pagamento.', a: `<button class="btn p sm" ${go('D-20')}>Tentar de novo</button>` }
      : { c: 'warn', i: 'clock', h: 'A SEFAZ PR não respondeu', p: 'A consulta passou de 10 segundos. Guardamos o link e tentamos de novo em 5 minutos. Avisamos quando a nota entrar.', a: `<button class="btn p sm" ${act('retry')}>${ico('refresh')}Tentar agora</button><button class="btn s sm" ${go('D-10')}>Voltar aos preços</button>` };
  return wshell('D-20', `<div class="wcenter"><div class="wcard state pad-l"><span class="sticon ${v.c}">${ico(v.i)}</span><h2>${v.h}</h2><p>${v.p}</p><div class="flex mt8">${v.a}</div></div></div>`);
});

/* ============ Lojas ============ */
wdef('D-31', '/lojas', { name: 'Lojas · mais baratas + mapa', us: ['US-03.02', 'US-03.03'], rn: ['RN-09', 'RN-10'], req: ['REQ-035', 'REQ-046'], notes: 'Lista ranqueada (RN-10, muda com o raio) ao lado do mapa grande. Clique no pin para o popup com progresso de EAN.' }, () => {
  const rk = storeRanking(S.radius).filter((r) => !S.qs || norm(r.s.nome).includes(norm(S.qs)));
  const all = storeRanking(30); const sel = all.find((r) => r.s.id === (S.mapStore || 'atacadao')) || all[0]; const t = storeStats(sel.s);
  const pins = rk.map((r) => ({ lat: r.s.lat, lng: r.s.lng, cls: 'store' + (r.s.id === sel.s.id ? ' on' : '') + (r.pos === 1 ? ' g' : ''), txt: r.pos || '·', attrs: act('mapstore', r.s.id), label: r.s.nome }));
  return wshell('D-31', `<div class="wmaplist"><section class="wlist">
    <h1 class="h1">Mais baratas</h1><p class="meta mb12">${S.gps ? 'perto de você' : ANCHOR.label} · ranking pela mediana dos mesmos produtos</p>
    <label class="search">${ico('search')}<input data-input="qs" value="${esc(S.qs)}" placeholder="Buscar loja"></label>
    <div class="chips wrap">${[1, 3, 5, 10, 30].map((r) => `<button class="chip${S.radius === r ? ' on' : ''}" ${act('radius', r)}>${r} km</button>`).join('')}</div>
    <div id="rk">${rk.map(rankRow).join('') || `<div class="empty">${ico('store')}<p>Nenhuma loja nesse raio.</p></div>`}</div></section>
  <div class="wbigmap">${fmap(pins, { cls: 'full', radius: Math.min(S.radius, 4) })}
    <div class="mapcard col"><div class="flex"><div class="grow"><p class="b">${sel.s.nome}</p><p class="meta">${sel.s.bairro} · ${fmtKm(sel.dist)}${sel.pos ? ` · ${sel.pos}ª mais barata` : ''}</p></div>${sel.idx !== null ? `<span class="idx tnum ${sel.idx < 0 ? 'g' : 'w'}">${pct(sel.idx)}</span>` : ''}</div>
    ${progress(t.ean, t.itens, { notas: t.notas, compact: true })}<button class="btn p sm" ${go('D-33', { store: sel.s.id })}>Ver vitrine</button></div></div></div>`, 'flushw');
});

wdef('D-33', '/loja', { name: 'Vitrine da loja', us: ['US-03.04', 'US-03.05', 'US-03.06'], rn: ['RN-05', 'RN-12'], req: ['REQ-018', 'REQ-043', 'REQ-046'], notes: 'Cabeçalho com ranking e progresso; abas Com EAN (grade larga) e Sem EAN (tabela com sugestão inline e Vincular).' }, () => {
  const s = storeById(S.sel.store); const rk = storeRanking(30).find((r) => r.s.id === s.id); const t = storeStats(s);
  const withE = PRODUCTS.map((p) => ({ p, o: latestByStore(p.ean).find((o) => o.store === s.id), b: bestOf(p.ean) })).filter((x) => x.o);
  const noE = (NO_EAN[s.id] || []).filter(([cod]) => !S.linkedVitrine.includes(s.id + cod));
  return wshell('D-31', `<div class="wcrumb"><button ${go('D-31')}>Lojas</button>›<span>${s.nome}</span></div>
  <div class="wvhead"><div><h1 class="h1">${s.nome}</h1><p class="meta">${s.razao} · ${s.end} · ${s.bairro} · ${fmtKm(distOf(s.id))}</p>
    <p class="mt8">${rk && rk.pos ? `<span class="chip ${rk.idx < 0 ? 'menor' : 'meta'} tnum">${rk.pos}ª mais barata · ${pct(rk.idx)} vs mediana</span>` : chip('dados insuficientes', 'meta')}</p></div>
    <div>${progress(t.ean, t.itens, { notas: t.notas })}</div></div>
  <div class="seg wseg"><button class="${S.vtab === 'ean' ? 'on' : ''}" ${act('vtab', 'ean')}>Com EAN <span class="tnum">${withE.length}</span></button><button class="${S.vtab === 'sem' ? 'on' : ''}" ${act('vtab', 'sem')}>Sem EAN <span class="tnum">${noE.length}</span></button></div>
  ${S.vtab === 'ean' ? `<div class="pgrid wgrid">${withE.map(({ p, o, b }) => `<article class="pc" ${go('D-14', { ean: p.ean })}>${photo(p)}<p class="pn">${esc(p.titulo)}</p><p class="pp">${price(o.price, { menor: o.store === b.store })}</p><p class="pm">${when(o.d)}${o.store === b.store ? ' · menor da região' : ''}</p></article>`).join('')}</div>`
    : (noE.length ? `<table class="wt"><thead><tr><th>Na nota</th><th>Preço</th><th>Sugestão de código de barras</th><th></th></tr></thead><tbody>${noE.map(([cod, desc, v, d]) => { const g = suggestFor(desc)[0]; return `<tr><td><b>${esc(humanize(desc))}</b><br><span class="meta mono">${esc(desc)} · cód. ${cod} · ${when(d)}</span></td><td class="tnum">${price(v)}</td><td>${esc(g.titulo)}<br><span class="meta mono">${g.ean} · ${Math.round(g.score * 100)}%</span></td><td class="r"><button class="btn s xs" ${act('vlink', s.id + cod)}>Vincular</button></td></tr>`; }).join('')}</tbody></table>`
      : `<div class="empty">${ico('check')}<p>Todos os itens desta loja já têm EAN.</p></div>`)}`);
});

/* ============ Listas, notas e gastos ============ */
wdef('D-40', '/listas', { name: 'Minhas listas', us: ['US-04.01', 'US-04.02'], rn: ['RN-13', 'RN-14'], req: ['REQ-050', 'REQ-051'], notes: 'Listas em grade, cada uma com melhor loja única e quanto dividir economiza.' }, () => wshell('D-40', `
  <div class="h1row"><h1 class="h1">Minhas listas</h1><button class="btn s sm" ${act('sheet', 'newlist')}>${ico('plus')}Nova lista</button></div>
  ${S.session !== 'conta' ? `<button class="banner" ${go('D-02')}>${ico('finger')}<span>Salvas neste navegador. <b>Crie conta</b> para não perder.</span>${ico('next')}</button>` : ''}
  <div class="wlcards">${S.lists.map((l) => { const q = quote(l.items); const n = l.items.reduce((a, i) => a + i.qty, 0); return `<button class="lcard" ${go('D-42', { list: l.id })}>
    <div class="flex"><p class="b lg grow">${esc(l.nome)}</p><span class="meta tnum">${l.items.length} produtos · ${n} un.</span></div>
    <div class="thumbs">${l.items.slice(0, 7).map((i) => photo(prodByEan(i.ean), 'xs')).join('')}</div>
    ${q.ref ? `<div class="lsum"><span class="meta">Uma loja</span><b class="tnum">${brl(q.ref.total)}</b><span class="meta">${q.ref.s.nome}${q.partial ? ` · ${q.ref.found} de ${l.items.length}` : ''}</span></div>
    <div class="lsum"><span class="meta">Dividindo</span>${price(q.splitTotal, { menor: true })}<span class="chip menor tnum">−${brl(Math.max(0, q.saving))}</span></div>` : '<p class="meta">Adicione produtos para cotar</p>'}</button>`; }).join('')}</div>`));

wdef('D-42', '/listas/lista', { name: 'Lista · cotação', us: ['US-04.01', 'US-04.02', 'US-04.03'], rn: ['RN-13'], req: ['REQ-051'], notes: 'Itens editáveis à esquerda; cotação ao lado com alternância Uma loja / Dividir entre lojas (pílula desliza). Item sem preço recente aparece como faltando, nunca estimado (RN-13).' }, () => {
  const l = listOf(); const q = quote(l.items); const ref = q.ref;
  const right = !S.wsplit
    ? q.byStore.map((r, i) => `<div class="qrow${i === 0 ? ' best' : ''}"><div class="grow"><p class="b">${r.s.nome} ${i === 0 ? chip('melhor loja', 'menor') : ''}</p><p class="meta tnum">${r.found} de ${l.items.length} itens · ${fmtKm(distOf(r.s.id))}</p><div class="cov"><i style="width:${r.cov * 100}%"></i></div>${r.missing.length ? `<p class="miss">sem preço: ${r.missing.map((e) => prodByEan(e).titulo.split(' ').slice(0, 2).join(' ')).join(', ')}</p>` : ''}</div>${price(r.total, { menor: i === 0 })}</div>`).join('')
    : `<div class="splitsum"><div><span class="meta">Dividindo em ${q.split.length} lojas</span>${price(q.splitTotal, { menor: true, cls: 'xl' })}</div>${ref ? `<div class="save"><b class="tnum">−${brl(Math.max(0, q.saving))}</b><span class="tnum">${pct(-Math.max(0, q.saving) / ref.total)} vs tudo no ${ref.s.nome} (${brl(ref.total)})</span></div>` : ''}</div>
      ${q.split.map(([sid, its]) => `<div class="card list grp"><div class="li head"><span class="b">${storeById(sid).nome}</span><span class="meta">${fmtKm(distOf(sid))}</span><span class="sp"></span><b class="tnum">${brl(its.reduce((a, i) => a + i.price * i.qty, 0))}</b></div>${its.map((i) => `<div class="li"><div class="grow"><p class="b">${esc(prodByEan(i.ean).titulo)}</p><p class="meta tnum">${i.qty} × ${brl(i.price)}</p></div>${price(i.price * i.qty, { menor: true })}</div>`).join('')}</div>`).join('')}`;
  return wshell('D-40', `<div class="wcrumb"><button ${go('D-40')}>Minhas listas</button>›<span>${esc(l.nome)}</span></div>
  <div class="wtwo r">
    <section class="wcard"><div class="sec"><h2>${esc(l.nome)}</h2><span>${l.items.length} produtos</span></div>
      <table class="wt"><tbody>${l.items.map((i) => { const p = prodByEan(i.ean); return `<tr><td><div class="flex">${photo(p, 'xs')}<b>${esc(p.titulo)}</b></div></td><td class="meta tnum">menor ${brl(bestOf(p.ean).price)}</td><td>${stepper(i.qty, i.ean)}</td><td class="r"><button class="ib sm ghost" ${act('rm', i.ean)} aria-label="Remover">${ico('trash')}</button></td></tr>`; }).join('')}</tbody></table>
      <button class="btn gh" ${go('D-11')}>${ico('plus')}Adicionar produto</button></section>
    <aside class="wsticky"><div class="seg"><span class="segpill ${S.wsplit ? 'r' : 'l'}"${vt('segpill')}></span><button class="${S.wsplit ? '' : 'on'}" ${act('wsplit', 'one')}>${ico('store')}Uma loja</button><button class="${S.wsplit ? 'on' : ''}" ${act('wsplit', 'split')}>${ico('split')}Dividir entre lojas</button></div>${right}</aside>
  </div>`);
});

wdef('D-50', '/notas', { name: 'Minhas notas + detalhe', us: ['US-01.09', 'US-04.04'], rn: ['RN-06', 'RN-14'], req: ['REQ-046', 'REQ-051'], notes: 'Lista de notas e cupom lado a lado (mestre-detalhe). Progresso de EAN por nota; CPF do consumidor descartado.' }, () => {
  const ns = allNotes(); const sel = ns.find((n) => n.id === S.sel.note) ? S.sel.note : ns[0].id;
  const n = noteDetail(sel); const s = storeById(n.store); const done = n.itens.filter((i) => i.ean).length;
  return wshell('D-50', `<div class="wnotes"><aside>
    <div class="h1row"><h1 class="h1">Minhas notas</h1><span class="meta">${S.session === 'conta' ? esc(S.email) : 'neste navegador'}</span></div>
    <button class="monthcard" ${go('D-52')}><div><span class="meta">Novembro</span>${price(ns.reduce((a, x) => a + x.total, 0), { cls: 'xl ink' })}<span class="meta tnum">${ns.length} notas</span></div>${ico('chart')}</button>
    ${ns.map((x) => `<button class="nrow2${x.id === sel ? ' on' : ''}" ${go('D-50', { note: x.id })}><div class="flex"><div class="grow"><p class="b">${storeById(x.store).nome}</p><p class="meta tnum">${when(x.d)} · ${dateOf(x.d)} · nº ${x.numero}</p></div><b class="tnum">${brl(x.total)}</b></div>${progress(x.ean, x.itens, { compact: true })}</button>`).join('')}
  </aside>
  <section><div class="receipt wreceipt"><p class="b">${s.razao}</p><p class="meta">CNPJ ${s.cnpj} · ${s.end} · ${s.bairro}</p><p class="meta tnum">NFC-e nº ${n.numero} · ${dateOf(n.d)} ${n.hora || ''}</p>
    <span class="chip meta">${ico('shield')}CPF do consumidor descartado</span><div class="hr dash"></div>
    ${n.itens.map((i) => { const p = i.ean && prodByEan(i.ean); return `<div class="ritem"><div class="grow"><p>${esc(p ? p.titulo : humanize(i.desc))}</p><p class="meta tnum">${i.qtd} × ${brl(i.v)} ${i.ean ? originChip(i.origem) : '<span class="chip warn">sem EAN</span>'}</p></div><b class="tnum">${brl(i.v * i.qtd)}</b></div>`; }).join('')}
    ${n.more ? `<p class="meta center">+ ${n.more} itens</p>` : ''}<div class="hr dash"></div><div class="flex"><b>Total</b><span class="sp"></span><b class="tnum">${brl(n.total)}</b></div></div>
    ${sel === 'n-scan' ? progress(done, n.itens.length) : progress(n.ean, n.count)}
    <div class="flex">${n.itens.some((i) => !i.ean) ? `<button class="btn p sm" ${go('D-23', { cod: (n.itens.find((i) => !i.ean) || {}).cod })}>${ico('barcode')}Vincular pendentes</button>` : ''}<button class="btn gh sm" ${act('toast', 'Abrindo consulta pública da SEFAZ PR')}>Ver na SEFAZ</button></div></section></div>`);
});

wdef('D-52', '/gastos', { name: 'Gastos', us: ['US-04.05', 'US-04.06'], rn: ['RN-14'], req: ['REQ-051'], notes: 'Painel com mês atual, 6 meses, ranking por loja e por categoria — derivado de Minhas notas, privado ao titular.' }, () => {
  const max = Math.max(...MONTHS.map((m) => m[1])); const byStore = {}; allNotes().forEach((n) => { byStore[n.store] = (byStore[n.store] || 0) + n.total; });
  const st = Object.entries(byStore).sort((a, b) => b[1] - a[1]); const cur = MONTHS[MONTHS.length - 1][1], prev = MONTHS[MONTHS.length - 2][1];
  return wshell('D-50', `<div class="wcrumb"><button ${go('D-50')}>Minhas notas</button>›<span>Gastos</span></div>
  <div class="wthree">
    <div class="wcard"><span class="meta">Novembro até hoje</span>${price(cur, { cls: 'xl ink' })}<p class="meta tnum">${pct((cur - prev) / prev)} vs outubro inteiro (${brl(prev)})</p>
      <div class="bars mt16">${MONTHS.map(([m, v], i) => `<div class="bcol"><span class="bv tnum">${Math.round(v)}</span><i class="${i === MONTHS.length - 1 ? 'cur' : ''}" style="height:${(v / max) * 100}%"></i><span>${m}</span></div>`).join('')}</div></div>
    <div class="wcard"><div class="sec"><h2>Por loja</h2></div>${st.map(([sid, v]) => `<div class="hbar"><span class="b">${storeById(sid).nome}</span><span class="tnum">${brl(v)}</span><div class="track"><i style="width:${(v / st[0][1]) * 100}%"></i></div></div>`).join('')}</div>
    <div class="wcard"><div class="sec"><h2>Por categoria</h2></div>${SPEND_CATS.map(([c, v]) => `<div class="hbar"><span>${c}</span><span class="tnum">${brl(v)}</span><div class="track"><i style="width:${(v / SPEND_CATS[0][1]) * 100}%"></i></div></div>`).join('')}</div>
  </div>`);
});

/* ============ Conta ============ */
wdef('D-51', '/perfil', { name: 'Perfil, pontos e privacidade', us: ['US-01.03', 'US-01.05', 'US-01.12'], rn: ['RN-06', 'RN-14'], req: ['REQ-050', 'REQ-052'], notes: 'Uma página em três colunas: identidade e pontos; preferências (GPS, bairro, raio, alertas, opt-in loja); privacidade com exportar e excluir (digitar EXCLUIR).' }, () => wshell('', `<div class="wthree">
  <section class="wcard">
    ${S.session === 'conta' ? `<div class="idcard flat"><span class="avatar">${esc(S.email[0].toUpperCase())}</span><div class="grow"><p class="b">${esc(S.email)}</p><p class="meta">conta desde hoje</p></div></div>`
      : `<div class="idcard flat"><span class="avatar anon">${ico('finger')}</span><div class="grow"><p class="b">Visitante</p><p class="meta mono">fp_7c1e…a9d4 · IP 177.92.x.x</p></div></div><button class="btn p" ${go('D-02')}>Criar conta</button>`}
    <div class="ptshead"><span class="meta">${S.session === 'conta' ? 'Seu saldo' : 'Guardados neste navegador'}</span><b class="tnum">${S.points}</b><span class="meta">pontos</span></div>
    <div class="earn"><div>${ico('qr')}<b>+10</b><span>nota nova</span></div><div>${ico('barcode')}<b>+5</b><span>código vinculado</span></div></div>
    <div class="card list mt12">${S.ledger.slice(0, 4).map(([t, v, d]) => `<div class="li"><div class="grow"><p class="b">${t}</p><p class="meta">${d}</p></div><b class="tnum g">+${v}</b></div>`).join('')}</div>
  </section>
  <section class="wcard"><div class="sec"><h2>Preferências</h2></div>
    <div class="flex mb12">${ico('nav')}<div class="grow"><p class="b">Usar minha localização</p><p class="meta">${S.gps ? 'GPS ativo' : 'bairro ' + S.bairro}</p></div>${toggle(S.gps, 'gps', 'GPS')}</div>
    <div class="chips wrap">${['Centro', 'Águas Belas', 'Aviação', 'Boneca do Iguaçu', 'São Cristóvão'].map((b) => `<button class="chip${S.bairro === b && !S.gps ? ' on' : ''}" ${act('bairro', b)}>${b}</button>`).join('')}</div>
    <div class="sec"><h2>Raio padrão</h2><b class="tnum" id="rv">${S.radius} km</b></div><input type="range" min="1" max="30" value="${S.radius}" data-input="radius" class="range" aria-label="Raio">
    <div class="flex mt16">${ico('bell')}<div class="grow"><p class="b">Alertas de preço</p><p class="meta">quando algo da lista baixar</p></div>${toggle(S.alerts, 'alerts', 'Alertas')}</div>
    <div class="flex mt16">${ico('store')}<div class="grow"><p class="b">Mostrar minhas compras às lojas</p><p class="meta">só o que comprou nela + pontos, para bonificação</p></div>${toggle(S.optIn, 'optin', 'Opt-in loja')}</div>
  </section>
  <section class="wcard"><div class="sec"><h2>Privacidade</h2></div>
    <button class="btn s mb12" ${act('toast', 'Arquivo com seus dados enviado por e-mail')}>${ico('download')}Baixar meus dados</button>
    <p class="b">${S.session === 'conta' ? 'Excluir conta e dados' : 'Apagar dados deste navegador'}</p>
    <ul class="ticks bad mt8"><li>Minhas notas, listas e pontos</li><li>Registros de fingerprint e IP</li></ul>
    <ul class="ticks mt8 mb12"><li>Preços no índice público continuam, sem identificar você</li></ul>
    <label class="lbl">Digite EXCLUIR para confirmar</label><div class="field"><input data-input="del" value="${esc(S.del)}" placeholder="EXCLUIR"></div>
    <button class="btn danger" id="delbtn" ${act('delete')} ${S.del === 'EXCLUIR' ? '' : 'disabled'}>Apagar tudo</button>
    ${S.session === 'conta' ? `<button class="btn gh mt8" ${act('logout')}>${ico('logout')}Sair</button>` : ''}
  </section></div>`));

wdef('D-02', '/entrar', { name: 'Entrar ou criar conta', us: ['US-01.01', 'US-01.02', 'US-01.04'], rn: ['RN-14'], req: ['REQ-050', 'REQ-052'], notes: 'Abas Criar conta / Entrar. Merge do fingerprint explicado ao lado. Erro de login genérico (senha “errada”). Esqueci a senha responde igual exista ou não a conta.' }, () => {
  const sc = Math.min(4, (S.pw.length >= 8) + /\d/.test(S.pw) + /[A-Z]/.test(S.pw) + /[^\w]/.test(S.pw));
  const canGo = /.+@.+\..+/.test(S.emailIn) && S.pw.length >= 8 && S.lgpd; const criar = S.authTab !== 'entrar';
  return wshell('', `<div class="wauth"><aside class="wauth-l"><span class="wm md">${SYM}<b>notinhas</b><i>.shop</i></span>
    <h1 class="h1 mt16">Preço de verdade, das notas de quem compra.</h1>
    <div class="merge mt16">${ico('finger')}<div><p class="b">Vamos levar para sua conta</p><p class="meta tnum">${allNotes().length} notas · ${S.lists.length} listas · ${S.points} pontos deste navegador</p></div></div></aside>
  <section class="wcard pad-l"><div class="seg"><span class="segpill ${criar ? 'l' : 'r'}"${vt('segpill')}></span><button class="${criar ? 'on' : ''}" ${act('authtab', 'criar')}>Criar conta</button><button class="${criar ? '' : 'on'}" ${act('authtab', 'entrar')}>Entrar</button></div>
    ${S.loginErr && !criar ? `<div class="banner err">${ico('alert')}<span>E-mail ou senha incorretos.</span></div>` : ''}
    ${S.sent && !criar ? `<div class="banner">${ico('mail')}<span>Se houver conta com esse e-mail, enviamos um link que vale por 1 hora.</span></div>` : ''}
    <label class="lbl">E-mail</label><div class="field"><span>${ico('mail')}</span><input data-input="emailIn" type="email" value="${esc(S.emailIn)}" placeholder="voce@email.com"></div>
    <label class="lbl">Senha</label><div class="field"><span>${ico('lock')}</span><input data-input="pw" type="password" value="${esc(S.pw)}" placeholder="${criar ? '8 caracteres ou mais' : 'Sua senha'}"></div>
    ${criar ? `<div class="pwm s${sc}" id="pwm"><i></i><i></i><i></i><i></i></div>
    <button class="check${S.lgpd ? ' on' : ''}" ${act('lgpd')} role="checkbox" aria-checked="${S.lgpd}"><span>${ico('check')}</span>Li e aceito os termos e a política de privacidade</button>
    <button class="btn p mt12" id="signup" ${act('signup')} ${canGo ? '' : 'disabled'}>Criar conta</button>`
    : `<button class="lnk mt8" ${act('sent')}>Esqueci a senha</button><button class="btn p mt16" ${act('login')}>Entrar</button>`}
  </section></div>`);
});

wdef('D-54', '/listas/sem-credito', { name: 'Gate · contribuir', us: ['US-04.02'], rn: [], req: ['REQ-052'], notes: 'Pedido suave ao abrir uma cotação com crédito esgotado; busca de preço continua livre.' }, () => wshell('D-40', `<div class="wcenter"><div class="wcard state pad-l"><span class="sticon">${ico('award')}</span><h2>Suas cotações do mês acabaram</h2>
  <p>Uma nota ou três códigos de barras liberam mais 10 cotações. A busca de preço continua livre.</p><div class="meter lg"><i class="full" style="width:100%"></i></div>
  <div class="flex mt8"><button class="btn p sm" ${go('D-20')}>${ico('qr')}Depositar uma nota</button><button class="btn s sm" ${go('D-23')}>${ico('barcode')}Vincular 3 códigos</button><button class="btn gh sm" ${go('D-10')}>Agora não</button></div></div></div>`));

/* fluxos desktop na galeria (antes do ADM) */
FLOWS.splice(FLOWS.findIndex((f) => f.id === 'adm'), 0,
  { id: 'w1', n: 'WEB 1', title: 'Desktop · Produtos e preços', desc: 'Mesmo modelo do celular no navegador: Home em seções da altura da janela com rolagem horizontal, busca com filtros laterais e produto em duas colunas.', steps: ['D-10', 'D-11', 'D-14'], web: true },
  { id: 'w2', n: 'WEB 2', title: 'Desktop · Contribuir nota e EAN', desc: 'Foto arrastada, link colado ou webcam → leitura → vínculo de EAN com sugestões ao lado → foto.', steps: ['D-20', 'D-25', 'D-22', 'D-23', 'D-24', 'D-27'], web: true },
  { id: 'w3', n: 'WEB 3', title: 'Desktop · Estabelecimentos', desc: 'Ranking ao lado do mapa grande; vitrine com abas e tabela de itens sem EAN.', steps: ['D-31', 'D-33'], web: true },
  { id: 'w4', n: 'WEB 4', title: 'Desktop · Listas, notas e gastos', desc: 'Lista e cotação lado a lado; notas em mestre-detalhe; painel de gastos.', steps: ['D-40', 'D-42', 'D-50', 'D-52'], web: true },
  { id: 'w5', n: 'WEB 5', title: 'Desktop · Conta, pontos e privacidade', desc: 'Perfil em três colunas, entrar/criar conta em abas e gate de contribuição.', steps: ['D-51', 'D-02', 'D-54'], web: true },
);
