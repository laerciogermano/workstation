#!/usr/bin/env bash
# Publica prototipo/ em https://confraternizacao.laerciogermano.com
# Uso: SSHPASS='senha Contabo 185' bash deploy/publicar.sh
set -euo pipefail
: "${SSHPASS:?defina SSHPASS com a senha do Contabo 185}"
HOST="${HOST:-185.250.37.82}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/prototipo"
export SSHPASS

sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" 'mkdir -p /opt/confraternizacao'
sshpass -e rsync -az --delete \
  --exclude '.DS_Store' \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$SRC/" "root@$HOST:/opt/confraternizacao/"

sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" 'chown -R www-data:www-data /opt/confraternizacao'

curl -sS -o /dev/null -w "index %{http_code}\n" https://confraternizacao.laerciogermano.com/ || true
curl -sS -o /dev/null -w "v1 %{http_code}\n" https://confraternizacao.laerciogermano.com/v1/ || true
curl -sS -o /dev/null -w "v2 %{http_code}\n" https://confraternizacao.laerciogermano.com/v2/ || true
