# US-05 — Responsável prestador

| Campo | Valor |
|-------|-------|
| Épico | EP-00 — Fundamentos |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **atribuir um prestador de serviço como responsável de uma unidade**, para **intermediar necessidades do usuário final a quem presta o serviço**.

## Critérios de aceite

- [ ] Dado que existe uma unidade sem responsável, quando atribuo um prestador de serviço, então a unidade passa a exibir esse prestador como responsável.
- [ ] Dado que uma unidade tem um prestador como responsável, quando consulto a unidade, então o tipo de responsável identificado é prestador de serviço.
- [ ] Dado que o prestador não aceita ou não pode assumir, quando a atribuição é tentada ou recusada, então a unidade não fica com esse prestador como responsável ativo.

## Notas

- Ciclo de convite/aceitação do prestador não está detalhado no README além de assumir, executar e atender.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
