import { Link } from 'react-router';
import { StateView } from '../ui/bits';

export function NotFound() {
  return (
    <StateView icon="search" title="Página não encontrada">
      <p>O endereço pode ter mudado.</p>
      <Link to="/" className="btn p sm">
        Ir para Produtos
      </Link>
    </StateView>
  );
}
