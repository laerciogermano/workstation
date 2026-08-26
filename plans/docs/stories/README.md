# Histórias — Plans

Todas as user stories estão em um único arquivo, separadas por épico:

**[`user-stories.md`](user-stories.md)**

Fonte de negócio: [`plans/README.md`](../../README.md) · Épicos: [`../epics.md`](../epics.md)

Usar [`_TEMPLATE.md`](_TEMPLATE.md) ao acrescentar histórias em `user-stories.md`.

## Corte MVP (entrega 1)

Primeiro entregável: **núcleo utilizável** — identidade da unidade, catálogo/responsáveis, board básico e persistência no Explorar.

| Ordem | ID | História | Por quê no MVP |
|-------|-----|----------|----------------|
| 1 | US-01 | Mesma unidade, vocabulário e ciclo de vida | Princípio “uma unidade” + UUID + excluir/arquivar |
| 2 | US-03 | Gerenciar catálogo de responsáveis | Pré-requisito de atribuição válida |
| 3 | US-02 | Atribuir responsável tipado | Responsáveis tipados em qualquer superfície |
| 4 | US-04 | Configurar colunas e raias | Board configurável |
| 5 | US-05 | Cadastrar e mover cards | Fluxo mínimo de trabalho |
| 6 | US-18 | Persistir e abrir no Explorar | Toda unidade como arquivo |

**Fora do MVP (levas seguintes)**

| Leva | IDs | Foco |
|------|-----|------|
| 2 | US-06, US-19 | Hierarquia no board + lista/busca no Explorar |
| 3 | US-07, US-08 | IA no board + chamados/prestadores |
| 4 | US-09 … US-11 | Gantt básico (planos, datas, seq/paralelo, aninhar) |
| 5 | US-12 … US-15 | Execução IA no Gantt, FOP, máquina, exportação |
| 6 | US-16, US-17 | Árvore de execução |

**Dependências do MVP:** US-03 antes de US-02; US-01 antes de US-18; US-04 antes de US-05.

**Próximo passo da esteira:** marcar US-01, US-02, US-03, US-04, US-05 e US-18 como `ready` e abrir refinamentos em [`../tech/refinements/`](../tech/refinements/).

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
- Status: `draft` → `ready` → `in-progress` → `done`
- Só refinar tecnicamente histórias `ready` (DoR) em [`../tech/refinements/`](../tech/refinements/)

## Definition of Ready (DoR)

- Épico pai identificado
- Valor e persona claros
- Critérios de aceite testáveis (incluindo borda/negativo quando couber)
- Notas sem lacuna bloqueante no README de negócio
- Sem dependência de regra de negócio indefinida bloqueante no README
