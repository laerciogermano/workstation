import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../../lib/api';
import { queueReceipt } from '../../lib/offline-queue';
import { useIngest } from '../../lib/queries';
import { Skel } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { useGo } from '../../ui/nav';
import { Sheet } from '../../ui/Sheet';
import { decodeImageFile, useCameraScanner, Viewfinder } from './scanner';

type Phase = { kind: 'camera' } | { kind: 'processing' } | { kind: 'failed'; error: ApiError } | { kind: 'queued' };

/** T-20 câmera · T-21 foto · colar link · T-70 câmera negada · T-25 processando · T-27 falha */
export default function ScanPage() {
  const [phase, setPhase] = useState<Phase>({ kind: 'camera' });
  const [hit, setHit] = useState(false);
  const [paste, setPaste] = useState(false);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const ingest = useIngest();
  const go = useGo();
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);

  const submit = useCallback(
    async (url: string) => {
      if (busy.current) return;
      busy.current = true;
      if (!navigator.onLine) {
        queueReceipt(url);
        setPhase({ kind: 'queued' });
        return;
      }
      setPhase({ kind: 'processing' });
      try {
        const r = await ingest.mutateAsync(url);
        go(`/notas/${r.receipt.id}`, { replace: true, state: { status: r.status, points: r.pointsAwarded } });
      } catch (e) {
        setPhase({ kind: 'failed', error: e instanceof ApiError ? e : new ApiError(0, null) });
      } finally {
        busy.current = false;
      }
    },
    [ingest, go],
  );

  const { videoRef, state } = useCameraScanner(
    'qr',
    (text) => {
      setHit(true);
      void submit(text);
    },
    phase.kind === 'camera' && !paste,
  );

  async function onPhoto(f: File | undefined) {
    if (!f) return;
    setPhotoMsg('Lendo o QR da foto…');
    const text = await decodeImageFile(f, 'qr');
    if (text) {
      setPhotoMsg(null);
      void submit(text);
    } else setPhotoMsg('Não achamos um QR Code nessa foto. Tente outra, mais de perto e sem reflexo.');
  }

  if (phase.kind === 'processing') return <Processing />;
  if (phase.kind === 'failed') return <Failure error={phase.error} onRetry={() => setPhase({ kind: 'camera' })} />;
  if (phase.kind === 'queued')
    return (
      <div className="panel" style={{ marginTop: 0, minHeight: '100dvh' }}>
        <div className="state">
          <span className="sticon warn">
            <Icon name="wifioff" />
          </span>
          <h2>Nota guardada para enviar</h2>
          <p>Você está sem conexão. A nota fica na fila deste aparelho e sobe sozinha quando a rede voltar.</p>
          <Link to="/" className="btn p sm">
            Voltar para Produtos
          </Link>
        </div>
      </div>
    );

  const noCamera = state === 'denied' || state === 'unsupported';
  return (
    <div className="cam">
      <video ref={videoRef} muted playsInline aria-hidden="true" />
      <div className="floattop">
        <button className="ib glass" onClick={() => go(-1)} aria-label="Fechar">
          <Icon name="x" />
        </button>
        <span className="sp" />
        <span className="pillcam">
          <Icon name="qr" />
          QR da NFC-e · Paraná
        </span>
      </div>

      {noCamera ? (
        <div className="state" style={{ position: 'relative' }}>
          <span className="sticon warn">
            <Icon name="camera" />
          </span>
          <h2 style={{ color: 'var(--nt-white)' }}>{state === 'denied' ? 'Sem acesso à câmera' : 'Câmera indisponível aqui'}</h2>
          <p style={{ color: 'color-mix(in srgb, var(--nt-white) 75%, transparent)' }}>
            {state === 'denied'
              ? 'Libere a câmera nas configurações do navegador — ou use a foto do cupom ou o link da nota.'
              : 'A câmera precisa de conexão segura (HTTPS). Você ainda pode mandar a foto do cupom ou colar o link.'}
          </p>
        </div>
      ) : (
        <>
          <Viewfinder mode="qr" hit={hit} />
          <p>{state === 'starting' ? 'Abrindo a câmera…' : 'Aponte para o QR Code no rodapé do cupom'}</p>
        </>
      )}
      {photoMsg && (
        <p role="status" className="pillcam">
          {photoMsg}
        </p>
      )}

      <div className="camfoot">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
        <button className="btn light" onClick={() => fileRef.current?.click()}>
          <Icon name="image" />
          Foto do cupom
        </button>
        <button className="btn light" onClick={() => setPaste(true)}>
          <Icon name="link" />
          Colar link da nota
        </button>
      </div>
      <PasteSheet open={paste} onClose={() => setPaste(false)} onSubmit={(u) => { setPaste(false); void submit(u); }} />
    </div>
  );
}

function PasteSheet({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (u: string) => void }) {
  const [v, setV] = useState('');
  return (
    <Sheet open={open} onClose={onClose} title="Colar link da nota">
      <p className="meta mb12">O link do QR Code começa com fazenda.pr.gov.br/nfce/qrcode.</p>
      <label className="field">
        <span>
          <Icon name="link" />
        </span>
        <input value={v} onChange={(e) => setV(e.target.value)} placeholder="https://www.fazenda.pr.gov.br/nfce/qrcode?p=…" aria-label="Link da nota" inputMode="url" />
      </label>
      <button
        className="btn s mt8"
        onClick={async () => {
          try {
            setV(await navigator.clipboard.readText());
          } catch {
            /* sem permissão de leitura da área de transferência */
          }
        }}
      >
        Colar da área de transferência
      </button>
      <button className="btn p mt8" disabled={v.trim().length < 10} onClick={() => onSubmit(v.trim())}>
        Ler nota
      </button>
    </Sheet>
  );
}

/** T-25 — espera de até 10 s com etapas e skeleton dos itens (sem spinner solto). */
function Processing() {
  const steps = ['QR Code lido', 'Consultando a SEFAZ do Paraná', 'Lendo itens e preços', 'Conferindo se a nota é nova'];
  return (
    <div className="panel" style={{ marginTop: 0, minHeight: '100dvh' }} aria-busy="true">
      <h1 className="h1 mb12">Lendo sua nota</h1>
      <ol className="steps">
        {steps.map((s, i) => (
          <li key={s} className={i === 0 ? 'done' : i === 1 ? 'now' : ''}>
            <span className="mk">{i === 0 && <Icon name="check" />}</span>
            {s}
          </li>
        ))}
      </ol>
      <p className="meta mb12">Pode levar até 10 segundos — depende da SEFAZ.</p>
      {[0, 1, 2, 3].map((i) => (
        <div className="row" key={i}>
          <Skel h={40} w={40} r={9} />
          <div className="grow">
            <Skel h={12} w="70%" />
            <Skel h={10} w="40%" />
          </div>
          <Skel h={14} w={56} />
        </div>
      ))}
    </div>
  );
}

/** T-27 — SEFAZ sem resposta (link guardado, nova tentativa automática) ou link que não é NFC-e do PR (RN-01). */
function Failure({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  const invalid = error.code === 'INVALID_SEFAZ_URL';
  const sefaz = error.code === 'SEFAZ_TIMEOUT' || error.code === 'SEFAZ_PARSER_ERROR';
  return (
    <div className="panel" style={{ marginTop: 0, minHeight: '100dvh' }}>
      <div className="state">
        <span className={`sticon ${invalid ? 'err' : 'warn'}`}>
          <Icon name={invalid ? 'x' : 'clock'} />
        </span>
        <h2>{invalid ? 'Esse QR não é de uma NFC-e do Paraná' : sefaz ? 'A SEFAZ não respondeu a tempo' : 'Não deu para ler a nota'}</h2>
        <p>
          {invalid
            ? error.message
            : sefaz
              ? 'Guardamos o link e vamos tentar de novo sozinhos. Se der certo, a nota aparece em Minhas notas.'
              : error.message}
        </p>
        <button className="btn p sm" onClick={onRetry}>
          <Icon name="refresh" />
          Tentar outra nota
        </button>
        <Link to="/notas" className="btn gh">
          Ver Minhas notas
        </Link>
      </div>
    </div>
  );
}
