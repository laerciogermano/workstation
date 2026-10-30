#!/bin/zsh
cd /Users/laerciogermano/Documents/works/conectmax/connectmax/vendas/worker
mkdir -p logs
echo $$ > logs/worker-jacqueline.pid
exec env API_URL=http://144.126.154.90 \
  AGENT_ID=88000125-059f-499b-8ec2-ca9e5a6b5406 \
  AGENT_API_KEY=dev-local-agent-key \
  SERIAL=emulator-5556 ADB_SERIAL=emulator-5556 ADB_PORT=5557 \
  CONTAINER_NAME=avd-jacqueline-lima \
  HOST_KIND=localhost HOST_NOME='Macbook M5' HOST_KEY=localhost \
  PROFILES_API_URL=http://144.126.154.90 \
  MESSAGES_API_URL=http://144.126.154.90 \
  INVITES_API_URL=http://144.126.154.90 \
  npm start 2>&1 | tee -a logs/worker-jacqueline.out
