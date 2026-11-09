import { useId } from 'react';
import { THEMES, applyTheme, useTheme, type ThemeId } from '../lib/theme';

const dotStyle = (sw: readonly [string, string]) => ({ '--a': sw[0], '--b': sw[1] }) as React.CSSProperties;

/** Bolinha do tema (como no protótipo v2): metade cor de ação, metade cor de menor preço. */
export function ThemeDot({ id, size = 26 }: { id: ThemeId; size?: number }) {
  const t = THEMES.find((x) => x.id === id) ?? THEMES[0];
  return <span className="tdot" style={{ ...dotStyle(t.sw), width: size, height: size }} aria-hidden="true" />;
}

/**
 * Botão-bolinha que abre a lista de temas (Popover API: Esc e toque fora fecham sozinhos).
 * `placement`: 'down' no topo do celular, 'up' na barra lateral do desktop.
 */
export function ThemePicker({ placement = 'down', withLabel = false }: { placement?: 'down' | 'up'; withLabel?: boolean }) {
  const current = useTheme();
  const id = useId().replace(/:/g, '');
  const popId = `theme-${id}`;
  const cur = THEMES.find((t) => t.id === current) ?? THEMES[0];
  return (
    <>
      <button className={withLabel ? 'dnav themebtn' : 'ib themebtn'} popoverTarget={popId} aria-label={`Tema: ${cur.name}. Trocar tema`} style={{ anchorName: `--${popId}` } as React.CSSProperties}>
        <ThemeDot id={current} size={withLabel ? 20 : 24} />
        {withLabel && <span>Tema · {cur.name.split(" (")[0]}</span>}
      </button>
      <div id={popId} popover="auto" className={`themepop ${placement}`} role="radiogroup" aria-label="Tema" style={{ positionAnchor: `--${popId}` } as React.CSSProperties}>
        {THEMES.map((t) => (
          <button
            key={t.id}
            role="radio"
            aria-checked={t.id === current}
            className={t.id === current ? 'on' : ''}
            onClick={() => applyTheme(t.id, true)}
          >
            <ThemeDot id={t.id} />
            <span>{t.name}</span>
          </button>
        ))}
      </div>
    </>
  );
}
