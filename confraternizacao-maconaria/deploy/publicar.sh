#!/usr/bin/env bash
# Publica o app em https://confraternizacao.laerciogermano.com/
# e o protótipo em https://confraternizacao.laerciogermano.com/prototipo/
# Uso: SSHPASS='senha Contabo 185' bash deploy/publicar.sh
set -euo pipefail
: "${SSHPASS:?defina SSHPASS com a senha do Contabo 185}"
HOST="${HOST:-185.250.37.82}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/app"
PROTO="$ROOT/prototipo"
REMOTE_APP=/opt/confraternizacao/app
REMOTE_PROTO=/opt/confraternizacao/prototipo
ENV_DIR=/srv/confraternizacao
PORT=3333
DB_PORT=5439
PUBLIC_HOST=confraternizacao.laerciogermano.com
RSH='sshpass -e ssh -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no'
export SSHPASS

echo "==> build local"
cd "$APP"
pnpm install --frozen-lockfile
pnpm build

echo "==> pastas remotas"
sshpass -e ssh -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  "root@$HOST" "mkdir -p $REMOTE_APP $REMOTE_PROTO $ENV_DIR /opt/confraternizacao"

echo "==> rsync protótipo → $REMOTE_PROTO"
sshpass -e rsync -az --delete \
  --exclude '.DS_Store' \
  -e "$RSH" \
  "$PROTO/" "root@$HOST:$REMOTE_PROTO/"

echo "==> rsync app → $REMOTE_APP"
sshpass -e rsync -az --delete \
  --exclude node_modules \
  --exclude .env \
  --exclude '**/node_modules' \
  -e "$RSH" \
  "$APP/" "root@$HOST:$REMOTE_APP/"

sshpass -e rsync -az -e "$RSH" \
  "$ROOT/deploy/nginx-confraternizacao.conf" \
  "$ROOT/deploy/confraternizacao.service" \
  "root@$HOST:/tmp/"

echo "==> remoto: postgres18 + env + install + migrate/seed + nginx + service"
sshpass -e ssh -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  "root@$HOST" bash -s <<REMOTE
set -euo pipefail
REMOTE_APP=$REMOTE_APP
REMOTE_PROTO=$REMOTE_PROTO
ENV_DIR=$ENV_DIR
PORT=$PORT
DB_PORT=$DB_PORT
PUBLIC_HOST='$PUBLIC_HOST'

umask 077
ENV=\$ENV_DIR/.env
if [[ ! -f "\$ENV" ]]; then
  DB_PASS=\$(openssl rand -hex 16)
  JWT=\$(openssl rand -hex 32)
  ENC=\$(openssl rand -hex 32)
  cat > "\$ENV" <<EOF
NODE_ENV=production
DB_PASSWORD=\${DB_PASS}
DATABASE_URL=postgres://confrat:\${DB_PASS}@127.0.0.1:\${DB_PORT}/confrat
JWT_SECRET=\${JWT}
ENCRYPTION_KEY=\${ENC}
PORT=\${PORT}
APP_ORIGIN=https://\${PUBLIC_HOST}
DEFAULT_EVENT_SLUG=125-anos
DEV_TOOLS=true
ALLOW_SEED=true
SEED_PASSWORD=Confrat@125
EOF
  echo "criado \$ENV"
else
  # migra URL antiga (Postgres 17 compartilhado) para o container PG 18 em :5439
  if grep -q '@127.0.0.1:5432/confrat' "\$ENV"; then
    sed -i 's/@127.0.0.1:5432\\/confrat/@127.0.0.1:'"\$DB_PORT"'\\/confrat/' "\$ENV"
  fi
  grep -q '^DEV_TOOLS=' "\$ENV" || echo 'DEV_TOOLS=true' >> "\$ENV"
  grep -q '^ALLOW_SEED=' "\$ENV" || echo 'ALLOW_SEED=true' >> "\$ENV"
  grep -q '^SEED_PASSWORD=' "\$ENV" || echo 'SEED_PASSWORD=Confrat@125' >> "\$ENV"
  grep -q '^APP_ORIGIN=' "\$ENV" || echo "APP_ORIGIN=https://\$PUBLIC_HOST" >> "\$ENV"
  grep -q '^DB_PASSWORD=' "\$ENV" || true
  echo "já existe \$ENV"
fi
chmod 600 "\$ENV"
ln -sfn "\$ENV" "\$REMOTE_APP/.env"

# Postgres 18 (uuidv7) — compose do app
cd "\$REMOTE_APP"
docker compose --env-file "\$ENV" up -d --wait db

corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install --frozen-lockfile

pnpm --filter api db:migrate
ALLOW_SEED=true pnpm --filter api db:seed

cp /tmp/confraternizacao.service /etc/systemd/system/confraternizacao.service
cp /tmp/nginx-confraternizacao.conf /etc/nginx/sites-available/confraternizacao
ln -sfn /etc/nginx/sites-available/confraternizacao /etc/nginx/sites-enabled/confraternizacao
chown -R www-data:www-data /opt/confraternizacao/prototipo

systemctl daemon-reload
systemctl enable confraternizacao
systemctl restart confraternizacao
nginx -t
systemctl reload nginx

sleep 2
systemctl is-active confraternizacao
curl -sS -o /dev/null -w "local_app:%{http_code}\\n" http://127.0.0.1:\$PORT/
curl -sS http://127.0.0.1:\$PORT/api/auth/config; echo
REMOTE

echo "==> smoke público"
curl -sS -o /dev/null -w "app:%{http_code}\n" "https://$PUBLIC_HOST/"
curl -sS "https://$PUBLIC_HOST/api/auth/config"; echo
curl -sS -o /dev/null -w "proto:%{http_code}\n" "https://$PUBLIC_HOST/prototipo/"
curl -sS -o /dev/null -w "proto_v3:%{http_code}\n" "https://$PUBLIC_HOST/prototipo/v3/" || true
echo "OK — https://$PUBLIC_HOST/ · protótipo https://$PUBLIC_HOST/prototipo/"
echo "Contas demo: senha Confrat@125 (Paulo com MFA — código na tela)"
