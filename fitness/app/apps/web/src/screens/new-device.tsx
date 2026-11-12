/** F-62 · Aparelho novo (RF-02, RF-04 · RN-01, RN-01b): sem recuperação no v1, e a tela é honesta sobre isso. */
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { errorText } from '../lib/api';
import { fingerprintLabel, resetFingerprint, setToken } from '../lib/device';
import { clearPhotos } from '../lib/photos';
import { createDevice, qk } from '../lib/queries';
import { Icon } from '../ui/icon';
import { TopBar } from '../ui/kit';

export function NewDevice() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fresh = async () => {
    setBusy(true);
    setErr(null);
    try {
      setToken(null);
      resetFingerprint();
      await clearPhotos();
      qc.clear();
      await createDevice();
      await qc.fetchQuery({ queryKey: qk.me });
      void nav('/bem-vindo', { replace: true });
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="body ob">
      <TopBar title="" back={false} />
      <section className="empty">
        <Icon name="phone" />
        <h1>Este aparelho é novo para nós</h1>
        <p>
          Não há dados ligados a <span className="mono">{fingerprintLabel()}</span>. Como não existe conta, o histórico
          de outro aparelho não pode ser trazido.
        </p>
        <details className="disc">
          <summary>
            <Icon name="info" />E o meu personagem?
          </summary>
          <p>
            O apelido público não é login. Você pode criar outro aqui; o antigo continua no aparelho anterior. Conta
            opcional com sincronização está prevista para a v2.
          </p>
        </details>
        {err && <p className="err-box">{err}</p>}
        <div className="cta-col">
          <button type="button" className="btn p" onClick={fresh} disabled={busy}>
            Começar do zero
          </button>
        </div>
      </section>
    </div>
  );
}
