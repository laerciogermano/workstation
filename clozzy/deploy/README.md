# Deploy — clozzy.laerciogermano.com

**URL:** https://clozzy.laerciogermano.com/  
**Host:** Contabo `185.250.37.82` · root `/opt/clozzy` · nginx site `clozzy-proto`  
**DNS:** Hostinger (zona `laerciogermano.com`) · A `clozzy` → `185.250.37.82`  
**Conteúdo:** [`../docs/prototipo-v2/`](../docs/prototipo-v2/)

## Republicar

```bash
SSHPASS='…' bash deploy/publicar.sh
```

## Rollback

1. hPanel → DNS `laerciogermano.com` → excluir A `clozzy`
2. Contabo: `rm /etc/nginx/sites-enabled/clozzy-proto /etc/nginx/sites-available/clozzy-proto; rm -rf /opt/clozzy; nginx -t && systemctl reload nginx`
3. `certbot delete --cert-name clozzy.laerciogermano.com`
