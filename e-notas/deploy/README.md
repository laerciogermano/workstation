# e-notas — Deploy Contabo

Convive com **conect tec** (HTTP `:80`) e **mailcow** (HTTPS `:443`).

| App | URL |
|-----|-----|
| conect tec | http://144.126.154.90/ |
| e-notas (domínio) | **http://notinhas.shop/** (HTTPS após Certbot) |
| e-notas (HTTPS path) | **https://144.126.154.90/enotas/** |
| e-notas (HTTPS porta) | **https://144.126.154.90:4173/** |

HTTP `http://…/enotas/` redireciona para HTTPS. Certificado em `:4173` é autoassinado (aceitar aviso no browser — necessário p/ câmera). Em `/enotas/` no `:443` usa o cert do mailcow (também pode avisar no IP).

| Item | Valor |
|------|--------|
| Código | `/opt/e-notas` |
| Unit | `enotas.service` |
| Node | `127.0.0.1:4174` (`USE_HTTP=1`) |
| nginx `:4173` SSL | [`nginx-enotas.conf`](nginx-enotas.conf) |
| nginx `:443` path | snippet no mailcow ([`nginx-enotas.snippet.conf`](nginx-enotas.snippet.conf)) |
| nginx domínio | [`nginx-notinhas.conf`](nginx-notinhas.conf) → `/etc/nginx/sites-available/notinhas` |
| Certs `:4173` | `/opt/e-notas/certs/` |
| DNS | Hostinger: A `@` → `144.126.154.90` (TTL 300); CNAME `www` → `notinhas.shop` |

## Domínio `notinhas.shop`

1. DNS no hPanel Hostinger (zona do domínio): A `@` = Contabo `144.126.154.90`
2. Site nginx: `sites-available/notinhas` (proxy para `:4174`) + `sites-enabled`
3. Após DNS público propagar (hoje NS Hostinger já responde o A; LE pode ver NXDOMAIN até o registro `.shop` propagar):

```bash
export SSHPASS='…'   # root Contabo
HOST=144.126.154.90
sshpass -e ssh root@$HOST 'certbot --nginx -d notinhas.shop -d www.notinhas.shop --non-interactive --agree-tos -m laerciogermanoo@gmail.com --redirect'
```

**Antes → depois (domínio):** só `/enotas/` no IP → também `notinhas.shop` (HTTP) apontando ao mesmo Node; HTTPS via Certbot no site `notinhas`.

**Rollback domínio:** `rm /etc/nginx/sites-enabled/notinhas` + `nginx -t && systemctl reload nginx`; DNS A `@` voltar a `2.57.91.91` (parking Hostinger) se quiser.

## Rollback

1. `systemctl disable --now enotas`
2. Remover locations `/enotas` do mailcow + connectmax; `rm` site `enotas` e `notinhas`
3. `nginx -t && systemctl reload nginx`
4. Opcional: `rm -rf /opt/e-notas`

**Antes → depois:** e-notas só HTTP → HTTPS em `/enotas/` (`:443`) e `:4173`; conect tec permanece em `http://IP/`.
