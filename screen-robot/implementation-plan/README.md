# Implementation plan — screen-robot

**Por quê:** um arquivo de plano técnico por épico (sequências · agentes · passo a passo · contratos · classes · modelos · BDDs · **árvore de arquivos**).  
**Épicos:** [`../2.epics.md`](../2.epics.md) · [`../4.scenarios.md`](../4.scenarios.md) · [`../5.bdds.md`](../5.bdds.md).  
**Visão:** [`../README.md`](../README.md).  
**Processo:** [`core/processo/2.refinamento-tecnico`](../../core/processo/2.refinamento-tecnico/README.md#plano-de-implementação-por-épico).

**Padrão (EP-01 → EP-06):**

1. `provisionEmulator(cfg)` → `AgentHandle`  
2. Capacidades seguintes são **métodos do handle** (sem `serial` no caller)  
3. Libs internas (`events`, `apks`, `operate`, `extract`, `session`) encapsulam as sequências  
4. Cada plano EP inclui seção **Árvore de arquivos** (código + unitários ao lado + e2e US/EP)  
5. Ops paralelo (fora do handle): `resetInstance(cfg)` — ver [`EP-01`](EP-01-provisionar-agente.md) e [`../src/README.md`](../src/README.md)

| ID | Épico | Plano | API no handle |
|----|-------|-------|---------------|
| EP-01 | Provisionar agente | [`EP-01-provisionar-agente.md`](EP-01-provisionar-agente.md) | `provisionEmulator` → handle (+ ops `resetInstance`; US-22 mascarar identidade) |
| EP-02 | Eventos de UI | [`EP-02-eventos-de-ui.md`](EP-02-eventos-de-ui.md) | `on(event, opts?, onEvent?)` |
| EP-03 | Instalar APKs | [`EP-03-instalar-apks.md`](EP-03-instalar-apks.md) | `installApk(app)` |
| EP-04 | Operar tela | [`EP-04-operar-tela.md`](EP-04-operar-tela.md) | `launch` · `tap` · `type` · `scroll` · `screenshot` · `matchImage` · `openScrcpy` |
| EP-05 | Extrair elementos | [`EP-05-extrair-elementos.md`](EP-05-extrair-elementos.md) | `extract()` → só textos OCR; `findByText` (US-23 · SC-29/30 LinkedIn) |
| EP-06 | Sessão | [`EP-06-sessao.md`](EP-06-sessao.md) | `saveSession` · `removeSession` · `restoreSession` |

## Estrutura

```text
implementation-plan/
├── README.md
├── EP-01-provisionar-agente.md
├── EP-02-eventos-de-ui.md
├── …
└── EP-06-sessao.md
```

## Próximos passos

→ [`../tasks/`](../tasks/README.md) · [`../7.tasks.md`](../7.tasks.md) · [`../3.roadmap.md`](../3.roadmap.md)
