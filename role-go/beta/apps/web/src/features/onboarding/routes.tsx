import { type Me, type PreferencesBody, RADIUS_DEFAULT_KM, RADIUS_MAX_KM, RADIUS_MIN_KM } from '@rolego/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type JSX, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { api, errorMessage, qs } from '../../lib/http';
import { t } from '../../lib/i18n/pt-BR';
import { setMe, useCities, useEventTypes, useMe } from '../../lib/queries';
import { Icon, type IconName } from '../../ui/Icon';
import { Footer, Screen, TopBar } from '../../ui/layout';
import { Badge, Button, cx, NeonCard, ProgressSteps, RangeSlider, Skeleton, TextInput, Title, ui } from '../../ui/primitives';
import { useToast } from '../../ui/toast';
import s from './onboarding.module.css';

const TYPE_ICON: Record<string, IconName> = {
  festas: 'party', eletronica: 'music', 'samba-pagode': 'music', sertanejo: 'music', 'rock-indie': 'music',
  bar: 'glass', shows: 'mask', cultura: 'mask', gastronomia: 'glass', social: 'home',
};

export default function OnboardingRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="tipos" element={<Types />} />
      <Route path="cidade" element={<City />} />
      <Route path="localizacao" element={<Location />} />
      <Route path="raio" element={<Radius />} />
      <Route path="*" element={<Navigate to="tipos" replace />} />
    </Routes>
  );
}

function useSavePrefs() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (body: PreferencesBody) => api<Me>('/me/preferences', { method: 'PATCH', body }),
    onSuccess: (me) => setMe(qc, me),
    onError: (e) => toast.error(errorMessage(e)),
  });
}

/** T-05 · O que você curte? (≥ 1 tipo) */
function Types(): JSX.Element {
  const { data: me } = useMe();
  const { data: types } = useEventTypes();
  const [sel, setSel] = useState<string[]>(me?.preferences.eventTypes ?? []);
  const save = useSavePrefs();
  const nav = useNavigate();
  const toggle = (slug: string) => setSel((xs) => (xs.includes(slug) ? xs.filter((x) => x !== slug) : [...xs, slug]));
  return (
    <Screen foot title="O que você curte?">
      <TopBar back={false} />
      <ProgressSteps total={4} current={1} />
      <Title>O que você curte?</Title>
      <p className={ui.sub}>Escolha pelo menos um. Isso ajuda a ordenar o que aparece para você.</p>
      <div className={ui.grid2}>
        {types
          ? types.map((ty) => (
              <button key={ty.slug} type="button" className={cx(ui.tile, sel.includes(ty.slug) && ui.tileOn)} aria-pressed={sel.includes(ty.slug)} onClick={() => toggle(ty.slug)}>
                <Icon name={TYPE_ICON[ty.slug] ?? 'party'} size="l" />
                {ty.label}
              </button>
            ))
          : Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={84} />)}
      </div>
      <Footer>
        <Button disabled={!sel.length} loading={save.isPending} onClick={() => save.mutate({ eventTypes: sel }, { onSuccess: () => nav('/onboarding/cidade') })}>
          {sel.length ? `${t.next} (${sel.length})` : 'Escolha pelo menos 1'}
        </Button>
      </Footer>
    </Screen>
  );
}

/** T-06 · Cidade (busca sem acento; "em breve" para as não lançadas) */
function City(): JSX.Element {
  const { data: me } = useMe();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const h = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(h);
  }, [q]);
  const { data: cities } = useCities(debounced);
  const [sel, setSel] = useState<string | null>(me?.preferences.city?.id ?? null);
  const save = useSavePrefs();
  const nav = useNavigate();
  useEffect(() => {
    if (!sel && cities?.[0]?.launchStatus === 'live') setSel(cities[0].id);
  }, [cities, sel]);
  return (
    <Screen foot title="Cidade">
      <TopBar />
      <ProgressSteps total={4} current={2} />
      <Title>Onde você curte sair?</Title>
      <p className={ui.sub}>Sua cidade base. Dá para explorar outra cidade depois, quando viajar.</p>
      <TextInput placeholder="Buscar cidade" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar cidade" />
      <div role="radiogroup" aria-label="Cidades">
        {cities?.map((c) => (
          <button key={c.id} type="button" role="radio" aria-checked={sel === c.id} className={cx(s.cityRow, sel === c.id && s.cityOn)} onClick={() => setSel(c.id)}>
            <span className={s.radioDot} />
            <span className={ui.grow}>
              <span className={ui.b}>{c.name}</span> <span className={ui.muted}>{c.uf}</span>
            </span>
            {c.launchStatus === 'live' ? <Badge tone="green">no ar</Badge> : <Badge tone="neutral">em breve</Badge>}
          </button>
        ))}
      </div>
      <Footer>
        <Button disabled={!sel} loading={save.isPending} onClick={() => sel && save.mutate({ cityId: sel }, { onSuccess: () => nav('/onboarding/localizacao') })}>
          {t.next}
        </Button>
      </Footer>
    </Screen>
  );
}

/** T-07 · Localização: explica ANTES do prompt nativo; negado → centro da cidade (com feedback). */
function Location(): JSX.Element {
  const save = useSavePrefs();
  const nav = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const goRadius = () => nav('/onboarding/raio');
  const skip = (reason?: 'denied' | 'unavailable') => {
    if (reason === 'denied') toast.show('Sem permissão — vamos usar o centro da cidade.');
    else if (reason === 'unavailable') toast.show('Não pegamos o GPS — vamos usar o centro da cidade.');
    save.mutate({ originMode: 'city', location: null }, { onSuccess: goRadius, onSettled: () => setBusy(false) });
  };
  const allow = () => {
    if (!('geolocation' in navigator)) return skip('unavailable');
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        save.mutate(
          { originMode: 'gps', location: { lat: pos.coords.latitude, lng: pos.coords.longitude } },
          {
            onSuccess: () => {
              toast.show('Localização ativada.');
              goRadius();
            },
            onSettled: () => setBusy(false),
          },
        ),
      (err) => skip(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };
  return (
    <Screen foot title="Localização">
      <TopBar />
      <ProgressSteps total={4} current={3} />
      <Title accent="cyan">Rolês perto de você</Title>
      <div className={s.radar} aria-hidden>
        <i />
        <i />
        <i />
        <span className={s.sweep} />
        <span className={s.me} />
      </div>
      <p className={ui.sub}>
        Usamos sua localização só para calcular a <span className={ui.cy}>distância até os rolês</span>. Guardamos apenas a última posição, aproximada (~100 m), e ela
        nunca aparece para outras pessoas.
      </p>
      <p className={`${ui.xs} ${ui.faint}`}>
        Ao tocar em permitir, o navegador mostra o pedido de permissão (às vezes no topo ou na barra de endereço).
      </p>
      <Footer column>
        <Button loading={busy || save.isPending} onClick={allow}>
          Permitir localização
        </Button>
        <Button variant="ghost" disabled={busy || save.isPending} onClick={() => skip()}>
          Agora não (usar o centro da cidade)
        </Button>
      </Footer>
    </Screen>
  );
}

/** T-08 · Raio 1–100 km com prévia "~48 rolês" (debounce 300 ms). */
function Radius(): JSX.Element {
  const { data: me } = useMe();
  const [km, setKm] = useState(me?.preferences.radiusKm ?? RADIUS_DEFAULT_KM);
  const [debounced, setDebounced] = useState(km);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(km), 300);
    return () => clearTimeout(h);
  }, [km]);
  const count = useQuery({ queryKey: ['discovery', 'count', debounced], queryFn: () => api<{ total: number }>(`/discovery/count${qs({ radiusKm: debounced })}`) });
  const qc = useQueryClient();
  const nav = useNavigate();
  const toast = useToast();
  const finish = useMutation({
    mutationFn: async () => {
      await api<Me>('/me/preferences', { method: 'PATCH', body: { radiusKm: km } });
      return api<Me>('/me/onboarding/complete', { method: 'POST' });
    },
    onSuccess: (m) => {
      setMe(qc, m);
      nav('/explorar', { replace: true });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Screen foot title="Raio">
      <TopBar />
      <ProgressSteps total={4} current={4} />
      <Title accent="cyan">Até onde você vai?</Title>
      <p className={ui.sub}>Dá para mudar quando quiser nos filtros.</p>
      <p className={s.big}>
        {km}
        <small>km</small>
      </p>
      <RangeSlider label="Raio de busca" value={km} min={RADIUS_MIN_KM} max={RADIUS_MAX_KM} onChange={setKm} scale={['1 km', '25', '50', '75', '100 km']} />
      <NeonCard accent="cyan" className={ui.mt16}>
        <p className={s.preview} role="status" aria-live="polite">
          {count.data ? (
            <>
              <span className={`${ui.xb} ${ui.lg} ${ui.cy}`}>~{count.data.total}</span> rolês nos próximos dias
            </>
          ) : (
            t.loading
          )}
        </p>
      </NeonCard>
      <p className={`${ui.xs} ${ui.faint} ${ui.mt16}`}>
        Sua presença nos eventos aparece para outras pessoas em "Quem vai". Você pode desligar isso a qualquer momento em Perfil → Privacidade.
      </p>
      <Footer>
        <Button loading={finish.isPending} onClick={() => finish.mutate()}>
          Bora explorar
        </Button>
      </Footer>
    </Screen>
  );
}
