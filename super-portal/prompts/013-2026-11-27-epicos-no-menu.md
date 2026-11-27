# 013 — Épicos no menu lateral

| Campo | Valor |
|-------|--------|
| Número | 013 |
| Data | 2026-11-27 |
| Origem | Claude Code |
| Título | Opções de épicos no menu para ver o que cresce em cada um |

## Prompt original

```
agora no menu lateral, adicione as opcoes de epicos, para vermos o que cresce de acordo com cada epico
```

## Interpretação

Não havia épicos definidos: propor a divisão em 11 épicos cumulativos, documentar e pôr o seletor no menu lateral (portal e player), com o portal mostrando só o que existe até o épico escolhido e destacando o que entrou.

## O que foi feito

- [`docs/epics.md`](../docs/epics.md) (proposta).
- [`prototipo/js/epicos.js`](../prototipo/js/epicos.js): seletor, filtro de menu/telas/botões, modal “O que cresce”, seção comparativa.
