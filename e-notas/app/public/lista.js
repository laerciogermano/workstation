const statusEl = document.getElementById('status');
const buscaItensEl = document.getElementById('busca-itens');
const buscaEanEl = document.getElementById('busca-ean');
const buscaVitrineEl = document.getElementById('busca-vitrine');
const buscaVitrineItensEl = document.getElementById('busca-vitrine-itens');
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
const vitrineGridEl = document.getElementById('vitrine-grid');
const vitrineLojaInfoEl = document.getElementById('vitrine-loja-info');
const vitrineItensEl = document.getElementById('vitrine-itens');
const tabs = [...document.querySelectorAll('.tab')];
const subtabs = [...document.querySelectorAll('.subtab')];
const panels = {
  empresas: document.getElementById('panel-empresas'),
  itens: document.getElementById('panel-itens'),
};
const itensViews = {
  lista: document.getElementById('itens-view-lista'),
  ean: document.getElementById('itens-view-ean'),
};

let allEmpresas = [];
let allItens = [];
let allCodigosBarras = [];
let filtroNotaId = null;
let filtroNotaLabel = '';
let itensSub = 'lista';
let lojaAbertaId = null;
let eanScanner = null;
let eanScanBusy = false;
let modalContext = { empresaNome: '', itemNome: '' };
let empresasMap = null;
let empresasMarkers = null;
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
    panel.hidden = key !== name;
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
  if (updateHash) {
    const url = new URL(location.href);
    url.hash =
      name === 'itens' && itensSub === 'ean'
        ? 'codigos-barras'
        : name === 'empresas' && lojaAbertaId != null
          ? `loja-${lojaAbertaId}`
          : name;
    if (name === 'itens' && itensSub === 'lista' && filtroNotaId != null) {
      url.searchParams.set('nota', String(filtroNotaId));
    } else {
      url.searchParams.delete('nota');
    }
    if (name === 'empresas' && lojaAbertaId != null) {
      url.searchParams.set('loja', String(lojaAbertaId));
    } else {
      url.searchParams.delete('loja');
    }
    history.replaceState(null, '', url);
  }
}

function setItensSub(name, { updateHash = true } = {}) {
  itensSub = name === 'ean' ? 'ean' : 'lista';
  for (const tab of subtabs) {
    const on = tab.dataset.sub === itensSub;
    tab.setAttribute('aria-selected', on ? 'true' : 'false');
  }
  itensViews.lista.hidden = itensSub !== 'lista';
  itensViews.ean.hidden = itensSub !== 'ean';
  if (!panels.itens.hidden && updateHash) setTab('itens');
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

function renderEmpresasMap(rows) {
  if (typeof L === 'undefined') {
    setMapStatus('Mapa indisponível.', 'err');
    return;
  }
  ensureEmpresasMap();
  empresasMarkers.clearLayers();
  const withCoords = rows.filter(
    (r) => r.lat != null && r.lng != null && !Number.isNaN(Number(r.lat)),
  );
  const bounds = [];
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
    bounds.push([lat, lng]);
  }
  if (bounds.length === 1) {
    empresasMap.setView(bounds[0], 15);
  } else if (bounds.length > 1) {
    empresasMap.fitBounds(bounds, { padding: [28, 28] });
  }
  const missing = rows.length - withCoords.length;
  if (!rows.length) {
    setMapStatus('');
  } else if (withCoords.length === 0) {
    setMapStatus('Localizando lojas…');
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
  document.getElementById('count-empresas').textContent = `(${rows.length})`;
  if (!panels.empresas.hidden) {
    renderEmpresasMap(rows);
    if (lojaAbertaId != null) renderVitrineDetalhe(lojaAbertaId);
    else renderVitrineLista();
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

function renderVitrineLista() {
  lojaAbertaId = null;
  vitrineListaEl.hidden = false;
  vitrineDetalheEl.hidden = true;
  const q = String(buscaVitrineEl?.value || '')
    .trim()
    .toLowerCase();
  const terms = q ? q.split(/\s+/).filter(Boolean) : [];
  const rows = terms.length
    ? allEmpresas.filter((r) => {
        const hay = lojaHaystack(r);
        return terms.every((t) => hay.includes(t));
      })
    : allEmpresas;
  document.getElementById('count-empresas').textContent = `(${allEmpresas.length})`;
  vitrineGridEl.innerHTML = rows.length
    ? rows
        .map((r) => {
          const n = catalogoLoja(r.id).length;
          return `<button type="button" class="loja-card" data-open-loja="${esc(r.id)}">
            <h3 class="loja-nome">${esc(r.nome || r.cnpj || `Loja #${r.id}`)}</h3>
            <p class="loja-meta">${esc(r.endereco || '')}</p>
            <div class="loja-stats">
              <span class="chip">${n} item${n === 1 ? '' : 's'}</span>
            </div>
          </button>`;
        })
        .join('')
    : `<p class="hint">${allEmpresas.length ? 'Nada encontrado.' : 'Sem lojas.'}</p>`;
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
    <h3 class="loja-nome">${esc(loja.nome || loja.cnpj || `Loja #${loja.id}`)}</h3>
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
              <td>${esc(r.nome || '—')}</td>
              <td class="mono">${esc(r.codigo_barras || '—')}</td>
              <td>${esc(r.codigo || '—')}</td>
              <td class="price-cell">${esc(formatPreco(r.valor_unitario))}</td>
              <td>${esc(formatDataNota(r.nota_emissao) || '—')}</td>
            </tr>`,
        )
        .join('')
    : `<tr><td colspan="5">${catalogo.length ? 'Nada encontrado.' : 'Sem itens.'}</td></tr>`;
}

function openVitrineLoja(empresaId) {
  buscaVitrineItensEl.value = '';
  renderVitrineDetalhe(empresaId);
  setTab('empresas');
}

function closeVitrineLoja() {
  buscaVitrineItensEl.value = '';
  renderVitrineLista();
  setTab('empresas');
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
  const q = String(buscaItensEl.value || '')
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
  applyItensFilter();
  if (!panels.itens.hidden) setTab('itens');
}

function openItensDaNota(notaId, label) {
  filtroNotaId = Number(notaId);
  filtroNotaLabel = label || `nota #${notaId}`;
  buscaItensEl.value = '';
  updateFiltroBanner();
  applyItensFilter();
  setItensSub('lista');
  setTab('itens');
}

function applyItensFilter() {
  const scoped =
    filtroNotaId != null
      ? allItens.filter((r) => Number(r.nota_id) === Number(filtroNotaId))
      : allItens;
  const rows = filterItens(allItens);
  const shown = rows.length;
  const total = scoped.length;
  const label =
    shown !== allItens.length || filtroNotaId != null
      ? `(${shown}/${filtroNotaId != null ? total : allItens.length})`
      : `(${shown})`;
  document.getElementById('count-itens').textContent = label;
  document.getElementById('itens').innerHTML = rows.length
    ? rows
        .map(
          (r) =>
            `<tr>${cell(formatDataNota(r.nota_emissao))}${cell(r.empresa_nome)}${cell(r.codigo_barras || '', 'mono')}${cell(r.nome)}<td class="price-cell">${esc(formatPreco(r.valor_unitario))}</td><td><button type="button" class="btn-link" data-vincular-ean data-empresa-id="${esc(r.empresa_id)}" data-empresa-nome="${esc(r.empresa_nome || '')}" data-codigo="${esc(r.codigo)}" data-nome="${esc(r.nome || '')}" data-ean="${esc(r.codigo_barras || '')}">${r.codigo_barras ? 'EAN' : '+ EAN'}</button></td></tr>`,
        )
        .join('')
    : `<tr><td colspan="6">${allItens.length ? 'Nada encontrado.' : 'Sem itens.'}</td></tr>`;
}

function eanHaystack(r) {
  return [r.id, r.empresa_nome, r.empresa_cnpj, r.codigo_unidade, r.codigo_barras]
    .map((v) => String(v ?? '').toLowerCase())
    .join(' ');
}

function applyEanFilter() {
  const q = String(buscaEanEl.value || '')
    .trim()
    .toLowerCase();
  const terms = q ? q.split(/\s+/).filter(Boolean) : [];
  const rows = terms.length
    ? allCodigosBarras.filter((r) => {
        const hay = eanHaystack(r);
        return terms.every((t) => hay.includes(t));
      })
    : allCodigosBarras;
  document.getElementById('count-ean').textContent = `(${allCodigosBarras.length})`;
  document.getElementById('codigos-barras').innerHTML = rows.length
    ? rows
        .map(
          (r) =>
            `<tr>${cell(r.empresa_nome || r.empresa_cnpj)}${cell(r.codigo_unidade)}${cell(r.codigo_barras, 'mono')}</tr>`,
        )
        .join('')
    : `<tr><td colspan="3">${allCodigosBarras.length ? 'Nada encontrado.' : 'Sem EANs.'}</td></tr>`;
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

buscaItensEl.addEventListener('input', applyItensFilter);
buscaEanEl.addEventListener('input', applyEanFilter);
buscaVitrineEl?.addEventListener('input', () => {
  lojaAbertaId = null;
  renderVitrineLista();
});
buscaVitrineItensEl?.addEventListener('input', () => {
  if (lojaAbertaId != null) renderVitrineDetalhe(lojaAbertaId);
});
document.getElementById('vitrine-voltar')?.addEventListener('click', () => {
  closeVitrineLoja();
});
vitrineGridEl?.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-open-loja]');
  if (!btn) return;
  openVitrineLoja(btn.dataset.openLoja);
});

for (const tab of tabs) {
  tab.addEventListener('click', () => {
    if (tab.dataset.tab === 'itens') setItensSub(itensSub);
    if (tab.dataset.tab === 'empresas') {
      lojaAbertaId = null;
      renderVitrineLista();
    }
    setTab(tab.dataset.tab);
  });
}

for (const tab of subtabs) {
  tab.addEventListener('click', () => setItensSub(tab.dataset.sub));
}

document.getElementById('itens').addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-vincular-ean]');
  if (!btn) return;
  openCadastroEan({
    empresaId: btn.dataset.empresaId,
    empresaNome: btn.dataset.empresaNome,
    codigo: btn.dataset.codigo,
    nome: btn.dataset.nome,
    ean: btn.dataset.ean,
  });
});

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
  applyEanFilter();
}

async function reloadItens() {
  const data = await fetchJson('api/itens');
  allItens = data.itens || [];
  applyItensFilter();
}

function readRoute() {
  const params = new URLSearchParams(location.search);
  const nota = params.get('nota');
  const loja = params.get('loja');
  const hash = (location.hash || '').replace(/^#/, '');
  if (nota) {
    filtroNotaId = Number(nota);
    filtroNotaLabel = `nota #${nota}`;
    itensSub = 'lista';
    return 'itens';
  }
  if (loja) {
    lojaAbertaId = Number(loja);
    return 'empresas';
  }
  const lojaHash = hash.match(/^loja-(\d+)$/);
  if (lojaHash) {
    lojaAbertaId = Number(lojaHash[1]);
    return 'empresas';
  }
  if (hash === 'codigos-barras') {
    itensSub = 'ean';
    return 'itens';
  }
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
    allItens = itens.itens || [];
    allCodigosBarras = eans.codigosBarras || [];
    renderEmpresas(allEmpresas);
    if (filtroNotaId != null) {
      const n = (notas.notas || []).find(
        (x) => Number(x.id) === Number(filtroNotaId),
      );
      if (n) {
        filtroNotaLabel = n.numero ? `nota ${n.numero}` : `nota #${n.id}`;
      }
    }
    updateFiltroBanner();
    renderItens();
    applyEanFilter();
    setItensSub(itensSub, { updateHash: false });
    let next = tab;
    if (tab === 'notas') next = 'itens';
    if (tab === 'vitrine') next = 'empresas';
    setTab(next, { updateHash: true });
    setStatus('');
  } catch (err) {
    console.error(err);
    setStatus(err.message || 'Falha ao carregar', 'err');
  }
}

load();
