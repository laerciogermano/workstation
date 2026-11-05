# Task Trello: Bloquear execução se IP já usado

- **Card:** [Bloquear execução se IP atual = último IP](https://trello.com/c/InSl0Em6) (evoluiu: lista de todos os IPs)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção) · lista `Concluído`
- **ID:** `6aeb15c1ae14cb2c2a7e3889`
- **Descrição:** [`card-description.md`](card-description.md)

## Objetivo

Antes de cada operação: se o IP de egress já estiver na lista histórica → aborta. Se for novo → executa e append. Sem poll “até mudar”.

## Implementação

- [`conectmax/connectmax/vendas/worker/src/last-egress-ip.mjs`](../../../conectmax/connectmax/vendas/worker/src/last-egress-ip.mjs) — lista + check pontual + timeline JSONL
- [`conectmax/connectmax/vendas/worker/src/agent-cycle.mjs`](../../../conectmax/connectmax/vendas/worker/src/agent-cycle.mjs) — check antes do claim; commit+fail se já usado
- Regra Cursor: [`.cursor/rules/ip-egress-nunca-reutilizar.mdc`](../../../.cursor/rules/ip-egress-nunca-reutilizar.mdc)
- Docs: [`conectmax/connectmax/vendas/worker/README.md`](../../../conectmax/connectmax/vendas/worker/README.md)

**Arquivos no host**

| Path | Papel |
|------|--------|
| `~/.connectmax/used-egress-ips` | Lista de IPs já usados (1/linha) |
| `~/.connectmax/last-egress-ip` | Legado — migrado na 1ª leitura |
| `~/.connectmax/egress-ip-timeline.jsonl` | Histórico: `at`, `ip`, `previous`, `agentId`, `jobId`, `jobType` |

**Reset lista:** `rm ~/.connectmax/used-egress-ips` (e opcionalmente `last-egress-ip`)  
**Desligar guarda:** `SKIP_EGRESS_IP_GUARD=1`

## Rollback

```bash
# código: reverta agent-cycle + last-egress-ip.mjs + trecho no worker README
rm -f ~/.connectmax/used-egress-ips ~/.connectmax/last-egress-ip
# timeline opcional: rm ~/.connectmax/egress-ip-timeline.jsonl
```
