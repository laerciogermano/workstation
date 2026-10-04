# 005 — Separar áudios e transcrições em pasta

| Campo | Valor |
|-------|--------|
| Número | 005 |
| Data | 2026-10-04 |
| Origem | Chat no Cursor (workstation) |
| Título | Mover áudios e transcrições para subpasta de inputs |

## Prompt original

```
sdepare os audios e transcricaoes em uma pasta dentro de inputs
```

## Interpretação

Criar uma pasta dentro de `inputs/` e mover para lá os `.m4a` e as transcrições correspondentes (incluindo `transcricao.txt` / `transcricao-bullets.md`), mantendo documentos-fonte na raiz de `inputs/`.

## O que foi feito

- Pasta [`../inputs/audios-e-transcricoes/`](../inputs/audios-e-transcricoes/README.md) com todos os áudios e transcrições.
- READMEs em `inputs/` e na subpasta; link no `roadmap.md`.
