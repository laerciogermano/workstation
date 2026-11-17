# 005 — Galeria de mídias + ordem por criação

| Campo | Valor |
|-------|--------|
| Número | 005 |
| Data | 2026-11-17 |
| Origem | Chat no Cursor (workstation) |
| Título | Galeria de mídias e lista por último criado |

## Prompt original

```
Tem uma galeria de mídias, onde você pode adicionar vídeos, e em cada, agente você pode selecionar qual vídeo que vai executar.

Deve listar pelo último criado. Também os CDPs.
```

## Interpretação

Galeria de vídeos em disco; cada CDP escolhe qual mídia executa. Listas (mídias e CDPs) ordenadas pelo **mais recentemente criado**.

## O que foi feito

- `media.mjs` + UI Galeria + select por CDP
- `listCdps` ordena por `createdAt` desc; `listMedia` já era desc
