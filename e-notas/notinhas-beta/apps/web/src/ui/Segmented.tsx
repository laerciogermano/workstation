import { motion } from 'motion/react';
import { useId } from 'react';
import { Icon, type IconName } from './Icon';

/** Pílula desliza entre opções (mesmo conteúdo, outra forma de ver) — Motion layoutId. */
export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: IconName }[] }) {
  const id = useId();
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={o.value === value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.value === value && <motion.span layoutId={`seg-${id}`} className="segpill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
          {o.icon && <Icon name={o.icon} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}
