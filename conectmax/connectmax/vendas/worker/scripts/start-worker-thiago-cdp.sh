#!/bin/zsh
# Worker LinkedIn via Chrome CDP — Thiago Nascimento (extrair_leads + conectar).
# Sem `exec … | tee`: keep-worker precisa do PID real do node e do wait correto.
cd /Users/laerciogermano/Documents/works/conectmax/connectmax/vendas/worker
mkdir -p logs
LOG=logs/worker-thiago-cdp.out
PIDF=logs/worker-thiago-cdp.pid
env API_URL=http://144.126.154.90 \
  AGENT_ID="${AGENT_ID:-b7515404-ec01-466c-b30f-30be39c0a2f3}" \
  AGENT_API_KEY=dev-local-agent-key \
  WORKER_RUNTIME=cdp \
  CDP_ID=thiago-nascimento \
  CDP_URL=http://127.0.0.1:9256 \
  CONTAINER_NAME=cdp-thiago-nascimento \
  SERIAL=cdp:thiago-nascimento \
  HOST_KIND=localhost HOST_NOME='Macbook M5' HOST_KEY=localhost \
  PROFILES_API_URL=http://144.126.154.90 \
  MESSAGES_API_URL=http://144.126.154.90 \
  INVITES_API_URL=http://144.126.154.90 \
  npm start >>"$LOG" 2>&1 &
echo $! >"$PIDF"
wait "$(cat "$PIDF")"
exit $?
