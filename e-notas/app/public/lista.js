const statusEl = document.getElementById('status');
const buscaItensEl = document.getElementById('busca-itens');
const buscaEanEl = document.getElementById('busca-ean');
const filtroNotaEl = document.getElementById('filtro-nota');
const formEanEl = document.getElementById('form-ean');
const eanEmpresaEl = document.getElementById('ean-empresa');
const eanUnidadeEl = document.getElementById('ean-unidade');
const eanBarrasEl = document.getElementById('ean-barras');
const eanFormStatusEl = document.getElementById('ean-form-status');
const eanUnidadeListEl = document.getElementById('ean-unidade-sugeridos');
const tabs = [...document.querySelectorAll('.tab')];
const subtabs = [...document.querySelectorAll('.subtab')];
const panels = {
  empresas: document.getElementById('panel-empresas'),
  notas: document.getElementById('panel-notas'),
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

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = 'status' + (kind ? ` ${kind}` : '');
}

function setEanFormStatus(text, kind) {
  eanFormStatusEl.textContent = text;
  eanFormStatusEl.className = 'status' + (kind ? ` ${kind}` : '');
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
  if (updateHash) {
    const url = new URL(location.href);
    url.hash = name === 'itens' && itensSub === 'ean' ? 'codigos-barras' : name;
    if (name === 'itens' && itensSub === 'lista' && filtroNotaId != null) {
      url.searchParams.set('nota', String(filtroNotaId));
    } else {
      url.searchParams.delete('nota');
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

function renderEmpresas(rows) {
  document.getElementById('count-empresas').textContent = `(${rows.length})`;
  document.getElementById('empresas').innerHTML = rows.length
    ? rows
        .map(
          (r) =>
            `<tr>${cell(r.id)}${cell(r.cnpj)}${cell(r.nome)}${cell(r.endereco)}</tr>`,
        )
        .join('')
    : '<tr><td colspan="4">Nenhuma empresa</td></tr>';
}

function fillEmpresaSelect(selectedId) {
  const cur = selectedId != null ? String(selectedId) : eanEmpresaEl.value;
  eanEmpresaEl.innerHTML = allEmpresas.length
    ? allEmpresas
        .map(
          (e) =>
            `<option value="${esc(e.id)}">${esc(e.nome || e.cnpj || `#${e.id}`)}</option>`,
        )
        .join('')
    : '<option value="">Nenhuma empresa</option>';
  if (cur && [...eanEmpresaEl.options].some((o) => o.value === cur)) {
    eanEmpresaEl.value = cur;
  }
  refreshUnidadeSuggestions();
}

function refreshUnidadeSuggestions() {
  const empId = Number(eanEmpresaEl.value);
  const codes = [
    ...new Set(
      allItens
        .filter((i) => Number(i.empresa_id) === empId && i.codigo)
        .map((i) => String(i.codigo)),
    ),
  ].sort();
  eanUnidadeListEl.innerHTML = codes
    .map((c) => `<option value="${esc(c)}"></option>`)
    .join('');
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

function renderNotas(rows) {
  document.getElementById('count-notas').textContent = `(${rows.length})`;
  document.getElementById('notas').innerHTML = rows.length
    ? rows
        .map((r) => {
          const label = r.numero
            ? `nota ${r.numero}`
            : `nota #${r.id}`;
          return `<tr class="row-link" data-nota-id="${esc(r.id)}" data-nota-label="${esc(label)}" tabindex="0" title="Ver itens desta nota">${cell(r.id)}${cell(formatDataNota(r.emissao))}${cell(r.empresa_nome || r.empresa_cnpj)}${cell(r.numero)}${cell(r.qtd_itens)}${cell(r.valor_total)}${cell(r.descontos)}${cell(r.outras_despesas)}${cell(r.chave_acesso, 'mono')}</tr>`;
        })
        .join('')
    : '<tr><td colspan="9">Nenhuma nota</td></tr>';
}

function itemHaystack(r) {
  return [
    r.id,
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
  filtroNotaEl.innerHTML = `Itens da <strong>${esc(filtroNotaLabel || `nota #${filtroNotaId}`)}</strong> · <button type="button" id="limpar-filtro-nota" class="linkish">mostrar todos</button>`;
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
            `<tr>${cell(r.id)}${cell(r.empresa_nome)}${cell(r.nota_numero || r.nota_id)}${cell(r.codigo)}${cell(r.codigo_barras || '', 'mono')}${cell(r.nome)}${cell(r.quantidade ? `${r.quantidade} ${r.unidade || ''}`.trim() : '')}${cell(r.valor_unitario)}${cell(r.valor_total)}<td><button type="button" class="btn-link" data-vincular-ean data-empresa-id="${esc(r.empresa_id)}" data-codigo="${esc(r.codigo)}" data-ean="${esc(r.codigo_barras || '')}">${r.codigo_barras ? 'Editar EAN' : 'Cadastrar EAN'}</button></td></tr>`,
        )
        .join('')
    : `<tr><td colspan="10">${allItens.length ? 'Nenhum item na pesquisa' : 'Nenhum item'}</td></tr>`;
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
            `<tr>${cell(r.id)}${cell(r.empresa_nome || r.empresa_cnpj)}${cell(r.codigo_unidade)}${cell(r.codigo_barras, 'mono')}</tr>`,
        )
        .join('')
    : `<tr><td colspan="4">${allCodigosBarras.length ? 'Nenhum na pesquisa' : 'Nenhum código de barras'}</td></tr>`;
}

function openCadastroEan({ empresaId, codigo, ean }) {
  setItensSub('ean');
  setTab('itens');
  fillEmpresaSelect(empresaId);
  eanUnidadeEl.value = codigo || '';
  eanBarrasEl.value = ean || '';
  setEanFormStatus('');
  eanBarrasEl.focus();
}

function renderItens() {
  applyItensFilter();
}

buscaItensEl.addEventListener('input', applyItensFilter);
buscaEanEl.addEventListener('input', applyEanFilter);
eanEmpresaEl.addEventListener('change', refreshUnidadeSuggestions);

for (const tab of tabs) {
  tab.addEventListener('click', () => {
    if (tab.dataset.tab === 'itens') setItensSub(itensSub);
    setTab(tab.dataset.tab);
  });
}

for (const tab of subtabs) {
  tab.addEventListener('click', () => setItensSub(tab.dataset.sub));
}

document.getElementById('notas').addEventListener('click', (ev) => {
  const row = ev.target.closest('tr[data-nota-id]');
  if (!row) return;
  openItensDaNota(row.dataset.notaId, row.dataset.notaLabel);
});

document.getElementById('notas').addEventListener('keydown', (ev) => {
  if (ev.key !== 'Enter' && ev.key !== ' ') return;
  const row = ev.target.closest('tr[data-nota-id]');
  if (!row) return;
  ev.preventDefault();
  openItensDaNota(row.dataset.notaId, row.dataset.notaLabel);
});

document.getElementById('itens').addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-vincular-ean]');
  if (!btn) return;
  openCadastroEan({
    empresaId: btn.dataset.empresaId,
    codigo: btn.dataset.codigo,
    ean: btn.dataset.ean,
  });
});

formEanEl.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  setEanFormStatus('Salvando…');
  try {
    await fetchJson('api/codigos-barras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa_id: Number(eanEmpresaEl.value),
        codigo_unidade: eanUnidadeEl.value.trim(),
        codigo_barras: eanBarrasEl.value.trim(),
      }),
    });
    setEanFormStatus('Salvo.', 'ok');
    eanBarrasEl.value = '';
    await reloadCodigosBarras();
    await reloadItens();
  } catch (err) {
    setEanFormStatus(`Falha: ${err.message}`, 'err');
  }
});

async function reloadCodigosBarras() {
  const data = await fetchJson('api/codigos-barras');
  allCodigosBarras = data.codigosBarras || [];
  applyEanFilter();
}

async function reloadItens() {
  const data = await fetchJson('api/itens');
  allItens = data.itens || [];
  refreshUnidadeSuggestions();
  applyItensFilter();
}

function readRoute() {
  const params = new URLSearchParams(location.search);
  const nota = params.get('nota');
  const hash = (location.hash || '').replace(/^#/, '');
  if (nota) {
    filtroNotaId = Number(nota);
    filtroNotaLabel = `nota #${nota}`;
    itensSub = 'lista';
    return 'itens';
  }
  if (hash === 'codigos-barras') {
    itensSub = 'ean';
    return 'itens';
  }
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
    renderNotas(notas.notas || []);
    fillEmpresaSelect();
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
    setTab(tab, { updateHash: true });
    setStatus(
      `${allEmpresas.length} empresas · ${notas.notas?.length ?? 0} notas · ${allItens.length} itens · ${allCodigosBarras.length} EANs`,
      'ok',
    );
  } catch (err) {
    console.error(err);
    setStatus(`Falha: ${err.message}`, 'err');
  }
}

load();
