# Task Trello: Banners BR Supply para capas LinkedIn

- **Card:** [Buscar banners BR Supply para capas LinkedIn dos vendedores](https://trello.com/c/YKQ8HAsu)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção)
- **ID:** `6ae9dc16dd4a9cb567b8f5cd`
- **Descrição:** [`card-description.md`](card-description.md)

## Objetivo

Coletar 2–3 variações de banner BR Supply (referência de capas reais no LinkedIn) para aplicar nos vendedores escolhidos.

## Execução (teste)

- CDP: `eduardo-vargas` :9242 (`startCdp` + `connectCdp`, human-cdp)
- Busca: people `keywords=BR Supply`
- Download hi-res via `Network.getResponseBody` (CDN bloqueia `fetch`/canvas)

## Entrega

| Artefato | Caminho |
|---|---|
| Relatório | [`reports/banners-br-supply.md`](reports/banners-br-supply.md) |
| Originais (task) | [`banners/`](banners/README.md) |
| Assets prontos | [`src/assets/banners/br-supply-0{1,2}-*.jpg`](../../src/assets/banners/README.md) |

## Uso

```bash
CDP_URL=http://127.0.0.1:PORT node pocs/chrome-cdp/linkedin-update-banner-cdp.mjs \
  --photo src/assets/banners/br-supply-01-caixas.jpg
```

## Rollback

```bash
rm -rf screen-robot/tasks/6ae9dc16dd4a9cb567b8f5cd
rm -f screen-robot/src/assets/banners/br-supply-0{1,2}-*.jpg
trello card:archive --id 6ae9dc16dd4a9cb567b8f5cd
```
