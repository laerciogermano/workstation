# Task Trello: Dashboard executivo: faturamento por vendedor + funil (mês/ano)

- **Card ID:** `6ad9f22cf14c52879b6b565a`
- **URL:** https://trello.com/c/DwkWgoK2
- **Anexos baixados:** 4 arquivo(s)

## Pastas

- [`anexos/`](anexos/) — planilhas funil + identidade visual HTML
- [`links/`](links/) — URLs de anexos-link (se houver)
- [`comentarios/`](comentarios/README.md) — comentários do card
- [`card-description.md`](card-description.md) — descrição do card
- [`manifest.json`](manifest.json) — inventário

## Entrega

Rota **`/executivo`** no front [`vendas/web`](../../vendas/web/README.md) (`npm run dev` → `http://localhost:5173/executivo`), alinhada à identidade v1 (Hero Noite / Hero Dia). Dados: `vendas/web/scripts/build-funil.py` → `vendas/web/src/data/funil.json`, a partir dos mesmos xlsx de `anexos/` (cópia em `docs/planilhas-funil/`).

## Origem

Board Connect · Priorizados · dashboard executivo (faturamento por vendedor + funil mês/ano).

## Reverter / limpar

```bash
rm -rf tasks/6ad9f22cf14c52879b6b565a
```
