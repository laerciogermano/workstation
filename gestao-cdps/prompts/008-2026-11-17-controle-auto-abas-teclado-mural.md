# 008 — Controle auto + abas + teclado + mural

| Campo | Valor |
|-------|--------|
| Número | 008 |
| Data | 2026-11-17 |
| Origem | Chat no Cursor (workstation) |
| Título | Controle auto / abas / teclado / telas ao vivo |

## Prompt original

```
Na parte de controlar, eu não quero precisar ter que iniciar, já deixa a tela ali já, o intervalo deixa cem milissegundos e adicione também … abas pra eu adicionar abas e navegar com a URL e tudo mais. E eu quero também que ele pegue, quando eu clicar na tela, que ele pegue os comandos do meu teclado. Então se eu der Ctrl V, ele deve colar, se eu digitar, ele deve digitar também junto, não ter que colar um texto ali no campo. Eu quero fazer isso como se eu tivesse na máquina de verdade.

Depois cria uma seção, uma página ali, que mostre todos os CDPs que estão rodando a foto. Com… e quando eu clicar, eu quero que abra a modal pra eu controlar.
```

## Interpretação

1. Controlar: visão automática, intervalo 100 ms, abas + URL, teclado no espelho (sem campo Digitar).
2. Página “Telas ao vivo”: grid com print dos CDPs up; clique abre o modal de controle.

## O que foi feito

- `view.mjs`: default/min `intervalMs: 100`; `setViewTarget`
- `listPages` + `connect({ targetId })` + `typeFocused` / `paste` / `pressKey`
- API tabs + input paste/keydown; `POST /api/views/ensure-up`
- UI: visão auto; abas/URL; teclado no stage; nav **Telas ao vivo**

## Antes → depois

Visão manual 1s + campo Digitar → auto 100 ms + teclado na tela + mural. Rollback: restaurar `camera-ui/` + defaults antigos em `view.mjs`.
