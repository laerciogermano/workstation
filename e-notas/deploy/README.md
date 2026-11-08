# e-notas — Deploy Contabo

Convive com **conect tec** (HTTP `:80`) e **mailcow** (HTTPS `:443`).

| App | URL |
|-----|-----|
| VDS atual (2026-11-08) | `185.250.37.82` (`vmi3645369`) |
| Protótipo v2 (HTTP) | **http://185.250.37.82/** (Host `notinhas.shop`) · DNS ainda pode apontar ao legado |
| App lab | **http://185.250.37.82/enotas/** |
| Legado offline | `144.126.154.90` (`vmi3645318`) |

HTTP `http://…/enotas/` redireciona para HTTPS. Certificado em `:4173` é autoassinado (aceitar aviso no browser — necessário p/ câmera). Em `/enotas/` no `:443` usa o cert do mailcow (também pode avisar no IP).

| Item | Valor |
|------|--------|
| Código app | `/opt/e-notas` |
| Protótipo v2 | `/opt/notinhas-v2` (root do site `notinhas`) |
| Unit | `enotas.service` |
| Node | `127.0.0.1:4174` (`USE_HTTP=1`) |
| nginx domínio | `/etc/nginx/sites-available/notinhas` — `/` → v2; `/enotas/` → Node |
| DNS alvo | Hostinger: A `@` / `www` / `mail` → **`185.250.37.82`** (TTL 300) |
| DNS legado | A `@` → `144.126.154.90` (offline) |
| E-mail | 1 Mailcow (`/opt/mailcow-dockerized`); domínios `clozzy.com.br` + `notinhas.shop` + `conectmax.email` + `brsupply.email`; hostnames `mail.clozzy.com.br` + `mail.notinhas.shop` + `mail.conectmax.email` + `mail.brsupply.email` |

## Mailcow (clozzy + notinhas + conectmax no mesmo servidor)

Não dá para rodar **dois** stacks Mailcow no mesmo IP (portas 25/465/587/993). Um stack, N domínios e N hostnames.

| Item | Valor |
|------|--------|
| Path | `/opt/mailcow-dockerized` |
| `MAILCOW_HOSTNAME` | `mail.clozzy.com.br` |
| `ADDITIONAL_SAN` | `mail.notinhas.shop,mail.conectmax.email,mail.brsupply.email` |
| Domínios | `clozzy.com.br`, `notinhas.shop`, `conectmax.email`, `brsupply.email` |
| Web | https://mail.clozzy.com.br/ · https://mail.notinhas.shop/ · https://mail.conectmax.email/ · https://mail.brsupply.email/ |
| nginx host | [`nginx-mailcow.conf`](nginx-mailcow.conf) → `/etc/nginx/sites-available/mailcow` |
| Cert LE | `mail-clozzy-notinhas` (SAN: `mail.*`); copiado p/ `data/assets/ssl/` + hook renew |

**Antes → depois:** `mail.clozzy` + `mail.notinhas` → `mail.conectmax.email` + `mail.brsupply.email` (+ domínios/`contato@`).
**Rollback hostname brsupply/conectmax:** tirar o `mail.*` do nginx/`ADDITIONAL_SAN`; apagar domínio/mailbox no Mailcow; DNS A/MX do `mail` na Hostinger.

### Domínio `brsupply.email` (Mailcow Contabo 2026-11-03)

1. Mailcow: domínio + DKIM + `contato@brsupply.email`
2. `ADDITIONAL_SAN` + nginx vhost `mail.brsupply.email`
3. DNS Hostinger: A `mail` → `144.126.154.90`; MX `@` → `mail.brsupply.email`; TXT SPF/DKIM/DMARC
4. Após propagar A `mail`: expand LE com `-d mail.brsupply.email`

**Rollback:** apagar mailbox/domínio; remover DNS Hostinger; reverter nginx/`ADDITIONAL_SAN`.

### Domínio `conectmax.email` (Mailcow Contabo 2026-11-03)

1. Mailcow API: `add/domain` + DKIM + mailbox `contato@conectmax.email`
2. `ADDITIONAL_SAN=mail.notinhas.shop,mail.conectmax.email` + nginx vhost
3. DNS Hostinger (pendente se ainda sem A/MX):
   - A `mail` → `144.126.154.90`
   - MX `@` → `mail.conectmax.email` (prio 10)
   - TXT `@` → `v=spf1 mx a:mail.conectmax.email ip4:144.126.154.90 ~all`
   - TXT `dkim._domainkey` → valor DKIM (`GET /api/v1/get/dkim/conectmax.email`)
   - TXT `_dmarc` → `v=DMARC1; p=none; rua=mailto:contato@conectmax.email`
4. Após DNS A `mail`: expand LE `certbot certonly --nginx -d mail.clozzy.com.br -d mail.notinhas.shop -d mail.conectmax.email --cert-name mail-clozzy-notinhas` (ou emitir novo) + copiar p/ `data/assets/ssl/`

**Rollback mail conectmax:** apagar mailbox/domínio no Mailcow; remover MX/SPF/DKIM/DMARC/A `mail` na Hostinger; reverter nginx/`ADDITIONAL_SAN`.

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
