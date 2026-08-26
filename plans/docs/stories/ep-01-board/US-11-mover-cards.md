# US-11 — Mover cards

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **mover cards entre colunas e raias**, para **acompanhar o andamento do trabalho**.

## Critérios de aceite

- [ ] Dado que um card está em uma coluna e raia, quando o movo para outra coluna, então ele deixa a origem e aparece no destino.
- [ ] Dado que um card está em uma raia, quando o movo para outra raia, então ele aparece na raia de destino.
- [ ] Dado que o destino é inválido ou inexistente, quando tento mover o card, então o card permanece na posição original.

## Notas

- Restrições de transição entre colunas (WIP, permissões) não estão no README.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
