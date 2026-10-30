#!/bin/zsh
cd /Users/laerciogermano/Documents/works/conectmax/connectmax/vendas/worker
mkdir -p logs
echo $$ > logs/worker-matheus.pid
exec env API_URL=http://144.126.154.90 \
  AGENT_ID=ddc7f46c-2361-4ed2-aa4d-a32319f97721 \
  AGENT_API_KEY=dev-local-agent-key \
  SERIAL=emulator-5554 ADB_SERIAL=emulator-5554 \
  HOST_KIND=localhost HOST_NOME='Macbook M5' HOST_KEY=localhost \
  PROFILES_API_URL=http://144.126.154.90 \
  MESSAGES_API_URL=http://144.126.154.90 \
  INVITES_API_URL=http://144.126.154.90 \
  npm start 2>&1 | tee -a logs/worker-matheus.out
