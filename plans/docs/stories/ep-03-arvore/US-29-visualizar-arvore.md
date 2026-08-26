# US-29 — Visualizar árvore

| Campo | Valor |
|-------|-------|
| Épico | EP-03 — Árvore de execução |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **visualizar as atividades (nós) em árvore**, para **entender a estrutura hierárquica da execução**.

## Critérios de aceite

- [ ] Dado que existem atividades na execução, quando abro a árvore, então os nós aparecem em estrutura hierárquica.
- [ ] Dado que a execução está vazia, quando abro a árvore, então a visão está vazia e utilizável para novas atividades.
- [ ] Dado que a hierarquia está inconsistente, quando abro a árvore, então o sistema não apresenta ciclos e sinaliza erro se detectado.

## Notas

- Raiz única vs. múltiplas raízes não está no README.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
