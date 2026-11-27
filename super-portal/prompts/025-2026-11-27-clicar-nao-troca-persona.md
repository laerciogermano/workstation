# 025 — Clicar numa feature não troca a persona

| Campo | Valor |
|-------|--------|
| Número | 025 |
| Data | 2026-11-27 |
| Origem | Claude Code |
| Título | Lista do player por persona |

## Prompt original

```
quando clico em uma das funcionalidades, volta pra administrador
```

## Interpretação

A persona escolhida tem que ser mantida. A lista mostrava telas que a persona não acessa, e abrir uma delas trocava para Administrador.

## O que foi feito

- [`prototipo/js/app.js`](../prototipo/js/app.js): a lista e as setas mostram só o que a persona acessa; nem o clique nem o link digitado trocam a persona.
- A galeria continua trocando a persona quando a tela exige.
