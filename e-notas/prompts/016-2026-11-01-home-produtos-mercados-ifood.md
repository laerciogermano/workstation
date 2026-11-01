# 016 — Home produtos + mercados (estilo iFood)

| Campo | Valor |
|-------|--------|
| Número | 016 |
| Data | 2026-11-01 |
| Origem | Chat no Cursor (workstation) |
| Título | Home com produtos/fotos/preços e mercados; manter aba Estabelecimentos |

## Prompt original

```
na tela inicial do app, deixe algo mais parecido com o ifood, listando os produtos com fotos e precos e em baixo os mercados
```

```
mas matenha a aba de estabelecimentos
```

## Interpretação

Feed na aba **Estabelecimentos**: produtos (foto + menor preço) acima, mercados abaixo, mapa; não renomear/remover a aba.

## O que foi feito

- `index.html` / `lista.js` / `styles.css`: produto-grid + mercados; aba continua Estabelecimentos
- REQ-018 atualizado; deploy Contabo `public/`
