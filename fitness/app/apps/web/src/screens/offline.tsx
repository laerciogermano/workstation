/** F-61 · Vitrine sem internet (RF-37 · RNF-08): o núcleo segue offline; social precisa de rede. */
import { Link } from 'react-router';
import { Icon } from '../ui/icon';
import { TopBar } from '../ui/kit';

export function Offline() {
  return (
    <div className="body">
      <TopBar title="Vitrine" />
      <section className="empty">
        <Icon name="wifioff" />
        <h1>A vitrine precisa de internet</h1>
        <p>Treino, dieta e medidas continuam funcionando e ficam salvos neste aparelho.</p>
        <div className="cta-col">
          <button type="button" className="btn p" onClick={() => window.location.reload()}>
            Tentar de novo
          </button>
          <Link className="btn g" to="/" viewTransition>
            Ir para hoje
          </Link>
        </div>
      </section>
    </div>
  );
}
