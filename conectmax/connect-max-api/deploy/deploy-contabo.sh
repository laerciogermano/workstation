#!/usr/bin/env bash
# Publica Connect Max API em https://connect-max-api.laerciogermano.com (Contabo).
# Uso: HOST=185.250.37.82 SSHPASS='…' API_KEY='…' ./deploy/deploy-contabo.sh
# DNS: wildcard A * em laerciogermano.com → Contabo (sem registro extra).
set -euo pipefail

HOST="${HOST:-185.250.37.82}"
REMOTE_DIR=/opt/connect-max-api
ENV_DIR=/srv/connect-max-api
DATA_DIR=/var/lib/connect-max-api
PORT="${PORT:-4182}"
PUBLIC_HOST="${PUBLIC_HOST:-connect-max-api.laerciogermano.com}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RSH="sshpass -e ssh -o StrictHostKeyChecking=no"

: "${SSHPASS:?defina SSHPASS (senha root Contabo)}"
: "${API_KEY:?defina API_KEY (chave de aplicação)}"

FRANQ_USER="${CONECTMAX_FRANQUEADO_USER:-}"
FRANQ_PASS="${CONECTMAX_FRANQUEADO_PASS:-}"
if [[ -z "$FRANQ_USER" || -z "$FRANQ_PASS" ]]; then
  CREDS="${HOME}/.config/conectmax-franqueado/credentials.env"
  if [[ -f "$CREDS" ]]; then
    # shellcheck disable=SC1090
    set -a
    # lê KEY=VAL sem source (valores podem ter espaços)
    while IFS= read -r line || [[ -n "$line" ]]; do
      [[ -z "$line" || "$line" =~ ^# ]] && continue
      [[ "$line" != *=* ]] && continue
      k="${line%%=*}"
      v="${line#*=}"
      v="${v%\"}"
      v="${v#\"}"
      case "$k" in
        CONECTMAX_FRANQUEADO_USER) FRANQ_USER="$v" ;;
        CONECTMAX_FRANQUEADO_PASS) FRANQ_PASS="$v" ;;
      esac
    done < "$CREDS"
    set +a
  fi
fi
: "${FRANQ_USER:?faltando CONECTMAX_FRANQUEADO_USER}"
: "${FRANQ_PASS:?faltando CONECTMAX_FRANQUEADO_PASS}"

PG_PASS="${DB_PASSWORD:-jL592CN6B0F801pKkgV9fkR2WOpxv8}"

echo "==> rsync → root@$HOST:$REMOTE_DIR"
sshpass -e rsync -az --delete \
  --exclude node_modules \
  --exclude .env \
  --exclude coverage \
  -e "$RSH" \
  "$ROOT/" "root@$HOST:$REMOTE_DIR/"

sshpass -e rsync -az -e "$RSH" \
  "$ROOT/deploy/nginx-api-conectmax.conf" \
  "$ROOT/deploy/connect-max-api.service" \
  "root@$HOST:/tmp/"

sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" bash -s <<REMOTE
set -euo pipefail
REMOTE_DIR=$REMOTE_DIR
ENV_DIR=$ENV_DIR
DATA_DIR=$DATA_DIR
PORT=$PORT
PUBLIC_HOST='$PUBLIC_HOST'
API_KEY='$API_KEY'
FRANQ_USER='$FRANQ_USER'
FRANQ_PASS='$FRANQ_PASS'
PG_PASS='$PG_PASS'

mkdir -p "\$ENV_DIR" "\$REMOTE_DIR" "\$DATA_DIR"
umask 077
cat > "\$ENV_DIR/.env" <<ENV
NODE_ENV=production
HOST=127.0.0.1
PORT=\$PORT
API_KEY=\$API_KEY
FRANQUIA_ID=9
FRANQUIA_NOME=Campinas
EXTRACT_LIMIT=50
CONECTMAX_FRANQUEADO_USER=\$FRANQ_USER
CONECTMAX_FRANQUEADO_PASS=\$FRANQ_PASS
CONECTMAX_FRANQUEADO_CONFIG_DIR=\$DATA_DIR
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=connectmax
DB_PASSWORD=\$PG_PASS
DB_NAME=connectmax
ENV
chmod 600 "\$ENV_DIR/.env"
ln -sfn "\$ENV_DIR/.env" "\$REMOTE_DIR/.env"

cd "\$REMOTE_DIR"
npm install --omit=dev --cache /tmp/npm-cache-cma

cp /tmp/connect-max-api.service /etc/systemd/system/connect-max-api.service
cp /tmp/nginx-api-conectmax.conf /etc/nginx/sites-available/api-conectmax
ln -sfn /etc/nginx/sites-available/api-conectmax /etc/nginx/sites-enabled/api-conectmax

systemctl daemon-reload
systemctl enable connect-max-api
systemctl restart connect-max-api
nginx -t
systemctl reload nginx

if ! certbot certificates 2>/dev/null | grep -q "\$PUBLIC_HOST"; then
  certbot --nginx -d "\$PUBLIC_HOST" --non-interactive --agree-tos -m contato@conectmax.email --redirect || true
fi

sleep 1
curl -sS "http://127.0.0.1:\$PORT/health"
echo
systemctl is-active connect-max-api
REMOTE

echo "==> deploy ok → https://$PUBLIC_HOST"
