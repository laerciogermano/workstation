# US-02 — Vocabulário por visão

| Campo | Valor |
|-------|-------|
| Épico | EP-00 — Fundamentos |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **nomear a unidade conforme a visão em uso**, para **trabalhar no vocabulário natural de cada superfície** (board, Gantt, árvore ou Explorar).

## Critérios de aceite

- [ ] Dado que estou no board, quando visualizo uma unidade, então ela é apresentada como **card**.
- [ ] Dado que estou no Gantt, quando visualizo a mesma unidade, então ela é apresentada como **tarefa**.
- [ ] Dado que estou na árvore de execução, quando visualizo a mesma unidade, então ela é apresentada como **atividade** (**nó**).
- [ ] Dado que estou no Explorar, quando visualizo a mesma unidade, então ela é apresentada como **arquivo**.
- [ ] Dado que troco de visão, quando a mesma unidade permanece selecionada, então o rótulo muda conforme a visão sem criar outra entidade.

## Notas

- Glossário board/Gantt/árvore/Explorar está no README; UI deve espelhar esses nomes sem inventar sinônimos.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
