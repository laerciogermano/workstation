# US-32 — Responsáveis na árvore

| Campo | Valor |
|-------|-------|
| Épico | EP-03 — Árvore de execução |
| Status | draft |
| Persona | usuário |

## História

Como **usuário**, quero **atribuir e visualizar responsáveis na árvore**, para **saber quem (pessoa, IA, prestador ou máquina) conduz cada nó**.

## Critérios de aceite

- [ ] Dado que existe um nó na árvore, quando atribuo um responsável, então o nó exibe esse responsável.
- [ ] Dado que nós possuem responsáveis, quando visualizo a árvore, então os responsáveis ficam visíveis em cada atividade.
- [ ] Dado que o responsável é inválido, quando tento atribuir, então o nó não muda de responsável.

## Notas

- Herança de responsável do pai para filhos não está no README (assume-se atribuição explícita).

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
