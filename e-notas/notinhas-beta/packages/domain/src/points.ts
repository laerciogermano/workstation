/** REQ-052: contribuição paga o uso. */
export const POINTS = { receipt: 10, eanLink: 5 } as const;
export type PointKind = keyof typeof POINTS;

/** Crédito de cotação: franquia + 1 cotação a cada 5 pontos, por janela de 30 dias. */
export const FREE_QUOTES_PER_MONTH = 5;
export function quoteCredits(points: number, quotesUsedLast30d: number): number {
  return Math.max(0, FREE_QUOTES_PER_MONTH + Math.floor(points / 5) - quotesUsedLast30d);
}
