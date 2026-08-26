# Refinamento técnico

Camada **depois** das histórias com status `ready` (Definition of Ready).

Aqui entram o **como** construir — sem redefinir regra de negócio (isso vive no [`../../README.md`](../../README.md)).

## Pastas

| Pasta | Uso |
|-------|-----|
| [`adr/`](adr/) | Architecture Decision Records |
| [`spikes/`](spikes/) | Investigações / provas de conceito |
| [`refinements/`](refinements/) | Breakdown técnico — [`refinements/refinements.md`](refinements/refinements.md) |


## Quando usar

1. História em `stories/` com status `ready` no [`../board.md`](../board.md) e aceite testável
2. Spike se houver incerteza técnica material
3. ADR se a decisão arquitetural for duradoura
4. Refinement com tarefas técnicas (front, back, dados, infra)

## O que não fazer aqui

- Inventar capacidade de produto não descrita no README / épicos
- Substituir critérios de aceite por detalhes de implementação
