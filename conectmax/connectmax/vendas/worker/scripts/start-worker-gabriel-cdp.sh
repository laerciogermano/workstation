#!/bin/zsh
# Worker LinkedIn via Chrome CDP — Gabriel Rocha (extrair_leads + conectar).
# stdout/stderr → terminal + logs/worker-*.out (process substitution mantém PID do npm).
cd /Users/laerciogermano/Documents/works/conectmax/connectmax/vendas/worker
mkdir -p logs
LOG=logs/worker-gabriel-cdp.out
PIDF=logs/worker-gabriel-cdp.pid
echo "——— $(date '+%H:%M:%S') start-worker-gabriel-cdp (log também em $LOG) ———"
env API_URL=http://144.126.154.90 \
  AGENT_ID="${AGENT_ID:-gabriel-rocha}" \
  AGENT_API_KEY=dev-local-agent-key \
  WORKER_RUNTIME=cdp \
  CDP_ID=gabriel-rocha \
  CDP_URL=http://127.0.0.1:9260 \
  CONTAINER_NAME=cdp-gabriel-rocha \
  SERIAL=cdp:gabriel-rocha \
  HOST_KIND=localhost HOST_NOME='Macbook M5' HOST_KEY=localhost \
  PROFILES_API_URL=http://144.126.154.90 \
  MESSAGES_API_URL=http://144.126.154.90 \
  INVITES_API_URL=http://144.126.154.90 \
  npm start > >(tee -a "$LOG") 2>&1 &
echo $! >"$PIDF"
wait "$(cat "$PIDF")"
exit $?
