/** F-01 · Boas-vindas sem conta (RF-01, RF-02, RF-05 · RN-01, RN-02, RN-15). */
import { Link, Navigate } from 'react-router';
import { fingerprintLabel } from '../lib/device';
import { useSession } from '../lib/session';
import { Icon } from '../ui/icon';
import { Wordmark } from '../ui/kit';

export function Welcome() {
  const { onboarded } = useSession();
  if (onboarded) return <Navigate to="/" replace />;
  return (
    <div className="body ob hero">
      <div className="herotop">
        <Wordmark size="lg" />
      </div>
      <h1 className="h-xl">Treino, dieta e corpo no mesmo lugar.</h1>
      <p className="lede">
        Uma meta calórica feita para você amarra o que você come, o que treina e como o corpo responde.
      </p>
      <ul className="pillars">
        <li>
          <Icon name="flame" />
          <span>
            <b>Base metabólica</b>TMB, gasto e déficit ou superávit
          </span>
        </li>
        <li>
          <Icon name="bowl" />
          <span>
            <b>Dieta com o que tem em casa</b>e checagem do dia
          </span>
        </li>
        <li>
          <Icon name="dumbbell" />
          <span>
            <b>Treino com movimento</b>e calorias por exercício
          </span>
        </li>
      </ul>
      <div className="fpcard">
        <Icon name="finger" />
        <div>
          <b>Sem conta e sem senha</b>
          <p>
            Este aparelho é a sua identidade: <span className="mono">{fingerprintLabel()}</span>. Trocar de aparelho ou
            limpar os dados começa do zero.
          </p>
        </div>
      </div>
      <p className="fine">Valores são estimativas de apoio e não substituem médico ou nutricionista.</p>
      <div className="cta-col">
        <Link className="btn p" to="/comecar/voce" viewTransition>
          Começar · leva 1 minuto
        </Link>
        <Link className="btn g" to="/vitrine" viewTransition>
          Só olhar a vitrine
        </Link>
      </div>
    </div>
  );
}
