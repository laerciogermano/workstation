# US-14 — Orquestrar IA no board

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **que uma IA execute automaticamente o trabalho ao mover um card para coluna de execução quando ela for a responsável**, para **orquestrar AIs pelo board**.

## Critérios de aceite

- [ ] Dado que um card tem IA como responsável e existe uma coluna de execução, quando movo o card para essa coluna, então a IA inicia a execução do trabalho automaticamente.
- [ ] Dado que um card tem responsável que não é IA e existe uma coluna de execução, quando movo o card para essa coluna, então a execução automática por IA não é disparada.
- [ ] Dado que a IA falha ao iniciar a execução, quando o card já está na coluna de execução, então o card permanece na coluna e o estado de falha fica visível.

## Notas

- Critério de sucesso/falha da execução da IA e retries não estão no README.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
