#!/bin/zsh
# Worker LinkedIn via Chrome CDP — Juliana Peixoto (extrair_leads + conectar).
# stdout/stderr → terminal + logs/worker-*.out (process substitution mantém PID do npm).
cd /Users/laerciogermano/Documents/works/conectmax/connectmax/vendas/worker
mkdir -p logs
LOG=logs/worker-juliana-cdp.out
PIDF=logs/worker-juliana-cdp.pid
echo "——— $(date '+%H:%M:%S') start-worker-juliana-cdp (log também em $LOG) ———"
env API_URL=http://144.126.154.90 \
  AGENT_ID="${AGENT_ID:-1bbb1614-ed89-42f5-a8d0-72d8649dac4a}" \
  AGENT_API_KEY=dev-local-agent-key \
  WORKER_RUNTIME=cdp \
  CDP_ID=juliana-peixoto \
  CDP_URL=http://127.0.0.1:9258 \
  CONTAINER_NAME=cdp-juliana-peixoto \
  SERIAL=cdp:juliana-peixoto \
  HOST_KIND=localhost HOST_NOME='Macbook M5' HOST_KEY=localhost \
  PROFILES_API_URL=http://144.126.154.90 \
  MESSAGES_API_URL=http://144.126.154.90 \
  INVITES_API_URL=http://144.126.154.90 \
  npm start > >(tee -a "$LOG") 2>&1 &
echo $! >"$PIDF"
wait "$(cat "$PIDF")"
exit $?
