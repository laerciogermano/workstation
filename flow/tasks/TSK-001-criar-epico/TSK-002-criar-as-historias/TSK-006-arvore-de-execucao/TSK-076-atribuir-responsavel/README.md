# TSK-076 — Atribuir responsável

| Campo | Valor |
|-------|--------|
| ID | TSK-076 |
| Status | Doing |
| Pai | [TSK-006](../README.md) |
| Output | [US-04 — Atribuir responsável](../../../../../epics/EP-04-arvore-de-execucao/US-04-atribuir-responsavel/README.md) |

## Árvore de atividades

```mermaid
flowchart TD
  T076[TSK-076 Atribuir responsável]
  T085[TSK-085 Criar BDD]
  T086[TSK-086 Criar PAF]
  T076 --> T085
  T076 --> T086
  style T076 fill:#fff3cd
  style T085 fill:#d4edda
```

## Filhos

- [`TSK-085`](TSK-085-criar-bdd/README.md) → Criar BDD (Done)
- [`TSK-086`](TSK-086-criar-paf/README.md) → Criar PAF (Todo)
