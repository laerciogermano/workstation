# e-notas — Deploy Contabo

Convive com **conect tec** (HTTP `:80`) e **mailcow** (HTTPS `:443`).

| App | URL |
|-----|-----|
| VDS atual (2026-11-08) | `185.250.37.82` (`vmi3645369`) |
| **Beta (atual)** | **https://notinhas.shop/** · **https://www.notinhas.shop/** — SPA + `/api/` ([`notinhas-beta/deploy/`](../notinhas-beta/deploy/README.md)) |
| App lab | **https://notinhas.shop/enotas/** (proxy → `:4175`) |
| Protótipo v2 (arquivo) | `/opt/notinhas-v2` (não é mais o `root` do nginx) |
| Legado offline | `144.126.154.90` (`vmi3645318`) |

| Item | Valor |
|------|--------|
| Código Beta | `/opt/notinhas-beta` · unit `notinhas-api` · Node `127.0.0.1:4174` · schema `notinhas` |
| Código lab | `/opt/e-notas` · unit `enotas.service` · Node `127.0.0.1:4175` (`USE_HTTP=1`) |
| Protótipo v2 | `/opt/notinhas-v2` ← sync de `beta-docs/prototipos/v2/` (rollback do root) |
| nginx domínio | `/etc/nginx/sites-available/notinhas` — `/` → Beta dist; `/api/` → `:4174`; `/enotas/` → `:4175`; `:443` Certbot |
| Cert LE | `/etc/letsencrypt/live/notinhas.shop/` · renew via `certbot.timer` |
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

### Domínio `brsupply.email` (Mailcow Contabo)

**Atual (2026-11-09):** Mailcow reinstalado em `185.250.37.82` (`MAILCOW_HOSTNAME=mail.brsupply.email`, HTTP `8080` / HTTPS `8443`; nginx host faz proxy `:443` → `8443`). DNS Hostinger: A `mail` → **`185.250.37.82`**; MX `@` → `mail.brsupply.email`; SPF `ip4:185.250.37.82`; DKIM do Mailcow novo; LE `mail.brsupply.email`.

**Antes (2026-11-03 / legado):** stack em `144.126.154.90` (offline) + A `mail`/`ip4` no SPF apontando para `144…`.

1. Mailcow: domínio + DKIM + mailbox (ex. `benchmarking@` / `contato@`)
2. nginx host: site `mail-brsupply` (proxy TLS)
3. DNS Hostinger: A `mail` → `185.250.37.82`; MX/SPF/DKIM/DMARC
4. `certbot certonly --webroot -w /var/www/html -d mail.brsupply.email`

**Rollback:** A `mail` + SPF → `144.126.154.90` (só se o host legado voltar); `docker compose down` em `/opt/mailcow-dockerized`; `rm` site nginx `mail-brsupply`.

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

1. DNS Hostinger: A `@` / `www` / `mail` → Contabo **`185.250.37.82`**
2. Site nginx: `sites-available/notinhas` — `root /opt/notinhas-beta/apps/web/dist`; `/api/` → `:4174`; `/enotas/` → `:4175`
3. **HTTPS (feito 2026-11-08):** Certbot LE `notinhas.shop` + `www`; HTTP→HTTPS; renew `certbot.timer`
4. **Beta no ar (2026-11-09):** ver [`../notinhas-beta/deploy/README.md`](../notinhas-beta/deploy/README.md)
5. **Mail** — domínio + DKIM no Mailcow (legado `144…` ou reapontar); DNS:
   - A `mail` → `185.250.37.82` (web) — MX/SPF do mail ainda podem apontar ao host Mailcow ativo
   - MX `@` → `mail.notinhas.shop` (prio 10)
   - TXT `@` → `v=spf1 mx a:mail.notinhas.shop ip4:185.250.37.82 ~all` (ajustar se Mailcow permanecer no IP legado)
   - TXT `dkim._domainkey` / `_dmarc` conforme Mailcow
   - Webmail: https://mail.notinhas.shop/SOGo/

### Deploy / refresh do protótipo v2 (só arquivos; não é o root atual)

```bash
# local → Contabo
rsync -az --delete e-notas/beta-docs/prototipos/v2/ root@185.250.37.82:/opt/notinhas-v2/
ssh root@185.250.37.82 'chown -R www-data:www-data /opt/notinhas-v2'
```

### Emitir / renovar SSL (VDS atual)

```bash
ssh root@185.250.37.82 'certbot --nginx -d notinhas.shop -d www.notinhas.shop --non-interactive --agree-tos -m laerciogermanoo@gmail.com --redirect'
# dry-renew: certbot renew --dry-run
```

Script legado (IP antigo): [`issue-ssl-notinhas.sh`](issue-ssl-notinhas.sh).

**Antes → depois (domínio):** root v2 → root Beta (`/opt/notinhas-beta`); lab `:4174`→`:4175` em `/enotas/`.
**Rollback domínio / Beta:** ver [`../notinhas-beta/deploy/README.md`](../notinhas-beta/deploy/README.md). SSL: `certbot delete --cert-name notinhas.shop` (só se for tirar o domínio).

## Rollback

1. `systemctl disable --now enotas`
2. Remover locations `/enotas` do mailcow + connectmax; `rm` site `enotas` e `notinhas`
3. `nginx -t && systemctl reload nginx`
4. Opcional: `rm -rf /opt/e-notas`

**Antes → depois:** e-notas só HTTP → HTTPS em `/enotas/` (`:443`) e `:4173`; conect tec permanece em `http://IP/`.
