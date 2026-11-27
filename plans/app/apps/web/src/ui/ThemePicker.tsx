import { chooseTheme } from '../store/app.ts';
import { THEMES, type ThemeId } from './themes.ts';

/** Bolinhas do topo: fundo do tema por fora, cor de destaque no meio. */
export function ThemePicker({ current }: { current: ThemeId }) {
  return (
    <div className="themes" role="group" aria-label="Tema">
      {THEMES.map((t) => (
        <button key={t.id} type="button" aria-label={`Tema ${t.name}`} title={t.name} aria-pressed={t.id === current} style={{ background: t.bg }} onClick={() => chooseTheme(t.id)}>
          <i style={{ background: t.accent }} />
        </button>
      ))}
    </div>
  );
}
