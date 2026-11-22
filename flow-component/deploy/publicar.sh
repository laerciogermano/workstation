#!/usr/bin/env bash
# Publica example/ em https://fop.laerciogermano.com e https://flow-oriented-programming.com
# Uso: SSHPASS='senha Contabo 185' bash deploy/publicar.sh
set -euo pipefail
: "${SSHPASS:?defina SSHPASS com a senha do Contabo 185}"
HOST="${HOST:-185.250.37.82}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/example"
FOP_HOSTS=(fop.laerciogermano.com flow-oriented-programming.com www.flow-oriented-programming.com)
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
    server_name fop.laerciogermano.com fop.lesgermano.com flow-oriented-programming.com www.flow-oriented-programming.com;
    root /opt/fop;
    index index.html;
    location ^~ /.well-known/acme-challenge/ { root /var/www/html; }
    location / { try_files $uri $uri/ /index.html; }
}
HTTPONLY
fi

sshpass -e rsync -az --delete \
  --exclude '.DS_Store' \
  --exclude 'build.mjs' \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$SRC/" "root@$HOST:/opt/fop/"

# Página principal = índice AST; editor permanece em /flow-novo.html (oculto)
sshpass -e rsync -az \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$ROOT/docs/indice-ast.html" "root@$HOST:/opt/fop/index.html"
sshpass -e rsync -az \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$ROOT/docs/fn-svg.js" "root@$HOST:/opt/fop/fn-svg.js"
sshpass -e rsync -az \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$ROOT/docs/img/" "root@$HOST:/opt/fop/img/"

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

# Cert LE: sub + apex + www (expand se faltar SAN)
NEED_CERT=0
if [[ ! -s /etc/letsencrypt/live/fop.laerciogermano.com/fullchain.pem ]]; then
  NEED_CERT=1
elif ! openssl x509 -in /etc/letsencrypt/live/fop.laerciogermano.com/fullchain.pem -noout -text \
  | grep -q 'DNS:flow-oriented-programming.com'; then
  NEED_CERT=1
fi
if [[ "$NEED_CERT" -eq 1 ]] \
  && dig +short fop.laerciogermano.com A | grep -q 185.250.37.82 \
  && dig +short flow-oriented-programming.com A | grep -q 185.250.37.82; then
  certbot --nginx --cert-name fop.laerciogermano.com \
    -d fop.laerciogermano.com \
    -d flow-oriented-programming.com \
    -d www.flow-oriented-programming.com \
    --expand --non-interactive --agree-tos -m laerciogermanoo@gmail.com --redirect || true
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

for h in "${FOP_HOSTS[@]}"; do
  curl -sS -o /dev/null -w "$h https %{http_code}\n" "https://$h/" \
    || curl -sS -o /dev/null -w "$h http %{http_code}\n" "http://$h/" || true
done
