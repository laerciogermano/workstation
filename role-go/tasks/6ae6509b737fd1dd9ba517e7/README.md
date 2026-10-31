# Task Trello: v0.1 — Autenticação e onboarding (criar + publicar)

- **Card ID:** `6ae6509b737fd1dd9ba517e7`
- **URL:** https://trello.com/c/qRWb8Gxn
- **Board:** [RoleGo](https://trello.com/b/Qe6mVdfL/rolego) · lista `todo`

## Objetivo

Criar e publicar a **versão 0.1** do RoleGo: autenticação e onboarding (épico E01) em https://rolego.com.br.

## Insumos

Espelha a descrição do card Trello.

### Escopo e protótipo

- [`../../epics.md`](../../epics.md) — E01 Conta, onboarding e perfil
- [`../../web/README.md`](../../web/README.md) — protótipo React (Vite)
- [`../../deploy/README.md`](../../deploy/README.md) — publish Contabo / nginx

### Marca

- [`../../marca/README.md`](../../marca/README.md)
- Card identidade: [gU37I2lg](https://trello.com/c/gU37I2lg) · [`../6adfa306d2ba6a3e29c5f07d/README.md`](../6adfa306d2ba6a3e29c5f07d/README.md)
- Card logo: [S7jWwUbC](https://trello.com/c/S7jWwUbC) · [`../6adfae475a40a1ad4f46ac66/README.md`](../6adfae475a40a1ad4f46ac66/README.md)

### Wireframes

- [`../../input/rolego_mvp_completo_dark.pdf`](../../input/rolego_mvp_completo_dark.pdf)

## Entrega prevista

- App v0.1 (auth + onboarding + perfil mínimo) publicado em rolego.com.br
- Deploy/rollback documentados se o fluxo mudar

## Rollback

```bash
# só pasta local
rm -rf role-go/tasks/6ae6509b737fd1dd9ba517e7
# card no Trello (se precisar)
trello card:archive --id 6ae6509b737fd1dd9ba517e7
# produção: voltar “em breve” — ver ../../deploy/README.md
```
