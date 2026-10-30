#!/bin/zsh
cd /Users/laerciogermano/Documents/works/conectmax/connectmax/vendas/worker
mkdir -p logs
echo $$ > logs/worker-fernando.pid
exec env API_URL=http://144.126.154.90 \
  AGENT_ID=76b09621-1d12-45a7-b3c9-ce1daf81e724 \
  AGENT_API_KEY=dev-local-agent-key \
  SERIAL=emulator-5564 ADB_SERIAL=emulator-5564 ADB_PORT=5565 \
  CONTAINER_NAME=avd-fernando-breda \
  HOST_KIND=localhost HOST_NOME='Macbook M5' HOST_KEY=localhost \
  PROFILES_API_URL=http://144.126.154.90 \
  MESSAGES_API_URL=http://144.126.154.90 \
  INVITES_API_URL=http://144.126.154.90 \
  npm start 2>&1 | tee -a logs/worker-fernando.out
