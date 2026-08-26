# US-13 — Colunas de execução

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **marcar uma ou mais colunas como colunas de execução**, para **disparar trabalho automático ao mover cards para elas**.

## Critérios de aceite

- [ ] Dado que estou configurando o board, quando marco uma ou mais colunas como de execução, então essas colunas ficam identificadas como colunas de execução.
- [ ] Dado que uma coluna não é de execução, quando movo um card para ela, então nenhuma execução automática é disparada por essa coluna.
- [ ] Dado que desmarco uma coluna de execução, quando movo um card para ela, então não há disparo automático decorrente dessa coluna.

## Notas

- Se cards já presentes na coluna no momento da marcação disparam execução retroativa não está definido.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
