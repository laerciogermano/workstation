# US-07 — Configurar colunas

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | membro do time |

## História

Como **membro do time**, quero **configurar colunas em quantidade livre**, para **refletir o processo de trabalho do time**.

## Critérios de aceite

- [ ] Dado que estou configurando o board, quando adiciono N colunas, então o board exibe exatamente essas N colunas.
- [ ] Dado que o board possui colunas, quando removo ou reordeno uma coluna, então a configuração do board reflete a alteração.
- [ ] Dado que uma coluna contém cards, quando tento removê-la, então o sistema impede a remoção ou exige destino para os cards.

## Notas

- Política ao remover coluna com cards (bloquear vs. mover) não está no README.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
