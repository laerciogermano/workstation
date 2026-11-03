# Tasks — screen-robot

**Por quê:** atividades executáveis do refinamento técnico (pastas = `TSK-<nn>-<titulo>`), cada uma com Entradas · Execução · Saídas.  
**Gantt / inventário:** [`7.tasks.md`](../7.tasks.md).  
**Processo:** [`core/processo/2.refinamento-tecnico`](../../core/processo/2.refinamento-tecnico/README.md).  
**Cenários / BDDs / planos:** [`4.scenarios.md`](../4.scenarios.md) · [`5.bdds.md`](../5.bdds.md) · [`implementation-plan/`](../implementation-plan/README.md).

## Escopo atual

EP-01 · EP-02 · EP-03 · EP-04 · EP-05 · EP-06 · EP-07.

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
├── TSK-021-extrair-elementos/             # EP-05 Extrair textos (US-13)
│   ├── TSK-022-extrair-elementos-ocr/
│   ├── TSK-023-extrair-textos/
│   ├── TSK-024-enriquecer-lista/          # cancelado (absorvido em US-13)
│   ├── TSK-025-extrair-icones/            # cancelado (absorvido em US-13)
│   ├── TSK-026-extrair-listas/            # cancelado (absorvido em US-13)
│   ├── TSK-027-extrair-imagens/           # cancelado (absorvido em US-13)
│   └── TSK-037-buscar-por-texto/
├── TSK-028-sessao/
│   ├── TSK-029-salvar-sessao/
│   ├── TSK-030-remover-sessao/
│   └── TSK-031-recuperar-sessao/
└── TSK-038-motor-gemini/
    ├── TSK-039-decide-gemini/
    └── TSK-040-run-agent/
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
| TSK-021 | Extrair textos | [`TSK-021-extrair-elementos/`](TSK-021-extrair-elementos/README.md) |
| TSK-022..023 · TSK-037 | Filhas EP-05 (ativas) | sob `TSK-021-extrair-elementos/` |
| TSK-024..027 | Filhas EP-05 **canceladas / removidas** | sob `TSK-021-extrair-elementos/` |
| TSK-028 | Sessão | [`TSK-028-sessao/`](TSK-028-sessao/README.md) |
| TSK-029..031 | Filhas EP-06 | sob `TSK-028-sessao/` |
| TSK-038 | Motor Gemini | [`TSK-038-motor-gemini/`](TSK-038-motor-gemini/README.md) |
| TSK-039..040 | Filhas EP-07 | sob `TSK-038-motor-gemini/` |

## Cards Trello (POC / board Robô Prospecção)

| Pasta | Card |
|-------|------|
| [`6ae8ac1d5228997f864b40c5/`](6ae8ac1d5228997f864b40c5/README.md) | [Lib CDP humana](https://trello.com/c/5tt5ZTeN) |
| [`6ae8b23dccd25f22a26e5916/`](6ae8b23dccd25f22a26e5916/README.md) | [CRUD de CDPs na lib](https://trello.com/c/hoLSkLko) |
| [`6ae8d5241aa4adad65cdd8f1/`](6ae8d5241aa4adad65cdd8f1/README.md) | [Modo debug no connect (painel junto ao mouse)](https://trello.com/c/W4GN946S) |
| [`6ae8dc57b01c993b519a5030/`](6ae8dc57b01c993b519a5030/README.md) | [Catálogo devices + browsers (fingerprint)](https://trello.com/c/x3dClHJu) |
| [`6ae8dd3e5c359e796ef30a66/`](6ae8dd3e5c359e796ef30a66/README.md) | [Trajetória contínua do mouse (sem teleportes)](https://trello.com/c/5N5E2vlJ) |
| [`6ae8ef85ddea48cb1414b3be/`](6ae8ef85ddea48cb1414b3be/README.md) | [Dashboard de bots (frota + atividade + controles)](https://trello.com/c/A1h6DvaX) |
| [`6ae9c89d7f2951914a023746/`](6ae9c89d7f2951914a023746/README.md) | [Pesquisar na net personas LinkedIn que mais vendem](https://trello.com/c/WAZ9CciT) |
| [`6ae9ca1e215a10fb339d26e4/`](6ae9ca1e215a10fb339d26e4/README.md) | [Lista de vendedores alinhados às personas (aparência)](https://trello.com/c/1KXbnbBZ) |
| [`6ae9d0bc128614a8c22f6afc/`](6ae9d0bc128614a8c22f6afc/README.md) | [Empresas BR (suprimentos/vendas) para experiência LinkedIn](https://trello.com/c/W1XpTjvv) |
| [`6ae9d21f09e7040253b84179/`](6ae9d21f09e7040253b84179/README.md) | [Experiência LinkedIn por vendedor (títulos + empresas BR)](https://trello.com/c/uAP602Qv) |
| [`6ae9d2e4e3474dba682bde66/`](6ae9d2e4e3474dba682bde66/README.md) | [Documento de vendedores v2 (playbook + trajetória Experience)](https://trello.com/c/nmrVC9iS) |
