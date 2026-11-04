import { type JSX, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Sheet } from '../../ui/layout';
import { Button, Title, ui } from '../../ui/primitives';

export type GuestAuthReason = 'interest' | 'pass' | 'rsvp' | 'people';

const COPY: Record<GuestAuthReason, { title: string; body: string; cta: string }> = {
  interest: {
    title: 'Quer curtir este rolê?',
    body: 'Pra marcar interesse, cria uma conta — é rápido e você não perde o que curtiu.',
    cta: 'Criar conta',
  },
  pass: {
    title: 'Quer passar este rolê?',
    body: 'Pra lembrar o que você já viu, cria uma conta. É bem rapidinho.',
    cta: 'Criar conta',
  },
  rsvp: {
    title: 'Quer confirmar presença?',
    body: 'Pra dizer que vai, cria uma conta — leva pouco tempo e o organizador te encontra na lista.',
    cta: 'Criar conta',
  },
  people: {
    title: 'Quer ver quem vai?',
    body: 'Pra ver quem curtiu e quem confirmou presença, cria uma conta. É rápido.',
    cta: 'Criar conta',
  },
};

/** Sheet pedindo cadastro antes de ação autenticada (curtir, RSVP…). */
export function GuestAuthSheet({
  open,
  reason,
  onClose,
  next,
}: {
  open: boolean;
  reason: GuestAuthReason;
  onClose: () => void;
  next?: string;
}): JSX.Element | null {
  const nav = useNavigate();
  const loc = useLocation();
  const dest = encodeURIComponent(next ?? loc.pathname + loc.search);
  const c = COPY[reason];
  return (
    <Sheet open={open} onClose={onClose} label={c.title} accent="magenta">
      <Title>{c.title}</Title>
      <p className={ui.sub} style={{ marginTop: 8 }}>
        {c.body}
      </p>
      <Button className={ui.mt24} onClick={() => nav(`/cadastro?next=${dest}`)}>
        {c.cta}
      </Button>
      <Button variant="ghost" className={ui.mt12} onClick={() => nav(`/entrar?next=${dest}`)}>
        Já tenho conta
      </Button>
    </Sheet>
  );
}

/** Estado + opener para o sheet de cadastro visitante. */
export function useGuestAuthPrompt() {
  const [state, setState] = useState<{ open: boolean; reason: GuestAuthReason; next?: string }>({ open: false, reason: 'interest' });
  const prompt = useCallback((reason: GuestAuthReason = 'interest', next?: string) => {
    setState({ open: true, reason, next });
  }, []);
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  return {
    prompt,
    close,
    sheet: <GuestAuthSheet open={state.open} reason={state.reason} next={state.next} onClose={close} />,
  };
}
