# US-12 — Aninhar cards

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **aninhar cards em qualquer profundidade**, para **decompor o trabalho com hierarquia infinita**.

## Critérios de aceite

- [ ] Dado que existe um card pai, quando crio um card filho aninhado, então o filho fica subordinado ao pai.
- [ ] Dado que existe uma cadeia de cards aninhados, quando adiciono mais um nível de aninhamento, então o sistema aceita sem limite de profundidade.
- [ ] Dado que tento aninhar um card em si mesmo ou criar ciclo, quando confirmo, então o sistema rejeita o aninhamento.

## Notas

- Comportamento de mover pai com filhos no board não está especificado.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
