const statusEl = document.getElementById('status');

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

function renderNotas(rows) {
  document.getElementById('count-notas').textContent = `(${rows.length})`;
  document.getElementById('notas').innerHTML = rows.length
    ? rows
        .map(
          (r) =>
            `<tr>${cell(r.id)}${cell(r.empresa_nome || r.empresa_cnpj)}${cell(r.numero)}${cell(r.emissao)}${cell(r.valor_total)}${cell(r.chave_acesso, 'mono')}</tr>`,
        )
        .join('')
    : '<tr><td colspan="6">Nenhuma nota</td></tr>';
}

function renderItens(rows) {
  document.getElementById('count-itens').textContent = `(${rows.length})`;
  document.getElementById('itens').innerHTML = rows.length
    ? rows
        .map(
          (r) =>
            `<tr>${cell(r.id)}${cell(r.empresa_nome)}${cell(r.nota_numero || r.nota_id)}${cell(r.codigo)}${cell(r.nome)}${cell(r.quantidade ? `${r.quantidade} ${r.unidade || ''}`.trim() : '')}${cell(r.valor_unitario)}${cell(r.valor_total)}</tr>`,
        )
        .join('')
    : '<tr><td colspan="8">Nenhum item</td></tr>';
}

async function load() {
  try {
    const [empresas, notas, itens] = await Promise.all([
      fetchJson('/api/empresas'),
      fetchJson('/api/notas'),
      fetchJson('/api/itens'),
    ]);
    renderEmpresas(empresas.empresas || []);
    renderNotas(notas.notas || []);
    renderItens(itens.itens || []);
    setStatus(
      `${empresas.empresas?.length ?? 0} empresas · ${notas.notas?.length ?? 0} notas · ${itens.itens?.length ?? 0} itens`,
      'ok',
    );
  } catch (err) {
    console.error(err);
    setStatus(`Falha: ${err.message}`, 'err');
  }
}

load();
