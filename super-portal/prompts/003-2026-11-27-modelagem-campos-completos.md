# 003 — Modelagem com todos os campos das tabelas

| Campo | Valor |
|-------|--------|
| Número | 003 |
| Data | 2026-11-27 |
| Origem | Chat no Cursor (workstation) |
| Título | Expandir diagrama com todos os dados/campos das tabelas |

## Prompt original

```
deixe o diagrama dmodelagem com todos os dados que existem na base e nos documentos que criamos, valores que digo sao de cada tabela, os dados
```

## Interpretação

Atualizar a modelagem do Super Portal para listar **todos os campos** de cada tabela da base (`portal_franqueado`) e dos docs — não só o núcleo enxuto.

## O que foi feito

- [`docs/modelagem-dados.md`](../docs/modelagem-dados.md) — diagrama + tabela com colunas completas de todas as entidades do schema (+ `marca` no Tenant).
