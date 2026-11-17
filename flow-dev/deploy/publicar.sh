#!/usr/bin/env bash
# Publica prototipo/ em https://flow-ide.laerciogermano.com
# Uso: SSHPASS='senha Contabo 185' bash deploy/publicar.sh
set -euo pipefail
: "${SSHPASS:?defina SSHPASS com a senha do Contabo 185}"
HOST="${HOST:-185.250.37.82}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/prototipo"
export SSHPASS

sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" 'mkdir -p /opt/flow-ide'
sshpass -e rsync -az --delete \
  --exclude '.DS_Store' \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$SRC/" "root@$HOST:/opt/flow-ide/"

sshpass -e rsync -az \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$ROOT/deploy/nginx-flow-ide.conf" "root@$HOST:/tmp/nginx-flow-ide.conf"

sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" bash -s <<'REMOTE'
set -euo pipefail
chown -R www-data:www-data /opt/flow-ide
install -m 644 /tmp/nginx-flow-ide.conf /etc/nginx/sites-available/flow-ide
ln -sfn /etc/nginx/sites-available/flow-ide /etc/nginx/sites-enabled/flow-ide
nginx -t
systemctl reload nginx

if dig +short flow-ide.laerciogermano.com A | grep -q 185.250.37.82; then
  certbot --nginx -d flow-ide.laerciogermano.com --non-interactive --agree-tos -m laerciogermanoo@gmail.com --redirect || true
fi
REMOTE

curl -sS -o /dev/null -w "index %{http_code}\n" "https://flow-ide.laerciogermano.com/" || \
  curl -sS -o /dev/null -w "index-http %{http_code}\n" "http://flow-ide.laerciogermano.com/" || true
