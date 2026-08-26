# US-18 — Entradas e saídas

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **visualizar entradas e saídas (artefatos de estado) das tarefas**, para **entender o fluxo de estado entre procedimentos**.

## Critérios de aceite

- [ ] Dado que uma tarefa possui entradas e saídas definidas, quando a visualizo no Gantt, então os artefatos de estado de entrada e saída são exibidos.
- [ ] Dado que duas tarefas compartilham um artefato de estado, quando visualizo o fluxo, então a saída de uma aparece como entrada da outra quando assim modelado.
- [ ] Dado que uma tarefa não tem entradas/saídas, quando a visualizo, então a ausência fica clara (sem artefatos inventados).

## Notas

- Formato/tipo dos artefatos de estado ainda não especificado.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
