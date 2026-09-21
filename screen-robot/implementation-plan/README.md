# Implementation plan — screen-robot

**Por quê:** um arquivo de plano técnico por épico (sequências · agentes · passo a passo · contratos · classes · modelos · BDDs · **Como utilizar** · **árvore de arquivos**).  
**Épicos:** [`../2.epics.md`](../2.epics.md) · [`../4.scenarios.md`](../4.scenarios.md) · [`../5.bdds.md`](../5.bdds.md).  
**Visão:** [`../README.md`](../README.md).  
**Processo:** [`core/processo/2.refinamento-tecnico`](../../core/processo/2.refinamento-tecnico/README.md#plano-de-implementação-por-épico).

**Padrão (EP-01 → EP-06):**

1. `provisionEmulator(cfg)` → `{ serial, kind, provisionedAt, bootCompleted }` (só dados)  
2. Capacidades seguintes são **funções puras** com `{ serial, … }` (como `on`)  
3. Libs (`events`, `apks`, `operate`, `extract`, `session`) encapsulam as sequências  
4. Cada plano EP inclui **`## Como utilizar`** e **Árvore de arquivos**  
5. Ops paralelo: `resetInstance(cfg)` — ver [`EP-01`](EP-01-provisionar-agente.md) e [`../src/README.md`](../src/README.md)

| ID | Épico | Plano | API |
|----|-------|-------|-----|
| EP-01 | Provisionar agente | [`EP-01-provisionar-agente.md`](EP-01-provisionar-agente.md) | `provisionEmulator` → dados (+ ops `resetInstance`) |
| EP-02 | Eventos de UI | [`EP-02-eventos-de-ui.md`](EP-02-eventos-de-ui.md) | `on(cfg)` |
| EP-03 | Instalar APKs | [`EP-03-instalar-apks.md`](EP-03-instalar-apks.md) | `installApk({ serial, … })` |
| EP-04 | Operar tela | [`EP-04-operar-tela.md`](EP-04-operar-tela.md) | `launch` · `tap` · `type` · `scroll` · `screenshot` · `matchImage` · `openScrcpy` |
| EP-05 | Extrair textos | [`EP-05-extrair-elementos.md`](EP-05-extrair-elementos.md) | `extract({ serial })` → só textos OCR; `findByText` |
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
