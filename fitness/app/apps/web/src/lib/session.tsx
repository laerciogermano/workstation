import type { MeResponse } from '@fitness/contracts';
import type { IsoDate } from '@fitness/domain';
import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { todayLocal } from './date';

export interface Session {
  me: MeResponse;
  today: IsoDate;
  online: boolean;
  onboarded: boolean;
}

const Ctx = createContext<Session | null>(null);

export function useSession(): Session {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSession fora do SessionProvider');
  return s;
}

export function useOnline(): boolean {
  const [on, setOn] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => setOn(true);
    const down = () => setOn(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return on;
}

/** Dia local, atualizado na virada da meia-noite com o app aberto. */
function useToday(): IsoDate {
  const [d, setD] = useState(todayLocal);
  useEffect(() => {
    const t = setInterval(() => setD(todayLocal()), 60_000);
    return () => clearInterval(t);
  }, []);
  return d;
}

export function SessionProvider({ me, children }: { me: MeResponse; children: ReactNode }) {
  const online = useOnline();
  const today = useToday();
  return <Ctx.Provider value={{ me, today, online, onboarded: me.profile !== null }}>{children}</Ctx.Provider>;
}

/** Posição do GPS com permissão (RNF-07). Guardada só na sessão. */
export interface Position {
  lat: number;
  lng: number;
}
let cachedPos: Position | null = null;
export function usePosition() {
  const [pos, setPos] = useState<Position | null>(cachedPos);
  const [state, setState] = useState<'idle' | 'asking' | 'denied'>('idle');
  const ask = () => {
    if (!('geolocation' in navigator)) {
      setState('denied');
      return;
    }
    setState('asking');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        cachedPos = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(cachedPos);
        setState('idle');
      },
      () => setState('denied'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };
  return { pos, state, ask };
}
