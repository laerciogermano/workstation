# 028 — Card buscar fotos ao cadastrar EAN

| Campo | Valor |
|-------|--------|
| Número | 028 |
| Data | 2026-11-04 |
| Origem | Chat no Cursor (workstation) |
| Título | Card Trello: busca de fotos ao cadastrar código de barras |

## Prompt original

```
Cria um serviço no Notinhas, que quando ele cadastrar o código de barras, ele vai fazer diferentes requisições. Na verdade, ele não vai fazer diferentes requisições, ele vai... entrar no Google. Vai pesquisar. Pelo código de barras em imagens. Ou. Isso, código de barras em imagens e vai baixar. As cinco primeiras imagens. Ou identifique uma forma melhor pra buscar as imagens, mas toda vez que... ele escanear um código de barras pra cadastrar em um produto, vincular ao código. Ele deve fazer uma requisição. Pra... algum lugar ou diferentes serviços ou pro Google, pra buscar a... a foto ou as fotos. Talvez seja interessante criar uma tabela de imagens, onde pra cada código de barras você tenha diferentes imagens e a gente vote qual que é a melhor. E ele... Não a gente vote, a gente escolha a melhor pra ficar representando ali no feed.
Antes de criar, de implementar, cria uma atividade no, no Trello pra deixar tudo descrito.
```

## Interpretação

Só abrir card no board **enotas** (Backlog) + pasta de task + REQ, descrevendo: ao cadastrar EAN, buscar candidatas de foto (preferir APIs de produto; Google Images só fallback), tabela de imagens por barcode, escolher a representativa do feed (sem voto). **Não implementar** neste turno.

## O que foi feito

- Card Trello no Backlog: https://trello.com/c/0fVZ8eBE
- Pasta `e-notas/tasks/6aeb14ff912c47963559ce9e/`
- Índice em `e-notas/tasks/README.md`
- REQ-032 em `e-notas/docs/requisitos.md`
