# Cenários — screen-robot

**Por quê:** um arquivo de cenários (US → SC) por épico.  
**Épicos:** [`../2.epics.md`](../2.epics.md) · **BDDs:** [`../4.bdds/`](../4.bdds/README.md).  
**Visão:** [`../README.md`](../README.md).  
**Stories:** [`../1.stories.md`](../1.stories.md).  
**Tasks:** [`../7.tasks.md`](../7.tasks.md).

**IDs:** **US-** = história · **SC-XX** = cenário sequencial (toda US tem ≥1 SC).

| ID | Épico | Cenários |
|----|-------|----------|
| EP-01 | Provisionar agente | [`EP-01-provisionar-agente.md`](EP-01-provisionar-agente.md) |
| EP-02 | Eventos de UI | [`EP-02-eventos-de-ui.md`](EP-02-eventos-de-ui.md) |
| EP-03 | Instalar APKs | [`EP-03-instalar-apks.md`](EP-03-instalar-apks.md) |
| EP-04 | Operar tela | [`EP-04-operar-tela.md`](EP-04-operar-tela.md) |
| EP-05 | Extrair elementos | [`EP-05-extrair-elementos.md`](EP-05-extrair-elementos.md) |
| EP-06 | Sessão | [`EP-06-sessao.md`](EP-06-sessao.md) |

## Estrutura

```text
3.scenarios/
├── README.md
├── EP-01-provisionar-agente.md
├── EP-02-eventos-de-ui.md
├── EP-03-instalar-apks.md
├── EP-04-operar-tela.md
├── EP-05-extrair-elementos.md
└── EP-06-sessao.md
```

## Aceite de integração

| Artefato | Caminho |
|----------|---------|
| BDDs (unitário + piloto LinkedIn) | [`../4.bdds/`](../4.bdds/README.md) |
| Script | [`../sources/android-control/scripts/linkedin-login.js`](../sources/android-control/scripts/linkedin-login.js) |

## Próximos passos

→ [`../4.bdds/`](../4.bdds/README.md) · [`../implementation-plan/`](../implementation-plan/README.md) · [`../7.tasks.md`](../7.tasks.md)
