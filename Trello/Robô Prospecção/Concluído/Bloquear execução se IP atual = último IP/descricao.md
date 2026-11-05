## Objetivo
Antes de **qualquer execução** de worker/operação, obter o IP de egress atual e verificar se **já foi usado** em alguma operação anterior (lista acumulativa). Se **já foi**, **não executar**: abortar na hora e marcar falha com motivo explícito. Se **nunca** foi, executar e **salvar na lista**.

## Problema
Reusar qualquer IP já visto (não só o imediatamente anterior) aumenta risco (LinkedIn/anti-bot). Guardar só o “último” liberava IPs antigos quando o egress oscilava.

## Comportamento
1. Persistência: lista em `~/.connectmax/used-egress-ips` (1 IP/linha). Migração: `last-egress-ip` + IPs da timeline.
2. No **início** de cada ciclo: obter IP atual **uma vez** (`ipify`).
3. Se `IP atual ∈ lista` → **abortar** (não claima; se já claimou → `fail` com “IP já utilizado anteriormente”).
4. Se novo → claima/executa; append na lista + timeline JSONL (`at`, `ip`, `previous`, `agentId`, `jobId`, `jobType`).
5. Sem poll contínuo à espera de mudança — só checagem pontual antes da operação.

## Escopo
1. Lista acumulativa de IPs (host compartilhado)
2. Abort (não wait) quando IP já usado
3. Timeline com data/hora por operação
4. Docs + reset / `SKIP_EGRESS_IP_GUARD`

## Fora de escopo
- Troca automática de VPN/proxy
- Bloquear por IP já usado em contas CSV (outra regra)

## Aceite
- Job A com IP X → X entra na lista + timeline
- Job B ainda com X → aborta (não executa)
- Job C com IP Y novo → executa; Y entra na lista
- Voltar a X no futuro → aborta de novo (X continua na lista)
