# US-16 — Atender chamado

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | prestador de serviço |

## História

Como **prestador de serviço**, quero **assumir a responsabilidade de um chamado, executá-lo e atender a necessidade**, para **fechar a orquestração entre usuário final e serviço**.

## Critérios de aceite

- [ ] Dado que existe um chamado aberto, quando um prestador assume a responsabilidade, então o chamado passa a ter esse prestador como responsável.
- [ ] Dado que um prestador é responsável pelo chamado, quando conclui a execução, então a necessidade do usuário final fica atendida e o chamado reflete o atendimento.
- [ ] Dado que o chamado já tem prestador responsável, quando outro prestador tenta assumir, então a operação é rejeitada ou segue regra explícita de transferência.

## Notas

- Transferência entre prestadores e definição de “atendido” (aceite do usuário final?) não estão no README.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
