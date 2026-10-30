#!/bin/zsh
cd /Users/laerciogermano/Documents/works/conectmax/connectmax/vendas/worker
mkdir -p logs
echo $$ > logs/worker-alex.pid
exec env API_URL=http://144.126.154.90 \
  AGENT_ID=585c3f24-91d8-4fad-b86e-cc75b238d753 \
  AGENT_API_KEY=dev-local-agent-key \
  SERIAL=emulator-5562 ADB_SERIAL=emulator-5562 ADB_PORT=5563 \
  CONTAINER_NAME=avd-alex-romao \
  HOST_KIND=localhost HOST_NOME='Macbook M5' HOST_KEY=localhost \
  PROFILES_API_URL=http://144.126.154.90 \
  MESSAGES_API_URL=http://144.126.154.90 \
  INVITES_API_URL=http://144.126.154.90 \
  npm start 2>&1 | tee -a logs/worker-alex.out
