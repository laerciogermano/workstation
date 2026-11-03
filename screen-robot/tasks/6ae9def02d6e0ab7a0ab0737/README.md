# Task Trello: Escolhidos — fotos Unsplash novas

- **Card:** [Escolhidos: nova lista com fotos Unsplash diferentes](https://trello.com/c/DV55oGU2)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção)
- **ID:** `6ae9def02d6e0ab7a0ab0737`
- **Descrição:** [`card-description.md`](card-description.md)

## Objetivo

Mesmos 6 perfis escolhidos, com **fotos Unsplash diferentes** (Unsplash License) alinhadas ao `pessoa_avatar_style`.

## Entrega

| Artefato | Caminho |
|---|---|
| PDF | [`reports/Vendedores-escolhidos-unsplash-v2.pdf`](reports/Vendedores-escolhidos-unsplash-v2.pdf) |
| MD | [`vendedores.md`](vendedores.md) |
| CSV / experiência | [`vendedores.csv`](vendedores.csv) · [`experiencia-por-vendedor.csv`](experiencia-por-vendedor.csv) |
| Fontes Unsplash | [`unsplash-fontes.csv`](unsplash-fontes.csv) · [`unsplash-assigned.json`](unsplash-assigned.json) |
| Avatares | [`avatars/`](avatars/) |
| Gerador | [`generate-lista-unsplash.mjs`](generate-lista-unsplash.mjs) |

## Regenerar

```bash
cd screen-robot/tasks/6ae9def02d6e0ab7a0ab0737
node generate-lista-unsplash.mjs
```

**Antes → depois:** fotos TPDNE/Unsplash mistas do escolhidos v2 → lote Unsplash novo (photo_ids distintos). Rollback: [`../6ae9dd6525adce9bc153a2b1/`](../6ae9dd6525adce9bc153a2b1/README.md).

## Relacionados

- Escolhidos v2: [`../6ae9dd6525adce9bc153a2b1/README.md`](../6ae9dd6525adce9bc153a2b1/README.md) · [aTIPjSjZ](https://trello.com/c/aTIPjSjZ)
- Unsplash anterior: [`../6ae9d6add727a12aafdbe85b/README.md`](../6ae9d6add727a12aafdbe85b/README.md) · [WoiK15WJ](https://trello.com/c/WoiK15WJ)

## Rollback

```bash
rm -rf screen-robot/tasks/6ae9def02d6e0ab7a0ab0737
trello card:archive --id 6ae9def02d6e0ab7a0ab0737
```
