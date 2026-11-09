import { useSyncExternalStore } from 'react';

/** REQ-055 — os 6 temas do protótipo v2. `sw` = [cor de ação, cor de menor preço] da bolinha. */
export const THEMES = [
  { id: 'institucional', name: 'Institucional', sw: ['#0069B4', '#00984B'], dark: false },
  { id: 'escuro', name: 'Escuro', sw: ['#2F86E8', '#34D27F'], dark: true },
  { id: 'petroleo', name: 'Petróleo + lima', sw: ['#0E6170', '#3F9E1F'], dark: false },
  { id: 'grafite', name: 'Grafite + esmeralda', sw: ['#1F2430', '#00995A'], dark: false },
  { id: 'feira', name: 'Feira (laranja + verde)', sw: ['#DC5A07', '#1F8A3A'], dark: false },
  { id: 'papel', name: 'Papel de nota', sw: ['#23446B', '#2D7A3E'], dark: false },
] as const;
export type ThemeId = (typeof THEMES)[number]['id'];

const KEY = 'nt_theme';
const listeners = new Set<() => void>();
const isTheme = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v);

/** Sem escolha salva: Grafite + esmeralda (padrão do produto). */
function initial(): ThemeId {
  const saved = localStorage.getItem(KEY);
  if (isTheme(saved)) return saved;
  return 'grafite';
}

function paint(id: ThemeId) {
  const root = document.documentElement;
  root.dataset['theme'] = id;
  const meta = document.querySelector('meta[name="theme-color"]:not([media])') ?? Object.assign(document.head.appendChild(document.createElement('meta')), { name: 'theme-color' });
  meta.setAttribute('content', getComputedStyle(root).getPropertyValue('--nt-canvas').trim());
  listeners.forEach((l) => l());
}

export function applyTheme(id: ThemeId = initial(), animate = false) {
  if (isTheme(localStorage.getItem(KEY)) || animate) localStorage.setItem(KEY, id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (animate && document.startViewTransition && !reduce && document.documentElement.dataset['theme'] !== id) {
    document.documentElement.dataset['vt'] = 'theme';
    const t = document.startViewTransition(() => paint(id));
    void t.finished.finally(() => delete document.documentElement.dataset['vt']);
  } else paint(id);
}

export function useTheme(): ThemeId {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => (document.documentElement.dataset['theme'] as ThemeId | undefined) ?? 'grafite',
    () => 'grafite',
  );
}
