# 070 — Pixel de abertura no e-mail marketing

| Campo | Valor |
|-------|--------|
| Número | 070 |
| Data | 2026-11-27 |
| Origem | Claude Code |
| Título | Saber quem abriu o e-mail da campanha |

## Prompt original

```
e depois de ajustar no epico, imlemente no email marketing esse pixel para sabermos quem abriu
```

```
e se possivel, colocar o email no link, pra eu saber exatamente qual email abriu
```

Contexto (pedido sobre o Super Portal e texto de referência sobre pixel, link rastreado e UTM): [`super-portal/prompts/032`](../../../super-portal/prompts/032-2026-11-27-analytics-nas-campanhas.md).

## Interpretação

Pixel 1×1 por destinatário no `email-marketing`, com o e-mail visível no link, e a tela mostrando quem abriu. Só abertura; clique e UTM ficam de fora.

## O que foi feito

- CU-06 no [`README`](../email-marketing/README.md); [`arquitetura`](../email-marketing/docs/arquitetura.md) e `AGENTS.md` atualizados.
- Migração `0002_open_tracking.sql`; rota pública `GET /t/o/:token.gif?e=`; pixel no HTML enviado.
- `GET /api/campaigns/:id/recipients` e, na campanha, total “Abriram” e tabela de destinatários com filtro.
- Testes: 22 passando. Sem deploy.
