# US-30 — Criar atividades filhas

| Campo | Valor |
|-------|-------|
| Épico | EP-03 — Árvore de execução |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **criar atividades filhas a partir de qualquer atividade**, para **decompor o trabalho na árvore**.

## Critérios de aceite

- [ ] Dado que existe uma atividade, quando crio uma atividade filha a partir dela, então o nó filho fica subordinado ao nó pai.
- [ ] Dado que existe qualquer atividade na árvore, quando solicito criar filha, então a operação é permitida a partir desse nó.
- [ ] Dado que os dados mínimos da filha não são informados, quando tento criar, então o sistema rejeita.

## Notas

- Campos mínimos da atividade não especificados.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
