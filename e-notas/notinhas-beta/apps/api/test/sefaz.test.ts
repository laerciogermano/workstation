import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkSefazUrl } from '../src/modules/receipts/sefaz-url.js';
import { createSefazPrAdapter, parseDanfeHtml, splitAddress } from '../src/modules/receipts/sefaz-pr.adapter.js';
import { SefazError } from '../src/modules/receipts/sefaz.port.js';
import { KEY_JUPITER, sefazUrl } from './helpers.js';

const html = readFileSync(new URL('./fixtures/danfe-jupiter.html', import.meta.url), 'utf8').replace('__CHAVE__', KEY_JUPITER.replace(/(\d{4})/g, '$1 '));

describe('RN-01 · allow-list da URL (anti-SSRF)', () => {
  it('aceita QR da Fazenda PR e força HTTPS', () => {
    const r = checkSefazUrl(sefazUrl(KEY_JUPITER));
    expect(r.ok && r.url.startsWith('https://www.fazenda.pr.gov.br/nfce/qrcode')).toBe(true);
    expect(r.ok && r.accessKey).toBe(KEY_JUPITER);
  });
  it.each([
    ['outro host', `https://fazenda.pr.gov.br.evil.com/nfce/qrcode?p=${KEY_JUPITER}`],
    ['IP interno', `http://127.0.0.1/nfce/qrcode?p=${KEY_JUPITER}`],
    ['porta estranha', `https://www.fazenda.pr.gov.br:8080/nfce/qrcode?p=${KEY_JUPITER}`],
    ['outro caminho', `https://www.fazenda.pr.gov.br/admin?p=${KEY_JUPITER}`],
    ['chave com DV errado', `https://www.fazenda.pr.gov.br/nfce/qrcode?p=${KEY_JUPITER.slice(0, 43)}0|2`],
    ['texto', 'leite barato'],
  ])('recusa %s', (_n, url) => {
    expect(checkSefazUrl(url).ok).toBe(false);
  });
});

describe('parser da DANFE (SEFAZ-PR)', () => {
  const p = parseDanfeHtml(html);
  it('extrai emitente, chave, totais e itens em centavos', () => {
    expect(p.store).toMatchObject({ cnpj: '04118410000122', legalName: 'JUPITER SUPERMERCADOS LTDA', neighborhood: 'Centro', city: 'Sao Jose dos Pinhais' });
    expect(p.receipt).toMatchObject({ accessKey: KEY_JUPITER, number: '48271', series: '1', totalCents: 4177, discountCents: 0 });
    expect(p.receipt.issuedAt?.toISOString()).toBe('2026-11-08T12:41:12.000Z');
    expect(p.items).toHaveLength(3);
    expect(p.items[1]).toMatchObject({ storeCode: '34811', quantity: 4, unitPriceCents: 529, totalCents: 2116 });
    expect(p.items[2]).toMatchObject({ quantity: 1.235, unit: 'KG' });
  });
  it('RN-06: CPF e nome do consumidor nunca saem do parser', () => {
    const s = JSON.stringify(p);
    expect(s).not.toContain('123.456.789');
    expect(s).not.toContain('MARIA');
  });
  it('HTML sem itens vira SEFAZ_PARSER_ERROR', () => {
    expect(() => parseDanfeHtml('<html></html>')).toThrow(SefazError);
  });
  it('separa bairro e cidade do endereço fiscal', () => {
    expect(splitAddress('AV. RUI BARBOSA, 7992, , AGUAS BELAS, SAO JOSE DOS PINHAIS, PR')).toEqual({ neighborhood: 'Aguas Belas', city: 'Sao Jose dos Pinhais' });
  });
});

describe('RN-15 · resiliência', () => {
  it('tenta de novo em 503 e depois lê', async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      return calls === 1 ? new Response('', { status: 503 }) : new Response(html, { status: 200 });
    }) as typeof fetch;
    const r = await createSefazPrAdapter({ timeoutMs: 1000, fetchImpl }).fetchReceipt('https://www.fazenda.pr.gov.br/nfce/qrcode?p=x');
    expect(calls).toBe(2);
    expect(r.items).toHaveLength(3);
  });
  it('timeout vira SEFAZ_TIMEOUT', async () => {
    const fetchImpl = (async () => {
      throw Object.assign(new Error('t'), { name: 'TimeoutError' });
    }) as typeof fetch;
    await expect(createSefazPrAdapter({ timeoutMs: 10, fetchImpl }).fetchReceipt('https://x')).rejects.toMatchObject({ code: 'SEFAZ_TIMEOUT' });
  });
});
