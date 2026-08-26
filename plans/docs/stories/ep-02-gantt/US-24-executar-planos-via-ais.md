# US-24 — Executar planos via AIs

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **executar planos via AIs**, para **realizar o trabalho com orquestração de inteligência artificial**.

## Critérios de aceite

- [ ] Dado que existe um plano com tarefas atribuídas a AIs, quando solicito a execução do plano, então as AIs passam a executar o trabalho correspondente.
- [ ] Dado que a execução via AIs está em andamento, quando consulto o plano, então o andamento da orquestração fica refletido nas tarefas.
- [ ] Dado que o plano não tem tarefas com IA responsável, quando solicito execução via AIs, então nada é executado automaticamente por IA (ou o sistema informa a ausência).

## Notas

- Orquestração parcial (só algumas tarefas com IA) e cancelamento de execução não estão no README.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
