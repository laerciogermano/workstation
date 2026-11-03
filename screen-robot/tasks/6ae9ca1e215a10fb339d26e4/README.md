# Task Trello: Lista de vendedores alinhados às personas

- **Card:** [Lista de vendedores alinhados às personas (com descrição de aparência)](https://trello.com/c/1KXbnbBZ)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção) · lista `Concluído`
- **ID:** `6ae9ca1e215a10fb339d26e4`
- **Descrição:** [`card-description.md`](card-description.md)

## Objetivo

Criar lista de vendedores com traits das personas que mais vendem no nosso contexto, incluindo descrição de aparência para avatar.

## Entrega

| Artefato | Caminho |
|---|---|
| Lista CSV (12 vendedores + `avatar_file`) | [`vendedores.csv`](vendedores.csv) |
| Resumo MD | [`vendedores.md`](vendedores.md) |
| Relatório PDF (foto + dados) | [`reports/Vendedores-avatares.pdf`](reports/Vendedores-avatares.pdf) |
| Avatares atribuídos | [`avatars/`](avatars/) |
| Personas (dep.) | [`../6ae9c89d7f2951914a023746/personas.csv`](../6ae9c89d7f2951914a023746/personas.csv) |

**Antes → depois:** só CSV/MD → PDF no card Trello com headshot sintético por vendedor (`avatar_file`). Rollback: remover `reports/Vendedores-avatares.pdf`, pasta `avatars/` e coluna `avatar_file` do CSV.

## Dependência

- Personas: [`../6ae9c89d7f2951914a023746/README.md`](../6ae9c89d7f2951914a023746/README.md) · [WAZ9CciT](https://trello.com/c/WAZ9CciT)

## Rollback

```bash
rm -rf screen-robot/tasks/6ae9ca1e215a10fb339d26e4
trello card:archive --id 6ae9ca1e215a10fb339d26e4
```
