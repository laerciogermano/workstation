# Tasks — screen-robot

**Por quê:** atividades executáveis do refinamento técnico (pastas = `TSK-<nn>-<titulo>`), cada uma com Entradas · Execução · Saídas.  
**Gantt / inventário:** [`7.tasks.md`](../7.tasks.md).  
**Processo:** [`core/processo/2.refinamento-tecnico`](../../core/processo/2.refinamento-tecnico/README.md).  
**Cenários / BDDs / planos:** [`4.scenarios.md`](../4.scenarios.md) · [`5.bdds.md`](../5.bdds.md) · [`implementation-plan/`](../implementation-plan/README.md).

## Escopo atual

EP-01 Provisionar agente · EP-02 Eventos de UI.

## Árvore

```text
tasks/
├── TSK-001-provisionar-agente/
│   ├── TSK-002-subir-e-conectar/
│   ├── TSK-003-serial-adb-online/
│   └── TSK-004-boot-completo/
└── TSK-005-eventos-de-ui/
    ├── TSK-006-evento-de-boot/
    ├── TSK-007-evento-de-app-aberta/
    ├── TSK-008-evento-de-tela-estavel/
    └── TSK-009-evento-de-mudanca-dump/
```

| TSK | Atividade | Pasta |
|-----|-----------|-------|
| TSK-001 | Provisionar agente | [`TSK-001-provisionar-agente/`](TSK-001-provisionar-agente/README.md) |
| TSK-002 | Subir e conectar | [`TSK-002-subir-e-conectar/`](TSK-001-provisionar-agente/TSK-002-subir-e-conectar/README.md) |
| TSK-003 | Serial ADB online | [`TSK-003-serial-adb-online/`](TSK-001-provisionar-agente/TSK-003-serial-adb-online/README.md) |
| TSK-004 | Boot completo | [`TSK-004-boot-completo/`](TSK-001-provisionar-agente/TSK-004-boot-completo/README.md) |
| TSK-005 | Eventos de UI | [`TSK-005-eventos-de-ui/`](TSK-005-eventos-de-ui/README.md) |
| TSK-006 | Evento de boot | [`TSK-006-evento-de-boot/`](TSK-005-eventos-de-ui/TSK-006-evento-de-boot/README.md) |
| TSK-007 | Evento de app aberta | [`TSK-007-evento-de-app-aberta/`](TSK-005-eventos-de-ui/TSK-007-evento-de-app-aberta/README.md) |
| TSK-008 | Evento de tela estável | [`TSK-008-evento-de-tela-estavel/`](TSK-005-eventos-de-ui/TSK-008-evento-de-tela-estavel/README.md) |
| TSK-009 | Evento de mudança de dump | [`TSK-009-evento-de-mudanca-dump/`](TSK-005-eventos-de-ui/TSK-009-evento-de-mudanca-dump/README.md) |
