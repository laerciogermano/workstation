import type { ProductViewMode } from '../lib/product-view';
import { useProductViewMode } from '../lib/product-view';
import { Segmented } from './Segmented';

const OPTIONS: { value: ProductViewMode; label: string; icon: 'gridsm' | 'grid' | 'list' }[] = [
  { value: 'sm', label: 'Peq.', icon: 'gridsm' },
  { value: 'md', label: 'Méd.', icon: 'grid' },
  { value: 'list', label: 'Lista', icon: 'list' },
];

/** Seletor sm / md / lista — persiste em `nt:product-view`. */
export function ProductViewToggle({ className = '' }: { className?: string }) {
  const [mode, setMode] = useProductViewMode();
  return (
    <div className={`viewbar ${className}`.trim()} role="group" aria-label="Modo de visualização dos produtos">
      <Segmented value={mode} onChange={setMode} options={OPTIONS} />
    </div>
  );
}
