# 022 — Features dentro de cada épico

| Campo | Valor |
|-------|--------|
| Número | 022 |
| Data | 2026-11-27 |
| Origem | Claude Code |
| Título | Telas agrupadas por feature dentro do épico |

## Prompt original

```
dai dentro de cada epico agrupoe por feature os subitens
```

## Interpretação

Na lista à esquerda do player, cada épico ganha subgrupos por feature.

## O que foi feito

- [`prototipo/js/epicos.js`](../prototipo/js/epicos.js): cada épico declara suas features e telas.
- [`prototipo/js/app.js`](../prototipo/js/app.js): lista e setas ← → na ordem épico, feature, código.
- [`docs/epics.md`](../docs/epics.md): coluna Feature.
