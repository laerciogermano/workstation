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
| E-mail | Mailcow domínio `notinhas.shop`; caixa `contato@notinhas.shop` (senha em `credenciais.md`) |

## Domínio `notinhas.shop`

1. DNS no hPanel Hostinger (zona do domínio): A `@` = Contabo `144.126.154.90`
2. Site nginx: `sites-available/notinhas` (proxy para `:4174`) + `sites-enabled`
3. **HTTPS (Let's Encrypt / Certbot)** — mesmo padrão do RoleGo (nginx na Contabo já usa `:443` com mailcow/rolego; Caddy/Traefik brigariam pela porta).
4. **Mail (Mailcow)** — domínio + DKIM no Mailcow da Contabo; DNS Hostinger sob `notinhas.shop`:
   - A `mail` → `144.126.154.90`
   - MX `@` → `mail.notinhas.shop` (prio 10)
   - TXT `@` → `v=spf1 mx a:mail.notinhas.shop ip4:144.126.154.90 ~all`
   - TXT `dkim._domainkey` → valor DKIM do Mailcow (`GET /api/v1/get/dkim/notinhas.shop`)
   - TXT `_dmarc` → `v=DMARC1; p=none; rua=mailto:contato@notinhas.shop`
   - Webmail/admin ainda em https://mail.clozzy.com.br/ (mesmo stack); MX/SPF usam `mail.notinhas.shop`

**Antes → depois (mail):** sem e-mail no domínio → Mailcow `notinhas.shop` + `contato@` + MX/SPF/DKIM/DMARC na Hostinger.
**Rollback mail:** apagar mailbox/domínio no Mailcow admin; remover MX/SPF/DKIM/DMARC na zona Hostinger.

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
