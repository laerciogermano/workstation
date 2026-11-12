#!/bin/zsh
# Worker LinkedIn via Chrome CDP — Thiago Nascimento (extrair_leads + conectar).
# stdout/stderr → terminal + logs/worker-*.out (process substitution mantém PID do npm).
cd /Users/laerciogermano/Documents/works/conectmax/connectmax/vendas/worker
mkdir -p logs
LOG=logs/worker-thiago-cdp.out
PIDF=logs/worker-thiago-cdp.pid
echo "——— $(date '+%H:%M:%S') start-worker-thiago-cdp (log também em $LOG) ———"
env API_URL=http://185.250.37.82 \
  AGENT_ID="${AGENT_ID:-b7515404-ec01-466c-b30f-30be39c0a2f3}" \
  AGENT_API_KEY=dev-local-agent-key \
  WORKER_RUNTIME=cdp \
  CDP_ID=thiago-nascimento \
  CDP_URL=http://127.0.0.1:9256 \
  CONTAINER_NAME=cdp-thiago-nascimento \
  SERIAL=cdp:thiago-nascimento \
  HOST_KIND=localhost HOST_NOME='Macbook M5' HOST_KEY=localhost \
  PROFILES_API_URL=http://185.250.37.82 \
  MESSAGES_API_URL=http://185.250.37.82 \
  INVITES_API_URL=http://185.250.37.82 \
  npm start > >(tee -a "$LOG") 2>&1 &
echo $! >"$PIDF"
wait "$(cat "$PIDF")"
exit $?
