# RoleGo — Deploy (Contabo)

## Protótipo Beta (`rolego.com.br`)

Galeria HTML navegável ([`../beta-docs/prototipos/index.html`](../beta-docs/prototipos/index.html)) no nginx da Contabo VPS `144.126.154.90` (mesmo host do ConnectMax).

| Item | Valor |
|------|--------|
| Arquivos | `/opt/rolego/web` (`index.html` do protótipo) |
| Backup SPA E01 (Vite) | `/opt/rolego/web-e01-vite-bak` |
| Em breve (rollback) | `/opt/rolego/embreve` |
| nginx | `/etc/nginx/sites-available/rolego` → `sites-enabled/rolego` |
| Canônico no repo | [`nginx-rolego.conf`](nginx-rolego.conf) + [`embreve/`](embreve/) |
| DNS | A `rolego.com.br` e `www` → `144.126.154.90` |
| URL | https://rolego.com.br |

**Antes → depois (2026-11-04):** SPA Vite E01 (`web/dist/`) → protótipo Beta estático (`beta-docs/prototipos/index.html`). Rollback SPA: ver abaixo.

### Deploy do protótipo Beta

```bash
export SSHPASS='…'   # senha root Contabo
HOST=144.126.154.90
RSH='sshpass -e ssh -o StrictHostKeyChecking=no'
STAGING=/tmp/rolego-proto-deploy

rm -rf "$STAGING" && mkdir -p "$STAGING"
cp role-go/beta-docs/prototipos/index.html "$STAGING/index.html"

sshpass -e ssh -o StrictHostKeyChecking=no root@$HOST '
  # backup único do SPA antigo
  [ -d /opt/rolego/web-e01-vite-bak ] || cp -a /opt/rolego/web /opt/rolego/web-e01-vite-bak
  mkdir -p /opt/rolego/web
'
sshpass -e rsync -az --delete -e "$RSH" "$STAGING/" "root@$HOST:/opt/rolego/web/"
sshpass -e ssh -o StrictHostKeyChecking=no root@$HOST '
  sed -i "s|root /opt/rolego/embreve;|root /opt/rolego/web;|" /etc/nginx/sites-available/rolego
  nginx -t && systemctl reload nginx
'
curl -sS -o /dev/null -w "%{http_code}\n" -L https://rolego.com.br/
```

### Deploy do SPA E01 (legado, Vite)

```bash
cd role-go/web && npm install --cache /tmp/npm-cache-rolego && npm run build && cd ../..

export SSHPASS='…'
HOST=144.126.154.90
RSH='sshpass -e ssh -o StrictHostKeyChecking=no'

sshpass -e ssh -o StrictHostKeyChecking=no root@$HOST 'mkdir -p /opt/rolego/web'
sshpass -e rsync -az --delete -e "$RSH" role-go/web/dist/ "root@$HOST:/opt/rolego/web/"
sshpass -e ssh -o StrictHostKeyChecking=no root@$HOST '
  sed -i "s|root /opt/rolego/embreve;|root /opt/rolego/web;|" /etc/nginx/sites-available/rolego
  nginx -t && systemctl reload nginx
'
```

### Em breve (primeira instalação / página estática)

```bash
export SSHPASS='…'
HOST=144.126.154.90
RSH='sshpass -e ssh -o StrictHostKeyChecking=no'

sshpass -e ssh -o StrictHostKeyChecking=no root@$HOST 'mkdir -p /opt/rolego/embreve'
sshpass -e rsync -az -e "$RSH" role-go/deploy/embreve/ "root@$HOST:/opt/rolego/embreve/"
# Só na 1ª vez (sem Certbot ainda): copiar nginx-rolego.conf
# Depois do Certbot: NÃO sobrescrever — só sed no root.
```

### HTTPS (após DNS apontar para a Contabo)

```bash
sshpass -e ssh root@$HOST 'certbot --nginx -d rolego.com.br -d www.rolego.com.br --non-interactive --agree-tos -m admin@rolego.com.br --redirect'
```

### Rollback

1. Voltar SPA E01 Vite: `rsync -a --delete /opt/rolego/web-e01-vite-bak/ /opt/rolego/web/` (na VPS) + `nginx -t && systemctl reload nginx`
2. Voltar “em breve”: `sed -i 's|root /opt/rolego/web;|root /opt/rolego/embreve;|' /etc/nginx/sites-available/rolego && nginx -t && systemctl reload nginx`
3. Desligar site: `rm /etc/nginx/sites-enabled/rolego` e `nginx -t && systemctl reload nginx`
4. Opcional: `rm -rf /opt/rolego`
5. DNS: voltar A para o provedor anterior (Hostinger CDN `2.57.91.91` se ainda aplicável)

**Antes → depois (histórico):** página “em breve” em `/opt/rolego/embreve` → SPA E01 em `/opt/rolego/web` → protótipo Beta HTML em `/opt/rolego/web` (ConnectMax continua `default_server` na porta 80).
