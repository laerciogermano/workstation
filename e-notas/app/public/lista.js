const statusEl = document.getElementById('status');
const buscaItensEl = document.getElementById('busca-itens');
const filtroNotaEl = document.getElementById('filtro-nota');
const tabs = [...document.querySelectorAll('.tab')];
const panels = {
  empresas: document.getElementById('panel-empresas'),
  notas: document.getElementById('panel-notas'),
  itens: document.getElementById('panel-itens'),
};

let allItens = [];
let filtroNotaId = null;
let filtroNotaLabel = '';

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = 'status' + (kind ? ` ${kind}` : '');
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

async function fetchJson(path) {
  const res = await fetch(path);
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
    url.hash = name;
    if (name === 'itens' && filtroNotaId != null) {
      url.searchParams.set('nota', String(filtroNotaId));
    } else {
      url.searchParams.delete('nota');
    }
    history.replaceState(null, '', url);
  }
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
            `<tr>${cell(r.id)}${cell(r.empresa_nome)}${cell(r.nota_numero || r.nota_id)}${cell(r.codigo)}${cell(r.nome)}${cell(r.quantidade ? `${r.quantidade} ${r.unidade || ''}`.trim() : '')}${cell(r.valor_unitario)}${cell(r.valor_total)}</tr>`,
        )
        .join('')
    : `<tr><td colspan="8">${allItens.length ? 'Nenhum item na pesquisa' : 'Nenhum item'}</td></tr>`;
}

function renderItens() {
  applyItensFilter();
}

buscaItensEl.addEventListener('input', applyItensFilter);

for (const tab of tabs) {
  tab.addEventListener('click', () => setTab(tab.dataset.tab));
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

function readRoute() {
  const params = new URLSearchParams(location.search);
  const nota = params.get('nota');
  const hash = (location.hash || '').replace(/^#/, '');
  if (nota) {
    filtroNotaId = Number(nota);
    filtroNotaLabel = `nota #${nota}`;
    return 'itens';
  }
  if (panels[hash]) return hash;
  return 'empresas';
}

async function load() {
  const tab = readRoute();
  try {
    const [empresas, notas, itens] = await Promise.all([
      fetchJson('api/empresas'),
      fetchJson('api/notas'),
      fetchJson('api/itens'),
    ]);
    allItens = itens.itens || [];
    renderEmpresas(empresas.empresas || []);
    renderNotas(notas.notas || []);
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
    setTab(tab, { updateHash: true });
    setStatus(
      `${empresas.empresas?.length ?? 0} empresas · ${notas.notas?.length ?? 0} notas · ${allItens.length} itens`,
      'ok',
    );
  } catch (err) {
    console.error(err);
    setStatus(`Falha: ${err.message}`, 'err');
  }
}

load();
