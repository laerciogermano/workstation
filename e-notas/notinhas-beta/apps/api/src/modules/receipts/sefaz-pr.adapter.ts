import * as cheerio from 'cheerio';
import { normalizeAccessKey, parseBrl, parseQuantity } from '@notinhas/domain';
import { SefazError, type ParsedDanfe, type SefazPort } from './sefaz.port.js';

/**
 * Adaptador da consulta pública NFC-e da SEFAZ-PR (portado de e-notas/app/fazenda-pr.js).
 * - timeout rígido (RN-15) e até 2 novas tentativas em 502/503/504 (1 s, 3 s)
 * - CPF/nome do consumidor nunca é lido do HTML (RN-06): só emitente, chave, totais e itens
 */
export function createSefazPrAdapter(opts: { timeoutMs: number; fetchImpl?: typeof fetch }): SefazPort {
  const doFetch = opts.fetchImpl ?? fetch;
  const backoff = [1000, 3000];

  async function download(url: string): Promise<string> {
    for (let attempt = 0; ; attempt++) {
      let res: Response;
      try {
        res = await doFetch(url, {
          redirect: 'follow',
          signal: AbortSignal.timeout(opts.timeoutMs),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; notinhas.shop/1.0; +https://notinhas.shop)',
            Accept: 'text/html,application/xhtml+xml',
            'Accept-Language': 'pt-BR,pt;q=0.9',
          },
        });
      } catch (e) {
        const isTimeout = e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError');
        throw new SefazError(isTimeout ? 'SEFAZ_TIMEOUT' : 'SEFAZ_PARSER_ERROR', isTimeout ? 'SEFAZ sem resposta' : 'Falha de rede com a SEFAZ');
      }
      if (res.ok) return res.text();
      const wait = backoff[attempt];
      if ([502, 503, 504].includes(res.status) && wait !== undefined) {
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw new SefazError('SEFAZ_PARSER_ERROR', `SEFAZ respondeu HTTP ${res.status}`);
    }
  }

  return {
    async fetchReceipt(url) {
      const html = await download(url);
      return parseDanfeHtml(html);
    },
  };
}

const clean = (s: string): string => s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

function afterLabel(raw: string, label: string): string {
  const m = raw.match(new RegExp(`${label}\\s*:?\\s*(.*)$`, 'i'));
  return m?.[1]?.trim() ?? '';
}

function labelFromBlock(block: string, label: string): string | null {
  const re = new RegExp(`${label}\\s*:\\s*([^\\n]+?)(?=\\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç].*:|$)`, 'i');
  return block.match(re)?.[1]?.trim() ?? null;
}

/** "13/11/2026 09:41:12" (horário de Brasília) → Date UTC */
function parseIssuedAt(raw: string | null): Date | null {
  const m = raw?.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  const [, d, mo, y, h, mi, s] = m;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s ?? '00'}-03:00`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "R. X, 1434, , CENTRO, SAO JOSE DOS PINHAIS, PR" → bairro e cidade */
export function splitAddress(address: string | null): { neighborhood: string | null; city: string | null } {
  const parts = (address ?? '').split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length < 3) return { neighborhood: null, city: null };
  const title = (s: string | undefined) =>
    s ? s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()).replace(/\b(De|Da|Do|Dos|Das)\b/g, (w) => w.toLowerCase()) : null;
  const hasUf = /^[A-Z]{2}$/.test(parts[parts.length - 1] ?? '');
  const city = parts[parts.length - (hasUf ? 2 : 1)];
  const neighborhood = parts[parts.length - (hasUf ? 3 : 2)];
  return { neighborhood: title(neighborhood), city: title(city) };
}

export function parseDanfeHtml(html: string): ParsedDanfe {
  const $ = cheerio.load(html);
  const $emit = $('.txtCenter').first();
  const legalName = clean($emit.find('.txtTopo').first().text());

  let cnpjRaw = '';
  let address: string | null = null;
  $emit.find('.text').each((_, el) => {
    const t = clean($(el).text());
    if (/CNPJ\s*:/i.test(t)) cnpjRaw = afterLabel(t, 'CNPJ');
    else if (t && !address) address = t;
  });
  const cnpj = cnpjRaw.replace(/\D/g, '');
  const accessKey = normalizeAccessKey(clean($('span.chave').first().text()));
  if (!legalName || cnpj.length !== 14 || !accessKey) {
    throw new SefazError('SEFAZ_PARSER_ERROR', 'HTML sem emitente ou chave de acesso');
  }

  const info = clean($('#infos li').first().text());
  const issued = labelFromBlock(info, 'Emissão')?.replace(/\s*-\s*Via Consumidor.*$/i, '') ?? null;
  const total = (label: string): number | null => {
    let v: number | null = null;
    $('#totalNota #linhaTotal').each((_, el) => {
      if (clean($(el).find('label').first().text()).toLowerCase().includes(label.toLowerCase())) {
        v = parseBrl(clean($(el).find('.totalNumb').first().text()));
      }
    });
    return v;
  };

  const items: ParsedDanfe['items'] = [];
  $('#tabResult tr[id^="Item"]').each((_, tr) => {
    const $tr = $(tr);
    const description = clean($tr.find('.txtTit2').first().text());
    const codeRaw = clean($tr.find('.RCod').first().text());
    const storeCode = codeRaw.match(/Código\s*:\s*([^)]+)/i)?.[1]?.trim() ?? codeRaw.replace(/[()]/g, '').trim();
    if (!description && !storeCode) return;
    const quantity = parseQuantity(afterLabel(clean($tr.find('.Rqtd').first().text()), 'Qtde\\.?')) ?? 1;
    const unitPriceCents = parseBrl(afterLabel(clean($tr.find('.RvlUnit').first().text()), 'Vl\\.\\s*Unit\\.?')) ?? 0;
    const totalCents = parseBrl(clean($tr.find('span.valor').first().text())) ?? Math.round(unitPriceCents * quantity);
    items.push({
      lineNo: items.length + 1,
      storeCode: storeCode || `linha-${items.length + 1}`,
      description: description || storeCode,
      quantity: quantity > 0 ? quantity : 1,
      unit: afterLabel(clean($tr.find('.RUN').first().text()), 'UN') || null,
      unitPriceCents,
      totalCents,
    });
  });
  if (items.length === 0) throw new SefazError('SEFAZ_PARSER_ERROR', 'HTML sem tabela de itens');

  return {
    store: { legalName, cnpj, address, ...splitAddress(address) },
    receipt: {
      accessKey,
      number: labelFromBlock(info, 'Número'),
      series: labelFromBlock(info, 'Série'),
      issuedAt: parseIssuedAt(issued),
      protocol: info.match(/Protocolo de Autorização:\s*(\d+)/i)?.[1] ?? null,
      totalCents: total('Valor a pagar') ?? total('Valor total'),
      discountCents: total('Descontos'),
    },
    items,
  };
}
