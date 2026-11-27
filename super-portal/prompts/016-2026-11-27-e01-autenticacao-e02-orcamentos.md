# 016 — E01 autenticação e acesso, E02 orçamentos

| Campo | Valor |
|-------|--------|
| Número | 016 |
| Data | 2026-11-27 |
| Origem | Claude Code |
| Título | Redefinir os dois primeiros épicos |

## Prompt original

```
o epico 01 deve ser apenas a parte de autenticacao e acesso, para todas as personas, epico dois vai ser orcamentos
```

## Interpretação

E01 = entrar, recuperar senha, sem acesso, saída, minha conta e gestão de quem acessa (vendedores, funcionários, permissões), para os cinco papéis. E02 = orçamentos. O que saiu dos antigos E01 e E02 (painel, marca, ajustes, estados, clientes, produtos, busca) forma a E03; E04 a E11 não mudam.

## O que foi feito

- [`prototipo/js/epicos.js`](../prototipo/js/epicos.js) e [`docs/epics.md`](../docs/epics.md).
- Entrada funciona para os cinco papéis; sem módulo na fase, o destino é “Minha conta”.
