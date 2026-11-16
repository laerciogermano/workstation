# Deploy — confraternizacao.laerciogermano.com

**URL:** https://confraternizacao.laerciogermano.com/  
**Host:** Contabo `185.250.37.82` · root `/opt/confraternizacao` · nginx site `confraternizacao`  
**DNS:** Hostinger (zona `laerciogermano.com`) · A `confraternizacao` → `185.250.37.82`  
**Conteúdo:** [`prototipo/`](../prototipo/) (`index.html` atual + `v1/` + `v2/`)

## Republicar

```bash
SSHPASS='…' bash deploy/publicar.sh
```

## Rollback

1. hPanel → DNS `laerciogermano.com` → excluir A `confraternizacao`
2. Contabo: `rm /etc/nginx/sites-enabled/confraternizacao /etc/nginx/sites-available/confraternizacao; rm -rf /opt/confraternizacao; nginx -t && systemctl reload nginx`
3. `certbot delete --cert-name confraternizacao.laerciogermano.com`
