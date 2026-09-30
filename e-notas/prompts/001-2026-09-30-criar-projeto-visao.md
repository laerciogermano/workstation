# 001 — Criar projeto e-notas e documento de visão

| Campo | Valor |
|-------|--------|
| Número | 001 |
| Data | 2026-09-30 |
| Origem | Chat no Cursor (workstation) |
| Título | Criar projeto e-notas e documento de visão |

## Prompt original

```
crie um novo projeto dentro de works que se chama e-notas que serve para scnear o qrcode url das notas e mepar os precos dos codigos de barras para servir de busca para os compradores que querem ter acesso aos menores precos
```

## Interpretação

Criar, no workstation, a pasta/projeto **e-notas** no padrão dos demais (visão, docs, config IA, timeline de prompts). O produto ingere a **URL do QR** de notas fiscais (NFC-e / NF-e consumidor), mapeia **preços por código de barras (EAN)** e serve **busca de menor preço** para compradores. Nesta etapa, entregar **primeiro** o documento de visão; não avançar ainda a funcionalidades/BDD/código.

## O que foi feito

- Pasta `e-notas/` no workstation, no padrão dos outros projetos.
- Visão em `e-notas/README.md` (QR → itens/EAN → índice → busca de menor preço).
- Índice da esteira em `e-notas/docs/README.md`.
- Timeline em `e-notas/prompts/` (este arquivo + `timeline.md`).
- Regras da IA em `e-notas/config/config-ia.md`.
- Entrada do projeto no `README.md` da raiz do workstation.
