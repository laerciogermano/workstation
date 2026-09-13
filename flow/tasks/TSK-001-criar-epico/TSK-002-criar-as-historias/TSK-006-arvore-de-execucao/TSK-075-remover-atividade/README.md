# TSK-075 — Remover atividade

| Campo | Valor |
|-------|--------|
| ID | TSK-075 |
| Status | Doing |
| Pai | [TSK-006](../README.md) |
| Output | [US-03 — Remover atividade](../../../../../epics/EP-04-arvore-de-execucao/US-03-remover-atividade/README.md) |

## Árvore de atividades

```mermaid
flowchart TD
  T075[TSK-075 Remover atividade]
  T083[TSK-083 Criar BDD]
  T084[TSK-084 Criar PAF]
  T075 --> T083
  T075 --> T084
  style T075 fill:#fff3cd
  style T083 fill:#d4edda
```

## Filhos

- [`TSK-083`](TSK-083-criar-bdd/README.md) → Criar BDD (Done)
- [`TSK-084`](TSK-084-criar-paf/README.md) → Criar PAF (Todo)
