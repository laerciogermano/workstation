# Task Trello: Experiência LinkedIn por vendedor

- **Card:** [Experiência LinkedIn por vendedor (títulos + empresas BR)](https://trello.com/c/uAP602Qv)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção) · lista `Concluído`
- **ID:** `6ae9d21f09e7040253b84179`
- **Descrição:** [`card-description.md`](card-description.md)

## Objetivo

Para cada vendedor da lista, definir a estrutura de **Experience** do LinkedIn (título, empresa BR, período, descrição) com base nos anos de experiência e no catálogo de empresas brasileiras.

## Entrega

| Artefato | Caminho |
|---|---|
| CSV acionável | [`experiencia-por-vendedor.csv`](experiencia-por-vendedor.csv) |
| Estrutura MD | [`experiencia-por-vendedor.md`](experiencia-por-vendedor.md) |

**Antes → depois:** só cargo atual ConectMax → trajetória completa (atual + prévias BR). Rollback: remover pasta da task / arquivar card.

## Relacionados

- Vendedores: [`../6ae9ca1e215a10fb339d26e4/README.md`](../6ae9ca1e215a10fb339d26e4/README.md) · [1KXbnbBZ](https://trello.com/c/1KXbnbBZ)
- Empresas BR: [`../6ae9d0bc128614a8c22f6afc/README.md`](../6ae9d0bc128614a8c22f6afc/README.md) · [W1XpTjvv](https://trello.com/c/W1XpTjvv)
- Personas: [`../6ae9c89d7f2951914a023746/README.md`](../6ae9c89d7f2951914a023746/README.md) · [WAZ9CciT](https://trello.com/c/WAZ9CciT)

## Rollback

```bash
rm -rf screen-robot/tasks/6ae9d21f09e7040253b84179
trello card:archive --id 6ae9d21f09e7040253b84179
```
