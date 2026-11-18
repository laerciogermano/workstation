import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, ApiError } from "../../api/client";
import { Icon } from "../../ui/Icon";

export function AuthPage({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ email: "", password: "", name: "" });
  const m = useMutation({
    mutationFn: () => (mode === "login" ? api.login({ email: f.email, password: f.password }) : api.register(f)),
    onSuccess: onDone,
  });
  const err = m.error instanceof ApiError ? (m.error.issues?.map(i => i.message).join(" · ") || m.error.message) : m.error ? "Falha de conexão" : "";
  const submit = (e: FormEvent) => { e.preventDefault(); m.mutate(); };
  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit} aria-label={mode === "login" ? "Entrar" : "Criar conta"}>
        <h1><Icon n="workflow" />Flow.dev</h1>
        <p className="lead">{mode === "login" ? "Entre para abrir seus fluxos." : "Crie sua conta — já vem com o projeto de exemplo do protótipo."}</p>
        {mode === "register" && <label>Nome<input name="name" autoComplete="name" required maxLength={120} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>}
        <label>E-mail<input name="email" type="email" autoComplete="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></label>
        <label>Senha<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "register" ? 8 : 1} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /></label>
        {err && <div className="err" role="alert">{err}</div>}
        <button className="btn pri" disabled={m.isPending}>{mode === "login" ? "Entrar" : "Criar conta"}</button>
        <div className="alt">{mode === "login" ? "Ainda não tem conta?" : "Já tem conta?"}
          <button type="button" onClick={() => { m.reset(); setMode(mode === "login" ? "register" : "login"); }}>{mode === "login" ? "Criar conta" : "Entrar"}</button></div>
      </form>
    </div>
  );
}
