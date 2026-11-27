# 002 — Modelagem de dados com diagrama de classes

| Campo | Valor |
|-------|--------|
| Número | 002 |
| Data | 2026-11-27 |
| Origem | Chat no Cursor (workstation) |
| Título | Modelagem de dados com diagrama de classes (só o indispensável) |

## Prompt original

```
com bae na base de dados e nos documetnos criados de base e aquitetura, crie um documento do suporoortal com diagrama de classes da modelagem de dados, contendo apenas o nindispensavel
```

## Interpretação

Criar doc de modelagem do Super Portal com **diagrama de classes** do domínio, baseado no schema/docs do portal ConnectMax, **somente o núcleo indispensável** (sem agregados, suporte, blobs nem denormalizações de sync).

## O que foi feito

- [`docs/modelagem-dados.md`](../docs/modelagem-dados.md) — funil Tenant→…→ContaReceber + Mermaid + tabela do núcleo + fora de escopo + caminho inverso.
- Índice em [`docs/README.md`](../docs/README.md); link na visão.
