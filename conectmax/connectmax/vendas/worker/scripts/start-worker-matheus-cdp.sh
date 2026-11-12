#!/bin/zsh
# Worker LinkedIn via Chrome CDP — Matheus ConectMax (agente local).
# stdout/stderr → terminal + logs/worker-*.out (process substitution mantém PID do npm).
cd /Users/laerciogermano/Documents/works/conectmax/connectmax/vendas/worker
mkdir -p logs
LOG=logs/worker-matheus-cdp.out
PIDF=logs/worker-matheus-cdp.pid
echo "——— $(date '+%H:%M:%S') start-worker-matheus-cdp (log também em $LOG) ———"
env API_URL=http://185.250.37.82 \
  AGENT_ID="${AGENT_ID:-ddc7f46c-2361-4ed2-aa4d-a32319f97721}" \
  AGENT_API_KEY=dev-local-agent-key \
  WORKER_RUNTIME=cdp \
  CDP_ID=matheus-conectmax \
  CDP_URL=http://127.0.0.1:9267 \
  CONTAINER_NAME=cdp-matheus-conectmax \
  SERIAL=cdp:matheus-conectmax \
  EXTRACT_MAX_PROFILES=10 \
  HOST_KIND=localhost HOST_NOME='Macbook M5' HOST_KEY=localhost \
  PROFILES_API_URL=http://185.250.37.82 \
  MESSAGES_API_URL=http://185.250.37.82 \
  INVITES_API_URL=http://185.250.37.82 \
  npm start > >(tee -a "$LOG") 2>&1 &
echo $! >"$PIDF"
wait "$(cat "$PIDF")"
exit $?
