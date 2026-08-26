# US-03 — Responsável pessoa

| Campo | Valor |
|-------|-------|
| Épico | EP-00 — Fundamentos |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **atribuir uma pessoa como responsável de uma unidade**, para **deixar claro quem executa o trabalho humano**.

## Critérios de aceite

- [ ] Dado que existe uma unidade sem responsável, quando atribuo uma pessoa, então a unidade passa a exibir essa pessoa como responsável.
- [ ] Dado que uma unidade tem uma pessoa como responsável, quando consulto a unidade, então o tipo de responsável identificado é pessoa.
- [ ] Dado que tentamos atribuir uma pessoa inexistente ou inválida, quando confirmo a atribuição, então o sistema rejeita e mantém o responsável anterior (ou nenhum).

## Notas

- Cadastro/fonte de pessoas (conta, time, convidado) não está definido no README.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
