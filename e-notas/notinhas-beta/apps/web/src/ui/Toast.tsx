import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

type ToastMsg = { text: string; action?: { label: string; run: () => void } };
const Ctx = createContext<(m: ToastMsg) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const show = useCallback((m: ToastMsg) => {
    setMsg(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 3600);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div aria-live="polite">
        {msg && (
          <div className="toast" role="status">
            <Icon name="check" />
            <span>{msg.text}</span>
            {msg.action && (
              <button
                onClick={() => {
                  msg.action?.run();
                  setMsg(null);
                }}
              >
                {msg.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
