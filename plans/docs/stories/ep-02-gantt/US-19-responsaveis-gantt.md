# US-19 — Responsáveis no Gantt

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **atribuir e visualizar responsáveis nas tarefas do Gantt**, para **saber quem conduz cada ordem**.

## Critérios de aceite

- [ ] Dado que existe uma tarefa no Gantt, quando atribuo um responsável, então a tarefa exibe esse responsável.
- [ ] Dado que tarefas possuem responsáveis, quando visualizo o Gantt, então os responsáveis ficam visíveis em cada ordem.
- [ ] Dado que atribuo responsável inválido, quando confirmo, então a tarefa mantém o responsável anterior (ou nenhum).

## Notas

- Alinhado aos tipos de responsável do README (pessoa, IA, prestador, máquina).

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
