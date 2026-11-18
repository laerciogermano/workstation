import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

type Toast = (msg: string, icon?: string) => void;
const Ctx = createContext<Toast>(() => undefined);
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<{ msg: string; icon: string; k: number } | null>(null);
  const timer = useRef<number>(0);
  const show = useCallback<Toast>((msg, icon = "check") => {
    setT({ msg, icon, k: Date.now() });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setT(null), 2600);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div className={"toast" + (t ? " show" : "")} role="status" aria-live="polite">
        {t && <><Icon n={t.icon} />{t.msg}</>}
      </div>
    </Ctx.Provider>
  );
}
