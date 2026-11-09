import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const RELOAD_KEY = 'nt:chunk-reload';

/** Limpa o flag depois de um boot bem-sucedido (evita loop se o erro for outro). */
export function clearChunkReloadFlag(): void {
  try {
    sessionStorage.removeItem(RELOAD_KEY);
  } catch {
    /* private mode */
  }
}

/**
 * `React.lazy` com 1 reload automático quando o chunk some pós-deploy
 * (HTML/SW antigo aponta para `/assets/*-HASH.js` que o rsync --delete removeu).
 */
export function lazyPage<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const mod = await factory();
      clearChunkReloadFlag();
      return mod;
    } catch (err) {
      let already = false;
      try {
        already = sessionStorage.getItem(RELOAD_KEY) === '1';
        if (!already) sessionStorage.setItem(RELOAD_KEY, '1');
      } catch {
        throw err;
      }
      if (!already) {
        location.reload();
        return new Promise(() => undefined);
      }
      throw err;
    }
  });
}
