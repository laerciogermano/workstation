# Deploy Contabo — notinhas.shop Beta

**URL:** https://notinhas.shop/ · https://www.notinhas.shop/  
**Host:** Contabo `185.250.37.82` · código `/opt/notinhas-beta` · unit `notinhas-api` · Node `127.0.0.1:4174`  
**nginx:** `sites-available/notinhas` — `/` → `apps/web/dist`; `/api/` → API; `/enotas/` → lab `:4175`  
**Postgres:** schema `notinhas` no Docker `postgres-db-1` (`connectmax`)  
**Cert LE:** `/etc/letsencrypt/live/notinhas.shop/` (já emitido)

## Antes → depois

| | Antes | Depois |
|---|---|---|
| `/` | protótipo v2 `/opt/notinhas-v2` | SPA Beta `/opt/notinhas-beta/apps/web/dist` |
| API | lab `enotas.service` `:4174` em `/enotas/` | `notinhas-api` `:4174` em `/api/` |
| Lab | `:4174` | `:4175` em `/enotas/` (legado) |

## Republicar

```bash
export SSHPASS='…'   # Contabo 185 (credenciais.md)
SRC=/Users/laerciogermano/Documents/works/e-notas/notinhas-beta
sshpass -e rsync -az --delete \
  --exclude node_modules --exclude .git --exclude .env --exclude '**/node_modules' \
  -e 'ssh -o StrictHostKeyChecking=no' \
  "$SRC/" root@185.250.37.82:/opt/notinhas-beta/

sshpass -e ssh -o StrictHostKeyChecking=no root@185.250.37.82 '
  cd /opt/notinhas-beta && npm ci && npm run build && npm run db:migrate
  chown -R notinhas:notinhas /opt/notinhas-beta
  chown root:notinhas /opt/notinhas-beta/.env && chmod 640 /opt/notinhas-beta/.env
  systemctl restart notinhas-api
  nginx -t && systemctl reload nginx
'
```

Arquivos de referência: [`nginx.conf`](nginx.conf) · [`notinhas-api.service`](notinhas-api.service).

## Rollback

1. Restaurar nginx: `root /opt/notinhas-v2`; `/enotas/` → `:4174` (ou backup `notinhas.bak.*`)
2. `systemctl disable --now notinhas-api`
3. Em `/opt/e-notas/.env`: `PORT=4174` + `systemctl restart enotas`
4. Opcional: `DROP SCHEMA notinhas CASCADE` (só com confirmação) · `rm -rf /opt/notinhas-beta`
