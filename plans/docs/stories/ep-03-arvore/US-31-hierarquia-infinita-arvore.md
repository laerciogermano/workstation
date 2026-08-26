# US-31 — Hierarquia infinita na árvore

| Campo | Valor |
|-------|-------|
| Épico | EP-03 — Árvore de execução |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **relacionar atividades em hierarquia infinita**, para **refinar a execução sem limite de profundidade**.

## Critérios de aceite

- [ ] Dado que existe uma cadeia de atividades pai-filho, quando adiciono mais um nível de profundidade, então o sistema aceita o novo nó.
- [ ] Dado que a árvore possui múltiplos níveis, quando navego a hierarquia, então o relacionamento entre nós permanece íntegro em qualquer profundidade.
- [ ] Dado que uma operação criaria ciclo, quando confirmo, então o sistema rejeita.

## Notas

- Limites práticos de UI/performance não são regra de negócio; a regra é ausência de limite de profundidade.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
