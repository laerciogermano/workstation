# Task Trello: Vendedores v3 — LinkedIn × persona + BR Supply

- **Card:** [Vendedores v3: separar LinkedIn × persona + emprego atual BR Supply](https://trello.com/c/phrqBZpX)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção) · lista `Concluído`
- **ID:** `6ae9d41cca30d13ffbba775f`
- **Descrição:** [`card-description.md`](card-description.md)

## Objetivo

Separar no documento de vendedores (a) configuração LinkedIn e (b) dados da pessoa/persona; emprego **atual = BR Supply** nos 12.

## Entrega

| Artefato | Caminho |
|---|---|
| PDF v3 | [`reports/Vendedores-v3-linkedin-persona-brsupply.pdf`](reports/Vendedores-v3-linkedin-persona-brsupply.pdf) |
| MD | [`vendedores-v3.md`](vendedores-v3.md) |
| CSV (colunas `li_*` × `pessoa_*` / `persona_*`) | [`vendedores.csv`](vendedores.csv) |
| Experience | [`experiencia-por-vendedor.csv`](experiencia-por-vendedor.csv) |
| Fotos (ref Unsplash) | [`avatars/`](avatars/) |

**Antes → depois:** company/Experience atual ConectMax → **BR Supply**; campos misturados → seções A LinkedIn / B pessoa. Rollback: usar v2 em [`../6ae9d2e4e3474dba682bde66/README.md`](../6ae9d2e4e3474dba682bde66/README.md).

## Relacionados

- Doc v2: [`../6ae9d2e4e3474dba682bde66/README.md`](../6ae9d2e4e3474dba682bde66/README.md) · [nmrVC9iS](https://trello.com/c/nmrVC9iS)
- Unsplash: [`../6ae9d26ed00b21d127e73012/README.md`](../6ae9d26ed00b21d127e73012/README.md) · [DhXmx9sa](https://trello.com/c/DhXmx9sa)
- Experience: [`../6ae9d21f09e7040253b84179/README.md`](../6ae9d21f09e7040253b84179/README.md)
- Personas: [`../6ae9c89d7f2951914a023746/README.md`](../6ae9c89d7f2951914a023746/README.md)

## Rollback

```bash
rm -rf screen-robot/tasks/6ae9d41cca30d13ffbba775f
trello card:archive --id 6ae9d41cca30d13ffbba775f
```
