import { createContext, type JSX, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { cx } from './primitives';
import s from './ui.module.css';

type Toast = { id: number; text: string; error: boolean };
type Ctx = { show: (text: string) => void; error: (text: string) => void };
const ToastCtx = createContext<Ctx>({ show: () => undefined, error: () => undefined });

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((text: string, error: boolean) => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs.slice(-2), { id, text, error }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3500);
  }, []);
  const value = useMemo(() => ({ show: (t: string) => push(t, false), error: (t: string) => push(t, true) }), [push]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className={s.toasts} aria-live="polite" role="status">
        {items.map((x) => (
          <div key={x.id} className={cx(s.toast, x.error && s.toastErr)}>
            {x.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = (): Ctx => useContext(ToastCtx);
