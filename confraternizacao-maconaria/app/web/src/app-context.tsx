import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { api, type Context, type EventItem, type Me } from './api';
import { Icon } from './icons';

// ---------- aviso rápido ----------
const ToastContext = createContext<(msg: string, bad?: boolean) => void>(() => {});
export const useToast = () => useContext(ToastContext);
/** consultas que "enviam um código" ao rodar ficam fora da atualização geral */
export const refresh = (client: QueryClient) => client.invalidateQueries({ predicate: (q) => !['setup', 'stepup'].includes(String(q.queryKey[0])) });
export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ msg: '', bad: false, show: false });
  const timer = useRef(0);
  const toast = useCallback((msg: string, bad = false) => {
    clearTimeout(timer.current);
    setState({ msg, bad, show: true });
    timer.current = window.setTimeout(() => setState((s) => ({ ...s, show: false })), 3200);
  }, []);
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={`toast ${state.show ? 'show' : ''}`} role="status" aria-live="polite"><Icon n={state.bad ? 'triangle-alert' : 'circle-check'} /><span>{state.msg}</span></div>
    </ToastContext.Provider>
  );
}

/** executa uma ação, avisa o resultado e atualiza o que está na tela */
export function useAction() {
  const toast = useToast(), client = useQueryClient();
  return useCallback(async <T,>(fn: () => Promise<T>, message?: string): Promise<T | undefined> => {
    try {
      const out = await fn();
      await refresh(client);
      if (message) toast(message);
      return out;
    } catch (e) {
      toast((e as Error).message, true);
      await refresh(client);
      return undefined;
    }
  }, [client, toast]);
}

// ---------- usuário e evento atual ----------
export type Sheet = { kind: 'menu' } | { kind: 'account' } | { kind: 'actions'; sessionId: string } | null;
interface App { me: Me; ctx: Context; events: EventItem[]; eventId: string; switchEvent: (id: string) => void; openSheet: (s: Sheet) => void; sheet: Sheet; path: (p: string) => string }
export const AppContext = createContext<App | null>(null);
export const useApp = () => useContext(AppContext)!;

/** dados do evento atual */
export function useEv<T = any>(path: string, enabled = true) {
  const { eventId } = useApp();
  return useQuery({ queryKey: ['ev', eventId, path], queryFn: () => api<T>('GET', `/events/${eventId}${path}`), enabled });
}
export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => api<Me>('GET', '/me').catch((e) => { if (e.status === 401) return null; throw e; }), staleTime: 60_000 });
export const useDev = () => useQuery({ queryKey: ['config'], queryFn: () => api<{ devTools: boolean }>('GET', '/auth/config'), staleTime: Infinity }).data?.devTools ?? false;
