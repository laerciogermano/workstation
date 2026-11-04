## Objetivo
Antes de **qualquer execução** de worker/operação, comparar o IP de egress atual com o **último IP** gravado da execução anterior. Se for **igual**, **não executar**: matar/abortar na hora e marcar falha com motivo explícito de IP repetido.

## Problema
Operações consecutivas no mesmo egress aumentam risco (LinkedIn/anti-bot). Hoje não há guarda central que impeça job novo no mesmo IP do job anterior.

## Comportamento
1. Worker **fica ligado** e **polla** o IP de egress (`EGRESS_IP_POLL_MS`).
2. Compara com o **último IP** gravado (`~/.connectmax/last-egress-ip`).
3. Se `IP atual == último` → **não claima** / não executa; só espera o IP mudar.
4. Se diferente → claima e executa; grava o atual como último + append na **timeline** JSONL (data/hora + IP + job).
5. Timeline: `~/.connectmax/egress-ip-timeline.jsonl` (`at`, `ip`, `previous`, `agentId`, `jobId`, `jobType`).

## Escopo
1. Persistência do último IP (host compartilhado)
2. Poll contínuo enquanto IP não muda (sem fail de job por IP)
3. Timeline com data/hora por operação
4. Docs + reset / `SKIP_EGRESS_IP_GUARD`

## Fora de escopo
- Troca automática de VPN/proxy
- Bloquear por IP já usado em contas CSV (outra regra)

## Aceite
- Job A com IP X → grava X + linha na timeline
- Com IP ainda X e job na fila → worker idle/espera (não claima, não fail)
- IP muda para Y → worker claima e executa; timeline ganha linha Y
