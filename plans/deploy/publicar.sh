#!/usr/bin/env bash
# Publica prototipo/ em https://plans.laerciogermano.com
# Uso: SSHPASS='senha Contabo 185' bash deploy/publicar.sh
set -euo pipefail
: "${SSHPASS:?defina SSHPASS com a senha do Contabo 185}"
HOST="${HOST:-185.250.37.82}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/prototipo"
export SSHPASS

sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" 'mkdir -p /opt/plans'
sshpass -e rsync -az --delete \
  --exclude '.DS_Store' \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$SRC/" "root@$HOST:/opt/plans/"

sshpass -e rsync -az \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$ROOT/deploy/nginx-plans.conf" "root@$HOST:/tmp/nginx-plans.conf"

sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" bash -s <<'REMOTE'
set -euo pipefail
chown -R www-data:www-data /opt/plans
install -m 644 /tmp/nginx-plans.conf /etc/nginx/sites-available/plans
ln -sfn /etc/nginx/sites-available/plans /etc/nginx/sites-enabled/plans
nginx -t
systemctl reload nginx

if dig +short plans.laerciogermano.com A | grep -q 185.250.37.82; then
  certbot --nginx -d plans.laerciogermano.com --non-interactive --agree-tos -m laerciogermanoo@gmail.com --redirect || true
fi
REMOTE

curl -sS -o /dev/null -w "index %{http_code}\n" "https://plans.laerciogermano.com/" || \
  curl -sS -o /dev/null -w "index-http %{http_code}\n" "http://plans.laerciogermano.com/" || true
