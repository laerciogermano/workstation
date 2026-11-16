#!/usr/bin/env bash
# Publica site/ em https://centralizador.laerciogermano.com
# Uso: SSHPASS='senha Contabo 185' bash deploy/publicar.sh
set -euo pipefail
: "${SSHPASS:?defina SSHPASS com a senha do Contabo 185}"
HOST="${HOST:-185.250.37.82}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/site"
export SSHPASS

sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" 'mkdir -p /opt/centralizador'
sshpass -e rsync -az --delete \
  --exclude '.DS_Store' \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$SRC/" "root@$HOST:/opt/centralizador/"

sshpass -e rsync -az \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$ROOT/deploy/nginx-centralizador.conf" "root@$HOST:/tmp/nginx-centralizador.conf"

sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" bash -s <<'REMOTE'
set -euo pipefail
chown -R www-data:www-data /opt/centralizador
install -m 644 /tmp/nginx-centralizador.conf /etc/nginx/sites-available/centralizador
ln -sfn /etc/nginx/sites-available/centralizador /etc/nginx/sites-enabled/centralizador
nginx -t
systemctl reload nginx

if dig +short centralizador.laerciogermano.com A | grep -q 185.250.37.82; then
  certbot --nginx -d centralizador.laerciogermano.com --non-interactive --agree-tos -m laerciogermanoo@gmail.com --redirect || true
fi
REMOTE

curl -sS -o /dev/null -w "index %{http_code}\n" "https://centralizador.laerciogermano.com/" || \
  curl -sS -o /dev/null -w "index-http %{http_code}\n" "http://centralizador.laerciogermano.com/" || true
