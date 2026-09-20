# Tasks — screen-robot

**Por quê:** atividades executáveis do refinamento técnico (pastas = `TSK-<nn>-<titulo>`), cada uma com Entradas · Execução · Saídas.  
**Gantt / inventário:** [`7.tasks.md`](../7.tasks.md).  
**Processo:** [`core/processo/2.refinamento-tecnico`](../../core/processo/2.refinamento-tecnico/README.md).  
**Cenários / BDDs / planos:** [`4.scenarios.md`](../4.scenarios.md) · [`5.bdds.md`](../5.bdds.md) · [`implementation-plan/`](../implementation-plan/README.md).

## Escopo atual

EP-01 · EP-02 · EP-03 · EP-04 · EP-05 · EP-06.

## Árvore

```text
tasks/
├── TSK-001-provisionar-agente/
│   ├── TSK-002-subir-e-conectar/
│   ├── TSK-003-serial-adb-online/
│   ├── TSK-004-boot-completo/
│   ├── TSK-036-mascarar-identidade/
│   └── TSK-032-resgatar-agente/
│       ├── TSK-033-localizar-por-nome/
│       └── TSK-034-reconectar-e-boot/
├── TSK-005-eventos-de-ui/
│   ├── TSK-006-evento-de-boot/
│   ├── TSK-007-evento-de-app-aberta/
│   ├── TSK-008-evento-de-tela-estavel/
│   └── TSK-009-evento-de-mudanca-de-frame/   # US-05 frame_change
├── TSK-010-instalar-apks/
│   ├── TSK-011-ler-versao/
│   ├── TSK-012-baixar-apk/
│   └── TSK-013-instalar-pacote/
├── TSK-014-operar-tela/
│   ├── TSK-015-abrir-aplicativo/
│   ├── TSK-016-tap/
│   ├── TSK-017-type/
│   ├── TSK-018-scroll/
│   ├── TSK-019-screenshot/
│   ├── TSK-020-resgatar-coordenadas/
│   └── TSK-035-abrir-scrcpy/
├── TSK-021-extrair-elementos/
│   ├── TSK-022-extrair-arvore-dom/
│   ├── TSK-023-extrair-textos/
│   ├── TSK-024-extrair-restante-dom/
│   ├── TSK-025-extrair-icones/
│   ├── TSK-026-extrair-listas/
│   ├── TSK-027-extrair-imagens/
│   └── TSK-037-buscar-por-texto/
└── TSK-028-sessao/
    ├── TSK-029-salvar-sessao/
    ├── TSK-030-remover-sessao/
    └── TSK-031-recuperar-sessao/
```

| TSK | Atividade | Pasta |
|-----|-----------|-------|
| TSK-001 | Provisionar agente | [`TSK-001-provisionar-agente/`](TSK-001-provisionar-agente/README.md) |
| TSK-002..004 | Filhas US-01 | sob `TSK-001-provisionar-agente/` |
| TSK-036 | Mascarar identidade | [`TSK-036-mascarar-identidade/`](TSK-001-provisionar-agente/TSK-036-mascarar-identidade/README.md) |
| TSK-032 | Resgatar agente | [`TSK-032-resgatar-agente/`](TSK-001-provisionar-agente/TSK-032-resgatar-agente/README.md) |
| TSK-033..034 | Filhas US-20 | sob `TSK-032-resgatar-agente/` |
| TSK-005 | Eventos de UI | [`TSK-005-eventos-de-ui/`](TSK-005-eventos-de-ui/README.md) |
| TSK-006..009 | Filhas EP-02 | sob `TSK-005-eventos-de-ui/` |
| TSK-010 | Instalar APKs | [`TSK-010-instalar-apks/`](TSK-010-instalar-apks/README.md) |
| TSK-011..013 | Filhas EP-03 | sob `TSK-010-instalar-apks/` |
| TSK-014 | Operar tela | [`TSK-014-operar-tela/`](TSK-014-operar-tela/README.md) |
| TSK-015..020 | Filhas EP-04 | sob `TSK-014-operar-tela/` |
| TSK-035 | Abrir scrcpy | [`TSK-035-abrir-scrcpy/`](TSK-014-operar-tela/TSK-035-abrir-scrcpy/README.md) |
| TSK-021 | Extrair elementos | [`TSK-021-extrair-elementos/`](TSK-021-extrair-elementos/README.md) |
| TSK-022..027 · TSK-037 | Filhas EP-05 | sob `TSK-021-extrair-elementos/` |
| TSK-028 | Sessão | [`TSK-028-sessao/`](TSK-028-sessao/README.md) |
| TSK-029..031 | Filhas EP-06 | sob `TSK-028-sessao/` |
