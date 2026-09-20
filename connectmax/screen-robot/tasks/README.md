# Tasks — screen-robot

**Por quê:** atividades executáveis do refinamento técnico (pastas = **nome da task**), cada uma com Entradas · Execução · Saídas.  
**Gantt / inventário:** [`7.tasks.md`](../7.tasks.md).  
**Processo:** [`core/processo/2.refinamento-tecnico`](../../../core/processo/2.refinamento-tecnico/README.md).  
**Cenários / BDDs / planos:** [`4.scenarios.md`](../4.scenarios.md) · [`5.bdds.md`](../5.bdds.md) · [`implementation-plan/`](../implementation-plan/README.md).

## Escopo atual

Só tasks do **Provisionar agente** (TSK-001..004). Demais depois da validação deste formato.

## Árvore

```text
tasks/
└── provisionar-agente/          # TSK-001
    ├── README.md
    ├── subir-e-conectar/        # TSK-002
    ├── serial-adb-online/       # TSK-003
    └── boot-completo/           # TSK-004
```

| TSK | Atividade | Pasta |
|-----|-----------|-------|
| TSK-001 | Provisionar agente | [`provisionar-agente/`](provisionar-agente/README.md) |
| TSK-002 | Subir e conectar | [`subir-e-conectar/`](provisionar-agente/subir-e-conectar/README.md) |
| TSK-003 | Serial ADB online | [`serial-adb-online/`](provisionar-agente/serial-adb-online/README.md) |
| TSK-004 | Boot completo | [`boot-completo/`](provisionar-agente/boot-completo/README.md) |
