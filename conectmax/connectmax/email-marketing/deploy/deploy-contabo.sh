#!/usr/bin/env bash
# Publica email-marketing em https://marketing.conectmax.email (Contabo).
# Uso: HOST=185.250.37.82 SSHPASS='…' ./deploy/deploy-contabo.sh
set -euo pipefail

HOST="${HOST:-185.250.37.82}"
REMOTE_DIR=/opt/email-marketing
ENV_DIR=/srv/email-marketing
PORT="${PORT:-4000}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RSH="sshpass -e ssh -o StrictHostKeyChecking=no"

: "${SSHPASS:?defina SSHPASS (senha root Contabo)}"

echo "==> rsync → root@$HOST:$REMOTE_DIR"
sshpass -e rsync -az --delete \
  --exclude node_modules --exclude '**/node_modules' \
  --exclude dist --exclude '**/dist' \
  --exclude .env --exclude '**/.env' \
  --exclude coverage \
  -e "$RSH" \
  "$ROOT/" "root@$HOST:$REMOTE_DIR/"

sshpass -e rsync -az -e "$RSH" \
  "$ROOT/deploy/nginx-marketing-conectmax.conf" \
  "$ROOT/deploy/email-marketing-api.service" \
  "$ROOT/deploy/email-marketing-worker.service" \
  "root@$HOST:/tmp/"

OP_PASS="${OP_PASS:-}"
MARKETING_SMTP_PASS="${MARKETING_SMTP_PASS:-mJ9wbQmfm3oSBYoLfjQG}"

sshpass -e ssh -o StrictHostKeyChecking=no "root@$HOST" bash -s <<REMOTE
set -euo pipefail
REMOTE_DIR=$REMOTE_DIR
ENV_DIR=$ENV_DIR
PORT=$PORT
OP_PASS='$OP_PASS'
MARKETING_SMTP_PASS='$MARKETING_SMTP_PASS'
PG_PASS='jL592CN6B0F801pKkgV9fkR2WOpxv8'

mkdir -p "\$ENV_DIR" "\$REMOTE_DIR"
if [[ ! -f "\$ENV_DIR/.env" ]]; then
  umask 077
  cat > "\$ENV_DIR/.env" <<ENV
NODE_ENV=production
PORT=\$PORT
DATABASE_URL=postgres://connectmax:\${PG_PASS}@127.0.0.1:5432/email_marketing
PUBLIC_BASE_URL=https://marketing.conectmax.email
WEB_ORIGIN=https://marketing.conectmax.email
SMTP_HOST=mail.conectmax.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=marketing@conectmax.email
SMTP_PASS=\${MARKETING_SMTP_PASS}
SMTP_TLS_REJECT_UNAUTHORIZED=false
MAIL_FROM="Connect <marketing@conectmax.email>"
SEND_RATE_PER_SECOND=5
SEND_MAX_ATTEMPTS=3
LOG_LEVEL=info
ENV
  echo "criou \$ENV_DIR/.env"
else
  echo "mantém \$ENV_DIR/.env existente"
fi
ln -sfn "\$ENV_DIR/.env" "\$REMOTE_DIR/api/.env"

cd "\$REMOTE_DIR"
npm install --omit=dev
# build precisa de typescript/vite (devDeps dos workspaces)
npm install
npm run build
# migrate usa tsx + .env
npm run migrate

if [[ -n "\$OP_PASS" ]]; then
  npm run seed:operator -- operador@connect.local "\$OP_PASS"
fi

cp /tmp/nginx-marketing-conectmax.conf /etc/nginx/sites-available/marketing-conectmax
ln -sfn /etc/nginx/sites-available/marketing-conectmax /etc/nginx/sites-enabled/marketing-conectmax
cp /tmp/email-marketing-api.service /etc/systemd/system/email-marketing-api.service
cp /tmp/email-marketing-worker.service /etc/systemd/system/email-marketing-worker.service
systemctl daemon-reload
systemctl enable --now email-marketing-api email-marketing-worker
systemctl restart email-marketing-api email-marketing-worker

nginx -t
systemctl reload nginx

# LE se DNS já apontar
if dig +short marketing.conectmax.email A | grep -q 185.250.37.82; then
  certbot --nginx -d marketing.conectmax.email --non-interactive --agree-tos -m laerciogermanoo@gmail.com --redirect || true
fi

sleep 1
curl -sS -o /dev/null -w "local:%{http_code}\\n" "http://127.0.0.1:\$PORT/health/live" || true
systemctl --no-pager --full status email-marketing-api email-marketing-worker | sed -n '1,40p'
REMOTE

echo "OK — https://marketing.conectmax.email"
