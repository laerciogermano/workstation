# EP-01 — Provisionar agente

| Campo | Valor |
|-------|--------|
| ID | EP-01 |
| TSK | [`TSK-001`](../../7.tasks.md) |
| Prioridade | 1 |
| Filha | [`US-01`](US-01-provisionar-um-agente/README.md) |
| Plano | [`implementation-plan/EP-01-provisionar-agente.md`](../../implementation-plan/EP-01-provisionar-agente.md) |

## Entradas

- Stories / épicos: [`1.stories.md`](../../1.stories.md) · [`2.epics.md`](../../2.epics.md)
- Cenários SC-01..03 e BDDs de aceite
- Host com `adb`; runtime redroid ou AVD disponível/startável
- Stack: Node ≥ 18 · JS · Docker/Colima (redroid) ou AVD

## Execução

- Entregar capacidade Node de provisionar o agent até serial ADB `device` + boot completo
- API pública: único método `provisionEmulator(cfg)` → `AgentHandle` (SC-01→SC-03 encapsulados)
- Implementar / validar na ordem: SC-01 → SC-02 → SC-03 (via US-01)

## Saídas

- Agent pronto para ADB (serial online, boot ok) — pré-requisito de EP-02..06
- Handle com `serial`, `kind`, `provisionedAt`, `bootCompleted: true`

## Documentação

- Cenários: [`4.scenarios.md#ep-01--provisionar-agente`](../../4.scenarios.md#ep-01--provisionar-agente)
- BDDs: [`5.bdds.md#ep-01--provisionar-agente`](../../5.bdds.md#ep-01--provisionar-agente)
- Plano: [`implementation-plan/EP-01-provisionar-agente.md`](../../implementation-plan/EP-01-provisionar-agente.md)
- Código: [`sources/android-control/lib/provision.js`](../../sources/android-control/lib/provision.js)
- Runtime: [`sources/redroid/`](../../sources/redroid/README.md) · [`sources/android-studio/`](../../sources/android-studio/README.md)
