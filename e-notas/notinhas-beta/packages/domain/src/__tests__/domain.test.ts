import { describe, expect, it } from 'vitest';
import {
  cents,
  classifyProduct,
  descriptionSimilarity,
  formatBrl,
  formatPct,
  haversineKm,
  highlightOf,
  humanizeDescription,
  isValidAccessKey,
  isValidGtin,
  parseBrl,
  parseQuantity,
  quoteBasket,
  quoteCredits,
  rankStores,
  type PriceObservation,
} from '../index.js';

const NOW = new Date('2026-11-08T13:00:00Z');
const ob = (gtin: string, storeId: number, price: number, daysAgo: number): PriceObservation => ({
  gtin,
  storeId,
  priceCents: cents(price * 100),
  observedAt: new Date(NOW.getTime() - daysAgo * 86_400_000),
});

// Dados do protótipo v2 (SJP): 1 dimed · 2 stilo · 3 atacadao · 4 formosa · 5 jupiter
const MONSTER = '3000054721644';
const OBS = [
  ob(MONSTER, 1, 13.99, 0), ob(MONSTER, 2, 8.89, 2), ob(MONSTER, 3, 9.49, 5), ob(MONSTER, 4, 12.49, 9),
  ob(MONSTER, 1, 14.29, 5), ob(MONSTER, 1, 15.4, 35),
];

describe('GTIN (mod-10)', () => {
  it.each(['7894900011517', '7896004006277', '78936683', '3000054721644'])('aceita %s', (g) => {
    expect(isValidGtin(g)).toBe(true);
  });
  it.each(['7894900011518', '123', 'abcdefghijklm', '789490001151'])('recusa %s', (g) => {
    expect(isValidGtin(g)).toBe(false);
  });
});

describe('chave de acesso (mod-11)', () => {
  const withDv = (body: string) => {
    let w = 2, s = 0;
    for (let i = body.length - 1; i >= 0; i--) { s += Number(body[i]) * w; w = w === 9 ? 2 : w + 1; }
    const r = s % 11;
    return body + (r < 2 ? 0 : 11 - r);
  };
  it('valida DV e tamanho', () => {
    const key = withDv('4126110411841000012265001000048271102938441');
    expect(isValidAccessKey(key)).toBe(true);
    expect(isValidAccessKey(key.slice(0, 43) + ((Number(key[43]) + 1) % 10))).toBe(false);
    expect(isValidAccessKey('123')).toBe(false);
  });
});

describe('dinheiro', () => {
  it('parse/format BRL em centavos', () => {
    expect(parseBrl('1.234,56')).toBe(123456);
    expect(parseBrl('R$ 3,99')).toBe(399);
    expect(parseBrl('12.9')).toBe(1290);
    expect(parseBrl('')).toBeNull();
    expect(formatBrl(899)).toBe('R$ 8,99');
    expect(formatPct(-0.191)).toBe('-19%');
    expect(parseQuantity('3,500')).toBe(3.5);
  });
});

describe('RN-11 destaque', () => {
  it('Monster na Stilo fica 19% abaixo da mediana 14 d (R$ 10,99)', () => {
    const h = highlightOf(OBS, MONSTER, NOW);
    expect(h?.offer.storeId).toBe(2);
    expect(h?.medianCents).toBe(1099);
    expect(Math.round((h?.ratio ?? 0) * 100)).toBe(-19);
  });
  it('não destaca com menos de 3 lojas', () => {
    expect(highlightOf(OBS.slice(0, 2), MONSTER, NOW)).toBeNull();
  });
  it('não destaca se a diferença é < R$ 0,50', () => {
    const g = '7898367984018';
    expect(highlightOf([ob(g, 1, 3.99, 1), ob(g, 2, 4.19, 1), ob(g, 3, 4.29, 1)], g, NOW)).toBeNull();
  });
});

describe('RN-10 ranking', () => {
  it('ordena pela mediana dos desvios e deixa sem posição quem tem poucos dados', () => {
    const A = '7894900011517', B = '7896006711117';
    const obs = [ob(A, 1, 10, 1), ob(A, 2, 12, 1), ob(B, 1, 5, 1), ob(B, 2, 6, 1), ob(A, 3, 11, 1)];
    const r = rankStores(obs, [1, 2, 3], NOW);
    expect(r.map((x) => x.storeId)).toEqual([1, 2, 3]);
    expect(r[0]?.position).toBe(1);
    expect(r[2]?.position).toBeNull();
  });
});

describe('RN-13 cotação e split', () => {
  const A = 'A', B = 'B', C = 'C';
  const obs = [ob(A, 1, 10, 1), ob(A, 2, 8, 1), ob(B, 1, 5, 1), ob(B, 2, 6, 1), ob(C, 3, 2, 1)];
  const q = quoteBasket(obs, [{ gtin: A, quantity: 2 }, { gtin: B, quantity: 1 }, { gtin: 'Z', quantity: 1 }], [1, 2, 3], NOW);
  it('não interpola item sem preço', () => {
    expect(q.split.uncovered).toEqual(['Z']);
    expect(q.byStore.every((s) => s.missing.includes('Z'))).toBe(true);
  });
  it('split escolhe a loja mais barata por item e mede a economia', () => {
    expect(q.split.totalCents).toBe(8 * 2 * 100 + 500);
    expect(q.reference?.storeId).toBe(2); // 2x8 + 6 = 22 < 2x10 + 5 = 25
    expect(q.savingCents).toBe(100);
    expect(q.partial).toBe(false);
  });
});

describe('textos e categorias', () => {
  it('humaniza descrição de DANFE', () => {
    expect(humanizeDescription('ACHOC.PO TODDY')).toBe('Achocolatado em Pó Toddy');
    expect(humanizeDescription('CERVEJA LATA HEINEKEN ORIG 350ML#*+')).toBe('Cerveja Lata Heineken Original 350ml');
  });
  it('classifica e compara descrições', () => {
    expect(classifyProduct('ENERGETICO MONSTER 473ML').category).toBe('bebidas-nao-alcoolicas');
    expect(descriptionSimilarity('BATATA PRINGLES ORIGINAL 100G# +', 'Batata Pringles Original 104g')).toBeGreaterThan(0.5);
  });
});

it('haversine e créditos', () => {
  expect(haversineKm({ lat: -25.535, lng: -49.206 }, { lat: -25.5283, lng: -49.1942 })).toBeCloseTo(1.4, 1);
  expect(quoteCredits(0, 5)).toBe(0);
  expect(quoteCredits(15, 5)).toBe(3);
});
