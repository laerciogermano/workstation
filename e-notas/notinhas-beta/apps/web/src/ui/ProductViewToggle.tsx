import type { ProductViewMode } from '../lib/product-view';
import { useProductViewMode } from '../lib/product-view';
import { Segmented } from './Segmented';

const OPTIONS: { value: ProductViewMode; label: string; icon: 'gridsm' | 'grid' | 'list' }[] = [
  { value: 'sm', label: 'Cards pequenos', icon: 'gridsm' },
  { value: 'md', label: 'Cards médios', icon: 'grid' },
  { value: 'list', label: 'Lista', icon: 'list' },
];

/** Seletor sm / md / lista — persiste em `nt:product-view`. `compact` = só ícones. */
export function ProductViewToggle({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const [mode, setMode] = useProductViewMode();
  return (
    <div className={`viewbar ${compact ? 'compact' : ''} ${className}`.trim()} role="group" aria-label="Modo de visualização dos produtos">
      <Segmented value={mode} onChange={setMode} options={OPTIONS} iconsOnly={compact} />
    </div>
  );
}
