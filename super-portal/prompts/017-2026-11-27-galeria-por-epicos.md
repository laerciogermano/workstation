# 017 — Galeria separada por épicos

| Campo | Valor |
|-------|--------|
| Número | 017 |
| Data | 2026-11-27 |
| Origem | Claude Code |
| Título | Galeria por épicos, pedidos em terceiro |

## Prompt original

```
separe a galeria por epicos file:///Users/laerciogermano/Documents/works/super-portal/prototipo/index.html
```

```
autnticao, orcamentos, pedidos.. nessa ordem
```

## Interpretação

A galeria da apresentação deixa de agrupar por fluxo (A–M) e passa a agrupar por épico. Pedidos vira o terceiro: troca de lugar com cadastros, painel e marca (agora E04). A lista lateral do player continua por fluxo.

## O que foi feito

- [`prototipo/js/app.js`](../prototipo/js/app.js): galeria e navegação por épico.
- [`prototipo/js/epicos.js`](../prototipo/js/epicos.js), telas e [`docs/epics.md`](../docs/epics.md): E03 Pedidos, E04 Cadastros, painel e marca.
