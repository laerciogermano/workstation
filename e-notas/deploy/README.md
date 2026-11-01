# e-notas — Deploy Contabo

Convive com **conect tec** (ConnectMax) no mesmo host.

| App | URL |
|-----|-----|
| conect tec | http://144.126.154.90/ |
| e-notas | http://144.126.154.90/enotas/ **ou** http://144.126.154.90:4173/ |

| Item | Valor |
|------|--------|
| Código | `/opt/e-notas` |
| Unit | `enotas.service` ([`enotas.service`](enotas.service)) |
| Node | `127.0.0.1:4174` (`USE_HTTP=1`) |
| nginx porta | [`nginx-enotas.conf`](nginx-enotas.conf) → `:4173` |
| nginx path | snippet em `connectmax` ([`nginx-enotas.snippet.conf`](nginx-enotas.snippet.conf)) → `/enotas/` |
| Alias | `/e-notas/` → `/enotas/` (evita cair no SPA do conect tec) |

## Publicar (do Mac)

```bash
export SSHPASS='…'   # root Contabo — credenciais.md
HOST=144.126.154.90
RSH='sshpass -e ssh -o StrictHostKeyChecking=no'
APP="$(pwd)/e-notas"

sshpass -e ssh -o StrictHostKeyChecking=no root@$HOST 'mkdir -p /opt/e-notas'
sshpass -e rsync -az --delete -e "$RSH" \
  --exclude node_modules --exclude certs --exclude .env \
  "$APP/app/" "root@$HOST:/opt/e-notas/"
sshpass -e scp -o StrictHostKeyChecking=no \
  "$APP/deploy/enotas.service" root@$HOST:/etc/systemd/system/enotas.service
sshpass -e scp -o StrictHostKeyChecking=no \
  "$APP/deploy/nginx-enotas.conf" root@$HOST:/etc/nginx/sites-available/enotas
sshpass -e ssh -o StrictHostKeyChecking=no root@$HOST '
  cd /opt/e-notas && npm install --omit=dev
  ln -sfn /etc/nginx/sites-available/enotas /etc/nginx/sites-enabled/enotas
  nginx -t && systemctl reload nginx
  systemctl daemon-reload && systemctl restart enotas
'
```

`.env` na VPS: `USE_HTTP=1` `HOST=127.0.0.1` `PORT=4174` + `DB_*`.

## Rollback

1. `systemctl disable --now enotas`
2. `rm /etc/nginx/sites-enabled/enotas`
3. Remover locations `/enotas` `/e-notas` de `connectmax`
4. `nginx -t && systemctl reload nginx`
5. Opcional: `rm -rf /opt/e-notas`

**Antes → depois:** só conect tec em `:80` → e-notas em `/enotas/` + `:4173`; conect tec permanece em `/`.
