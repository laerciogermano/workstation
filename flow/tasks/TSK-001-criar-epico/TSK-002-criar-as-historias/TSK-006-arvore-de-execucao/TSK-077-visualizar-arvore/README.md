# TSK-077 — Visualizar árvore

| Campo | Valor |
|-------|--------|
| ID | TSK-077 |
| Status | Doing |
| Pai | [TSK-006](../README.md) |
| Output | [US-05 — Visualizar árvore](../../../../../epics/EP-04-arvore-de-execucao/US-05-visualizar-arvore/README.md) |

## Árvore de atividades

```mermaid
flowchart TD
  T077[TSK-077 Visualizar árvore]
  T087[TSK-087 Criar BDD]
  T088[TSK-088 Criar PAF]
  T077 --> T087
  T077 --> T088
  style T077 fill:#fff3cd
  style T087 fill:#d4edda
```

## Filhos

- [`TSK-087`](TSK-087-criar-bdd/README.md) → Criar BDD (Done)
- [`TSK-088`](TSK-088-criar-paf/README.md) → Criar PAF (Todo)
