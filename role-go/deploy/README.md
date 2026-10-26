# RoleGo — Deploy (Contabo)

## Em breve (`rolego.com.br`)

Página estática no nginx da Contabo VPS `144.126.154.90` (mesmo host do ConnectMax).

| Item | Valor |
|------|--------|
| Arquivos | `/opt/rolego/embreve` |
| nginx | `/etc/nginx/sites-available/rolego` → `sites-enabled/rolego` |
| Canônico no repo | [`embreve/`](embreve/) + [`nginx-rolego.conf`](nginx-rolego.conf) |
| DNS | A `rolego.com.br` e `www` → `144.126.154.90` |

### Deploy

```bash
export SSHPASS='…'   # senha root Contabo
HOST=144.126.154.90
RSH='sshpass -e ssh -o StrictHostKeyChecking=no'

sshpass -e ssh -o StrictHostKeyChecking=no root@$HOST 'mkdir -p /opt/rolego/embreve'
sshpass -e rsync -az -e "$RSH" embreve/ "root@$HOST:/opt/rolego/embreve/"
sshpass -e scp -o StrictHostKeyChecking=no nginx-rolego.conf "root@$HOST:/etc/nginx/sites-available/rolego"
sshpass -e ssh -o StrictHostKeyChecking=no root@$HOST '
  ln -sfn /etc/nginx/sites-available/rolego /etc/nginx/sites-enabled/rolego
  nginx -t && systemctl reload nginx
'
```

### HTTPS (após DNS apontar para a Contabo)

```bash
sshpass -e ssh root@$HOST 'certbot --nginx -d rolego.com.br -d www.rolego.com.br --non-interactive --agree-tos -m admin@rolego.com.br --redirect'
```

### Rollback

1. `rm /etc/nginx/sites-enabled/rolego` e `nginx -t && systemctl reload nginx`
2. Opcional: `rm -rf /opt/rolego`
3. DNS: voltar A para o provedor anterior (Hostinger CDN `2.57.91.91` se ainda aplicável)

**Antes → depois:** domínio na Hostinger → A na Contabo + site `rolego` no nginx (ConnectMax continua `default_server` na porta 80).
