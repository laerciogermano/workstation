# Task Trello: Bloquear execução se IP atual = último IP

- **Card:** [Bloquear execução se IP atual = último IP](https://trello.com/c/InSl0Em6)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção) · lista `Concluído`
- **ID:** `6aeb15c1ae14cb2c2a7e3889`
- **Descrição:** [`card-description.md`](card-description.md)

## Objetivo

Worker fica ligado e polla o egress. Só claima/executa se o IP atual ≠ último. Se igual, espera (sem fail). Cada operação gravada na timeline com data/hora.

## Implementação

- [`conectmax/connectmax/vendas/worker/src/last-egress-ip.mjs`](../../../conectmax/connectmax/vendas/worker/src/last-egress-ip.mjs) — poll + último IP + timeline JSONL
- [`conectmax/connectmax/vendas/worker/src/agent-cycle.mjs`](../../../conectmax/connectmax/vendas/worker/src/agent-cycle.mjs) — wait antes do claim; commit+timeline ao executar
- Docs: [`conectmax/connectmax/vendas/worker/README.md`](../../../conectmax/connectmax/vendas/worker/README.md)

**Arquivos no host**

| Path | Papel |
|------|--------|
| `~/.connectmax/last-egress-ip` | Último IP usado numa operação |
| `~/.connectmax/egress-ip-timeline.jsonl` | Histórico: `at`, `ip`, `previous`, `agentId`, `jobId`, `jobType` |

**Reset último IP:** `rm ~/.connectmax/last-egress-ip`  
**Desligar guarda:** `SKIP_EGRESS_IP_GUARD=1`

## Rollback

```bash
# código: reverta agent-cycle + last-egress-ip.mjs + trecho no worker README
rm -f ~/.connectmax/last-egress-ip
# timeline opcional: rm ~/.connectmax/egress-ip-timeline.jsonl
trello card:archive --id 6aeb15c1ae14cb2c2a7e3889
```
