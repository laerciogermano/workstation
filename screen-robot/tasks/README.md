# Tasks — screen-robot

**Por quê:** atividades executáveis do refinamento técnico (pastas = `TSK-<nn>-<titulo>`), cada uma com Entradas · Execução · Saídas.  
**Gantt / inventário:** [`7.tasks.md`](../7.tasks.md).  
**Processo:** [`core/processo/2.refinamento-tecnico`](../../core/processo/2.refinamento-tecnico/README.md).  
**Cenários / BDDs / planos:** [`4.scenarios.md`](../4.scenarios.md) · [`5.bdds.md`](../5.bdds.md) · [`implementation-plan/`](../implementation-plan/README.md).

## Escopo atual

EP-01 · EP-02 · EP-03.

## Árvore

```text
tasks/
├── TSK-001-provisionar-agente/
│   ├── TSK-002-subir-e-conectar/
│   ├── TSK-003-serial-adb-online/
│   └── TSK-004-boot-completo/
├── TSK-005-eventos-de-ui/
│   ├── TSK-006-evento-de-boot/
│   ├── TSK-007-evento-de-app-aberta/
│   ├── TSK-008-evento-de-tela-estavel/
│   └── TSK-009-evento-de-mudanca-dump/
└── TSK-010-instalar-apks/
    ├── TSK-011-ler-versao/
    ├── TSK-012-baixar-apk/
    └── TSK-013-instalar-pacote/
```

| TSK | Atividade | Pasta |
|-----|-----------|-------|
| TSK-001 | Provisionar agente | [`TSK-001-provisionar-agente/`](TSK-001-provisionar-agente/README.md) |
| TSK-002..004 | Filhas EP-01 | sob `TSK-001-provisionar-agente/` |
| TSK-005 | Eventos de UI | [`TSK-005-eventos-de-ui/`](TSK-005-eventos-de-ui/README.md) |
| TSK-006..009 | Filhas EP-02 | sob `TSK-005-eventos-de-ui/` |
| TSK-010 | Instalar APKs | [`TSK-010-instalar-apks/`](TSK-010-instalar-apks/README.md) |
| TSK-011 | Ler versão | [`TSK-011-ler-versao/`](TSK-010-instalar-apks/TSK-011-ler-versao/README.md) |
| TSK-012 | Baixar APK | [`TSK-012-baixar-apk/`](TSK-010-instalar-apks/TSK-012-baixar-apk/README.md) |
| TSK-013 | Instalar pacote | [`TSK-013-instalar-pacote/`](TSK-010-instalar-apks/TSK-013-instalar-pacote/README.md) |
