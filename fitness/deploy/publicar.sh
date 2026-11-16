#!/usr/bin/env bash
# Publica prototipos/v1/ em https://fitness.laerciogermano.com
# Uso: SSHPASS='senha Contabo 185' bash deploy/publicar.sh
set -euo pipefail
: "${SSHPASS:?defina SSHPASS com a senha do Contabo 185}"
HOST="${HOST:-185.250.37.82}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/prototipos/v1"
export SSHPASS

sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" 'mkdir -p /opt/fitness'
sshpass -e rsync -az --delete \
  --exclude '.DS_Store' \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$SRC/" "root@$HOST:/opt/fitness/"

sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" 'chown -R www-data:www-data /opt/fitness'

curl -sS -o /dev/null -w "index %{http_code}\n" https://fitness.laerciogermano.com/ || true
curl -sS -o /dev/null -w "css %{http_code}\n" https://fitness.laerciogermano.com/styles.css || true
