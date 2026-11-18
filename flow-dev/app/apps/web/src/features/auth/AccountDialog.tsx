import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, type Me } from "../../api/client";
import { Icon } from "../../ui/Icon";
import { clearPersonKey, savePersonKey } from "./person";

/** Vincula o visitante a uma conta (mesmo UUID e projetos), entra numa conta existente ou retoma por código. */
export function AccountDialog({ me, onClose }: { me: Me; onClose: () => void }) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"register" | "login" | "code">("register");
  const [f, setF] = useState({ email: "", password: "", name: me.name === "Visitante" ? "" : me.name });
  const [code, setCode] = useState("");
  const m = useMutation({
    mutationFn: async () => {
      if (mode === "register") return api.register(f);
      if (mode === "login") return api.login({ email: f.email, password: f.password });
      return api.guest(code.trim());
    },
    onSuccess: r => {
      if (r.user.guest && r.user.personKey) savePersonKey(r.user.personKey); else clearPersonKey();
      qc.clear(); void qc.invalidateQueries({ queryKey: ["me"] }); onClose();
    },
  });
  const err = m.error instanceof ApiError ? (m.error.issues?.map(i => i.message).join(" · ") || m.error.message) : m.error ? "Falha de conexão" : "";
  const submit = (e: FormEvent) => { e.preventDefault(); m.mutate(); };
  const tab = (k: typeof mode, t: string) => <button type="button" className={"btn" + (mode === k ? " pri" : "")} onClick={() => { m.reset(); setMode(k); }}>{t}</button>;
  return (
    <div className="scrim" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="auth-card" onSubmit={submit} aria-label="Conta" onKeyDown={e => { if (e.key === "Escape") onClose(); }}>
        <h1><Icon n="user-round" />{me.guest ? "Salvar com uma conta" : "Conta"}</h1>
        {me.guest ? (
          <>
            <p className="lead">Você está como <b>visitante</b>: seus projetos já estão salvos neste navegador, ligados ao seu código. Crie uma conta para levar seus fluxos para outros aparelhos.</p>
            <label>Seu código (UUID) — guarde para recuperar<input readOnly value={me.personKey ?? ""} onFocus={e => e.currentTarget.select()} /></label>
            <div style={{ display: "flex", gap: 8 }}>{tab("register", "Criar conta")}{tab("login", "Já tenho conta")}{tab("code", "Usar um código")}</div>
          </>
        ) : <p className="lead">Conectado como <b>{me.email}</b>.</p>}
        {me.guest && mode === "register" && <label>Nome<input autoComplete="name" required maxLength={120} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>}
        {me.guest && mode !== "code" && <>
          <label>E-mail<input type="email" autoComplete="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></label>
          <label>Senha<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "register" ? 8 : 1} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /></label></>}
        {me.guest && mode === "code" && <label>Código de um visitante anterior<input required pattern="[0-9a-fA-F-]{36}" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={code} onChange={e => setCode(e.target.value)} /></label>}
        {mode === "login" && me.guest && <p className="lead" style={{ fontSize: 12 }}>Ao entrar, os projetos deste visitante são levados para a conta.</p>}
        {err && <div className="err" role="alert">{err}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          {me.guest && <button className="btn pri" style={{ flex: 1 }} disabled={m.isPending}>{mode === "register" ? "Vincular conta" : mode === "login" ? "Entrar" : "Retomar"}</button>}
          {!me.guest && <button type="button" className="btn" style={{ flex: 1 }} onClick={async () => { await api.logout(); clearPersonKey(); qc.clear(); void qc.invalidateQueries({ queryKey: ["me"] }); onClose(); }}><Icon n="arrow-up-from-line" />Sair</button>}
          <button type="button" className="btn" onClick={onClose}>Fechar</button></div>
      </form>
    </div>
  );
}
