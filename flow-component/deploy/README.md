# Deploy — fop.laerciogermano.com

**URL:** https://fop.laerciogermano.com/ → `flow-novo.html?tema=eternos-black`  
**Host:** Contabo `185.250.37.82` · root `/opt/fop` · nginx site `fop`  
**DNS:** Hostinger (zona `laerciogermano.com`) · A `fop` → `185.250.37.82`  
**Conteúdo:** [`../example/`](../example/) (editor Flow · FOP)

> Pedido: **só FOP** em `fop.lesgermano.com`. `lesgermano.com` não está na conta Hostinger Germano. Publicado em `fop.laerciogermano.com`. nginx também lista `fop.lesgermano.com` se o domínio for registrado depois.

## Republicar

```bash
SSHPASS='…' bash deploy/publicar.sh
```

Local (preview): `python3 -m http.server 8787 --directory example` → http://127.0.0.1:8787/flow-novo.html?tema=eternos-black

## Rollback

1. hPanel → DNS `laerciogermano.com` → excluir A `fop`
2. Contabo: `rm /etc/nginx/sites-enabled/fop /etc/nginx/sites-available/fop; rm -rf /opt/fop; nginx -t && systemctl reload nginx`
3. `certbot delete --cert-name fop.laerciogermano.com`

## Antes → depois

Sem site FOP → `example/` (flow-novo) em `/opt/fop` + A `fop`. `flow-ide.laerciogermano.com` permanece (protótipo Flow.dev).
