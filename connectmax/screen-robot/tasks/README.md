# Tasks — screen-robot

**Por quê:** atividades executáveis do refinamento técnico (EP → US → SC), cada uma com Entradas · Execução · Saídas.  
**Gantt / inventário:** [`7.tasks.md`](../7.tasks.md).  
**Processo:** [`core/processo/2.refinamento-tecnico`](../../../core/processo/2.refinamento-tecnico/README.md).  
**Cenários / BDDs / planos:** [`4.scenarios.md`](../4.scenarios.md) · [`5.bdds.md`](../5.bdds.md) · [`implementation-plan/`](../implementation-plan/README.md).

## Escopo atual

Só **EP-01**. Demais épicos depois da validação deste formato.

## Árvore

```text
tasks/
└── EP-01-provisionar-agente/
    ├── README.md
    └── US-01-provisionar-um-agente/
        ├── README.md
        ├── SC-01-subir-conectar-android/
        ├── SC-02-garantir-serial-adb-online/
        └── SC-03-aguardar-boot-completo/
```

| ID | Atividade | Pasta |
|----|-----------|-------|
| EP-01 | Provisionar agente | [`EP-01-provisionar-agente/`](EP-01-provisionar-agente/README.md) |
| US-01 | Provisionar um agente | [`US-01-provisionar-um-agente/`](EP-01-provisionar-agente/US-01-provisionar-um-agente/README.md) |
| SC-01 | Subir / conectar o Android | [`SC-01-…`](EP-01-provisionar-agente/US-01-provisionar-um-agente/SC-01-subir-conectar-android/README.md) |
| SC-02 | Garantir serial ADB online | [`SC-02-…`](EP-01-provisionar-agente/US-01-provisionar-um-agente/SC-02-garantir-serial-adb-online/README.md) |
| SC-03 | Aguardar boot completo | [`SC-03-…`](EP-01-provisionar-agente/US-01-provisionar-um-agente/SC-03-aguardar-boot-completo/README.md) |
