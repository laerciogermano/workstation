#!/usr/bin/env bash
# Publica docs/prototipo-v2/ em https://clozzy.laerciogermano.com
# Uso: SSHPASS='senha Contabo 185' bash deploy/publicar.sh
set -euo pipefail
: "${SSHPASS:?defina SSHPASS com a senha do Contabo 185}"
HOST="${HOST:-185.250.37.82}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/docs/prototipo-v2"
export SSHPASS

sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" 'mkdir -p /opt/clozzy'
sshpass -e rsync -az --delete \
  --exclude '.DS_Store' \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$SRC/" "root@$HOST:/opt/clozzy/"

sshpass -e rsync -az \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$ROOT/deploy/nginx-clozzy.conf" "root@$HOST:/tmp/nginx-clozzy.conf"

sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" bash -s <<'REMOTE'
set -euo pipefail
chown -R www-data:www-data /opt/clozzy
install -m 644 /tmp/nginx-clozzy.conf /etc/nginx/sites-available/clozzy-proto
ln -sfn /etc/nginx/sites-available/clozzy-proto /etc/nginx/sites-enabled/clozzy-proto
nginx -t
systemctl reload nginx

if dig +short clozzy.laerciogermano.com A | grep -q 185.250.37.82; then
  certbot --nginx -d clozzy.laerciogermano.com --non-interactive --agree-tos -m laerciogermanoo@gmail.com --redirect || true
fi
REMOTE

curl -sS -o /dev/null -w "index %{http_code}\n" "https://clozzy.laerciogermano.com/" || \
  curl -sS -o /dev/null -w "index-http %{http_code}\n" "http://clozzy.laerciogermano.com/" || true
