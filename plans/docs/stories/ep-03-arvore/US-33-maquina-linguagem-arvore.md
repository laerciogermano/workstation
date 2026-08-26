# US-33 — Máquina como linguagem na árvore

| Campo | Valor |
|-------|-------|
| Épico | EP-03 — Árvore de execução |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **tratar atividade com responsável máquina como linguagem de programação**, para **executar nós como procedimentos programáveis**.

## Critérios de aceite

- [ ] Dado que uma atividade tem responsável máquina, quando a consulto ou edito na árvore, então ela é tratada como linguagem de programação.
- [ ] Dado que uma atividade não tem responsável máquina, quando a consulto na árvore, então ela não é tratada como linguagem de programação.
- [ ] Dado que o procedimento da atividade máquina é inválido, quando tento salvar ou executar, então o sistema rejeita ou sinaliza o erro.

## Notas

- Paridade com capacidades de máquina no Gantt (bibliotecas/loops) na árvore ainda não detalhada no README.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
