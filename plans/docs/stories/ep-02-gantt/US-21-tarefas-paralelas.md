# US-21 — Tarefas paralelas

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **definir tarefas paralelas**, para **expressar execução simultânea**.

## Critérios de aceite

- [ ] Dado que existem duas tarefas, quando as defino como paralelas, então ambas podem ocorrer no mesmo intervalo temporal sem dependência mútua obrigatória.
- [ ] Dado que tarefas estão em paralelo, quando visualizo o Gantt, então a sobreposição temporal fica evidenciada.
- [ ] Dado que marco como paralelas tarefas que já têm dependência sequencial conflitante, quando confirmo, então o sistema rejeita ou remove a dependência conflitante de forma explícita.

## Notas

- Regra de conflito paralelo vs. sequencial precisa ser fechada na implementação.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
