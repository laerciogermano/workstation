# US-17 — Visualizar ordens no tempo

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **visualizar tarefas (ordens) no tempo**, para **acompanhar o planejamento temporal do projeto**.

## Critérios de aceite

- [ ] Dado que existem tarefas com datas no plano, quando abro o Gantt, então as tarefas aparecem posicionadas no eixo temporal.
- [ ] Dado que não há tarefas no plano, quando abro o Gantt, então a visão temporal está vazia e utilizável para novas ordens.
- [ ] Dado que uma tarefa não tem datas válidas, quando abro o Gantt, então ela não aparece posicionada no tempo ou fica sinalizada como incompleta.

## Notas

- Modelo de datas (início/fim, duração, fuso) não está no README.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
