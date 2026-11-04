# Task Trello: Bloquear execução se IP atual = último IP

- **Card:** [Bloquear execução se IP atual = último IP](https://trello.com/c/InSl0Em6)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção) · lista `Concluído`
- **ID:** `6aeb15c1ae14cb2c2a7e3889`
- **Descrição:** [`card-description.md`](card-description.md)

## Objetivo

Guardar o último IP de egress usado numa operação; no start da próxima, se o IP atual for igual, abortar e falhar com motivo `IP igual ao último IP` — sem poll contínuo.

## Implementação

- [`conectmax/connectmax/vendas/worker/src/last-egress-ip.mjs`](../../../conectmax/connectmax/vendas/worker/src/last-egress-ip.mjs) — fetch ipify + arquivo `~/.connectmax/last-egress-ip` + lock
- [`conectmax/connectmax/vendas/worker/src/agent-cycle.mjs`](../../../conectmax/connectmax/vendas/worker/src/agent-cycle.mjs) — após claim, antes do handler
- Docs: [`conectmax/connectmax/vendas/worker/README.md`](../../../conectmax/connectmax/vendas/worker/README.md)

**Reset último IP:** `rm ~/.connectmax/last-egress-ip`  
**Desligar:** `SKIP_EGRESS_IP_GUARD=1`

## Rollback

```bash
# código: reverta agent-cycle + apague last-egress-ip.mjs; limpe o trecho no worker README
rm -f ~/.connectmax/last-egress-ip
trello card:archive --id 6aeb15c1ae14cb2c2a7e3889
```
