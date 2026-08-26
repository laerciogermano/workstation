# Histórias — Plans

Todas as user stories estão em um único arquivo, separadas por épico:

**[`user-stories.md`](user-stories.md)**

Fonte de negócio: [`plans/README.md`](../../README.md) · Épicos: [`../epics.md`](../epics.md)

**Versões de entrega:** [`../versions.md`](../versions.md) (gerenciador de versões — não fica neste arquivo nem em `user-stories.md`).

Usar [`_TEMPLATE.md`](_TEMPLATE.md) ao acrescentar histórias em `user-stories.md`.

## Épicos no arquivo

| Épico | Seção |
|-------|-------|
| EP-00 Fundamentos | US-01 … US-03 |
| EP-01 Board | US-04 … US-08 |
| EP-02 Gantt | US-09 … US-15 |
| EP-03 Árvore de execução | US-16 … US-17 |
| EP-04 Explorar | US-18 … US-19 |

## Convenções

- ID global: `US-XX`
- Empacotamento em versões (`v1` …): [`../versions.md`](../versions.md)
- Status: `draft` → `ready` → `in-progress` → `done`
- Só refinar tecnicamente histórias `ready` (DoR) em [`../tech/refinements/`](../tech/refinements/)

## Definition of Ready (DoR)

- Épico pai identificado
- Valor e persona claros
- Critérios de aceite testáveis (incluindo borda/negativo quando couber)
- Notas sem lacuna bloqueante no README de negócio
- Sem dependência de regra de negócio indefinida bloqueante no README
