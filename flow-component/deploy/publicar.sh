#!/usr/bin/env bash
# Publica example/ em https://fop.laerciogermano.com (Flow · só FOP / flow-novo)
# Uso: SSHPASS='senha Contabo 185' bash deploy/publicar.sh
set -euo pipefail
: "${SSHPASS:?defina SSHPASS com a senha do Contabo 185}"
HOST="${HOST:-185.250.37.82}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/example"
export SSHPASS

sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" 'mkdir -p /opt/fop'

# Conf HTTP-only primeiro (certbot gera :443). Depois republica conf com SSL se já houver cert.
TMP_CONF="$(mktemp)"
if sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" \
  'test -s /etc/letsencrypt/live/fop.laerciogermano.com/fullchain.pem'; then
  cp "$ROOT/deploy/nginx-fop.conf" "$TMP_CONF"
else
  cat >"$TMP_CONF" <<'HTTPONLY'
server {
    listen 80;
    listen [::]:80;
    server_name fop.laerciogermano.com fop.lesgermano.com;
    root /opt/fop;
    index flow-novo.html index.html;
    location ^~ /.well-known/acme-challenge/ { root /var/www/html; }
    location = / { return 302 /flow-novo.html?tema=eternos-black; }
    location / { try_files $uri $uri/ =404; }
}
HTTPONLY
fi

sshpass -e rsync -az --delete \
  --exclude '.DS_Store' \
  --exclude 'build.mjs' \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$SRC/" "root@$HOST:/opt/fop/"

sshpass -e rsync -az \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$TMP_CONF" "root@$HOST:/tmp/nginx-fop.conf"
rm -f "$TMP_CONF"

sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" bash -s <<'REMOTE'
set -euo pipefail
chown -R www-data:www-data /opt/fop
install -m 644 /tmp/nginx-fop.conf /etc/nginx/sites-available/fop
ln -sfn /etc/nginx/sites-available/fop /etc/nginx/sites-enabled/fop
nginx -t
systemctl reload nginx

if [[ ! -s /etc/letsencrypt/live/fop.laerciogermano.com/fullchain.pem ]] \
  && dig +short fop.laerciogermano.com A | grep -q 185.250.37.82; then
  certbot --nginx -d fop.laerciogermano.com --non-interactive --agree-tos -m laerciogermanoo@gmail.com --redirect || true
fi
REMOTE

# Se o certbot gerou SSL, republica conf canônica com :443
if sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" \
  'test -s /etc/letsencrypt/live/fop.laerciogermano.com/fullchain.pem'; then
  sshpass -e rsync -az \
    -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
    "$ROOT/deploy/nginx-fop.conf" "root@$HOST:/tmp/nginx-fop.conf"
  sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" bash -s <<'REMOTE'
set -euo pipefail
install -m 644 /tmp/nginx-fop.conf /etc/nginx/sites-available/fop
nginx -t && systemctl reload nginx
REMOTE
fi

curl -sS -o /dev/null -w "https %{http_code}\n" "https://fop.laerciogermano.com/flow-novo.html?tema=eternos-black" || \
  curl -sS -o /dev/null -w "http %{http_code}\n" "http://fop.laerciogermano.com/flow-novo.html?tema=eternos-black" || true
