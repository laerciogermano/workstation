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
| E-mail | 1 Mailcow (`/opt/mailcow-dockerized`); domínios `clozzy.com.br` + `notinhas.shop`; hostnames `mail.clozzy.com.br` + `mail.notinhas.shop` |

## Mailcow (clozzy + notinhas no mesmo servidor)

Não dá para rodar **dois** stacks Mailcow no mesmo IP (portas 25/465/587/993). Um stack, dois domínios e dois hostnames.

| Item | Valor |
|------|--------|
| Path | `/opt/mailcow-dockerized` |
| `MAILCOW_HOSTNAME` | `mail.clozzy.com.br` |
| `ADDITIONAL_SAN` | `mail.notinhas.shop` |
| Domínios | `clozzy.com.br`, `notinhas.shop` |
| Web | https://mail.clozzy.com.br/ · https://mail.notinhas.shop/ |
| nginx host | [`nginx-mailcow.conf`](nginx-mailcow.conf) → `/etc/nginx/sites-available/mailcow` |
| Cert LE | `mail-clozzy-notinhas` (SAN: ambos os `mail.*`); copiado p/ `data/assets/ssl/` + hook renew |

**Antes → depois:** só `mail.clozzy.com.br` → também `mail.notinhas.shop` (nginx + LE + `ADDITIONAL_SAN`) com os dois domínios ativos.
**Rollback hostname notinhas:** tirar `mail.notinhas.shop` do nginx/`ADDITIONAL_SAN`; apagar cert `mail-clozzy-notinhas` se quiser; DNS A/MX do `mail` notinhas.

## Domínio `notinhas.shop`

1. DNS no hPanel Hostinger (zona do domínio): A `@` = Contabo `144.126.154.90`
2. Site nginx: `sites-available/notinhas` (proxy para `:4174`) + `sites-enabled`
3. **HTTPS (Let's Encrypt / Certbot)** — mesmo padrão do RoleGo (nginx na Contabo já usa `:443` com mailcow/rolego; Caddy/Traefik brigariam pela porta).
4. **Mail** — domínio + DKIM no Mailcow; DNS Hostinger:
   - A `mail` → `144.126.154.90`
   - MX `@` → `mail.notinhas.shop` (prio 10)
   - TXT `@` → `v=spf1 mx a:mail.notinhas.shop ip4:144.126.154.90 ~all`
   - TXT `dkim._domainkey` → valor DKIM do Mailcow (`GET /api/v1/get/dkim/notinhas.shop`)
   - TXT `_dmarc` → `v=DMARC1; p=none; rua=mailto:contato@notinhas.shop`
   - Webmail: https://mail.notinhas.shop/SOGo/

**Antes → depois (mail domínio):** sem e-mail → domínio `notinhas.shop` + `contato@` + MX/SPF/DKIM/DMARC.
**Rollback mail domínio:** apagar mailbox/domínio no Mailcow; remover MX/SPF/DKIM/DMARC na Hostinger.

Enquanto o registro `.shop` ainda der **NXDOMAIN** nos resolvers públicos, o ACME falha. Quando `dig +short A notinhas.shop @1.1.1.1` = `144.126.154.90`:

```bash
# one-shot
ssh root@144.126.154.90 'certbot --nginx -d notinhas.shop -d www.notinhas.shop --non-interactive --agree-tos -m laerciogermanoo@gmail.com --redirect'

# ou waiter (já em /opt/e-notas/deploy/):
ssh root@144.126.154.90 'bash /opt/e-notas/deploy/issue-ssl-notinhas.sh'
# log: /var/log/issue-ssl-notinhas.log
```

Script canônico: [`issue-ssl-notinhas.sh`](issue-ssl-notinhas.sh).

**Antes → depois (domínio):** só `/enotas/` no IP → também `notinhas.shop` (HTTP) apontando ao mesmo Node; HTTPS via Certbot no site `notinhas`.

**Rollback domínio:** `rm /etc/nginx/sites-enabled/notinhas` + `nginx -t && systemctl reload nginx`; DNS A `@` voltar a `2.57.91.91` (parking Hostinger) se quiser. SSL: `certbot delete --cert-name notinhas.shop`.

## Rollback

1. `systemctl disable --now enotas`
2. Remover locations `/enotas` do mailcow + connectmax; `rm` site `enotas` e `notinhas`
3. `nginx -t && systemctl reload nginx`
4. Opcional: `rm -rf /opt/e-notas`

**Antes → depois:** e-notas só HTTP → HTTPS em `/enotas/` (`:443`) e `:4173`; conect tec permanece em `http://IP/`.
