import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserDto } from "@flow/shared";
import { api } from "../../api/client";
import { Icon } from "../../ui/Icon";

export function ProjectsPage({ user, onLogout }: { user: UserDto; onLogout: () => void }) {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["projects"], queryFn: async () => (await api.projects()).projects });
  const [name, setName] = useState(""), [demo, setDemo] = useState(false);
  const create = useMutation({
    mutationFn: () => api.createProject({ name: name.trim(), demo }),
    onSuccess: r => { setName(""); qc.invalidateQueries({ queryKey: ["projects"] }); location.hash = `#/p/${r.id}`; },
  });
  const del = useMutation({ mutationFn: (id: string) => api.deleteProject(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }) });
  const submit = (e: FormEvent) => { e.preventDefault(); if (name.trim()) create.mutate(); };
  return (
    <div className="page"><div className="pj">
      <div className="pj-h"><h1>Projetos</h1><span style={{ color: "var(--muted)", fontSize: 13 }}>{user.name}</span>
        <button className="btn" onClick={onLogout}><Icon n="arrow-up-from-line" />Sair</button></div>
      <form className="pj-new" onSubmit={submit}>
        <input type="text" placeholder="Nome do novo projeto" aria-label="Nome do projeto" value={name} maxLength={120} onChange={e => setName(e.target.value)} />
        <label><input type="checkbox" checked={demo} onChange={e => setDemo(e.target.checked)} />Com o exemplo do protótipo</label>
        <button className="btn pri" disabled={!name.trim() || create.isPending}><Icon n="plus" />Criar</button>
      </form>
      <div className="pj-list">
        {list.data?.map(p => (
          <a key={p.id} className="pj-item" href={`#/p/${p.id}`}>
            <Icon n="workflow" /><div><b>{p.name}</b><small>{p.functions} funções · atualizado {new Date(p.updatedAt).toLocaleString("pt-BR")}</small></div><span className="sp" />
            <button className="btn ghost danger" title="Excluir projeto" aria-label={`Excluir ${p.name}`} onClick={e => { e.preventDefault(); if (confirm(`Excluir “${p.name}”?`)) del.mutate(p.id); }}><Icon n="trash-2" /></button>
          </a>
        ))}
        {list.data && !list.data.length && <div className="pj-empty">Nenhum projeto ainda. Crie o primeiro acima.</div>}
      </div>
    </div></div>
  );
}
