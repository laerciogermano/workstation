# Deploy — clozzy.laerciogermano.com

**URL:** https://clozzy.laerciogermano.com/  
**Host:** Contabo `185.250.37.82` · root `/opt/clozzy` · nginx site `clozzy-proto`  
**DNS:** Hostinger (zona `laerciogermano.com`) · A `clozzy` → `185.250.37.82`

| Path | Origem |
|---|---|
| `/` | [`../docs/site/`](../docs/site/README.md) |
| `/prototipo/` | [`../docs/prototipo-v2/`](../docs/prototipo-v2/README.md) |
| `/marca/` | [`../marca/identidade-verde-letras-redondas/`](../marca/identidade-verde-letras-redondas/README.md) |

## Republicar

```bash
SSHPASS='…' bash deploy/publicar.sh
```

## Rollback

1. Restaurar `publicar.sh` / nginx anteriores (só `prototipo-v2` na raiz) e republicar  
2. Ou: hPanel → DNS `laerciogermano.com` → excluir A `clozzy`; Contabo `rm /etc/nginx/sites-enabled/clozzy-proto /etc/nginx/sites-available/clozzy-proto; rm -rf /opt/clozzy; nginx -t && systemctl reload nginx`; `certbot delete --cert-name clozzy.laerciogermano.com`
