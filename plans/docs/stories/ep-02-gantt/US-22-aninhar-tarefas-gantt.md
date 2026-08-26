# US-22 — Aninhar tarefas no Gantt

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **aninhar tarefas em qualquer profundidade no Gantt**, para **planejar com hierarquia infinita**.

## Critérios de aceite

- [ ] Dado que existe uma tarefa pai no Gantt, quando crio uma tarefa filha, então a filha fica subordinada ao pai no plano.
- [ ] Dado que existe uma hierarquia de tarefas, quando adiciono mais um nível, então o Gantt aceita sem limite de profundidade.
- [ ] Dado que tento criar ciclo de aninhamento, quando confirmo, então o sistema rejeita.

## Notas

- Roll-up de datas/estado do pai a partir dos filhos não está no README.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
