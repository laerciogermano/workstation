# US-01 — Mesma unidade de trabalho

| Campo | Valor |
|-------|-------|
| Épico | EP-00 — Fundamentos |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **tratar toda atividade como a mesma unidade de trabalho** (card, tarefa, nó ou arquivo), para **organizar o projeto sem fragmentar o modelo mental entre visões**.

## Critérios de aceite

- [ ] Dado que existe uma unidade de trabalho no sistema, quando eu a abro no board, no Gantt, na árvore e no Explorar, então ela é a mesma entidade em todas as visões.
- [ ] Dado que altero um atributo da unidade em uma visão, quando consulto a mesma unidade em outra visão, então a alteração está refletida.
- [ ] Dado que uma unidade foi removida em uma visão, quando tento abri-la em outra visão, então ela não aparece como entidade ativa.

## Notas

- Identidade estável da unidade entre visões ainda não está formalizada no README de negócio (id canônico, merge, exclusão).

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
