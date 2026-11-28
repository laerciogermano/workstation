// Temas: as cores completas ficam em themes.css; aqui só o necessário para as bolinhas do topo.
export const THEMES = [
  { id: 'papel', name: 'Papel', bg: '#ffffff', accent: '#d4432a' },
  { id: 'teal', name: 'Teal', bg: '#eef2f2', accent: '#0f766e' },
  { id: 'indigo', name: 'Índigo', bg: '#eef0f7', accent: '#3d4fb8' },
  { id: 'cobalto', name: 'Cobalto', bg: '#eaf0fa', accent: '#2563eb' },
  { id: 'musgo', name: 'Musgo', bg: '#e9f0e7', accent: '#3f8f3a' },
  { id: 'ardosia', name: 'Ardósia', bg: '#232a36', accent: '#f08b4c', dark: true },
  { id: 'gantt', name: 'Gantt', bg: '#121212', accent: '#4981f6', dark: true },
  { id: 'graphite', name: 'Grafite', bg: '#202020', accent: '#61c24f', dark: true },
  { id: 'preto', name: 'Preto', bg: '#000000', accent: '#f0644b', dark: true },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];
export const isDark = (id: ThemeId) => THEMES.some((t) => t.id === id && 'dark' in t);
export const isTheme = (id: unknown): id is ThemeId => THEMES.some((t) => t.id === id);

/** Guardado só para a primeira pintura não piscar; quem manda é o .plans/ui.json do projeto. */
const PAINT_KEY = 'plans-theme';

export function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id;
  try {
    localStorage.setItem(PAINT_KEY, id);
  } catch {
    // armazenamento bloqueado: só perde a lembrança antes de abrir a pasta
  }
}

export function paintedTheme(): ThemeId {
  try {
    const id = localStorage.getItem(PAINT_KEY);
    return isTheme(id) ? id : 'papel';
  } catch {
    return 'papel';
  }
}
