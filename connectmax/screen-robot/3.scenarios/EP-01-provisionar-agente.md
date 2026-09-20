# Cenários — EP-01 Provisionar agente

**Por quê:** US e cenários (SC) do épico, expostos via **código Node**.  
**Índice:** [`README.md`](README.md) · **BDDs:** [`../4.bdds/EP-01-provisionar-agente.md`](../4.bdds/EP-01-provisionar-agente.md).  
**Épico:** [`../2.epics.md`](../2.epics.md) · **Plano:** [`../implementation-plan/EP-01-provisionar-agente.md`](../implementation-plan/EP-01-provisionar-agente.md).

**US:** US-01 · **SC:** SC-01..03.

---

## US-01 — Provisionar um agente

| ID | Cenário | Entradas | Execução | Saídas |
|----|---------|----------|----------|--------|
| SC-01 | Subir / conectar o Android (agent) | Host, imagem/runtime, script de start | Subir o agent e estabelecer conexão | Processo do agent em execução e alcançável |
| SC-02 | Garantir serial ADB online | Agent alcançável, serial esperado na config | `adb connect` / listar devices até serial `device` | Serial ADB online |
| SC-03 | Aguardar boot completo | Serial online | Poll de boot/sys.boot_completed (ou equivalente) | Device com boot completo |

## Próximos passos

→ [`../4.bdds/EP-01-provisionar-agente.md`](../4.bdds/EP-01-provisionar-agente.md) · [`../implementation-plan/EP-01-provisionar-agente.md`](../implementation-plan/EP-01-provisionar-agente.md)
