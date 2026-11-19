#!/bin/zsh
# Worker LinkedIn via Chrome CDP — Marina Costa (extrair_leads + conectar).
# stdout/stderr → terminal + logs/worker-*.out (process substitution mantém PID do npm).
cd /Users/laerciogermano/Documents/works/conectmax/connectmax/vendas/worker
mkdir -p logs
LOG=logs/worker-marina-cdp.out
PIDF=logs/worker-marina-cdp.pid
echo "——— $(date '+%H:%M:%S') start-worker-marina-cdp (log também em $LOG) ———"
env API_URL=http://185.250.37.82 \
  AGENT_ID="${AGENT_ID:-d59832cd-92fc-4446-bd9c-a8ac989b9cea}" \
  AGENT_API_KEY=dev-local-agent-key \
  WORKER_RUNTIME=cdp \
  CDP_ID=marina-costa \
  CDP_URL=http://127.0.0.1:9224 \
  CONTAINER_NAME=cdp-marina-costa \
  SERIAL=cdp:marina-costa \
  EXTRACT_MAX_PROFILES=10 \
  HOST_KIND=localhost HOST_NOME='Macbook M5' HOST_KEY=localhost \
  PROFILES_API_URL=http://185.250.37.82 \
  MESSAGES_API_URL=http://185.250.37.82 \
  INVITES_API_URL=http://185.250.37.82 \
  npm start > >(tee -a "$LOG") 2>&1 &
echo $! >"$PIDF"
wait "$(cat "$PIDF")"
exit $?
