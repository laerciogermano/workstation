import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api, ApiError } from "./api/client";
import { AccountDialog } from "./features/auth/AccountDialog";
import { clearPersonKey, getPersonKey, savePersonKey } from "./features/auth/person";
import { ProjectsPage } from "./features/projects/ProjectsPage";
import { IdePage } from "./features/ide/IdePage";

/** Roteamento mínimo por hash: #/ (projetos) · #/p/<id> (IDE). */
function useHashRoute(): string {
  const [h, setH] = useState(location.hash.slice(1) || "/");
  useEffect(() => { const f = () => setH(location.hash.slice(1) || "/"); addEventListener("hashchange", f); return () => removeEventListener("hashchange", f); }, []);
  return h;
}

export function App() {
  const route = useHashRoute();
  const [acct, setAcct] = useState(false);
  // sem tela de login: toda pessoa entra como visitante (UUID próprio) e vincula uma conta quando quiser
  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      let user;
      try { user = (await api.me()).user; } catch (e) {
        if (!(e instanceof ApiError && e.status === 401)) throw e;
        user = (await api.guest(getPersonKey())).user;
      }
      if (user.guest && user.personKey) savePersonKey(user.personKey); else if (!user.guest) clearPersonKey();
      return user;
    },
  });
  if (me.isPending) return <div className="boot">Carregando…</div>;
  if (me.isError || !me.data) return <div className="boot">Não foi possível falar com o servidor.</div>;
  const m = /^\/p\/([0-9a-f-]{36})$/.exec(route);
  const page = m
    ? <IdePage projectId={m[1]!} user={me.data} onExit={() => { location.hash = "#/"; }} onAccount={() => setAcct(true)} />
    : <ProjectsPage user={me.data} onAccount={() => setAcct(true)} />;
  return <>{page}{acct && <AccountDialog me={me.data} onClose={() => setAcct(false)} />}</>;
}
