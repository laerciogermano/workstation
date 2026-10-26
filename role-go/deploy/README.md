# RoleGo — Deploy (Contabo)

## Protótipo E01 (`rolego.com.br`)

SPA estática (build Vite de [`../web/`](../web/README.md)) no nginx da Contabo VPS `144.126.154.90` (mesmo host do ConnectMax).

| Item | Valor |
|------|--------|
| Arquivos | `/opt/rolego/web` (build de `web/dist/`) |
| Em breve (rollback) | `/opt/rolego/embreve` |
| nginx | `/etc/nginx/sites-available/rolego` → `sites-enabled/rolego` |
| Canônico no repo | [`nginx-rolego.conf`](nginx-rolego.conf) + [`embreve/`](embreve/) |
| DNS | A `rolego.com.br` e `www` → `144.126.154.90` |
| URL | https://rolego.com.br |

### Deploy do protótipo

```bash
cd web && npm install --cache /tmp/npm-cache-rolego && npm run build && cd ..

export SSHPASS='…'   # senha root Contabo
HOST=144.126.154.90
RSH='sshpass -e ssh -o StrictHostKeyChecking=no'

sshpass -e ssh -o StrictHostKeyChecking=no root@$HOST 'mkdir -p /opt/rolego/web'
sshpass -e rsync -az --delete -e "$RSH" web/dist/ "root@$HOST:/opt/rolego/web/"
sshpass -e ssh -o StrictHostKeyChecking=no root@$HOST '
  # só troca o root; não sobrescrever o conf live (Certbot gerencia SSL)
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
sshpass -e rsync -az -e "$RSH" embreve/ "root@$HOST:/opt/rolego/embreve/"
# Só na 1ª vez (sem Certbot ainda): copiar nginx-rolego.conf
# Depois do Certbot: NÃO sobrescrever — só sed no root.
```

### HTTPS (após DNS apontar para a Contabo)

```bash
sshpass -e ssh root@$HOST 'certbot --nginx -d rolego.com.br -d www.rolego.com.br --non-interactive --agree-tos -m admin@rolego.com.br --redirect'
```

### Rollback

1. Voltar “em breve”: `sed -i 's|root /opt/rolego/web;|root /opt/rolego/embreve;|' /etc/nginx/sites-available/rolego && nginx -t && systemctl reload nginx`
2. Desligar site: `rm /etc/nginx/sites-enabled/rolego` e `nginx -t && systemctl reload nginx`
3. Opcional: `rm -rf /opt/rolego`
4. DNS: voltar A para o provedor anterior (Hostinger CDN `2.57.91.91` se ainda aplicável)

**Antes → depois:** página “em breve” em `/opt/rolego/embreve` → protótipo E01 em `/opt/rolego/web` (ConnectMax continua `default_server` na porta 80).
