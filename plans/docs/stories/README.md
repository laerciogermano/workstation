# Histórias — Plans

Todas as user stories estão em um único arquivo, separadas por épico:

**[`user-stories.md`](user-stories.md)**

Fonte de negócio: [`plans/README.md`](../../README.md) · Épicos: [`../epics.md`](../epics.md)

Usar [`_TEMPLATE.md`](_TEMPLATE.md) ao acrescentar histórias em `user-stories.md`.

## Épicos no arquivo

| Épico | Seção |
|-------|-------|
| EP-00 Fundamentos | US-01 … US-06 |
| EP-01 Board | US-07 … US-16 |
| EP-02 Gantt | US-17 … US-28 |
| EP-03 Árvore de execução | US-29 … US-33 |
| EP-04 Explorar | US-34 … US-36 |

## Convenções

- ID global: `US-XX`
- Status: `draft` → `ready` → `in-progress` → `done`
- Só refinar tecnicamente histórias `ready` (DoR) em [`../tech/refinements/`](../tech/refinements/)

## Definition of Ready (DoR)

- Épico pai identificado
- Valor e persona claros
- Critérios de aceite testáveis (incluindo borda/negativo quando couber)
- Notas com regras de negócio ainda abertas, se houver
- Sem dependência de regra de negócio indefinida bloqueante no README
