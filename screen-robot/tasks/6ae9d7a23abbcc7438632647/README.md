# Task Trello: Comparar fotos — doc v3 igual com lote TPDNE alt

- **Card:** [Comparar fotos: doc vendedores igual com lote alternativo](https://trello.com/c/4svbSI4J)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção) · lista `Concluído`
- **ID:** `6ae9d7a23abbcc7438632647`
- **Descrição:** [`card-description.md`](card-description.md)

## Objetivo

Mesmo documento v3 (estrutura e textos intactos); **só as 12 fotos** trocadas por lote fresco **This Person Does Not Exist**.

## Entrega

| Artefato | Caminho |
|---|---|
| PDF (v3 + fotos TPDNE alt, 16 págs.) | [`reports/Vendedores-v3-tpdne-alt-fotos.pdf`](reports/Vendedores-v3-tpdne-alt-fotos.pdf) |
| Fontes lote alt | [`fontes-tpdne-alt.csv`](fontes-tpdne-alt.csv) |
| Avatares TPDNE | [`avatars/`](avatars/) |
| CSV/Experience (cópia v3) | [`vendedores.csv`](vendedores.csv) · [`experiencia-por-vendedor.csv`](experiencia-por-vendedor.csv) |

**Antes → depois:** doc Unsplash foto-only → mesmo layout/seções com fotos TPDNE alt + §6 de atribuição TPDNE. Rollback: PDF Unsplash em [`../6ae9d6add727a12aafdbe85b/`](../6ae9d6add727a12aafdbe85b/README.md).

## Relacionados

- Último Unsplash: [`../6ae9d6add727a12aafdbe85b/README.md`](../6ae9d6add727a12aafdbe85b/README.md) · [WoiK15WJ](https://trello.com/c/WoiK15WJ)
- Fontes avatar: [`../../src/assets/avatars/fontes-avatar.md`](../../src/assets/avatars/fontes-avatar.md)

## Rollback

```bash
rm -rf screen-robot/tasks/6ae9d7a23abbcc7438632647
trello card:archive --id 6ae9d7a23abbcc7438632647
```
