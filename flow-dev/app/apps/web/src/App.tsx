import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api, ApiError } from "./api/client";
import { AuthPage } from "./features/auth/AuthPage";
import { ProjectsPage } from "./features/projects/ProjectsPage";
import { IdePage } from "./features/ide/IdePage";

/** Roteamento mínimo por hash: #/ (projetos) · #/p/<id> (IDE). */
function useHashRoute(): string {
  const [h, setH] = useState(location.hash.slice(1) || "/");
  useEffect(() => { const f = () => setH(location.hash.slice(1) || "/"); addEventListener("hashchange", f); return () => removeEventListener("hashchange", f); }, []);
  return h;
}

export function App() {
  const qc = useQueryClient();
  const route = useHashRoute();
  const me = useQuery({ queryKey: ["me"], queryFn: async () => { try { return (await api.me()).user; } catch (e) { if (e instanceof ApiError && e.status === 401) return null; throw e; } } });
  if (me.isPending) return <div className="boot">Carregando…</div>;
  if (me.isError) return <div className="boot">Não foi possível falar com o servidor.</div>;
  if (!me.data) return <AuthPage onDone={() => qc.invalidateQueries({ queryKey: ["me"] })} />;
  const m = /^\/p\/([0-9a-f-]{36})$/.exec(route);
  if (m) return <IdePage projectId={m[1]!} user={me.data} onExit={() => { location.hash = "#/"; }} />;
  return <ProjectsPage user={me.data} onLogout={async () => { await api.logout(); qc.clear(); qc.invalidateQueries({ queryKey: ["me"] }); }} />;
}
