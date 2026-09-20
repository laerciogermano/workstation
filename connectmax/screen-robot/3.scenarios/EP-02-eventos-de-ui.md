# Cenários — EP-02 Eventos de UI

**Por quê:** US e cenários (SC) do épico, expostos via **código Node**.  
**Índice:** [`README.md`](README.md) · **BDDs:** [`../4.bdds/EP-02-eventos-de-ui.md`](../4.bdds/EP-02-eventos-de-ui.md).  
**Épico:** [`../2.epics.md`](../2.epics.md) · **Plano:** [`../implementation-plan/EP-02-eventos-de-ui.md`](../implementation-plan/EP-02-eventos-de-ui.md).

**US:** US-02..05 · **SC:** SC-04..07.

---

## US-02 — Evento de boot

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-04 | Sinal de boot é recebido | Serial online | Listener aguarda o evento de boot | Boot sinalizado |

## US-03 — Evento de app aberta

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-05 | App em foreground é confirmada | Package esperado em foreground | Aguardar app aberta | App em foreground |

## US-04 — Evento de tela estável

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-06 | Tela fica estável | App em foreground | Aguardar ausência de transição de UI | Tela estável |

## US-05 — Evento de mudança de dump

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-07 | Dump de UI muda | Dump anterior (ou ausência), serial online | Detectar mudança no dump (uiautomator) | Dump atualizado disponível |

## Próximos passos

→ [`../4.bdds/EP-02-eventos-de-ui.md`](../4.bdds/EP-02-eventos-de-ui.md) · [`../implementation-plan/EP-02-eventos-de-ui.md`](../implementation-plan/EP-02-eventos-de-ui.md)
