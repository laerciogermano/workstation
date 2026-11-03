# Task Trello: Vendedores — fotos Unsplash + PDF v2

- **Card:** [Vendedores: fotos Unsplash business headshot + PDF v2](https://trello.com/c/DhXmx9sa)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção) · lista `Concluído`
- **ID:** `6ae9d26ed00b21d127e73012`
- **Descrição:** [`card-description.md`](card-description.md)

## Objetivo

Substituir avatares TPDNE por **business headshots Unsplash** (1 por vendedor) e gerar PDF playbook v2 com atribuição.

## Entrega

| Artefato | Caminho |
|---|---|
| CSV (vendedores + colunas Unsplash) | [`vendedores.csv`](vendedores.csv) |
| Fontes/licenças | [`unsplash-fontes.csv`](unsplash-fontes.csv) |
| PDF Unsplash v2 | [`reports/Vendedores-avatares-unsplash-v2.pdf`](reports/Vendedores-avatares-unsplash-v2.pdf) |
| Avatares | [`avatars/`](avatars/) |

**Antes → depois:** fotos `thispersondoesnotexist` → Unsplash business headshot + metadados (`unsplash_*`). Rollback: PDF/CSV em [`../6ae9ca1e215a10fb339d26e4/`](../6ae9ca1e215a10fb339d26e4/README.md).

## Relacionados

- Lista v1: [`../6ae9ca1e215a10fb339d26e4/README.md`](../6ae9ca1e215a10fb339d26e4/README.md) · [1KXbnbBZ](https://trello.com/c/1KXbnbBZ)
- Fontes avatar: [`../../src/assets/avatars/fontes-avatar.md`](../../src/assets/avatars/fontes-avatar.md)

## Rollback

```bash
rm -rf screen-robot/tasks/6ae9d26ed00b21d127e73012
trello card:archive --id 6ae9d26ed00b21d127e73012
```
