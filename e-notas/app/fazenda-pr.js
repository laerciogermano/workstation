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

function normalizeCnpj(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length === 14 ? digits : null;
}

function normalizeChave(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length === 44 ? digits : null;
}

function labelFromBlock(block, label) {
  const re = new RegExp(`${label}\\s*:\\s*([^\\n]+?)(?=\\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç].*:|$)`, 'i');
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

function totalByLabel($, label) {
  let value = null;
  $('#totalNota #linhaTotal').each((_, el) => {
    const $el = $(el);
    if (text($el.find('label').first()).toLowerCase().includes(label.toLowerCase())) {
      value = text($el.find('.totalNumb').first()) || null;
    }
  });
  return value;
}

export function parseDanfeHtml(html) {
  const $ = cheerio.load(html);
  const $emit = $('.txtCenter').first();
  const nome = text($emit.find('.txtTopo').first()) || null;

  let cnpjRaw = null;
  let endereco = null;
  $emit.find('.text').each((i, el) => {
    const t = text($(el));
    if (/CNPJ\s*:/i.test(t)) cnpjRaw = afterLabel(t, 'CNPJ');
    else if (t && !endereco) endereco = t;
  });

  const chave = normalizeChave(text($('span.chave').first()));
  const infoBlock = text($('#infos li').first());
  const numero = labelFromBlock(infoBlock, 'Número');
  const serie = labelFromBlock(infoBlock, 'Série');
  let emissao = labelFromBlock(infoBlock, 'Emissão');
  if (emissao) emissao = emissao.replace(/\s*-\s*Via Consumidor.*$/i, '').trim();
  const protocoloMatch = infoBlock.match(/Protocolo de Autorização:\s*(\d+)/i);
  const protocolo = protocoloMatch ? protocoloMatch[1] : null;

  const itens = [];
  $('#tabResult tr[id^="Item"]').each((_, tr) => {
    const $tr = $(tr);
    const itemNome = text($tr.find('.txtTit2').first());
    const codigo = parseCode(text($tr.find('.RCod').first()));
    const quantidade = afterLabel(text($tr.find('.Rqtd').first()), 'Qtde\\.?');
    const unidade = afterLabel(text($tr.find('.RUN').first()), 'UN');
    const valorUnitario = afterLabel(text($tr.find('.RvlUnit').first()), 'Vl\\.\\s*Unit\\.?');
    const valorTotal = text($tr.find('span.valor').first());

    if (!itemNome && !codigo) return;
    itens.push({
      nome: itemNome,
      codigo: codigo || null,
      quantidade: quantidade || null,
      unidade: unidade || null,
      valorUnitario: valorUnitario || null,
      valorTotal: valorTotal || null,
    });
  });

  return {
    empresa: {
      nome,
      cnpj: normalizeCnpj(cnpjRaw),
      cnpjFormatado: cnpjRaw || null,
      endereco,
    },
    nota: {
      chave,
      numero,
      serie,
      emissao,
      protocolo,
      qtdItens: totalByLabel($, 'Qtd. total de itens'),
      valorTotal: totalByLabel($, 'Valor total'),
      descontos: totalByLabel($, 'Descontos'),
      outrasDespesas: totalByLabel($, 'Outras despesas'),
      valorAPagar: totalByLabel($, 'Valor a pagar'),
    },
    itens,
  };
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
