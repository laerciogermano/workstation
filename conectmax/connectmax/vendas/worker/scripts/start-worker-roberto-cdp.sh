#!/bin/zsh
# Worker LinkedIn via Chrome CDP — Roberto Menezes (extrair_leads + conectar).
# stdout/stderr → terminal + logs/worker-*.out (process substitution mantém PID do npm).
cd /Users/laerciogermano/Documents/works/conectmax/connectmax/vendas/worker
mkdir -p logs
LOG=logs/worker-roberto-cdp.out
PIDF=logs/worker-roberto-cdp.pid
echo "——— $(date '+%H:%M:%S') start-worker-roberto-cdp (log também em $LOG) ———"
env API_URL=http://185.250.37.82 \
  AGENT_ID="${AGENT_ID:-29140d46-85d0-4541-a640-7b72f9519c5b}" \
  AGENT_API_KEY=dev-local-agent-key \
  WORKER_RUNTIME=cdp \
  CDP_ID=roberto-menezes \
  CDP_URL=http://127.0.0.1:9259 \
  CONTAINER_NAME=cdp-roberto-menezes \
  SERIAL=cdp:roberto-menezes \
  EXTRACT_MAX_PROFILES=10 \
  HOST_KIND=localhost HOST_NOME='Macbook M5' HOST_KEY=localhost \
  PROFILES_API_URL=http://185.250.37.82 \
  MESSAGES_API_URL=http://185.250.37.82 \
  INVITES_API_URL=http://185.250.37.82 \
  npm start > >(tee -a "$LOG") 2>&1 &
echo $! >"$PIDF"
wait "$(cat "$PIDF")"
exit $?
