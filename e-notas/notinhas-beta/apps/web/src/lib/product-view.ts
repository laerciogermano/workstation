import { useSyncExternalStore } from 'react';

/** Modos de grade de produtos (home / busca / loja). */
export type ProductViewMode = 'sm' | 'md' | 'list';

const KEY = 'nt:product-view';
const DEFAULT: ProductViewMode = 'md';

function isMode(v: string | null): v is ProductViewMode {
  return v === 'sm' || v === 'md' || v === 'list';
}

let current: ProductViewMode = (() => {
  try {
    const v = localStorage.getItem(KEY);
    return isMode(v) ? v : DEFAULT;
  } catch {
    return DEFAULT;
  }
})();

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function getProductViewMode(): ProductViewMode {
  return current;
}

export function setProductViewMode(mode: ProductViewMode): void {
  if (mode === current) return;
  current = mode;
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* private mode */
  }
  emit();
}

export function useProductViewMode(): [ProductViewMode, (m: ProductViewMode) => void] {
  const mode = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getProductViewMode,
    () => DEFAULT,
  );
  return [mode, setProductViewMode];
}
