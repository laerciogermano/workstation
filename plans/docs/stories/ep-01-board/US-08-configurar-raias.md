# US-08 — Configurar raias

| Campo | Valor |
|-------|-------|
| Épico | EP-01 — Board |
| Status | draft |
| Persona | membro do time |

## História

Como **membro do time**, quero **configurar raias (swimlanes) em quantidade livre**, para **organizar o quadro conforme o processo do time**.

## Critérios de aceite

- [ ] Dado que estou configurando o board, quando adiciono N raias, então o board exibe exatamente essas N raias.
- [ ] Dado que o board possui raias, quando removo ou reordeno uma raia, então a configuração do board reflete a alteração.
- [ ] Dado que uma raia contém cards, quando tento removê-la, então o sistema impede a remoção ou exige destino para os cards.

## Notas

- Mesma lacuna de política de remoção com cards que nas colunas.

## Refinamento técnico

Quando `ready`: criar breakdown em [`../../tech/refinements/`](../../tech/refinements/).
