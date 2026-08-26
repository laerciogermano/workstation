# US-26 — Máquina como linguagem no Gantt

| Campo | Valor |
|-------|-------|
| Épico | EP-02 — Gantt |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **tratar tarefa com responsável máquina como linguagem de programação**, para **usar bibliotecas, laços e estados (entradas e saídas) no plano**.

## Critérios de aceite

- [ ] Dado que uma tarefa tem responsável máquina, quando a edito no Gantt, então posso usar bibliotecas de programação, laços/loops e estados como entradas e saídas.
- [ ] Dado que uma tarefa não tem responsável máquina, quando a edito no Gantt, então ela não é tratada como linguagem de programação nesse paradigma.
- [ ] Dado que o programa da tarefa máquina é inválido, quando tento salvar ou executar, então o sistema rejeita ou sinaliza o erro.

## Notas

- Catálogo de bibliotecas e sintaxe dos loops não estão no README.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
