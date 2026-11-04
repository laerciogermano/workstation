#!/usr/bin/env bash
# Sobe o monorepo beta/ na Contabo (rolego.com.br).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${HOST:-144.126.154.90}"
REMOTE_SRC=/opt/rolego/beta
REMOTE_ENV_DIR=/srv/rolego/prod

if [[ -z "${SSHPASS:-}" ]]; then
  SSHPASS="$(python3 -c 'import re; t=open("'"$ROOT"'/../credenciais.md").read(); print(re.search(r"`root@144\.126\.154\.90`\s*—\s*`([^`]+)`", t).group(1))')"
  export SSHPASS
fi
RSH='sshpass -e ssh -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no'
SSH=(sshpass -e ssh -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no)

echo "==> rsync monorepo → $HOST:$REMOTE_SRC"
"${SSH[@]}" "root@$HOST" "mkdir -p $REMOTE_SRC $REMOTE_ENV_DIR"
sshpass -e rsync -az --delete \
  --exclude node_modules --exclude .turbo --exclude test-results \
  --exclude 'apps/*/dist' --exclude 'packages/*/dist' \
  --exclude '.git' --exclude 'e2e/test-results' \
  -e "$RSH" \
  "$ROOT/beta/" "root@$HOST:$REMOTE_SRC/"

echo "==> .env + build + up + seed"
"${SSH[@]}" "root@$HOST" bash -s <<REMOTE
set -euo pipefail
ENV=$REMOTE_ENV_DIR/.env
if [[ ! -f "\$ENV" ]]; then
  PG_PASS=\$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
  JWT_KEK=\$(openssl rand -base64 32)
  umask 077
  cat > "\$ENV" <<EOF
NODE_ENV=production
PORT=3000
APP_URL=https://rolego.com.br
POSTGRES_PASSWORD=\$PG_PASS
DATABASE_URL=postgres://rolego:\$PG_PASS@db:5432/rolego
JWT_ISSUER=rolego.com.br
JWT_AUDIENCE=rolego-api
JWT_KEK=\$JWT_KEK
ACCESS_TTL_S=600
REFRESH_TTL_D=30
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM="RoleGo <nao-responda@rolego.com.br>"
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GEOCODER=live
NOMINATIM_URL=https://nominatim.openstreetmap.org
NOMINATIM_UA="RoleGo/1.0 (contato@rolego.com.br)"
MEDIA_DIR=/media
WORKER_INLINE=false
LOG_LEVEL=info
EOF
  echo "criado \$ENV"
else
  echo "já existe \$ENV"
fi
POSTGRES_PASSWORD=\$(grep -E '^POSTGRES_PASSWORD=' "\$ENV" | cut -d= -f2-)
export POSTGRES_PASSWORD
cd $REMOTE_SRC
echo "==> docker compose build"
ENV_FILE=\$ENV docker compose -f infra/docker-compose.vps.yml build
echo "==> docker compose up"
ENV_FILE=\$ENV docker compose -f infra/docker-compose.vps.yml up -d
echo "==> aguardar health API"
for i in \$(seq 1 90); do
  if docker compose -f infra/docker-compose.vps.yml exec -T api node -e "fetch('http://127.0.0.1:3000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    echo "API ok (tentativa \$i)"
    break
  fi
  sleep 4
  if [[ \$i -eq 90 ]]; then
    echo "API não ficou healthy"
    docker compose -f infra/docker-compose.vps.yml ps
    docker compose -f infra/docker-compose.vps.yml logs --tail=120 api migrate
    exit 1
  fi
done
echo "==> seed (MEDIA_DIR em subdir — seed dá rm no path)"
ENV_FILE=\$ENV docker compose -f infra/docker-compose.vps.yml exec -T -e MEDIA_DIR=/media/seed api node dist/cli/seed.js
if [[ ! -d /opt/rolego/web-proto-bak ]]; then
  cp -a /opt/rolego/web /opt/rolego/web-proto-bak
  echo "backup protótipo → /opt/rolego/web-proto-bak"
fi
REMOTE

echo "==> nginx proxy → :8090"
sshpass -e rsync -az -e "$RSH" "$ROOT/deploy/nginx-rolego-app.conf" "root@$HOST:/tmp/nginx-rolego-app.conf"
"${SSH[@]}" "root@$HOST" bash -s <<'NGX'
set -euo pipefail
cp /tmp/nginx-rolego-app.conf /etc/nginx/sites-available/rolego
nginx -t
systemctl reload nginx
curl -sS -o /dev/null -w "local_web:%{http_code}\n" http://127.0.0.1:8090/
curl -sS -o /dev/null -w "local_health:%{http_code}\n" http://127.0.0.1:8090/api/v1/health
docker compose -f /opt/rolego/beta/infra/docker-compose.vps.yml ps
NGX

echo "==> smoke público"
curl -sS -o /dev/null -w "https:%{http_code}\n" -L https://rolego.com.br/
curl -sS https://rolego.com.br/api/v1/health; echo
echo "OK — https://rolego.com.br (seed: ana@rolego.dev / rolego2026)"
