// Minimizar esconde os filhos de uma linha. O tempo não muda: a linha minimizada continua cobrindo os mesmos passos.
import type { FlowLayout, Row } from './types.ts';

export interface Visibility {
  /** Índices das linhas à vista, em ordem. */
  rows: readonly number[];
  /** Linhas minimizadas. */
  closed: ReadonlySet<number>;
}

export function visibleRows(layout: FlowLayout, isClosed: (row: Row) => boolean): Visibility {
  const rows: number[] = [];
  const closed = new Set<number>();
  for (let i = 0; i < layout.rows.length; i++) {
    const row = layout.rows[i]!;
    rows.push(i);
    if (row.composite && isClosed(row)) {
      closed.add(i);
      i = row.last; // pula a subárvore inteira
    }
  }
  return { rows, closed };
}

/** Posição da primeira linha à vista com índice maior ou igual a `index`. */
export function positionOf(rows: readonly number[], index: number): number {
  let low = 0, high = rows.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (rows[mid]! < index) low = mid + 1;
    else high = mid;
  }
  return low;
}
