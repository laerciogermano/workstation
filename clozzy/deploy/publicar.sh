#!/usr/bin/env bash
# Publica site (home) + prototipo-v2 + manual da marca em https://clozzy.laerciogermano.com
# Uso: SSHPASS='senha Contabo 185' bash deploy/publicar.sh
set -euo pipefail
: "${SSHPASS:?defina SSHPASS com a senha do Contabo 185}"
HOST="${HOST:-185.250.37.82}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="$ROOT/docs/site"
PROTO="$ROOT/docs/prototipo-v2"
MARCA="$ROOT/marca/identidade-verde-letras-redondas"
export SSHPASS

sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" 'mkdir -p /opt/clozzy/prototipo /opt/clozzy/marca'

# Home (sem --delete na raiz: não apaga prototipo/marca)
sshpass -e rsync -az \
  --exclude '.DS_Store' --exclude 'README.md' \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$SITE/" "root@$HOST:/opt/clozzy/"

# Protótipo em /prototipo/
sshpass -e rsync -az --delete \
  --exclude '.DS_Store' --exclude 'README.md' \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$PROTO/" "root@$HOST:/opt/clozzy/prototipo/"

# Manual da marca em /marca/ (HTML como index + PDF)
sshpass -e rsync -az --delete \
  --exclude '.DS_Store' --exclude 'README.md' --exclude '_build.py' --exclude 'svg' --exclude '__pycache__' \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$MARCA/" "root@$HOST:/opt/clozzy/marca/"

sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" bash -s <<'REMOTE'
set -euo pipefail
# HTML do manual como index em /marca/
if [[ -f /opt/clozzy/marca/identidade-verde-letras-redondas.html ]]; then
  cp -f /opt/clozzy/marca/identidade-verde-letras-redondas.html /opt/clozzy/marca/index.html
fi
chown -R www-data:www-data /opt/clozzy
REMOTE

sshpass -e rsync -az \
  -e 'sshpass -e ssh -o StrictHostKeyChecking=no' \
  "$ROOT/deploy/nginx-clozzy.conf" "root@$HOST:/tmp/nginx-clozzy.conf"

sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" bash -s <<'REMOTE'
set -euo pipefail
install -m 644 /tmp/nginx-clozzy.conf /etc/nginx/sites-available/clozzy-proto
ln -sfn /etc/nginx/sites-available/clozzy-proto /etc/nginx/sites-enabled/clozzy-proto
# Preservar bloco SSL do certbot se o conf local for só :80
if [[ -f /etc/letsencrypt/live/clozzy.laerciogermano.com/fullchain.pem ]]; then
  if ! grep -q 'listen 443' /etc/nginx/sites-available/clozzy-proto; then
    certbot --nginx -d clozzy.laerciogermano.com --non-interactive --agree-tos -m laerciogermanoo@gmail.com --redirect || true
  fi
fi
nginx -t
systemctl reload nginx

if dig +short clozzy.laerciogermano.com A | grep -q 185.250.37.82; then
  certbot --nginx -d clozzy.laerciogermano.com --non-interactive --agree-tos -m laerciogermanoo@gmail.com --redirect || true
fi
REMOTE

curl -sS -o /dev/null -w "home %{http_code}\n" "https://clozzy.laerciogermano.com/" || true
curl -sS -o /dev/null -w "proto %{http_code}\n" "https://clozzy.laerciogermano.com/prototipo/" || true
curl -sS -o /dev/null -w "marca %{http_code}\n" "https://clozzy.laerciogermano.com/marca/" || true
