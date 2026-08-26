# US-04 — Responsável IA

| Campo | Valor |
|-------|-------|
| Épico | EP-00 — Fundamentos |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **atribuir uma IA como responsável de uma unidade**, para **delegar execução automática quando couber**.

## Critérios de aceite

- [ ] Dado que existe uma unidade sem responsável, quando atribuo uma IA, então a unidade passa a exibir essa IA como responsável.
- [ ] Dado que uma unidade tem uma IA como responsável, quando consulto a unidade, então o tipo de responsável identificado é IA.
- [ ] Dado que a IA escolhida não está disponível, quando tento atribuí-la, então o sistema rejeita a atribuição.

## Notas

- O que constitui “executar o trabalho” para uma IA (escopo, artefatos, critério de conclusão) ainda está aberto.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
