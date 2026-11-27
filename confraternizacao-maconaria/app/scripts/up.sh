#!/usr/bin/env bash
# Sobe tudo para ver o sistema em http://localhost:3333
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -f .env ]; then
  pw=$(openssl rand -hex 16)
  sed -e "s/troque-por-32-bytes-aleatorios-no-minimo/$(openssl rand -hex 32)/" \
      -e "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$(openssl rand -hex 32)/" \
      -e "s/troque/$pw/g" .env.example > .env
fi
docker info >/dev/null 2>&1 || { command -v colima >/dev/null && colima start; }
docker compose up -d --wait db
pnpm install
pnpm build
pnpm --filter api db:migrate
pnpm --filter api db:seed
exec pnpm start
