# 047 — Mapas em Produtos/Lojas e no topo da página do produto

| Campo | Valor |
|-------|--------|
| Número | 047 |
| Data | 2026-11-09 |
| Origem | Claude Code (workstation) |
| Título | Mapa no topo da página do produto; corrigir faixa de mapa |

## Prompt original

```
faltaram os mapas em produtos e em lojas e na pagina doproduto
na verdade em lojas e produtos, na pagina do perfil do prodto tem que ficar em cima
```

## Entrega

- Home e Estabelecimentos já tinham a faixa (prompt 045), mas o mapa aparecia encolhido com borda: a classe `banner` do `MapView` colidia com o estilo de aviso. Renomeada para `inbanner` (`ui/MapBanner.tsx`, `styles/app.css`).
- `/produto/:gtin`: `MapBanner` movido para o topo, logo abaixo da barra, antes da foto; legenda “N lojas com este produto · perto de …”.
- Conferido no Chrome 390×844: home, estabelecimentos e produto com mapa preenchendo a faixa.
- REQ-062 atualizado.
