# 004 — Extrair itens Fazenda PR

| Campo | Valor |
|-------|--------|
| Número | 004 |
| Data | 2026-11-01 |
| Origem | Chat no Cursor (workstation) |
| Título | Extrair itens da DANFE PR pela URL |

## Prompt original

```
agora a api deve extrair todos os itens do notas fazenda pr fov da url que veio
```

## Interpretação

`POST /api/nota` busca a consulta NFC-e da Fazenda PR e extrai todos os itens da DANFE.

## O que foi feito

- `fazenda-pr.js` fetch + parse cheerio; log e JSON com itens
