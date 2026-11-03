# Task Trello: Vendedores escolhidos (seleção final)

- **Card:** [Vendedores escolhidos: PDF só com a seleção final](https://trello.com/c/b3v1eoH5)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção) · lista `Concluído`
- **ID:** `6ae9db12f2929dff03af4f93`
- **Descrição:** [`card-description.md`](card-description.md)

## Objetivo

PDF só com os **6 vendedores escolhidos**, cada um com a foto da fonte marcada na seleção.

## Entrega

| Artefato | Caminho |
|---|---|
| PDF (6 perfis) | [`reports/Vendedores-escolhidos.pdf`](reports/Vendedores-escolhidos.pdf) |
| MD | [`escolhidos.md`](escolhidos.md) |
| CSV / Experience | [`vendedores.csv`](vendedores.csv) · [`experiencia-por-vendedor.csv`](experiencia-por-vendedor.csv) |
| Fontes de foto | [`fontes-foto-escolhida.csv`](fontes-foto-escolhida.csv) |
| Avatares | [`avatars/`](avatars/) |

**Antes → depois:** catálogos de 12 (v3 / Unsplash / cmp / TPDNE alt) → subset de 6 com foto mista. Rollback: PDFs completos nas tasks relacionadas.

## Seleção

| ID | Nome | Foto |
|---|---|---|
| v04 | Juliana Peixoto | TPDNE alt |
| v05 | Roberto Menezes | TPDNE v1 |
| v06 | Daniela Hoffmann | Unsplash |
| v09 | Thiago Nascimento | TPDNE v1 |
| v11 | Gabriel Rocha | TPDNE alt |
| v12 | Aline Monteiro | TPDNE alt |

## Relacionados

- v3 textos: [`../6ae9d41cca30d13ffbba775f/README.md`](../6ae9d41cca30d13ffbba775f/README.md) · [phrqBZpX](https://trello.com/c/phrqBZpX)
- cmp v1: [`../6ae9d6b1af135d58a5e42918/README.md`](../6ae9d6b1af135d58a5e42918/README.md) · [J1p8LQef](https://trello.com/c/J1p8LQef)
- Unsplash: [`../6ae9d6add727a12aafdbe85b/README.md`](../6ae9d6add727a12aafdbe85b/README.md) · [WoiK15WJ](https://trello.com/c/WoiK15WJ)
- TPDNE alt: [`../6ae9d7a23abbcc7438632647/README.md`](../6ae9d7a23abbcc7438632647/README.md) · [4svbSI4J](https://trello.com/c/4svbSI4J)

## Rollback

```bash
rm -rf screen-robot/tasks/6ae9db12f2929dff03af4f93
trello card:archive --id 6ae9db12f2929dff03af4f93
```
