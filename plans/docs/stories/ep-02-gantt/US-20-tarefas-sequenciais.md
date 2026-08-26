# US-20 — Tarefas sequenciais

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **definir tarefas sequenciais**, para **expressar ordem e dependência no tempo**.

## Critérios de aceite

- [ ] Dado que existem duas tarefas, quando as defino como sequenciais, então a segunda depende da conclusão ou ordem da primeira.
- [ ] Dado que tarefas estão em sequência, quando visualizo o Gantt, então a ordem temporal e a dependência ficam evidenciadas.
- [ ] Dado que a sequência criaria dependência cíclica, quando tento salvá-la, então o sistema rejeita.

## Notas

- Se a dependência é finish-to-start estrita ou apenas ordem visual ainda aberto.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
