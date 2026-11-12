export const THEMES = [
  { id: 'cobalto', name: 'Cobalto', sw: ['#F4F5F7', '#2B4BF2'] },
  { id: 'preto', name: 'Preto', sw: ['#000000', '#5B7BFF'] },
  { id: 'lima', name: 'Lima sobre preto', sw: ['#000000', '#C6F432'] },
  { id: 'giz', name: 'Giz e tijolo', sw: ['#F5F1EA', '#C2410C'] },
] as const;
export type ThemeId = (typeof THEMES)[number]['id'];

export function currentTheme(): ThemeId {
  const t = document.documentElement.dataset.theme;
  return THEMES.some((x) => x.id === t) ? (t as ThemeId) : 'cobalto';
}

export function applyTheme(id: ThemeId): void {
  const go = () => {
    document.documentElement.dataset.theme = id;
    try {
      localStorage.setItem('ft-theme', id);
    } catch {
      /* sem storage */
    }
  };
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.startViewTransition(go);
  } else go();
}
