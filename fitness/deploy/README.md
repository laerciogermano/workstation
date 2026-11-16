# Deploy — fitness.laerciogermano.com

**URL:** https://fitness.laerciogermano.com/  
**Host:** Contabo `185.250.37.82` · root `/opt/fitness` · nginx site `fitness`  
**DNS:** Hostinger (zona `laerciogermano.com`) · A `fitness` → `185.250.37.82`  
**Conteúdo:** [`prototipos/v1/`](../prototipos/v1/)

**Temas (v1):** 13 — Cobalto, Preto, Lima, Pista, Zona (laranja + verde neon no cumpriu / texto preto), Volt, Next, Esmeralda, Forja, Giz, Sálvia, Musgo, Neon. Token `--ft-on-ok` para texto sobre preenchimento “cumpriu”. Voltar: `git checkout` do CSS/JS do protótipo + `publicar.sh`.

## Republicar

```bash
SSHPASS='…' bash deploy/publicar.sh
```

## Rollback

1. hPanel → DNS `laerciogermano.com` → excluir A `fitness`
2. Contabo: `rm /etc/nginx/sites-enabled/fitness /etc/nginx/sites-available/fitness; rm -rf /opt/fitness; nginx -t && systemctl reload nginx`
3. `certbot delete --cert-name fitness.laerciogermano.com`
