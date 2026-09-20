# Provisionar agente

| Campo | Valor |
|-------|--------|
| Pasta | `task-001-provisionar-agente` |
| TSK | [`TSK-001`](../../7.tasks.md) |
| Origem | EP-01 · US-01 |
| Filhas | [`task-002-subir-e-conectar`](task-002-subir-e-conectar/README.md) · [`task-003-serial-adb-online`](task-003-serial-adb-online/README.md) · [`task-004-boot-completo`](task-004-boot-completo/README.md) |
| Plano | [`implementation-plan/EP-01-provisionar-agente.md`](../../implementation-plan/EP-01-provisionar-agente.md) |

## Entradas

- Stories / épicos: [`1.stories.md`](../../1.stories.md) · [`2.epics.md`](../../2.epics.md)
- Cenários SC-01..03 e BDDs de aceite
- Host com `adb`; runtime redroid ou AVD disponível/startável
- Stack: Node ≥ 18 · JS · Docker/Colima (redroid) ou AVD

## Execução

- Entregar capacidade Node de provisionar o agent até serial ADB `device` + boot completo
- API pública: único método `provisionEmulator(cfg)` → `AgentHandle` (filhas encapsuladas)
- Implementar / validar na ordem: task-002 → task-003 → task-004

## Saídas

- Agent pronto para ADB (serial online, boot ok) — pré-requisito das demais tasks do Gantt
- Handle com `serial`, `kind`, `provisionedAt`, `bootCompleted: true`

## Documentação

- Cenários: [`4.scenarios.md#ep-01--provisionar-agente`](../../4.scenarios.md#ep-01--provisionar-agente)
- BDDs: [`5.bdds.md#ep-01--provisionar-agente`](../../5.bdds.md#ep-01--provisionar-agente)
- Plano: [`implementation-plan/EP-01-provisionar-agente.md`](../../implementation-plan/EP-01-provisionar-agente.md)
- Código: [`sources/android-control/lib/provision.js`](../../sources/android-control/lib/provision.js)
- Runtime: [`sources/redroid/`](../../sources/redroid/README.md) · [`sources/android-studio/`](../../sources/android-studio/README.md)
