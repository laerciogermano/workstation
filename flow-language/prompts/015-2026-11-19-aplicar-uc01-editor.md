# 015 — Aplicar UC-01 no editor Flow Language

| Campo | Valor |
|-------|--------|
| Número | 015 |
| Data/hora | 2026-11-19 |
| Origem | Chat no Cursor (workstation) |
| Título | Atualizar Flow Language conforme UC-01 |

## Prompt original

```
atualize o flow language de acordo com o caso de uso
```

## Interpretação

Implementar no editor [`../editor/`](../editor/README.md) o UC-01 de [`../docs/requisitos.md`](../docs/requisitos.md): novo fluxo com nome; uma barra de task `main`; responsável tipo arquivo `main`; clicar no nome abre alteração.

## O que foi feito

- `new-flow` cria arquivo `main` + task `main` (responsável `file:…`)
- Clique no nome da task / do arquivo abre renomear
- Docs (README editor + requisitos) alinhados
