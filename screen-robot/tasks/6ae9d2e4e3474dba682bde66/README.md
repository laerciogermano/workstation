# Task Trello: Documento de vendedores v2

- **Card:** [Documento de vendedores v2 (playbook + trajetória Experience)](https://trello.com/c/nmrVC9iS)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção) · lista `Concluído`
- **ID:** `6ae9d2e4e3474dba682bde66`
- **Descrição:** [`card-description.md`](card-description.md)

## Objetivo

Nova versão do documento de vendedores = playbook v1 + trajetória Experience (empresas BR).

## Entrega

| Artefato | Caminho |
|---|---|
| PDF v2 | [`reports/Vendedores-v2-playbook-experiencia.pdf`](reports/Vendedores-v2-playbook-experiencia.pdf) |
| MD | [`vendedores-v2.md`](vendedores-v2.md) |

**Antes → depois:** PDF só com perfil/foto → PDF com Experience completa. Rollback: usar v1 em `../6ae9ca1e215a10fb339d26e4/reports/`.

## Relacionados

- Vendedores v1: [`../6ae9ca1e215a10fb339d26e4/README.md`](../6ae9ca1e215a10fb339d26e4/README.md)
- Experiências: [`../6ae9d21f09e7040253b84179/README.md`](../6ae9d21f09e7040253b84179/README.md)

## Rollback

```bash
rm -rf screen-robot/tasks/6ae9d2e4e3474dba682bde66
trello card:archive --id 6ae9d2e4e3474dba682bde66
```
