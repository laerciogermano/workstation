# RoleGo — Deploy (Contabo)

VPS app atual: **`185.250.37.82`** (`vmi3645369`) · DNS A `rolego.com.br` / `www` / `mail` → Contabo · HTTPS Certbot.  
Legado offline: `144.126.154.90`.

## Beta monorepo (`rolego.com.br`) — atual

Stack Docker (`api` + `worker` + PostGIS + `web` + Mailpit) a partir de [`../beta/`](../beta/README.md).

| Item | Valor |
|------|--------|
| Código na VPS | `/opt/rolego/beta` |
| Env / segredos | `/srv/rolego/prod/.env` (não versionado) |
| Compose | [`../beta/infra/docker-compose.vps.yml`](../beta/infra/docker-compose.vps.yml) |
| Web (container) | `127.0.0.1:8090` (8080 = Mailcow) |
| nginx host | proxy → `:8090` · canônico [`nginx-rolego-app.conf`](nginx-rolego-app.conf) (HTTP até LE) |
| SMTP | Mailcow Contabo `mail.brsupply.email:587` · `nao-responda@rolego.com.br` (creds em `credenciais.md`) |
| Mailpit UI | `127.0.0.1:8025` (só localhost; legado — prod não usa mais) |
| Seed | `ana@rolego.dev` / `rolego2026` (e demais contas do README do beta) |
| Backup protótipo HTML | `/opt/rolego/web-proto-bak` |
| Backup SPA E01 Vite | `/opt/rolego/web-e01-vite-bak` |
| Em breve | `/opt/rolego/embreve` |

**Antes → depois (2026-11-04):** protótipo HTML estático em `/opt/rolego/web` → PWA + API Docker (proxy nginx `:8090`).

**Antes → depois (híbrido visitante):** `/` e `/explorar` exigiam login + tab bar sempre → home abre Explorar **sem cadastro**; tab bar só logado; `GET /discovery/*` `@Public`. Rollback: reverter commit `709bc9ab` (ou repor `RequireAuth` em `/explorar` + discovery autenticado).

**Antes → depois (SMTP):** `SMTP_HOST=mailpit:1025` (só captura local) → Mailcow real `mail.clozzy.com.br:587` + domínio/mailbox `rolego.com.br` / `nao-responda@`. Rollback: restaurar backup `/srv/rolego/prod/.env.bak-smtp-*` e `compose up -d --force-recreate api worker web`.

### DNS Hostinger (`rolego.com.br`) — web + e-mail

Alvo Contabo **`185.250.37.82`** (perfil Chrome Germano `:9230`). Mailcow já tem domínio + DKIM + caixas `germano@` / `jaime.richards@` / `nao-responda@`.

| Tipo | Nome | Valor |
|------|------|--------|
| A | `@` | `185.250.37.82` |
| A | `www` | `185.250.37.82` |
| A | `mail` | `185.250.37.82` |
| MX | `@` | `mail.rolego.com.br` (prio 10) |
| TXT | `@` | `v=spf1 mx a:mail.rolego.com.br ip4:185.250.37.82 ~all` |
| TXT | `dkim._domainkey` | DKIM Mailcow (`GET /api/v1/get/dkim/rolego.com.br` no host) |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:nao-responda@rolego.com.br` |

**Antes → depois (2026-11-10):** A/`www` apontavam para VPS morta `144…` → Contabo `185…` + Mailcow local + SMTP real.  
**Rollback DNS:** A/`www`/`mail` + SPF de volta para `144…` (só se o host legado voltar). Rollback Mailcow: apagar domínio/mailboxes `rolego.com.br` na API.  
Após DNS propagar: `certbot --nginx -d rolego.com.br -d www.rolego.com.br` e `certbot --nginx -d mail.rolego.com.br`.

Deploy: `HOST=185.250.37.82 SSHPASS='…' ./role-go/deploy/deploy-beta-vps.sh` (senha em `credenciais.md` § `root@185…`).

### PWA / viewport (app instalável)

- Manifest: `/manifest.webmanifest` · ícones em `/icon-192.png`, `/icon-512.png`, `/icon-maskable-512.png`, `/apple-touch-icon.png`
- Viewport: `maximum-scale=1, user-scalable=no, viewport-fit=cover` + metas `apple-mobile-web-app-*` (standalone, status bar translúcida)
- Inputs em **16px** (evita zoom do iOS ao focar)
- Instalar: Safari “Adicionar à Tela de Início” / Chrome “Instalar app”

**Antes → depois:** viewport só `initial-scale=1` (zoom livre) + apple-touch 192 → viewport travado + ícone 180 + maskable com safe zone. Rollback: reverter `apps/web/index.html`, `global.css`, `vite.config.ts` e `public/apple-touch-icon.png` / `icon-maskable-512.png`.

### Subir / atualizar

```bash
# senha root Contabo em credenciais.md (§ root@144…)
./role-go/deploy/deploy-beta-vps.sh
```

O script: rsync do monorepo → build das imagens → `compose up` → migrate → seed → nginx proxy → smoke HTTPS.

Re-seed manual (MEDIA_DIR em subpasta — o seed dá `rm` no path; **depois promover** para `/media`, senão capas 404):

```bash
ssh root@144.126.154.90 'cd /opt/rolego/beta && \
  ENV_FILE=/srv/rolego/prod/.env docker compose -f infra/docker-compose.vps.yml \
  exec -T -e MEDIA_DIR=/media/seed api node dist/cli/seed.js && \
  ENV_FILE=/srv/rolego/prod/.env docker compose -f infra/docker-compose.vps.yml \
  exec -T -u root api sh -c "for d in cover avatar gallery; do mkdir -p /media/\$d; cp -a /media/seed/\$d/. /media/\$d/; done; chown -R node:node /media/cover /media/avatar /media/gallery"'
```

**Antes → depois (bug fotos 2026-11-04):** seed gravava em `/media/seed/{cover,avatar,gallery}` e a API/nginx serviam `/media/{cover,…}` → 404. Deploy e re-seed agora promovem os arquivos para a raiz do volume. Rollback do conteúdo: apagar `/media/{cover,avatar,gallery}` no volume (as URLs voltam a 404 até novo seed+promote).

### Rollback

1. **Protótipo HTML:** restaurar nginx static `root /opt/rolego/web-proto-bak;` (ou copiar de volta para `/opt/rolego/web`) + `nginx -t && systemctl reload nginx`; opcional `docker compose -f /opt/rolego/beta/infra/docker-compose.vps.yml down`
2. **SPA E01 Vite:** `rsync -a --delete /opt/rolego/web-e01-vite-bak/ /opt/rolego/web/` + root static no nginx
3. **Em breve:** `root /opt/rolego/embreve;`
4. Parar só o stack: `cd /opt/rolego/beta && ENV_FILE=/srv/rolego/prod/.env docker compose -f infra/docker-compose.vps.yml down`

## Protótipo Beta HTML (legado)

Galeria em [`../beta-docs/prototipos/index.html`](../beta-docs/prototipos/index.html). Backup em `/opt/rolego/web-proto-bak`.

```bash
export SSHPASS='…'
HOST=144.126.154.90
RSH='sshpass -e ssh -o StrictHostKeyChecking=no'
STAGING=/tmp/rolego-proto-deploy
rm -rf "$STAGING" && mkdir -p "$STAGING"
cp role-go/beta-docs/prototipos/index.html "$STAGING/index.html"
sshpass -e rsync -az --delete -e "$RSH" "$STAGING/" "root@$HOST:/opt/rolego/web/"
# apontar nginx de volta para root /opt/rolego/web (ver Rollback)
```

## SPA E01 Vite (legado)

```bash
cd role-go/web && npm install --cache /tmp/npm-cache-rolego && npm run build && cd ../..
export SSHPASS='…'
HOST=144.126.154.90
RSH='sshpass -e ssh -o StrictHostKeyChecking=no'
sshpass -e rsync -az --delete -e "$RSH" role-go/web/dist/ "root@$HOST:/opt/rolego/web/"
```

## Em breve (primeira instalação)

```bash
export SSHPASS='…'
HOST=144.126.154.90
RSH='sshpass -e ssh -o StrictHostKeyChecking=no'
sshpass -e ssh -o StrictHostKeyChecking=no root@$HOST 'mkdir -p /opt/rolego/embreve'
sshpass -e rsync -az -e "$RSH" role-go/deploy/embreve/ "root@$HOST:/opt/rolego/embreve/"
```

## HTTPS (após DNS)

```bash
sshpass -e ssh root@$HOST 'certbot --nginx -d rolego.com.br -d www.rolego.com.br --non-interactive --agree-tos -m admin@rolego.com.br --redirect'
```
