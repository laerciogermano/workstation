const statusEl = document.getElementById('status');
const buscaItensEl = document.getElementById('busca-itens');

let allItens = [];

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
  const raw = String(emissao ?? '').trim().replace(/\s*-\s*$/, '');
  if (!raw) return '';
  const m = raw.match(/^(\d{2}\/\d{2}\/\d{4})(?:\s+(\d{2}:\d{2}(?::\d{2})?))?/);
  if (!m) return raw;
  return m[2] ? `${m[1]} ${m[2].slice(0, 5)}` : m[1];
}

function renderNotas(rows) {
  document.getElementById('count-notas').textContent = `(${rows.length})`;
  document.getElementById('notas').innerHTML = rows.length
    ? rows
        .map(
          (r) =>
            `<tr>${cell(r.id)}${cell(formatDataNota(r.emissao))}${cell(r.empresa_nome || r.empresa_cnpj)}${cell(r.numero)}${cell(r.qtd_itens)}${cell(r.valor_total)}${cell(r.descontos)}${cell(r.outras_despesas)}${cell(r.chave_acesso, 'mono')}</tr>`,
        )
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

function filterItens(rows, query) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return rows;
  const terms = q.split(/\s+/).filter(Boolean);
  return rows.filter((r) => {
    const hay = itemHaystack(r);
    return terms.every((t) => hay.includes(t));
  });
}

function renderItens(rows, total) {
  const shown = rows.length;
  const label =
    total != null && shown !== total ? `(${shown}/${total})` : `(${shown})`;
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

function applyItensFilter() {
  renderItens(filterItens(allItens, buscaItensEl.value), allItens.length);
}

buscaItensEl.addEventListener('input', applyItensFilter);

async function load() {
  try {
    const [empresas, notas, itens] = await Promise.all([
      fetchJson('/api/empresas'),
      fetchJson('/api/notas'),
      fetchJson('/api/itens'),
    ]);
    allItens = itens.itens || [];
    renderEmpresas(empresas.empresas || []);
    renderNotas(notas.notas || []);
    applyItensFilter();
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
