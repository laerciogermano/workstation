#!/bin/zsh
# Worker LinkedIn via Chrome CDP — Daniela Hoffmann (só extrair_leads no agente).
cd /Users/laerciogermano/Documents/works/conectmax/connectmax/vendas/worker
mkdir -p logs
echo $$ > logs/worker-daniela-cdp.pid
exec env API_URL=http://144.126.154.90 \
  AGENT_ID="${AGENT_ID:-f505db3b-3ed8-491c-8600-0cb14993158f}" \
  AGENT_API_KEY=dev-local-agent-key \
  WORKER_RUNTIME=cdp \
  CDP_ID=daniela-hoffmann \
  CDP_URL=http://127.0.0.1:9255 \
  CONTAINER_NAME=cdp-daniela-hoffmann \
  SERIAL=cdp:daniela-hoffmann \
  HOST_KIND=localhost HOST_NOME='Macbook M5' HOST_KEY=localhost \
  PROFILES_API_URL=http://144.126.154.90 \
  MESSAGES_API_URL=http://144.126.154.90 \
  INVITES_API_URL=http://144.126.154.90 \
  npm start 2>&1 | tee -a logs/worker-daniela-cdp.out
