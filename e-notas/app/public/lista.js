const statusEl = document.getElementById('status');
const buscaItensEl = document.getElementById('busca-itens');
const buscaEanEl = document.getElementById('busca-ean');
const buscaVitrineEl = document.getElementById('busca-vitrine');
const buscaVitrineItensEl = document.getElementById('busca-vitrine-itens');
const buscaProdutosEl = document.getElementById('busca-produtos');
const buscaNotasEl = document.getElementById('busca-notas');
const buscaNotaItensEl = document.getElementById('busca-nota-itens');
const filtroNotaEl = document.getElementById('filtro-nota');
const modalEanEl = document.getElementById('modal-ean');
const modalEanMetaEl = document.getElementById('modal-ean-meta');
const formEanEl = document.getElementById('form-ean');
const eanEmpresaEl = document.getElementById('ean-empresa');
const eanUnidadeEl = document.getElementById('ean-unidade');
const eanBarrasEl = document.getElementById('ean-barras');
const eanFormStatusEl = document.getElementById('ean-form-status');
const eanCamStatusEl = document.getElementById('ean-cam-status');
const vitrineListaEl = document.getElementById('vitrine-lista');
const vitrineDetalheEl = document.getElementById('vitrine-detalhe');
const produtosListaEl = document.getElementById('produtos-lista');
const produtoDetalheEl = document.getElementById('produto-detalhe');
const produtoInfoEl = document.getElementById('produto-info');
const produtoTimelineEl = document.getElementById('produto-timeline');
const countProdutoPrecosEl = document.getElementById('count-produto-precos');
const vitrineGridEl = document.getElementById('vitrine-grid');
const produtosGridEl = document.getElementById('produtos-grid');
const countProdutosEl = document.getElementById('count-produtos');
const vitrineLojaInfoEl = document.getElementById('vitrine-loja-info');
const vitrineItensEl = document.getElementById('vitrine-itens');
const notasListaEl = document.getElementById('notas-lista');
const notasDetalheEl = document.getElementById('notas-detalhe');
const notasGridEl = document.getElementById('notas-grid');
const notaInfoEl = document.getElementById('nota-info');
const notaItensEl = document.getElementById('nota-itens');
const tabs = [...document.querySelectorAll('.tab')];
const subtabs = [...document.querySelectorAll('.subtab')];
const panels = {
  empresas: document.getElementById('panel-empresas'),
  produtos: document.getElementById('panel-produtos'),
  notas: document.getElementById('panel-notas'),
};

let allEmpresas = [];
let allNotas = [];
let allItens = [];
let allCodigosBarras = [];
let filtroNotaId = null;
let filtroNotaLabel = '';
let itensSub = 'lista';
let lojaAbertaId = null;
let produtoAbertaKey = null;
let notaAbertaId = null;
let eanScanner = null;
let eanScanBusy = false;
let modalContext = { empresaNome: '', itemNome: '' };
let empresasMap = null;
let empresasMarkers = null;
let empresasMarkerById = new Map();
let geocodePoll = null;

function setStatus(text, kind) {
  const msg = String(text || '').trim();
  statusEl.hidden = !msg;
  statusEl.textContent = msg;
  statusEl.className = 'status' + (kind ? ` ${kind}` : '');
}

function setEanFormStatus(text, kind) {
  eanFormStatusEl.textContent = text;
  eanFormStatusEl.className = 'status' + (kind ? ` ${kind}` : '');
}

function setEanCamStatus(text, kind) {
  eanCamStatusEl.textContent = text;
  eanCamStatusEl.className = 'status' + (kind ? ` ${kind}` : '');
}

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cell(v, cls) {
  const text = v == null || v === '' ? '—' : String(v);
  return `<td${cls ? ` class="${cls}"` : ''}>${esc(text)}</td>`;
}

function fotoThumb(url, alt) {
  const src = String(url || '').trim();
  if (!src) {
    return `<td class="foto-cell"><span class="foto-empty" aria-hidden="true"></span></td>`;
  }
  return `<td class="foto-cell"><img class="foto-thumb" src="${esc(src)}" alt="${esc(
    alt || '',
  )}" loading="lazy" width="40" height="40" /></td>`;
}

async function fetchJson(path, opts) {
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function setTab(name, { updateHash = true } = {}) {
  if (!panels[name]) name = 'empresas';
  for (const tab of tabs) {
    const on = tab.dataset.tab === name;
    tab.setAttribute('aria-selected', on ? 'true' : 'false');
  }
  for (const [key, panel] of Object.entries(panels)) {
    if (panel) panel.hidden = key !== name;
  }
  if (name === 'empresas') {
    if (lojaAbertaId != null) renderVitrineDetalhe(lojaAbertaId);
    else renderVitrineLista();
    requestAnimationFrame(() => {
      ensureEmpresasMap();
      empresasMap?.invalidateSize();
      renderEmpresasMap(allEmpresas);
    });
  }
  if (name === 'produtos') {
    if (produtoAbertaKey != null) renderProdutoDetalhe(produtoAbertaKey);
    else renderProdutosTab();
  }
  if (name === 'notas') {
    if (notaAbertaId != null) renderNotaDetalhe(notaAbertaId);
    else renderNotasLista();
  }
  if (updateHash) {
    const url = new URL(location.href);
    url.hash =
      name === 'empresas' && lojaAbertaId != null
        ? `loja-${lojaAbertaId}`
        : name === 'produtos' && produtoAbertaKey != null
          ? `produto-${encodeURIComponent(produtoAbertaKey)}`
          : name === 'notas' && notaAbertaId != null
            ? `nota-${notaAbertaId}`
            : name;
    if (name === 'notas' && notaAbertaId != null) {
      url.searchParams.set('nota', String(notaAbertaId));
    } else {
      url.searchParams.delete('nota');
    }
    if (name === 'empresas' && lojaAbertaId != null) {
      url.searchParams.set('loja', String(lojaAbertaId));
    } else {
      url.searchParams.delete('loja');
    }
    if (name === 'produtos' && produtoAbertaKey != null) {
      url.searchParams.set('produto', produtoAbertaKey);
    } else {
      url.searchParams.delete('produto');
    }
    history.replaceState(null, '', url);
  }
}

function ensureEmpresasMap() {
  if (empresasMap || typeof L === 'undefined') return empresasMap;
  empresasMap = L.map('empresas-mapa', {
    scrollWheelZoom: true,
  }).setView([-25.534, -49.206], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(empresasMap);
  empresasMarkers = L.layerGroup().addTo(empresasMap);
  return empresasMap;
}

function setMapStatus(text, kind) {
  const statusElMap = document.getElementById('empresas-mapa-status');
  const msg = String(text || '').trim();
  statusElMap.hidden = !msg;
  statusElMap.textContent = msg;
  statusElMap.className = 'status' + (kind ? ` ${kind}` : '');
}

function fitEmpresasOverview(rows) {
  if (!empresasMap) return;
  const bounds = rows
    .filter(
      (r) => r.lat != null && r.lng != null && !Number.isNaN(Number(r.lat)),
    )
    .map((r) => [Number(r.lat), Number(r.lng)]);
  if (bounds.length === 1) empresasMap.setView(bounds[0], 15);
  else if (bounds.length > 1) empresasMap.fitBounds(bounds, { padding: [28, 28] });
}

/** Centraliza o mapa no pin da empresa aberta (e abre o popup). */
function focusEmpresaPin(empresaId) {
  if (!empresasMap) return false;
  const id = Number(empresaId);
  const emp = allEmpresas.find((e) => Number(e.id) === id);
  if (!emp || emp.lat == null || emp.lng == null) return false;
  const lat = Number(emp.lat);
  const lng = Number(emp.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
  empresasMap.setView([lat, lng], 16, { animate: true });
  empresasMarkerById.get(id)?.openPopup();
  return true;
}

function renderEmpresasMap(rows) {
  if (typeof L === 'undefined') {
    setMapStatus('Mapa indisponível.', 'err');
    return;
  }
  ensureEmpresasMap();
  empresasMarkers.clearLayers();
  empresasMarkerById.clear();
  const withCoords = rows.filter(
    (r) => r.lat != null && r.lng != null && !Number.isNaN(Number(r.lat)),
  );
  for (const r of withCoords) {
    const lat = Number(r.lat);
    const lng = Number(r.lng);
    const marker = L.marker([lat, lng]);
    marker.bindPopup(
      `<strong>${esc(r.nome || r.cnpj || `#${r.id}`)}</strong><br>${esc(r.endereco || '')}<br><button type="button" class="linkish" data-open-loja="${esc(r.id)}">Abrir</button>`,
    );
    marker.on('popupopen', () => {
      const btn = document.querySelector(`[data-open-loja="${String(r.id)}"]`);
      btn?.addEventListener(
        'click',
        (ev) => {
          ev.preventDefault();
          openVitrineLoja(r.id);
        },
        { once: true },
      );
    });
    empresasMarkers.addLayer(marker);
    empresasMarkerById.set(Number(r.id), marker);
  }
  if (lojaAbertaId != null) focusEmpresaPin(lojaAbertaId);
  else fitEmpresasOverview(withCoords);
  const missing = rows.length - withCoords.length;
  if (!rows.length) {
    setMapStatus('');
  } else if (withCoords.length === 0) {
    setMapStatus('Localizando estabelecimentos…');
    startGeocodePoll();
  } else if (missing > 0) {
    setMapStatus('');
    startGeocodePoll();
  } else {
    setMapStatus('');
    stopGeocodePoll();
  }
}

function stopGeocodePoll() {
  if (geocodePoll) {
    clearInterval(geocodePoll);
    geocodePoll = null;
  }
}

function startGeocodePoll() {
  if (geocodePoll) return;
  fetchJson('api/empresas/geocode', { method: 'POST' }).catch((err) =>
    console.warn(err),
  );
  let tries = 0;
  geocodePoll = setInterval(async () => {
    tries += 1;
    try {
      const data = await fetchJson('api/empresas');
      allEmpresas = data.empresas || [];
      renderEmpresas(allEmpresas);
      const pending = allEmpresas.filter(
        (e) =>
          e.endereco &&
          String(e.endereco).trim() &&
          (e.lat == null || e.lng == null),
      );
      if (!pending.length || tries >= 20) stopGeocodePoll();
    } catch (err) {
      console.warn(err);
      if (tries >= 5) stopGeocodePoll();
    }
  }, 2500);
}

function renderEmpresas(rows) {
  const countEl = document.getElementById('count-empresas');
  if (countEl) countEl.textContent = `(${rows.length})`;
  if (!panels.empresas?.hidden) {
    renderEmpresasMap(rows);
    if (lojaAbertaId != null) renderVitrineDetalhe(lojaAbertaId);
    else renderVitrineLista();
  }
  if (!panels.produtos?.hidden) {
    if (produtoAbertaKey != null) renderProdutoDetalhe(produtoAbertaKey);
    else renderProdutosTab();
  }
}

function emissaoSortKey(emissao) {
  const m = String(emissao ?? '').match(
    /(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/,
  );
  if (!m) return 0;
  return Number(`${m[3]}${m[2]}${m[1]}${m[4] || '00'}${m[5] || '00'}`);
}

function formatPreco(v) {
  const raw = String(v ?? '').trim();
  if (!raw) return '—';
  if (/^R\$/i.test(raw)) return raw;
  return `R$ ${raw}`;
}

function parseValor(v) {
  const s = String(v ?? '')
    .replace(/R\$\s*/i, '')
    .trim();
  if (!s) return NaN;
  const n = Number(s.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

function produtoKey(r) {
  const ean = String(r.codigo_barras || '').trim();
  if (ean) return `ean:${ean}`;
  const nome = String(r.nome || '')
    .trim()
    .toLowerCase();
  if (nome) return `nome:${nome}`;
  return `cod:${String(r.codigo || '').trim()}`;
}

/** Catálogo home: 1 card por produto com menor preço (loja + data + foto). */
function catalogoProdutos() {
  const byKey = new Map();
  for (const r of allItens) {
    const key = produtoKey(r);
    if (key === 'cod:' || key === 'nome:') continue;
    const preco = parseValor(r.valor_unitario);
    if (!Number.isFinite(preco) || preco <= 0) continue;
    const sk = emissaoSortKey(r.nota_emissao);
    const prev = byKey.get(key);
    if (
      !prev ||
      preco < prev._preco ||
      (preco === prev._preco && sk > prev._sk)
    ) {
      byKey.set(key, {
        ...r,
        _key: key,
        _preco: preco,
        _sk: sk,
        empresa_nome:
          r.empresa_nome ||
          allEmpresas.find((e) => Number(e.id) === Number(r.empresa_id))
            ?.nome ||
          '',
      });
    }
  }
  return [...byKey.values()].sort((a, b) => {
    const fa = a.foto_url ? 0 : 1;
    const fb = b.foto_url ? 0 : 1;
    if (fa !== fb) return fa - fb;
    return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
  });
}

function searchTermsFrom(el) {
  const q = String(el?.value || '')
    .trim()
    .toLowerCase();
  return q ? q.split(/\s+/).filter(Boolean) : [];
}

function catalogoLoja(empresaId) {
  const rows = allItens.filter(
    (i) => Number(i.empresa_id) === Number(empresaId),
  );
  const byKey = new Map();
  for (const r of rows) {
    const key = r.codigo_barras
      ? `ean:${r.codigo_barras}`
      : `cod:${String(r.codigo || '').trim()}`;
    const sk = emissaoSortKey(r.nota_emissao);
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, { ...r, _sk: sk, obs: 1 });
      continue;
    }
    prev.obs += 1;
    if (sk >= prev._sk) {
      byKey.set(key, { ...r, _sk: sk, obs: prev.obs });
    }
  }
  return [...byKey.values()].sort((a, b) =>
    String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'),
  );
}

function lojaHaystack(r) {
  return [r.id, r.nome, r.cnpj, r.endereco]
    .map((v) => String(v ?? '').toLowerCase())
    .join(' ');
}

function renderProdutosTab() {
  produtoAbertaKey = null;
  if (produtosListaEl) produtosListaEl.hidden = false;
  if (produtoDetalheEl) produtoDetalheEl.hidden = true;
  const catalogo = catalogoProdutos();
  const terms = searchTermsFrom(buscaProdutosEl);
  const rows = terms.length
    ? catalogo.filter((r) => {
        const hay = [
          r.nome,
          r.codigo_barras,
          r.codigo,
          r.empresa_nome,
          r.valor_unitario,
        ]
          .map((v) => String(v ?? '').toLowerCase())
          .join(' ');
        return terms.every((t) => hay.includes(t));
      })
    : catalogo;
  if (countProdutosEl) {
    countProdutosEl.textContent = `(${rows.length})`;
  }
  if (!produtosGridEl) return;
  produtosGridEl.innerHTML = rows.length
    ? rows
        .map((r) => {
          const foto = String(r.foto_url || '').trim();
          const img = foto
            ? `<img class="produto-img" src="${esc(foto)}" alt="" loading="lazy" width="160" height="160" />`
            : `<span class="produto-img produto-img-empty" aria-hidden="true"></span>`;
          const loja =
            r.empresa_nome ||
            allEmpresas.find((e) => Number(e.id) === Number(r.empresa_id))
              ?.nome ||
            'Mercado';
          const data = formatDataNota(r.nota_emissao) || '';
          return `<button type="button" class="produto-card" data-open-produto="${esc(
            r._key,
          )}">
            <div class="produto-media">${img}</div>
            <div class="produto-body">
              <h3 class="produto-nome">${esc(r.nome || 'Produto')}</h3>
              <p class="produto-preco">
                <span class="price-cell">${esc(formatPreco(r.valor_unitario))}</span>
                <span class="chip ok">menor</span>
              </p>
              <p class="produto-meta">${esc(loja)}${data ? ` · ${esc(data)}` : ''}</p>
            </div>
          </button>`;
        })
        .join('')
    : `<p class="hint">${catalogo.length ? 'Nenhum produto nesta busca.' : 'Sem produtos no índice.'}</p>`;
}

function historicoProduto(key) {
  const rows = allItens
    .filter((r) => produtoKey(r) === key)
    .map((r) => {
      const preco = parseValor(r.valor_unitario);
      return {
        ...r,
        _preco: preco,
        _sk: emissaoSortKey(r.nota_emissao),
        empresa_nome:
          r.empresa_nome ||
          allEmpresas.find((e) => Number(e.id) === Number(r.empresa_id))
            ?.nome ||
          '',
      };
    })
    .filter((r) => Number.isFinite(r._preco) && r._preco > 0);
  rows.sort((a, b) => b._sk - a._sk || a._preco - b._preco);
  return rows;
}

function renderProdutoDetalhe(key) {
  const hist = historicoProduto(key);
  if (!hist.length) {
    produtoAbertaKey = null;
    renderProdutosTab();
    return;
  }
  produtoAbertaKey = key;
  if (produtosListaEl) produtosListaEl.hidden = true;
  if (produtoDetalheEl) produtoDetalheEl.hidden = false;

  const menor = hist.reduce((best, r) =>
    !best || r._preco < best._preco ? r : best,
  );
  const head = hist.find((r) => String(r.foto_url || '').trim()) || hist[0];
  const foto = String(head.foto_url || '').trim();
  const img = foto
    ? `<img class="produto-img" src="${esc(foto)}" alt="" width="160" height="160" />`
    : `<span class="produto-img produto-img-empty" aria-hidden="true"></span>`;
  const ean = String(head.codigo_barras || '').trim();
  const codigos = [
    ...new Set(
      hist.map((r) => String(r.codigo || '').trim()).filter(Boolean),
    ),
  ];
  const mercados = new Set(
    hist.map((r) => String(r.empresa_id || '')).filter(Boolean),
  ).size;
  const metaParts = [];
  if (ean) metaParts.push(`EAN <span class="mono">${esc(ean)}</span>`);
  if (codigos.length) {
    metaParts.push(
      `Cód. ${codigos
        .slice(0, 3)
        .map((c) => esc(c))
        .join(', ')}${codigos.length > 3 ? '…' : ''}`,
    );
  }
  metaParts.push(
    `${hist.length} preço${hist.length === 1 ? '' : 's'} · ${mercados} mercado${
      mercados === 1 ? '' : 's'
    }`,
  );

  if (produtoInfoEl) {
    produtoInfoEl.innerHTML = `
    <div class="produto-hero-media">${img}</div>
    <div class="produto-hero-body">
      <h3 class="produto-hero-nome">${esc(head.nome || 'Produto')}</h3>
      <p class="produto-hero-meta">${metaParts.join('<br>')}</p>
      <p class="produto-hero-preco">
        <span class="price-cell">${esc(formatPreco(menor.valor_unitario))}</span>
        <span class="chip ok">menor</span>
      </p>
      <p class="produto-hero-meta">${esc(menor.empresa_nome || 'Mercado')}${
        formatDataNota(menor.nota_emissao)
          ? ` · ${esc(formatDataNota(menor.nota_emissao))}`
          : ''
      }</p>
    </div>`;
  }

  if (countProdutoPrecosEl) {
    countProdutoPrecosEl.textContent = `(${hist.length})`;
  }
  if (produtoTimelineEl) {
    produtoTimelineEl.innerHTML = hist
      .map((r) => {
        const isMenor = r._preco === menor._preco;
        const data = formatDataNota(r.nota_emissao) || '—';
        const loja = r.empresa_nome || 'Mercado';
        const nota = r.nota_numero
          ? `Nota ${r.nota_numero}`
          : r.nota_id
            ? `Nota #${r.nota_id}`
            : '';
        return `<li class="preco-timeline-item${isMenor ? ' is-menor' : ''}">
        <button type="button" class="preco-timeline-card${
          isMenor ? ' is-menor' : ''
        }" data-open-loja="${esc(r.empresa_id)}">
          <div class="preco-timeline-top">
            <p class="preco-timeline-data">${esc(data)}</p>
            <p class="preco-timeline-preco">
              <span class="price-cell">${esc(formatPreco(r.valor_unitario))}</span>
              ${isMenor ? '<span class="chip ok">menor</span>' : ''}
            </p>
          </div>
          <p class="preco-timeline-loja">${esc(loja)}</p>
          ${nota ? `<p class="preco-timeline-nota">${esc(nota)}</p>` : ''}
        </button>
      </li>`;
      })
      .join('');
  }
}

function openProduto(key) {
  renderProdutoDetalhe(key);
  setTab('produtos');
}

function closeProdutoDetalhe() {
  produtoAbertaKey = null;
  renderProdutosTab();
  setTab('produtos');
}

function renderVitrineLista() {
  lojaAbertaId = null;
  vitrineListaEl.hidden = false;
  vitrineDetalheEl.hidden = true;
  const terms = searchTermsFrom(buscaVitrineEl);
  const rows = terms.length
    ? allEmpresas.filter((r) => {
        const hay = lojaHaystack(r);
        return terms.every((t) => hay.includes(t));
      })
    : allEmpresas;
  const countEl = document.getElementById('count-empresas');
  if (countEl) countEl.textContent = `(${allEmpresas.length})`;
  vitrineGridEl.innerHTML = rows.length
    ? rows
        .map((r) => {
          const n = catalogoLoja(r.id).length;
          return `<button type="button" class="loja-card" data-open-loja="${esc(r.id)}">
            <h3 class="loja-nome">${esc(r.nome || r.cnpj || `Estabelecimento #${r.id}`)}</h3>
            <p class="loja-meta">${esc(r.endereco || '')}</p>
            <div class="loja-stats">
              <span class="chip">${n} item${n === 1 ? '' : 's'}</span>
            </div>
          </button>`;
        })
        .join('')
    : `<p class="hint">${allEmpresas.length ? 'Nada encontrado.' : 'Sem estabelecimentos.'}</p>`;
}

function renderVitrineDetalhe(empresaId) {
  const loja = allEmpresas.find((e) => Number(e.id) === Number(empresaId));
  if (!loja) {
    renderVitrineLista();
    return;
  }
  lojaAbertaId = Number(loja.id);
  vitrineListaEl.hidden = true;
  vitrineDetalheEl.hidden = false;
  const catalogo = catalogoLoja(loja.id);
  const q = String(buscaVitrineItensEl?.value || '')
    .trim()
    .toLowerCase();
  const terms = q ? q.split(/\s+/).filter(Boolean) : [];
  const rows = terms.length
    ? catalogo.filter((r) => {
        const hay = [r.nome, r.codigo, r.codigo_barras, r.valor_unitario]
          .map((v) => String(v ?? '').toLowerCase())
          .join(' ');
        return terms.every((t) => hay.includes(t));
      })
    : catalogo;

  vitrineLojaInfoEl.innerHTML = `
    <h3 class="loja-nome">${esc(loja.nome || loja.cnpj || `Estabelecimento #${loja.id}`)}</h3>
    <p class="loja-meta">${esc(loja.endereco || '')}</p>
    <p class="loja-meta mono">${esc(loja.cnpj || '')}</p>
    <div class="loja-stats">
      <span class="chip">${catalogo.length} item${catalogo.length === 1 ? '' : 's'}</span>
    </div>`;

  vitrineItensEl.innerHTML = rows.length
    ? rows
        .map(
          (r) =>
            `<tr>
              ${fotoThumb(r.foto_url, r.nome)}
              <td>${esc(r.nome || '—')}</td>
              <td class="mono">${esc(r.codigo_barras || '—')}</td>
              <td>${esc(r.codigo || '—')}</td>
              <td class="price-cell">${esc(formatPreco(r.valor_unitario))}</td>
              <td>${esc(formatDataNota(r.nota_emissao) || '—')}</td>
            </tr>`,
        )
        .join('')
    : `<tr><td colspan="6">${catalogo.length ? 'Nada encontrado.' : 'Sem itens.'}</td></tr>`;
}

function openVitrineLoja(empresaId) {
  buscaVitrineItensEl.value = '';
  renderVitrineDetalhe(empresaId);
  setTab('empresas');
  requestAnimationFrame(() => {
    empresasMap?.invalidateSize();
    focusEmpresaPin(empresaId);
  });
}

function closeVitrineLoja() {
  buscaVitrineItensEl.value = '';
  renderVitrineLista();
  setTab('empresas');
  requestAnimationFrame(() => {
    empresasMap?.invalidateSize();
    fitEmpresasOverview(allEmpresas);
  });
}

function notaLabel(n) {
  if (!n) return '';
  return n.numero ? `Nota ${n.numero}` : `Nota #${n.id}`;
}

function notaHaystack(n) {
  return [
    n.id,
    n.numero,
    n.serie,
    n.empresa_nome,
    n.empresa_cnpj,
    formatDataNota(n.emissao),
    n.valor_total,
    n.valor_a_pagar,
    n.qtd_itens,
    n.chave_acesso,
  ]
    .map((v) => String(v ?? '').toLowerCase())
    .join(' ');
}

function renderNotasLista() {
  notaAbertaId = null;
  notasListaEl.hidden = false;
  notasDetalheEl.hidden = true;
  buscaNotaItensEl.value = '';
  const q = String(buscaNotasEl?.value || '')
    .trim()
    .toLowerCase();
  const terms = q ? q.split(/\s+/).filter(Boolean) : [];
  const rows = terms.length
    ? allNotas.filter((n) => {
        const hay = notaHaystack(n);
        return terms.every((t) => hay.includes(t));
      })
    : allNotas;
  document.getElementById('count-notas').textContent = `(${allNotas.length})`;
  notasGridEl.innerHTML = rows.length
    ? rows
        .map((n) => {
          const data = formatDataNota(n.emissao) || '—';
          const total = formatPreco(n.valor_a_pagar || n.valor_total);
          const qtd = n.qtd_itens != null && n.qtd_itens !== '' ? n.qtd_itens : '—';
          return `<button type="button" class="loja-card" data-open-nota="${esc(n.id)}">
            <p class="loja-nome">${esc(notaLabel(n))}</p>
            <p class="loja-meta">${esc(n.empresa_nome || '—')}<br>${esc(data)}</p>
            <div class="loja-stats">
              <span class="chip">${esc(String(qtd))} itens</span>
              <span class="chip">${esc(total)}</span>
            </div>
          </button>`;
        })
        .join('')
    : `<p class="hint">${allNotas.length ? 'Nada encontrado.' : 'Sem notas.'}</p>`;
}

function renderNotaDetalhe(notaId) {
  const n = allNotas.find((x) => Number(x.id) === Number(notaId));
  if (!n) {
    renderNotasLista();
    return;
  }
  notaAbertaId = Number(n.id);
  notasListaEl.hidden = true;
  notasDetalheEl.hidden = false;
  const data = formatDataNota(n.emissao) || '—';
  const total = formatPreco(n.valor_a_pagar || n.valor_total);
  const desc = n.descontos ? formatPreco(n.descontos) : null;
  const outras = n.outras_despesas ? formatPreco(n.outras_despesas) : null;
  notaInfoEl.innerHTML = `
    <p class="loja-nome">${esc(notaLabel(n))}</p>
    <p class="loja-meta">${esc(n.empresa_nome || '—')}<br>${esc(data)}${
      n.serie ? ` · série ${esc(n.serie)}` : ''
    }</p>
    <div class="loja-stats">
      <span class="chip">${esc(String(n.qtd_itens ?? '—'))} itens</span>
      <span class="chip">${esc(total)}</span>
      ${desc ? `<span class="chip">desc. ${esc(desc)}</span>` : ''}
      ${outras ? `<span class="chip">outras ${esc(outras)}</span>` : ''}
    </div>`;

  const q = String(buscaNotaItensEl?.value || '')
    .trim()
    .toLowerCase();
  const terms = q ? q.split(/\s+/).filter(Boolean) : [];
  let rows = allItens.filter((r) => Number(r.nota_id) === Number(n.id));
  if (terms.length) {
    rows = rows.filter((r) => {
      const hay = itemHaystack(r);
      return terms.every((t) => hay.includes(t));
    });
  }
  document.getElementById('count-notas').textContent = `(${rows.length}/${
    allItens.filter((r) => Number(r.nota_id) === Number(n.id)).length
  })`;
  notaItensEl.innerHTML = rows.length
    ? rows
        .map(
          (r) =>
            `<tr>${fotoThumb(r.foto_url, r.nome)}${cell(r.nome)}${cell(
              r.codigo_barras || '',
              'mono',
            )}${cell(r.codigo || '', 'mono')}${cell(
              [r.quantidade, r.unidade].filter(Boolean).join(' ') || '—',
            )}<td class="price-cell">${esc(
              formatPreco(r.valor_unitario),
            )}</td><td><button type="button" class="btn-link" data-vincular-ean data-empresa-id="${esc(
              r.empresa_id,
            )}" data-empresa-nome="${esc(r.empresa_nome || '')}" data-codigo="${esc(
              r.codigo,
            )}" data-nome="${esc(r.nome || '')}" data-ean="${esc(
              r.codigo_barras || '',
            )}">${r.codigo_barras ? 'EAN' : '+ EAN'}</button></td></tr>`,
        )
        .join('')
    : `<tr><td colspan="7">${
        allItens.some((r) => Number(r.nota_id) === Number(n.id))
          ? 'Nada encontrado.'
          : 'Sem itens nesta nota.'
      }</td></tr>`;
}

function openNota(notaId) {
  buscaNotaItensEl.value = '';
  renderNotaDetalhe(notaId);
  setTab('notas');
}

function closeNotaDetalhe() {
  buscaNotaItensEl.value = '';
  renderNotasLista();
  setTab('notas');
}

function formatDataNota(emissao) {
  const raw = String(emissao ?? '').trim();
  if (!raw) return '';
  const m = raw.match(
    /(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::\d{2})?)?/,
  );
  if (!m) return raw.replace(/\s*-\s*$/, '').trim();
  const data = `${m[1]}/${m[2]}/${m[3]}`;
  return m[4] != null ? `${data} às ${m[4]}:${m[5]}` : data;
}

function itemHaystack(r) {
  return [
    r.id,
    formatDataNota(r.nota_emissao),
    r.empresa_nome,
    r.nota_numero,
    r.nota_id,
    r.codigo,
    r.codigo_barras,
    r.nome,
    r.quantidade,
    r.unidade,
    r.valor_unitario,
    r.valor_total,
  ]
    .map((v) => String(v ?? '').toLowerCase())
    .join(' ');
}

function filterItens(rows) {
  let out = rows;
  if (filtroNotaId != null) {
    out = out.filter((r) => Number(r.nota_id) === Number(filtroNotaId));
  }
  const q = String(buscaItensEl?.value || '')
    .trim()
    .toLowerCase();
  if (!q) return out;
  const terms = q.split(/\s+/).filter(Boolean);
  return out.filter((r) => {
    const hay = itemHaystack(r);
    return terms.every((t) => hay.includes(t));
  });
}

function updateFiltroBanner() {
  if (!filtroNotaEl) return;
  if (filtroNotaId == null) {
    filtroNotaEl.hidden = true;
    filtroNotaEl.innerHTML = '';
    return;
  }
  filtroNotaEl.hidden = false;
  filtroNotaEl.innerHTML = `<strong>${esc(filtroNotaLabel || `nota #${filtroNotaId}`)}</strong> · <button type="button" id="limpar-filtro-nota" class="linkish">limpar</button>`;
  document.getElementById('limpar-filtro-nota')?.addEventListener('click', () => {
    clearFiltroNota();
  });
}

function clearFiltroNota() {
  filtroNotaId = null;
  filtroNotaLabel = '';
  updateFiltroBanner();
}

function openItensDaNota(notaId, label) {
  openNota(notaId);
  if (label) filtroNotaLabel = label;
}

function applyItensFilter() {
  /* Aba Itens removida; mantido no-op para callers legados. */
}

function eanHaystack(r) {
  return [r.id, r.empresa_nome, r.empresa_cnpj, r.codigo_unidade, r.codigo_barras]
    .map((v) => String(v ?? '').toLowerCase())
    .join(' ');
}

function applyEanFilter() {
  const countEanEl = document.getElementById('count-ean');
  const tableEl = document.getElementById('codigos-barras');
  if (!countEanEl || !tableEl) return;
  const q = String(buscaEanEl?.value || '')
    .trim()
    .toLowerCase();
  const terms = q ? q.split(/\s+/).filter(Boolean) : [];
  const rows = terms.length
    ? allCodigosBarras.filter((r) => {
        const hay = eanHaystack(r);
        return terms.every((t) => hay.includes(t));
      })
    : allCodigosBarras;
  countEanEl.textContent = `(${allCodigosBarras.length})`;
  tableEl.innerHTML = rows.length
    ? rows
        .map(
          (r) =>
            `<tr>${fotoThumb(r.foto_url, r.codigo_barras)}${cell(
              r.empresa_nome || r.empresa_cnpj,
            )}${cell(r.codigo_unidade)}${cell(r.codigo_barras, 'mono')}</tr>`,
        )
        .join('')
    : `<tr><td colspan="4">${allCodigosBarras.length ? 'Nada encontrado.' : 'Sem EANs.'}</td></tr>`;
}

async function stopEanScanner() {
  if (!eanScanner) return;
  try {
    const state = eanScanner.getState?.();
    if (state === 2 /* SCANNING */) {
      await eanScanner.stop();
    }
  } catch {
    /* ignore */
  }
  try {
    await eanScanner.clear();
  } catch {
    /* ignore */
  }
  eanScanner = null;
  eanScanBusy = false;
}

async function startEanScanner() {
  await stopEanScanner();
  if (typeof Html5Qrcode === 'undefined') {
    setEanCamStatus('Biblioteca de câmera indisponível.', 'err');
    return;
  }
  setEanCamStatus('Abrindo câmera…');
  eanScanner = new Html5Qrcode('ean-reader');
  try {
    await eanScanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 260, height: 140 },
        aspectRatio: 1.777,
      },
      onBarcodeScanned,
    );
    setEanCamStatus('Aponte para o código de barras.');
  } catch (err) {
    console.error(err);
    setEanCamStatus(
      'Não foi possível abrir a câmera. Use HTTPS ou digite o código.',
      'err',
    );
  }
}

async function onBarcodeScanned(decodedText) {
  if (eanScanBusy) return;
  const code = String(decodedText || '').trim();
  if (!code) return;
  eanScanBusy = true;
  eanBarrasEl.value = code;
  setEanCamStatus(`Lido: ${code}`, 'ok');
  try {
    await saveEan();
  } finally {
    setTimeout(() => {
      eanScanBusy = false;
    }, 1500);
  }
}

async function openCadastroEan({
  empresaId,
  empresaNome,
  codigo,
  nome,
  ean,
}) {
  modalContext = {
    empresaNome: empresaNome || '',
    itemNome: nome || '',
  };
  eanEmpresaEl.value = String(empresaId || '');
  eanUnidadeEl.value = codigo || '';
  eanBarrasEl.value = ean || '';
  setEanFormStatus('');
  document.getElementById('modal-ean-title').textContent = ean
    ? 'Editar código de barras'
    : 'Cadastrar código de barras';
  modalEanMetaEl.textContent = [
    empresaNome,
    codigo ? `unidade ${codigo}` : '',
    nome,
  ]
    .filter(Boolean)
    .join(' · ');
  modalEanEl.hidden = false;
  document.body.classList.add('modal-open');
  await startEanScanner();
  eanBarrasEl.focus();
}

async function closeCadastroEan() {
  modalEanEl.hidden = true;
  document.body.classList.remove('modal-open');
  setEanCamStatus('');
  setEanFormStatus('');
  await stopEanScanner();
}

async function saveEan() {
  const empresaId = Number(eanEmpresaEl.value);
  const codigoUnidade = eanUnidadeEl.value.trim();
  const codigoBarras = eanBarrasEl.value.trim();
  if (!empresaId || !codigoUnidade || !codigoBarras) {
    setEanFormStatus('Informe o código de barras.', 'err');
    return;
  }
  setEanFormStatus('Salvando…');
  try {
    await fetchJson('api/codigos-barras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa_id: empresaId,
        codigo_unidade: codigoUnidade,
        codigo_barras: codigoBarras,
      }),
    });
    setEanFormStatus('Salvo.', 'ok');
    await reloadCodigosBarras();
    await reloadItens();
    await closeCadastroEan();
  } catch (err) {
    setEanFormStatus(`Falha: ${err.message}`, 'err');
  }
}

function renderItens() {
  applyItensFilter();
}

buscaItensEl?.addEventListener('input', applyItensFilter);
buscaEanEl?.addEventListener('input', applyEanFilter);
buscaVitrineEl?.addEventListener('input', () => {
  lojaAbertaId = null;
  renderVitrineLista();
});
buscaProdutosEl?.addEventListener('input', () => {
  produtoAbertaKey = null;
  renderProdutosTab();
});
buscaVitrineItensEl?.addEventListener('input', () => {
  if (lojaAbertaId != null) renderVitrineDetalhe(lojaAbertaId);
});
document.getElementById('vitrine-voltar')?.addEventListener('click', () => {
  closeVitrineLoja();
});
document.getElementById('produto-voltar')?.addEventListener('click', () => {
  closeProdutoDetalhe();
});
vitrineGridEl?.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-open-loja]');
  if (!btn) return;
  openVitrineLoja(btn.dataset.openLoja);
});
produtosGridEl?.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-open-produto]');
  if (!btn) return;
  openProduto(btn.dataset.openProduto);
});
produtoTimelineEl?.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-open-loja]');
  if (!btn) return;
  openVitrineLoja(btn.dataset.openLoja);
});

for (const tab of tabs) {
  tab.addEventListener('click', () => {
    if (tab.dataset.tab === 'empresas') {
      lojaAbertaId = null;
      renderVitrineLista();
    }
    if (tab.dataset.tab === 'produtos') {
      produtoAbertaKey = null;
      renderProdutosTab();
    }
    if (tab.dataset.tab === 'notas') {
      notaAbertaId = null;
      renderNotasLista();
    }
    setTab(tab.dataset.tab);
  });
}

buscaNotasEl?.addEventListener('input', () => {
  if (notaAbertaId == null) renderNotasLista();
});
buscaNotaItensEl?.addEventListener('input', () => {
  if (notaAbertaId != null) renderNotaDetalhe(notaAbertaId);
});
document.getElementById('notas-voltar')?.addEventListener('click', () => {
  closeNotaDetalhe();
});
notasGridEl?.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-open-nota]');
  if (!btn) return;
  openNota(btn.dataset.openNota);
});

function onVincularEanClick(ev) {
  const btn = ev.target.closest('[data-vincular-ean]');
  if (!btn) return;
  openCadastroEan({
    empresaId: btn.dataset.empresaId,
    empresaNome: btn.dataset.empresaNome,
    codigo: btn.dataset.codigo,
    nome: btn.dataset.nome,
    ean: btn.dataset.ean,
  });
}

document.getElementById('itens')?.addEventListener('click', onVincularEanClick);
notaItensEl?.addEventListener('click', onVincularEanClick);

formEanEl.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  await saveEan();
});

modalEanEl.addEventListener('click', (ev) => {
  if (ev.target.closest('[data-close-ean]')) closeCadastroEan();
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && !modalEanEl.hidden) closeCadastroEan();
});

async function reloadCodigosBarras() {
  const data = await fetchJson('api/codigos-barras');
  allCodigosBarras = data.codigosBarras || [];
  if (!panels.produtos?.hidden) renderProdutosTab();
}

async function reloadItens() {
  const data = await fetchJson('api/itens');
  allItens = data.itens || [];
  if (notaAbertaId != null) renderNotaDetalhe(notaAbertaId);
  if (lojaAbertaId != null) renderVitrineDetalhe(lojaAbertaId);
  else if (!panels.empresas?.hidden) renderVitrineLista();
  if (!panels.produtos?.hidden) {
    if (produtoAbertaKey != null) renderProdutoDetalhe(produtoAbertaKey);
    else renderProdutosTab();
  }
}

function readRoute() {
  const params = new URLSearchParams(location.search);
  const nota = params.get('nota');
  const loja = params.get('loja');
  const produto = params.get('produto');
  const hash = (location.hash || '').replace(/^#/, '');
  if (nota) {
    notaAbertaId = Number(nota);
    return 'notas';
  }
  if (produto) {
    produtoAbertaKey = produto;
    return 'produtos';
  }
  if (loja) {
    lojaAbertaId = Number(loja);
    return 'empresas';
  }
  const notaHash = hash.match(/^nota-(\d+)$/);
  if (notaHash) {
    notaAbertaId = Number(notaHash[1]);
    return 'notas';
  }
  const produtoHash = hash.match(/^produto-(.+)$/);
  if (produtoHash) {
    try {
      produtoAbertaKey = decodeURIComponent(produtoHash[1]);
    } catch {
      produtoAbertaKey = produtoHash[1];
    }
    return 'produtos';
  }
  const lojaHash = hash.match(/^loja-(\d+)$/);
  if (lojaHash) {
    lojaAbertaId = Number(lojaHash[1]);
    return 'empresas';
  }
  if (hash === 'itens' || hash === 'codigos-barras') return 'produtos';
  if (hash === 'vitrine') return 'empresas';
  if (panels[hash]) return hash;
  return 'empresas';
}

async function load() {
  const tab = readRoute();
  try {
    const [empresas, notas, itens, eans] = await Promise.all([
      fetchJson('api/empresas'),
      fetchJson('api/notas'),
      fetchJson('api/itens'),
      fetchJson('api/codigos-barras'),
    ]);
    allEmpresas = empresas.empresas || [];
    allNotas = notas.notas || [];
    allItens = itens.itens || [];
    allCodigosBarras = eans.codigosBarras || [];
    const notaInicial = notaAbertaId;
    renderEmpresas(allEmpresas);
    renderProdutosTab();
    if (notaInicial != null) {
      const n = allNotas.find((x) => Number(x.id) === Number(notaInicial));
      if (n) renderNotaDetalhe(n.id);
      else renderNotasLista();
    } else {
      renderNotasLista();
    }
    let next = tab;
    if (tab === 'vitrine' || tab === 'itens') next = tab === 'itens' ? 'produtos' : 'empresas';
    setTab(next, { updateHash: true });
    setStatus('');
  } catch (err) {
    console.error(err);
    setStatus(err.message || 'Falha ao carregar', 'err');
  }
}

load();
