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
const modalFotoEl = document.getElementById('modal-foto');
const modalFotoImgEl = document.getElementById('modal-foto-img');
const formEanEl = document.getElementById('form-ean');
const eanEmpresaEl = document.getElementById('ean-empresa');
const eanUnidadeEl = document.getElementById('ean-unidade');
const eanBarrasEl = document.getElementById('ean-barras');
const eanFormStatusEl = document.getElementById('ean-form-status');
const eanCamStatusEl = document.getElementById('ean-cam-status');
const eanCaptureEl = document.getElementById('ean-capture');
const eanFileEl = document.getElementById('ean-file');
const btnEanTirarFotoEl = document.getElementById('btn-ean-tirar-foto');
const btnEanEscolherImagemEl = document.getElementById('btn-ean-escolher-imagem');
const btnEanSugerirEl = document.getElementById('btn-ean-sugerir');
const eanSuggestListEl = document.getElementById('ean-suggest-list');
const eanSuggestStatusEl = document.getElementById('ean-suggest-status');
/** Cache descrição → candidatos enrichment. */
const eanSuggestCache = new Map();
const vitrineListaEl = document.getElementById('vitrine-lista');
const vitrineDetalheEl = document.getElementById('vitrine-detalhe');
const produtosListaEl = document.getElementById('produtos-lista');
const produtoDetalheEl = document.getElementById('produto-detalhe');
const produtoInfoEl = document.getElementById('produto-info');
const produtoFotosEl = document.getElementById('produto-fotos');
const produtoFotosGridEl = document.getElementById('produto-fotos-grid');
const produtoFotosStatusEl = document.getElementById('produto-fotos-status');
const produtoFotosBuscarEl = document.getElementById('produto-fotos-buscar');
const produtoFotosAtualizarEl = document.getElementById(
  'produto-fotos-atualizar',
);
const produtoEanSuggestEl = document.getElementById('produto-ean-suggest');
const produtoEanSuggestBodyEl = document.getElementById(
  'produto-ean-suggest-body',
);
const produtoEanSuggestFormEl = document.getElementById(
  'produto-ean-suggest-form',
);
const produtoEanSuggestQEl = document.getElementById('produto-ean-suggest-q');
const produtoEanSuggestBuscarEl = document.getElementById(
  'produto-ean-suggest-buscar',
);
const produtoEanSuggestTitleEl = document.getElementById(
  'produto-ean-suggest-title',
);
const produtoEanSuggestWhyEl = document.getElementById(
  'produto-ean-suggest-why',
);
const produtoEanSuggestFecharEl = document.getElementById(
  'produto-ean-suggest-fechar',
);
const produtoTimelineEl = document.getElementById('produto-timeline');
const countProdutoPrecosEl = document.getElementById('count-produto-precos');
let produtoFotosEan = '';
let produtoFotosNome = '';
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
  prototipo: document.getElementById('panel-prototipo'),
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
let produtoEanSuggestGen = 0;
/** @type {EventSource | null} */
let produtoEanSuggestEs = null;
let notaAbertaId = null;
let eanScanner = null;
let eanScanBusy = false;
let modalContext = { empresaNome: '', itemNome: '', origem: 'manual' };
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
  if (!panels[name]) name = 'produtos';
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
  if (updateHash) {
    const url = new URL(location.href);
    url.hash =
      name === 'empresas' && lojaAbertaId != null
        ? `loja-${lojaAbertaId}`
        : name === 'produtos' && produtoAbertaKey != null
          ? `produto-${encodeURIComponent(produtoAbertaKey)}`
          : name;
    url.searchParams.delete('nota');
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
    const prog = eanProgressLoja(r.id);
    const progLine = prog.total
      ? `<span class="ean-progress-ok-txt">${prog.comEan}/${prog.total} EAN (${prog.pctOk}%)</span>`
      : '0 itens';
    marker.bindPopup(
      `<strong>${esc(r.nome || r.cnpj || `#${r.id}`)}</strong><br>${esc(r.endereco || '')}<br>${progLine}<br><button type="button" class="linkish" data-open-loja="${esc(r.id)}">Abrir</button>`,
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
  // remove # e ruído de NFC-e p/ URL/hash estáveis
  const nome = String(r.nome || '')
    .replace(/#/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (nome) return `nome:${nome}`;
  return `cod:${String(r.codigo || '').trim()}`;
}

/** Catálogo home: 1 card por produto com menor preço (loja + data + foto). Só com EAN (REQ-045). */
function catalogoProdutos() {
  const byKey = new Map();
  for (const r of allItens) {
    const ean = String(r.codigo_barras || '').trim();
    if (!ean) continue;
    const key = produtoKey(r);
    if (!key.startsWith('ean:')) continue;
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
    const key = produtoKey(r);
    if (key === 'cod:' || key === 'nome:') continue;
    const preco = parseValor(r.valor_unitario);
    if (!Number.isFinite(preco) || preco <= 0) continue;
    const sk = emissaoSortKey(r.nota_emissao);
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, { ...r, _key: key, _preco: preco, _sk: sk, obs: 1 });
      continue;
    }
    prev.obs += 1;
    if (sk >= prev._sk) {
      byKey.set(key, {
        ...r,
        _key: key,
        _preco: preco,
        _sk: sk,
        obs: prev.obs,
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

function lojaHaystack(r) {
  return [r.id, r.nome, r.cnpj, r.endereco]
    .map((v) => String(v ?? '').toLowerCase())
    .join(' ');
}

/** Progresso de vínculo EAN por estabelecimento (SKU interno únicos). */
function eanProgressLoja(empresaId) {
  const rows = allItens.filter(
    (i) => Number(i.empresa_id) === Number(empresaId),
  );
  const bySku = new Map();
  for (const r of rows) {
    const cod = String(r.codigo || '').trim();
    const key = cod || produtoKey(r);
    if (!key || key === 'cod:' || key === 'nome:') continue;
    const hasEan = Boolean(String(r.codigo_barras || '').trim());
    const prev = bySku.get(key);
    if (!prev) bySku.set(key, { hasEan });
    else if (hasEan) prev.hasEan = true;
  }
  const total = bySku.size;
  const comEan = [...bySku.values()].filter((x) => x.hasEan).length;
  const semEan = Math.max(0, total - comEan);
  const pctOk = total ? Math.round((comEan / total) * 100) : 0;
  const pctFalta = total ? 100 - pctOk : 0;
  return { total, comEan, semEan, pctOk, pctFalta };
}

function htmlEanProgress(empresaId) {
  const p = eanProgressLoja(empresaId);
  if (!p.total) {
    return `<div class="ean-progress ean-progress-empty">
      <p class="ean-progress-meta">0 itens</p>
    </div>`;
  }
  const label = `${p.comEan} de ${p.total} com código de barras (${p.pctOk}%)`;
  return `<div class="ean-progress" role="img" aria-label="${esc(label)}">
    <div class="ean-progress-bar" aria-hidden="true">
      <span class="ean-progress-ok" style="width:${p.pctOk}%"></span>
      <span class="ean-progress-miss" style="width:${p.pctFalta}%"></span>
    </div>
    <p class="ean-progress-meta">
      <span class="ean-progress-ok-txt">${p.comEan} com EAN (${p.pctOk}%)</span>
      <span class="ean-progress-sep">·</span>
      <span class="ean-progress-miss-txt">${p.semEan} sem (${p.pctFalta}%)</span>
      <span class="ean-progress-sep">·</span>
      <span>${p.total} item${p.total === 1 ? '' : 's'}</span>
    </p>
  </div>`;
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
  const countLista = document.getElementById('count-produtos-lista');
  if (countLista) countLista.textContent = `(${rows.length})`;
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
    : `<p class="hint">${
        catalogo.length
          ? 'Nenhum produto nesta busca.'
          : 'Sem produtos com código de barras. Vincule o EAN na vitrine do estabelecimento.'
      }</p>`;
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
  const heroMediaAttrs = foto
    ? ` class="produto-hero-media" data-open-foto="${esc(foto)}" role="button" tabindex="0" aria-label="Ampliar foto"`
    : ` class="produto-hero-media"`;
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
  if (ean) {
    metaParts.push(`Código de barras <span class="mono">${esc(ean)}</span>`);
  }
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

  const eanEditLabel = ean ? 'Editar código de barras' : 'Vincular código de barras';
  if (produtoInfoEl) {
    produtoInfoEl.innerHTML = `
    <div${heroMediaAttrs}>${img}</div>
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
      <p class="produto-hero-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-edit-ean>
          ${esc(eanEditLabel)}
        </button>
      </p>
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

  void loadProdutoFotos(ean, head.nome || '');
  if (!ean) void openProdutoEanSearch(head);
  else hideProdutoEanSearch();
}

function hideProdutoEanSearch() {
  stopProdutoEanSuggestStream();
  if (produtoEanSuggestEl) produtoEanSuggestEl.hidden = true;
  if (produtoEanSuggestFecharEl) produtoEanSuggestFecharEl.hidden = true;
  setProdutoEanSuggestBuscarLoading(false);
}

function openProdutoEanSearch(head, queryOverride) {
  void loadProdutoEanSuggestions(head, queryOverride, { edit: true });
  if (produtoEanSuggestEl) {
    produtoEanSuggestEl.hidden = false;
    produtoEanSuggestEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  produtoEanSuggestQEl?.focus();
}

function renderProdutoEanSuggestList(list, { empresaId, empresaNome, codigo, nome }) {
  if (!produtoEanSuggestBodyEl) return;
  if (!list.length) {
    produtoEanSuggestBodyEl.innerHTML =
      '<p class="hint">Sem sugestão de código de barras para esta pesquisa.</p>';
    return;
  }
  produtoEanSuggestBodyEl.innerHTML = `
    <p class="ean-suggest-inline-label">Resultados — toque para vincular</p>
    <ul class="ean-suggest-list ean-suggest-list-cards">
      ${list
        .map((c) => {
          const pct = Math.round((Number(c.score) || 0) * 100);
          const thumb = c.image_url
            ? `<img class="ean-suggest-card-img" src="${esc(c.image_url)}" alt="" loading="lazy" width="72" height="72" />`
            : `<span class="ean-suggest-card-img ean-suggest-card-img-empty" aria-hidden="true"></span>`;
          return `<li><button type="button" class="ean-suggest-card"
            data-aplicar-sugestao
            data-ean="${esc(c.ean)}"
            data-empresa-id="${esc(String(empresaId))}"
            data-empresa-nome="${esc(empresaNome)}"
            data-codigo="${esc(codigo)}"
            data-nome="${esc(nome)}">
            ${thumb}
            <span class="ean-suggest-card-body">
              <span class="ean-suggest-card-title">${esc(c.nome_canonico || '—')}</span>
              <span class="ean-suggest-card-ean mono">${esc(c.ean)}</span>
              <span class="ean-suggest-card-meta">${pct}% · ${esc(c.fonte || '')}</span>
            </span>
          </button></li>`;
        })
        .join('')}
    </ul>`;
}

function setProdutoEanSuggestBuscarLoading(on) {
  if (!produtoEanSuggestBuscarEl) return;
  produtoEanSuggestBuscarEl.disabled = Boolean(on);
  produtoEanSuggestBuscarEl.classList.toggle('is-busy', Boolean(on));
  produtoEanSuggestBuscarEl.setAttribute('aria-busy', on ? 'true' : 'false');
  produtoEanSuggestBuscarEl.textContent = on ? 'Buscando…' : 'Buscar';
}

function runProdutoEanSuggestSearch() {
  if (produtoAbertaKey == null) return;
  const hist = historicoProduto(produtoAbertaKey);
  const head = hist[0];
  if (!head) return;
  const q = String(produtoEanSuggestQEl?.value || '').trim();
  void loadProdutoEanSuggestions(head, q || head.nome, { edit: true });
}

let produtoEanSuggestSearchTimer = 0;
function scheduleProdutoEanSuggestSearch() {
  clearTimeout(produtoEanSuggestSearchTimer);
  produtoEanSuggestSearchTimer = setTimeout(runProdutoEanSuggestSearch, 400);
}

function stopProdutoEanSuggestStream() {
  if (produtoEanSuggestEs) {
    try {
      produtoEanSuggestEs.close();
    } catch {
      /* ignore */
    }
    produtoEanSuggestEs = null;
  }
}

function tagSi5Candidatos(list) {
  return (list || []).map((c) => ({
    ...c,
    fonte: c.fonte?.startsWith?.('ean-serp:')
      ? c.fonte
      : `ean-serp:${c.fonte || 'si5'}`,
  }));
}

function loadProdutoEanSuggestions(head, queryOverride, { edit = false } = {}) {
  if (!produtoEanSuggestEl || !produtoEanSuggestBodyEl) return;
  const ean = String(head?.codigo_barras || '').trim();
  const codigo = String(head?.codigo || '').trim();
  const nome = String(head?.nome || '').trim();
  const empresaId = head?.empresa_id;
  const gen = ++produtoEanSuggestGen;
  stopProdutoEanSuggestStream();
  if (!codigo || !nome || !empresaId) {
    hideProdutoEanSearch();
    produtoEanSuggestBodyEl.innerHTML = '';
    return;
  }
  if (ean && !edit) {
    hideProdutoEanSearch();
    return;
  }
  const empresaNome =
    head.empresa_nome ||
    allEmpresas.find((e) => Number(e.id) === Number(empresaId))?.nome ||
    '';
  const query = String(queryOverride ?? nome).trim() || nome;
  if (produtoEanSuggestTitleEl) {
    produtoEanSuggestTitleEl.textContent = ean
      ? 'Editar código de barras'
      : 'Pesquisar código de barras';
  }
  if (produtoEanSuggestWhyEl) {
    produtoEanSuggestWhyEl.hidden = Boolean(ean);
  }
  if (produtoEanSuggestFecharEl) {
    produtoEanSuggestFecharEl.hidden = false;
  }
  produtoEanSuggestEl.hidden = false;
  produtoEanSuggestBodyEl.dataset.suggestFor = codigo;
  produtoEanSuggestBodyEl.dataset.empresaId = String(empresaId);
  produtoEanSuggestBodyEl.dataset.empresaNome = empresaNome;
  produtoEanSuggestBodyEl.dataset.codigo = codigo;
  produtoEanSuggestBodyEl.dataset.nome = nome;
  if (produtoEanSuggestQEl && queryOverride == null) {
    produtoEanSuggestQEl.value = nome.replace(/#/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const ctx = { empresaId, empresaNome, codigo, nome };
  setProdutoEanSuggestBuscarLoading(true);
  produtoEanSuggestBodyEl.innerHTML =
    '<p class="hint ean-suggest-loading">Buscando sugestões de código de barras…</p>';

  const qs = new URLSearchParams({
    descricao: query,
    n: '100',
    enrich: '1',
  });
  const es = new EventSource(`api/enrichment/ean/si5/stream?${qs}`);
  produtoEanSuggestEs = es;
  let sawBatch = false;
  /** @type {Map<string, object>} */
  const mergedByEan = new Map();

  const finish = (errMsg) => {
    if (gen !== produtoEanSuggestGen) return;
    stopProdutoEanSuggestStream();
    setProdutoEanSuggestBuscarLoading(false);
    if (errMsg && !sawBatch) {
      produtoEanSuggestBodyEl.innerHTML = `<p class="hint status err">Falha ao sugerir: ${esc(
        errMsg,
      )}</p>`;
    } else if (!sawBatch) {
      produtoEanSuggestBodyEl.innerHTML =
        '<p class="hint">Sem sugestão de código de barras para esta pesquisa.</p>';
    }
  };

  const onPayload = (list) => {
    if (gen !== produtoEanSuggestGen) return;
    for (const c of list || []) {
      if (!c?.ean || (Number(c.score) || 0) < 0.35) continue;
      const prev = mergedByEan.get(c.ean);
      const next = {
        ...(prev || {}),
        ...c,
        image_url: c.image_url || prev?.image_url || null,
        nome_canonico: c.nome_canonico || prev?.nome_canonico || null,
        fonte: c.fonte?.startsWith?.('ean-serp:')
          ? c.fonte
          : `ean-serp:${c.fonte || 'si5'}`,
      };
      if (!prev || (Number(next.score) || 0) >= (Number(prev.score) || 0)) {
        mergedByEan.set(c.ean, next);
      } else {
        mergedByEan.set(c.ean, {
          ...next,
          score: prev.score,
          image_url: next.image_url || prev.image_url,
        });
      }
    }
    const tagged = [...mergedByEan.values()].sort(
      (a, b) => (Number(b.score) || 0) - (Number(a.score) || 0),
    );
    if (!tagged.length) return;
    sawBatch = true;
    renderProdutoEanSuggestList(tagged, ctx);
  };

  es.addEventListener('batch', (ev) => {
    try {
      const data = JSON.parse(ev.data || '{}');
      onPayload(data.candidatos || []);
    } catch {
      /* ignore */
    }
  });
  es.addEventListener('enrich', (ev) => {
    try {
      const data = JSON.parse(ev.data || '{}');
      onPayload(data.candidatos || []);
    } catch {
      /* ignore */
    }
  });
  es.addEventListener('done', (ev) => {
    try {
      const data = JSON.parse(ev.data || '{}');
      onPayload(data.candidatos || []);
    } catch {
      /* ignore */
    }
    finish();
  });
  es.addEventListener('fail', (ev) => {
    let msg = 'stream falhou';
    try {
      if (ev?.data) msg = JSON.parse(ev.data).error || msg;
    } catch {
      /* ignore */
    }
    finish(msg);
  });
  es.onerror = () => {
    if (gen !== produtoEanSuggestGen) return;
    // EventSource dispara onerror em reconnect; só finaliza se fechou de vez
    if (es.readyState === EventSource.CLOSED) {
      finish(sawBatch ? '' : 'conexão SSE fechada');
    }
  };
}

function setProdutoFotosStatus(msg, kind) {
  if (!produtoFotosStatusEl) return;
  if (!msg) {
    produtoFotosStatusEl.hidden = true;
    produtoFotosStatusEl.textContent = '';
    produtoFotosStatusEl.className = 'hint';
    return;
  }
  produtoFotosStatusEl.hidden = false;
  produtoFotosStatusEl.textContent = msg;
  produtoFotosStatusEl.className = `hint${kind ? ` ${kind}` : ''}`;
}

function labelFonteFoto(fonte) {
  const f = String(fonte || '').trim().toLowerCase();
  if (!f) return 'Outras';
  if (f === 'google-imagens' || f.startsWith('google')) return 'Google';
  if (f === 'openfoodfacts') return 'Open Food Facts';
  if (f === 'openbeautyfacts') return 'Open Beauty Facts';
  if (f === 'openproductsfacts') return 'Open Products Facts';
  if (f === 'upcitemdb') return 'UPCitemdb';
  if (f === 'local') return 'Local';
  if (f.includes('si5')) return 'SI5';
  return fonte;
}

function renderProdutoFotosGrid(imagens) {
  if (!produtoFotosGridEl) return;
  if (!imagens.length) {
    produtoFotosGridEl.innerHTML =
      '<p class="hint">Nenhuma foto ainda. Use Buscar fotos.</p>';
    return;
  }
  const order = [
    'google-imagens',
    'openfoodfacts',
    'openbeautyfacts',
    'openproductsfacts',
    'upcitemdb',
    'local',
  ];
  const rank = (fonte) => {
    const i = order.indexOf(String(fonte || '').trim());
    return i === -1 ? order.length : i;
  };
  const sorted = [...imagens].sort(
    (a, b) =>
      rank(a.fonte) - rank(b.fonte) ||
      (Number(a.ordem) || 0) - (Number(b.ordem) || 0),
  );
  produtoFotosGridEl.innerHTML = `<div class="ean-fotos-grid">${sorted
    .map((img) => {
      const src = String(img.path_local || '').trim();
      const sel = Boolean(img.selecionada);
      const fonte = labelFonteFoto(img.fonte);
      return `<button type="button" class="ean-foto-card${
        sel ? ' is-selected' : ''
      }" data-ean-img-id="${esc(img.id)}" aria-pressed="${
        sel ? 'true' : 'false'
      }" title="${esc(fonte)}">
        <img src="${esc(src)}" alt="" loading="lazy" width="112" height="112" />
        ${sel ? '<span class="chip ok">feed</span>' : ''}
        <span class="ean-foto-fonte">${esc(fonte)}</span>
      </button>`;
    })
    .join('')}</div>`;
}

async function loadProdutoFotos(ean, nome) {
  produtoFotosEan = String(ean || '').trim();
  if (nome != null) produtoFotosNome = String(nome || '').trim();
  if (!produtoFotosEl) return;
  if (!produtoFotosEan) {
    produtoFotosEl.hidden = true;
    if (produtoFotosGridEl) produtoFotosGridEl.innerHTML = '';
    setProdutoFotosStatus('');
    return;
  }
  produtoFotosEl.hidden = false;
  setProdutoFotosStatus('Carregando fotos…');
  try {
    const data = await fetchJson(
      `api/ean-imagens?codigo_barras=${encodeURIComponent(produtoFotosEan)}`,
    );
    const imagens = data.imagens || [];
    renderProdutoFotosGrid(imagens);
    setProdutoFotosStatus(
      imagens.length
        ? 'Toque numa foto para usar no feed.'
        : 'Sem candidatas — busque (APIs + Google Imagens).',
    );
  } catch (err) {
    setProdutoFotosStatus(`Falha: ${err.message}`, 'err');
  }
}

async function buscarProdutoFotos(force) {
  if (!produtoFotosEan) return;
  setProdutoFotosStatus(
    force
      ? 'Buscando de novo (APIs + Google Imagens)…'
      : 'Buscando fotos (APIs + Google Imagens)…',
  );
  try {
    const data = await fetchJson('api/ean-imagens/buscar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo_barras: produtoFotosEan,
        descricao: produtoFotosNome || '',
        force: Boolean(force),
      }),
      signal: AbortSignal.timeout(120_000),
    });
    const imgs = data.imagens || [];
    renderProdutoFotosGrid(imgs);
    const byFonte = new Map();
    for (const i of imgs) {
      const k = labelFonteFoto(i.fonte);
      byFonte.set(k, (byFonte.get(k) || 0) + 1);
    }
    const fonteResumo = [...byFonte.entries()]
      .map(([k, n]) => `${k} ${n}`)
      .join(' · ');
    const googleHint = data.google_error
      ? ` Google: ${data.google_error}`
      : '';
    setProdutoFotosStatus(
      data.cached || data.skipped
        ? `Cache: ${imgs.length} foto(s)${
            fonteResumo ? ` · ${fonteResumo}` : ''
          }. Use Atualizar p/ buscar de novo.${googleHint}`
        : `Baixadas: ${data.baixadas || 0}${
            fonteResumo ? ` · ${fonteResumo}` : ''
          }. Toque para escolher a do feed.${googleHint}`,
      data.google_error ? 'err' : '',
    );
    await reloadItens();
    if (produtoAbertaKey) renderProdutoDetalhe(produtoAbertaKey);
  } catch (err) {
    setProdutoFotosStatus(`Falha: ${err.message}`, 'err');
  }
}

async function selecionarProdutoFoto(id) {
  try {
    await fetchJson(`api/ean-imagens/${encodeURIComponent(id)}/selecionar`, {
      method: 'POST',
    });
    await reloadItens();
    if (produtoAbertaKey) renderProdutoDetalhe(produtoAbertaKey);
    else await loadProdutoFotos(produtoFotosEan);
  } catch (err) {
    setProdutoFotosStatus(`Falha ao selecionar: ${err.message}`, 'err');
  }
}

function openProduto(key) {
  produtoAbertaKey = key;
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
        .map(
          (r) => `<button type="button" class="loja-card" data-open-loja="${esc(r.id)}">
            <h3 class="loja-nome">${esc(r.nome || r.cnpj || `Estabelecimento #${r.id}`)}</h3>
            <p class="loja-meta">${esc(r.endereco || '')}</p>
            ${htmlEanProgress(r.id)}
          </button>`,
        )
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
    ${htmlEanProgress(loja.id)}`;

  const countVitrine = document.getElementById('count-vitrine-itens');
  if (countVitrine) countVitrine.textContent = `(${rows.length})`;

  const menores = new Map(
    catalogoProdutos().map((r) => [r._key, r._preco]),
  );

  if (!vitrineItensEl) return;
  const empresaNome = loja.nome || loja.cnpj || `Estabelecimento #${loja.id}`;
  vitrineItensEl.innerHTML = rows.length
    ? rows
        .map((r) => {
          const foto = String(r.foto_url || '').trim();
          const img = foto
            ? `<img class="produto-img" src="${esc(foto)}" alt="" loading="lazy" width="160" height="160" />`
            : `<span class="produto-img produto-img-empty" aria-hidden="true"></span>`;
          const data = formatDataNota(r.nota_emissao) || '';
          const isMenor =
            Number.isFinite(r._preco) && menores.get(r._key) === r._preco;
          const codigo = String(r.codigo || '').trim();
          const ean = String(r.codigo_barras || '').trim();
          const origem = String(r.ean_origem || '').trim();
          const origemChip = ean
            ? `<span class="chip ean-origem" title="Origem do vínculo">${esc(
                labelOrigemEan(origem),
              )}</span>`
            : '';
          const eanBtn = codigo
            ? `<button type="button" class="btn btn-ghost btn-ean" data-vincular-ean
                data-empresa-id="${esc(loja.id)}"
                data-empresa-nome="${esc(empresaNome)}"
                data-codigo="${esc(codigo)}"
                data-nome="${esc(r.nome || '')}"
                data-ean="${esc(ean)}"
              >${ean ? 'Editar código de barras' : 'Código de barras'}</button>`
            : '';
          const suggestBox =
            !ean && codigo && r.nome
              ? `<div class="ean-suggest-inline"
                   data-suggest-for="${esc(codigo)}"
                   data-empresa-id="${esc(loja.id)}"
                   data-empresa-nome="${esc(empresaNome)}"
                   data-codigo="${esc(codigo)}"
                   data-nome="${esc(r.nome || '')}">
                   <p class="hint ean-suggest-loading">Buscando sugestões de código de barras…</p>
                 </div>`
              : '';
          return `<article class="produto-card produto-card-loja">
            <button type="button" class="produto-card-hit" data-open-produto="${esc(
              r._key,
            )}">
              <div class="produto-media">${img}</div>
              <div class="produto-body">
                <h3 class="produto-nome">${esc(r.nome || 'Produto')}</h3>
                <p class="produto-preco">
                  <span class="price-cell">${esc(formatPreco(r.valor_unitario))}</span>
                  ${isMenor ? '<span class="chip ok">menor</span>' : ''}
                  ${origemChip}
                </p>
                <p class="produto-meta">${data ? esc(data) : ''}${
                  ean
                    ? ` · cód. barras ${esc(ean)}`
                    : ' · sem código de barras'
                }</p>
              </div>
            </button>
            ${eanBtn}
            ${suggestBox}
          </article>`;
        })
        .join('')
    : `<p class="hint">${catalogo.length ? 'Nenhum produto nesta busca.' : 'Sem produtos nesta loja.'}</p>`;
  void hydrateEanSuggestions(vitrineItensEl);
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
  /* Aba Notas removida. */
  notaAbertaId = null;
}

function renderNotaDetalhe() {
  /* Aba Notas removida. */
}

function openNota() {
  setTab('produtos');
}

function closeNotaDetalhe() {
  notaAbertaId = null;
  setTab('produtos');
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
  modalContext = { ...modalContext, origem: 'barcode_scan' };
  setEanCamStatus(`Lido: ${code}`, 'ok');
  try {
    await saveEan({ origem: 'barcode_scan' });
  } finally {
    setTimeout(() => {
      eanScanBusy = false;
    }, 1500);
  }
}

async function decodeEanFromFile(file) {
  if (!file || eanScanBusy) return;
  if (typeof Html5Qrcode === 'undefined') {
    setEanCamStatus('Biblioteca de câmera indisponível.', 'err');
    return;
  }
  setEanCamStatus('Lendo código da imagem…');
  try {
    await stopEanScanner();
    eanScanner = new Html5Qrcode('ean-reader');
    const text = await eanScanner.scanFile(file, true);
    await onBarcodeScanned(text);
    if (modalEanEl && !modalEanEl.hidden) await startEanScanner();
  } catch (err) {
    console.error(err);
    setEanCamStatus('Código não encontrado na imagem. Tente outra foto.', 'err');
    if (modalEanEl && !modalEanEl.hidden) await startEanScanner();
  } finally {
    if (eanCaptureEl) eanCaptureEl.value = '';
    if (eanFileEl) eanFileEl.value = '';
  }
}

function labelOrigemEan(origem) {
  const o = String(origem || '').trim();
  if (o === 'barcode_scan') return 'scan';
  if (o === 'sugestao') return 'sugestão';
  if (o === 'manual') return 'manual';
  return o || '—';
}

async function fetchEanSugestoes(descricao, { force = false } = {}) {
  const key = String(descricao || '')
    .trim()
    .toLowerCase();
  if (!key) return [];
  if (!force && eanSuggestCache.has(key)) {
    const cached = await eanSuggestCache.get(key);
    if (Array.isArray(cached) && cached.length) return cached;
    eanSuggestCache.delete(key);
  }
  const p = fetchJson('api/enrichment/ean/si5', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ descricao, n: 100, force: Boolean(force) }),
  }).then((data) => {
    const list = data.candidatos || [];
    if (!list.length) eanSuggestCache.delete(key);
    return list;
  });
  eanSuggestCache.set(
    key,
    p.catch((err) => {
      eanSuggestCache.delete(key);
      throw err;
    }),
  );
  return eanSuggestCache.get(key);
}

async function hydrateEanSuggestions(root) {
  const nodes = [...(root || document).querySelectorAll('[data-suggest-for]')];
  const concurrency = 3;
  let i = 0;
  async function worker() {
    while (i < nodes.length) {
      const el = nodes[i++];
      const nome = el.dataset.nome || '';
      if (!nome.trim()) {
        el.innerHTML = `<p class="hint">Sem descrição.</p>`;
        continue;
      }
      const list = await fetchEanSugestoes(nome);
      if (!list.length) {
        el.innerHTML = `<p class="hint">Sem sugestão de código de barras.</p>`;
        continue;
      }
      el.innerHTML = `
        <p class="ean-suggest-inline-label">Sugestões — toque para vincular</p>
        <ul class="ean-suggest-list ean-suggest-list-inline">
          ${list
            .slice(0, 4)
            .map((c) => {
              const pct = Math.round((Number(c.score) || 0) * 100);
              const thumb = c.image_url
                ? `<img class="ean-suggest-thumb" src="${esc(c.image_url)}" alt="" loading="lazy" width="36" height="36" />`
                : '';
              return `<li><button type="button" class="ean-suggest-btn"
                data-aplicar-sugestao
                data-ean="${esc(c.ean)}"
                data-empresa-id="${esc(el.dataset.empresaId || '')}"
                data-empresa-nome="${esc(el.dataset.empresaNome || '')}"
                data-codigo="${esc(el.dataset.codigo || '')}"
                data-nome="${esc(el.dataset.nome || '')}">
                ${thumb}
                <span class="ean-suggest-ean">${esc(c.ean)}</span>
                <span class="ean-suggest-nome">${esc(c.nome_canonico || '—')}</span>
                <span class="ean-suggest-meta">${pct}% · ${esc(c.fonte || '')}</span>
              </button></li>`;
            })
            .join('')}
        </ul>`;
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, nodes.length) }, () => worker()),
  );
}

async function aplicarSugestaoEan({
  empresaId,
  codigo,
  nome,
  ean,
}) {
  const empresa = Number(empresaId);
  const unidade = String(codigo || '').trim();
  const codigoBarras = String(ean || '').trim();
  if (!empresa || !unidade || !codigoBarras) {
    throw new Error('Dados incompletos para vincular');
  }
  await fetchJson('api/codigos-barras', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      empresa_id: empresa,
      codigo_unidade: unidade,
      codigo_barras: codigoBarras,
      descricao: nome || '',
      origem: 'sugestao',
    }),
  });
  await reloadCodigosBarras();
  await reloadItens();
}

function setEanSuggestStatus(msg, kind) {
  if (!eanSuggestStatusEl) return;
  eanSuggestStatusEl.textContent = msg || '';
  eanSuggestStatusEl.classList.toggle('ok', kind === 'ok');
  eanSuggestStatusEl.classList.toggle('err', kind === 'err');
}

function clearEanSuggestList() {
  if (!eanSuggestListEl) return;
  eanSuggestListEl.innerHTML = '';
  eanSuggestListEl.hidden = true;
}

function renderEanSuggestList(candidatos) {
  if (!eanSuggestListEl) return;
  eanSuggestListEl.innerHTML = '';
  if (!candidatos?.length) {
    eanSuggestListEl.hidden = true;
    return;
  }
  for (const c of candidatos) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ean-suggest-btn';
    btn.dataset.ean = c.ean;
    btn.dataset.origem = 'sugestao';
    const pct = Math.round((Number(c.score) || 0) * 100);
    const thumb = c.image_url
      ? `<img class="ean-suggest-thumb" src="${esc(c.image_url)}" alt="" loading="lazy" width="36" height="36" />`
      : '';
    btn.innerHTML = `
      ${thumb}
      <span class="ean-suggest-ean">${esc(c.ean)}</span>
      <span class="ean-suggest-nome">${esc(c.nome_canonico || '—')}</span>
      <span class="ean-suggest-meta">${pct}% · ${esc(c.fonte || '')} · vincular</span>
    `;
    li.appendChild(btn);
    eanSuggestListEl.appendChild(li);
  }
  eanSuggestListEl.hidden = false;
}

async function sugerirEanPorDescricao() {
  const nome = modalContext?.itemNome || '';
  if (!nome.trim()) {
    setEanSuggestStatus('Sem descrição do item para sugerir.', 'err');
    return;
  }
  setEanSuggestStatus('Buscando candidatos…');
  clearEanSuggestList();
  try {
    const data = await fetchJson('api/enrichment/ean/si5', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descricao: nome, n: 100 }),
    });
    const list = data.candidatos || [];
    if (!list.length) {
      setEanSuggestStatus(
        'Nenhum código de barras encontrado. Digite ou escaneie.',
        'err',
      );
      return;
    }
    renderEanSuggestList(list);
    setEanSuggestStatus(`${list.length} candidato(s). Toque para preencher.`, 'ok');
  } catch (err) {
    setEanSuggestStatus(`Falha: ${err.message}`, 'err');
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
    origem: 'manual',
  };
  eanEmpresaEl.value = String(empresaId || '');
  eanUnidadeEl.value = codigo || '';
  eanBarrasEl.value = ean || '';
  setEanFormStatus('');
  setEanSuggestStatus('');
  clearEanSuggestList();
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
  if (!ean && nome) {
    void sugerirEanPorDescricao();
  }
}

async function closeCadastroEan() {
  modalEanEl.hidden = true;
  document.body.classList.remove('modal-open');
  setEanCamStatus('');
  setEanFormStatus('');
  setEanSuggestStatus('');
  clearEanSuggestList();
  await stopEanScanner();
}

async function saveEan({ origem } = {}) {
  const empresaId = Number(eanEmpresaEl.value);
  const codigoUnidade = eanUnidadeEl.value.trim();
  const codigoBarras = eanBarrasEl.value.trim();
  const origemFinal =
    origem || modalContext?.origem || 'manual';
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
        descricao: modalContext?.itemNome || '',
        origem: origemFinal,
      }),
    });
    setEanFormStatus(`Salvo (${labelOrigemEan(origemFinal)}).`, 'ok');
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
produtoFotosBuscarEl?.addEventListener('click', () => {
  void buscarProdutoFotos(false);
});
produtoFotosAtualizarEl?.addEventListener('click', () => {
  void buscarProdutoFotos(true);
});
produtoFotosGridEl?.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-ean-img-id]');
  if (!btn) return;
  void selecionarProdutoFoto(btn.dataset.eanImgId);
});
vitrineGridEl?.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-open-loja]');
  if (!btn) return;
  openVitrineLoja(btn.dataset.openLoja);
});
function openFotoViewer(src) {
  const url = String(src || '').trim();
  if (!url || !modalFotoEl || !modalFotoImgEl) return;
  modalFotoImgEl.src = url;
  modalFotoImgEl.alt = 'Foto do produto';
  modalFotoEl.hidden = false;
  document.body.classList.add('modal-open');
}

function closeFotoViewer() {
  if (!modalFotoEl) return;
  modalFotoEl.hidden = true;
  if (modalFotoImgEl) {
    modalFotoImgEl.removeAttribute('src');
    modalFotoImgEl.alt = '';
  }
  if (modalEanEl?.hidden !== false) {
    document.body.classList.remove('modal-open');
  }
}

function handleOpenFotoClick(ev) {
  const fotoEl = ev.target.closest('[data-open-foto]');
  if (!fotoEl) return false;
  ev.preventDefault();
  ev.stopPropagation();
  openFotoViewer(fotoEl.dataset.openFoto);
  return true;
}

produtosGridEl?.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-open-produto]');
  if (!btn) return;
  openProduto(btn.dataset.openProduto);
});
vitrineItensEl?.addEventListener('click', (ev) => {
  const sug = ev.target.closest('[data-aplicar-sugestao]');
  if (sug) {
    ev.preventDefault();
    ev.stopPropagation();
    const label =
      sug.querySelector('.ean-suggest-ean')?.textContent || sug.dataset.ean;
    sug.disabled = true;
    sug.classList.add('is-busy');
    void aplicarSugestaoEan({
      empresaId: sug.dataset.empresaId,
      codigo: sug.dataset.codigo,
      nome: sug.dataset.nome,
      ean: sug.dataset.ean,
    })
      .then(() => {
        if (lojaAbertaId != null) renderVitrineDetalhe(lojaAbertaId);
        if (produtoAbertaKey != null) renderProdutoDetalhe(produtoAbertaKey);
      })
      .catch((err) => {
        sug.disabled = false;
        sug.classList.remove('is-busy');
        alert(`Falha ao vincular ${label}: ${err.message}`);
      });
    return;
  }
  if (ev.target.closest('[data-vincular-ean]')) {
    onVincularEanClick(ev);
    return;
  }
  const btn = ev.target.closest('[data-open-produto]');
  if (!btn) return;
  openProduto(btn.dataset.openProduto);
});
produtoEanSuggestFormEl?.addEventListener('submit', (ev) => {
  ev.preventDefault();
  clearTimeout(produtoEanSuggestSearchTimer);
  runProdutoEanSuggestSearch();
});
produtoEanSuggestQEl?.addEventListener('input', () => {
  scheduleProdutoEanSuggestSearch();
});

produtoEanSuggestEl?.addEventListener('click', (ev) => {
  const sug = ev.target.closest('[data-aplicar-sugestao]');
  if (!sug) return;
  ev.preventDefault();
  const label =
    sug.querySelector('.ean-suggest-card-ean, .ean-suggest-ean')?.textContent ||
    sug.dataset.ean;
  sug.disabled = true;
  sug.classList.add('is-busy');
  void aplicarSugestaoEan({
    empresaId: sug.dataset.empresaId,
    codigo: sug.dataset.codigo,
    nome: sug.dataset.nome,
    ean: sug.dataset.ean,
  })
    .then(() => {
      hideProdutoEanSearch();
      if (produtoAbertaKey != null) renderProdutoDetalhe(produtoAbertaKey);
      if (lojaAbertaId != null) renderVitrineDetalhe(lojaAbertaId);
    })
    .catch((err) => {
      sug.disabled = false;
      sug.classList.remove('is-busy');
      alert(`Falha ao vincular ${label}: ${err.message}`);
    });
});
produtoEanSuggestFecharEl?.addEventListener('click', () => {
  hideProdutoEanSearch();
});
produtoInfoEl?.addEventListener('click', (ev) => {
  if (handleOpenFotoClick(ev)) return;
  const editBtn = ev.target.closest('[data-edit-ean]');
  if (!editBtn || produtoAbertaKey == null) return;
  const head = historicoProduto(produtoAbertaKey)[0];
  if (!head) return;
  openProdutoEanSearch(head);
});
produtoInfoEl?.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Enter' && ev.key !== ' ') return;
  const fotoEl = ev.target.closest('[data-open-foto]');
  if (!fotoEl) return;
  ev.preventDefault();
  openFotoViewer(fotoEl.dataset.openFoto);
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

btnEanTirarFotoEl?.addEventListener('click', () => eanCaptureEl?.click());
btnEanEscolherImagemEl?.addEventListener('click', () => eanFileEl?.click());
btnEanSugerirEl?.addEventListener('click', () => {
  void sugerirEanPorDescricao();
});
eanSuggestListEl?.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-ean]');
  if (!btn) return;
  eanBarrasEl.value = btn.dataset.ean || '';
  modalContext = { ...modalContext, origem: 'sugestao' };
  setEanSuggestStatus(`Vinculando ${btn.dataset.ean}…`, 'ok');
  void saveEan({ origem: 'sugestao' });
});

eanBarrasEl?.addEventListener('input', () => {
  modalContext = { ...modalContext, origem: 'manual' };
});
eanCaptureEl?.addEventListener('change', () => {
  const file = eanCaptureEl.files?.[0];
  if (file) decodeEanFromFile(file);
});
eanFileEl?.addEventListener('change', () => {
  const file = eanFileEl.files?.[0];
  if (file) decodeEanFromFile(file);
});

modalEanEl.addEventListener('click', (ev) => {
  if (ev.target.closest('[data-close-ean]')) closeCadastroEan();
});

modalFotoEl?.addEventListener('click', (ev) => {
  if (ev.target.closest('[data-close-foto]')) closeFotoViewer();
});

document.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Escape') return;
  if (modalFotoEl && !modalFotoEl.hidden) {
    closeFotoViewer();
    return;
  }
  if (modalEanEl && !modalEanEl.hidden) closeCadastroEan();
});

async function reloadCodigosBarras() {
  const data = await fetchJson('api/codigos-barras');
  allCodigosBarras = data.codigosBarras || [];
  if (!panels.produtos?.hidden) renderProdutosTab();
}

async function reloadItens() {
  const data = await fetchJson('api/itens');
  allItens = data.itens || [];
  if (lojaAbertaId != null) renderVitrineDetalhe(lojaAbertaId);
  else if (!panels.empresas?.hidden) renderVitrineLista();
  if (!panels.produtos?.hidden) {
    if (produtoAbertaKey != null) renderProdutoDetalhe(produtoAbertaKey);
    else renderProdutosTab();
  }
}

function readRoute() {
  const params = new URLSearchParams(location.search);
  const loja = params.get('loja');
  const produto = params.get('produto');
  const hash = (location.hash || '').replace(/^#/, '');
  if (produto) {
    produtoAbertaKey = produto;
    return 'produtos';
  }
  if (loja) {
    lojaAbertaId = Number(loja);
    return 'empresas';
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
  if (hash === 'itens' || hash === 'codigos-barras' || hash === 'notas' || /^nota-/.test(hash)) {
    return 'produtos';
  }
  if (hash === 'vitrine') return 'empresas';
  if (panels[hash]) return hash;
  return 'produtos';
}

async function load() {
  const tab = readRoute();
  try {
    const [empresas, itens, eans] = await Promise.all([
      fetchJson('api/empresas'),
      fetchJson('api/itens'),
      fetchJson('api/codigos-barras'),
    ]);
    allEmpresas = empresas.empresas || [];
    allNotas = [];
    allItens = itens.itens || [];
    allCodigosBarras = eans.codigosBarras || [];
    renderEmpresas(allEmpresas);
    renderProdutosTab();
    let next = tab;
    if (tab === 'vitrine' || tab === 'itens' || tab === 'notas') {
      next = tab === 'vitrine' ? 'empresas' : 'produtos';
    }
    setTab(next, { updateHash: true });
    setStatus('');
  } catch (err) {
    console.error(err);
    setStatus(err.message || 'Falha ao carregar', 'err');
  }
}

load();
