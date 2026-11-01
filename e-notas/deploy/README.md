# e-notas — Deploy Contabo

App Node + front em **`http://144.126.154.90/enotas/`** (nginx → `127.0.0.1:4173`).

| Item | Valor |
|------|--------|
| Código | `/opt/e-notas` |
| Unit | `enotas.service` ([`enotas.service`](enotas.service)) |
| App | `USE_HTTP=1` `HOST=127.0.0.1` `PORT=4173` |
| nginx | locations `/enotas/` no site `connectmax` ([`nginx-enotas.snippet.conf`](nginx-enotas.snippet.conf)) |
| DB | `127.0.0.1` / schema `enotas` |

## Publicar (do Mac)

```bash
export SSHPASS='…'   # root Contabo — credenciais.md
HOST=144.126.154.90
RSH='sshpass -e ssh -o StrictHostKeyChecking=no'
APP="$(pwd)/e-notas"   # ou path absoluto do repo

sshpass -e ssh -o StrictHostKeyChecking=no root@$HOST 'mkdir -p /opt/e-notas'
sshpass -e rsync -az --delete -e "$RSH" \
  --exclude node_modules --exclude certs --exclude .env \
  "$APP/app/" "root@$HOST:/opt/e-notas/"
sshpass -e scp -o StrictHostKeyChecking=no \
  "$APP/deploy/enotas.service" root@$HOST:/etc/systemd/system/enotas.service
sshpass -e ssh -o StrictHostKeyChecking=no root@$HOST '
  cd /opt/e-notas && npm install --omit=dev
  systemctl daemon-reload && systemctl restart enotas
'
```

Primeira vez: criar `/opt/e-notas/.env` (`USE_HTTP=1`, `DB_*`) e inserir o snippet nginx se ainda não existir; `nginx -t && systemctl reload nginx`; `systemctl enable --now enotas`.

## Rollback

1. `systemctl disable --now enotas`
2. Remover `location /enotas` de `/etc/nginx/sites-available/connectmax` → `nginx -t && systemctl reload nginx`
3. Opcional: `rm -rf /opt/e-notas`

**Antes → depois:** só lab local HTTPS `:4173` → Contabo `/enotas/` + unit `enotas`. Lab local: sem `USE_HTTP` (HTTPS autoassinado).
