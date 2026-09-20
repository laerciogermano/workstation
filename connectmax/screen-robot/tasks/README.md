# Tasks — screen-robot

**Por quê:** atividades executáveis do refinamento técnico (pastas = `task-<nn>-<titulo>`), cada uma com Entradas · Execução · Saídas.  
**Gantt / inventário:** [`7.tasks.md`](../7.tasks.md).  
**Processo:** [`core/processo/2.refinamento-tecnico`](../../../core/processo/2.refinamento-tecnico/README.md).  
**Cenários / BDDs / planos:** [`4.scenarios.md`](../4.scenarios.md) · [`5.bdds.md`](../5.bdds.md) · [`implementation-plan/`](../implementation-plan/README.md).

## Escopo atual

Só tasks do Provisionar agente (`task-001`..`004`). Demais depois da validação deste formato.

## Árvore

```text
tasks/
└── task-001-provisionar-agente/
    ├── README.md
    ├── task-002-subir-e-conectar/
    ├── task-003-serial-adb-online/
    └── task-004-boot-completo/
```

| TSK | Atividade | Pasta |
|-----|-----------|-------|
| TSK-001 | Provisionar agente | [`task-001-provisionar-agente/`](task-001-provisionar-agente/README.md) |
| TSK-002 | Subir e conectar | [`task-002-subir-e-conectar/`](task-001-provisionar-agente/task-002-subir-e-conectar/README.md) |
| TSK-003 | Serial ADB online | [`task-003-serial-adb-online/`](task-001-provisionar-agente/task-003-serial-adb-online/README.md) |
| TSK-004 | Boot completo | [`task-004-boot-completo/`](task-001-provisionar-agente/task-004-boot-completo/README.md) |
