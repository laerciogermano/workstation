# Task Trello: Vendedores — fotos Unsplash no último documento (foto-only)

- **Card:** [Vendedores: trocar só fotos Unsplash no último documento (v3)](https://trello.com/c/WoiK15WJ)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção) · lista `Concluído`
- **ID:** `6ae9d6add727a12aafdbe85b`
- **Descrição:** [`card-description.md`](card-description.md)

## Objetivo

Redefinir o **último documento de perfis** (v3) substituindo **apenas as fotos** pelas Unsplash — textos LinkedIn × persona / BR Supply inalterados.

## Entrega

| Artefato | Caminho |
|---|---|
| PDF (v3 + fotos Unsplash) | [`reports/Vendedores-v3-unsplash-fotos.pdf`](reports/Vendedores-v3-unsplash-fotos.pdf) |
| MD (espelho v3) | [`vendedores.md`](vendedores.md) |
| CSV perfis | [`vendedores.csv`](vendedores.csv) |
| Experience | [`experiencia-por-vendedor.csv`](experiencia-por-vendedor.csv) |
| Fontes Unsplash | [`unsplash-fontes.csv`](unsplash-fontes.csv) |
| Avatares | [`avatars/`](avatars/) |

**Antes → depois:** PDF v3 com thumbs Unsplash já parcialmente aplicadas → PDF explícito foto-only + seção de atribuição Unsplash. Textos = cópia de [`../6ae9d41cca30d13ffbba775f/`](../6ae9d41cca30d13ffbba775f/README.md). Rollback: usar PDF v3 original nessa pasta.

## Relacionados

- Fotos Unsplash: [`../6ae9d26ed00b21d127e73012/README.md`](../6ae9d26ed00b21d127e73012/README.md) · [DhXmx9sa](https://trello.com/c/DhXmx9sa)
- Doc v3: [`../6ae9d41cca30d13ffbba775f/README.md`](../6ae9d41cca30d13ffbba775f/README.md) · [phrqBZpX](https://trello.com/c/phrqBZpX)

## Rollback

```bash
rm -rf screen-robot/tasks/6ae9d6add727a12aafdbe85b
trello card:archive --id 6ae9d6add727a12aafdbe85b
```
