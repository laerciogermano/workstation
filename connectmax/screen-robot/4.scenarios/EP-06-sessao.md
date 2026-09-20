# Cenários — EP-06 Sessão

**Por quê:** US e cenários (SC) do épico, expostos via **código Node**.  
**Índice:** [`README.md`](README.md) · **BDDs:** [`../5.bdds/EP-06-sessao.md`](../5.bdds/EP-06-sessao.md).  
**Épico:** [`../2.epics.md`](../2.epics.md) · **Plano:** [`../implementation-plan/EP-06-sessao.md`](../implementation-plan/EP-06-sessao.md).

**US:** US-17..19 · **SC:** SC-22..24.

---

## US-17 — Salvar sessão

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-22 | Salvar sessão | Estado em memória, path da sessão | Serializar e gravar | Arquivo de sessão |

## US-18 — Remover sessão

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-23 | Remover sessão | Path da sessão | Apagar arquivo de sessão | Arquivo inexistente; contexto limpo |

## US-19 — Recuperar sessão

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-24 | Recuperar sessão | Arquivo de sessão existente | Ler e reaplicar contexto | Estado restaurado no runtime |

## Próximos passos

→ [`../5.bdds/EP-06-sessao.md`](../5.bdds/EP-06-sessao.md) · [`../implementation-plan/EP-06-sessao.md`](../implementation-plan/EP-06-sessao.md)
