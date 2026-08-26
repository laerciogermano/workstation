# US-25 — Flow Oriented Programming

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **aplicar Flow Oriented Programming no Gantt** (estado e procedimentos), para **modelar o plano como fluxo de entradas, saídas e funções**.

## Critérios de aceite

- [ ] Dado que estou modelando no Gantt, quando defino estados como entradas e saídas, então o plano expressa o fluxo de estado entre procedimentos.
- [ ] Dado que estou modelando no Gantt, quando defino procedimentos como funções e tarefas, então o plano expressa a lógica executável do fluxo.
- [ ] Dado que o fluxo fica inconsistente (saída sem consumidor obrigatório quando a regra exigir), quando valido, então o sistema sinaliza a inconsistência.

## Notas

- Semântica formal FOP (obrigatoriedade de ligar saídas, tipagem) não está no README.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
