import * as cheerio from 'cheerio';

const HOST_OK = /(^|\.)fazenda\.pr\.gov\.br$/i;

export function assertFazendaPrNfceUrl(raw) {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw Object.assign(new Error('URL inválida'), { status: 400 });
  }
  if (!HOST_OK.test(parsed.hostname)) {
    throw Object.assign(new Error('URL deve ser da Fazenda PR (fazenda.pr.gov.br)'), {
      status: 400,
    });
  }
  if (!/\/nfce\/qrcode\/?$/i.test(parsed.pathname)) {
    throw Object.assign(new Error('URL deve ser consulta NFC-e (/nfce/qrcode)'), {
      status: 400,
    });
  }
  if (!parsed.searchParams.get('p')) {
    throw Object.assign(new Error('URL sem parâmetro p do QR'), { status: 400 });
  }
  return parsed.toString();
}

function text($el) {
  return $el.text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function afterLabel(raw, label) {
  const re = new RegExp(`${label}\\s*:?\\s*(.*)$`, 'i');
  const m = raw.match(re);
  return m ? m[1].trim() : '';
}

function parseCode(raw) {
  const m = raw.match(/Código\s*:\s*([^)]+)/i);
  return m ? m[1].trim() : raw.replace(/[()]/g, '').trim();
}

export function parseDanfeHtml(html) {
  const $ = cheerio.load(html);
  const estabelecimento = text($('.txtTopo').first()) || null;
  const itens = [];

  $('#tabResult tr[id^="Item"]').each((_, tr) => {
    const $tr = $(tr);
    const nome = text($tr.find('.txtTit2').first());
    const codigo = parseCode(text($tr.find('.RCod').first()));
    const quantidade = afterLabel(text($tr.find('.Rqtd').first()), 'Qtde\\.?');
    const unidade = afterLabel(text($tr.find('.RUN').first()), 'UN');
    const valorUnitario = afterLabel(text($tr.find('.RvlUnit').first()), 'Vl\\.\\s*Unit\\.?');
    const valorTotal = text($tr.find('span.valor').first());

    if (!nome && !codigo) return;
    itens.push({
      nome,
      codigo: codigo || null,
      quantidade: quantidade || null,
      unidade: unidade || null,
      valorUnitario: valorUnitario || null,
      valorTotal: valorTotal || null,
    });
  });

  return { estabelecimento, itens };
}

export async function fetchDanfe(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; e-notas/0.1; +https://localhost) AppleWebKit/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!res.ok) {
    throw Object.assign(new Error(`Fazenda PR respondeu HTTP ${res.status}`), {
      status: 502,
    });
  }
  return res.text();
}
