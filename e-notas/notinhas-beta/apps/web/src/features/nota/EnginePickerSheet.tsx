import { Icon } from '../../ui/Icon';
import { Sheet } from '../../ui/Sheet';

export interface EngineOption {
  id: string;
  name: string;
  blurb: string;
  available: boolean;
}

/** Sheet compartilhado: escolher motor de QR ou EAN. */
export function EnginePickerSheet({
  open,
  title,
  hint,
  current,
  options,
  onClose,
  onPick,
}: {
  open: boolean;
  title: string;
  hint: string;
  current: string;
  options: EngineOption[];
  onClose: () => void;
  onPick: (id: string) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className="meta mb12">{hint}</p>
      <ul className="engine-list">
        {options.map((e) => {
          const on = e.id === current;
          return (
            <li key={e.id}>
              <button
                type="button"
                className={`engine-opt${on ? ' on' : ''}${e.available ? '' : ' off'}`}
                disabled={!e.available}
                aria-pressed={on}
                onClick={() => onPick(e.id)}
              >
                <span className="engine-opt-top">
                  <strong>{e.name}</strong>
                  {on && <Icon name="check" />}
                  {!e.available && <span className="meta">indisponível</span>}
                </span>
                <span className="meta">{e.blurb}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
