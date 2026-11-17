# Deploy — centralizador.laerciogermano.com

**URL:** https://centralizador.laerciogermano.com/  
**Host:** Contabo `185.250.37.82` · root `/opt/centralizador` · nginx site `centralizador`  
**DNS:** Hostinger (zona `laerciogermano.com`) · A `centralizador` → `185.250.37.82`  
**Conteúdo:** [`../site/`](../site/)

> Pedido original: `centralizador.lesgermano.com`. `lesgermano.com` **não está registrado** (whois sem match) e não aparece na conta Hostinger Germano. Publicado em `centralizador.laerciogermano.com`. Se registrar `lesgermano.com` na mesma conta: A `centralizador` → `185.250.37.82` + `certbot -d centralizador.lesgermano.com` (nginx já lista o `server_name`).

## Republicar

```bash
SSHPASS='…' bash deploy/publicar.sh
```

## Card Flow → Plans T-32

Card **Flow** aponta para `https://plans.laerciogermano.com/#T-32` (visão Flow do protótipo).

**Antes → depois:** `url: null` (“em breve”) → deep link `#T-32`.

**Voltar:** no `site/index.html`, card Flow com `url: null`.

## Card OmTV

Card **OmTV** no hub (`img/omtv.jpg`, `url: null` = em breve). Visão local: [`../../omtv/README.md`](../../omtv/README.md).

**Antes → depois:** sem card → card OmTV “em breve”.

**Voltar:** remover o objeto OmTV de `site/index.html` e `site/img/omtv.jpg`; republicar.

## Rollback

1. hPanel → DNS `laerciogermano.com` → excluir A `centralizador`
2. Contabo: `rm /etc/nginx/sites-enabled/centralizador /etc/nginx/sites-available/centralizador; rm -rf /opt/centralizador; nginx -t && systemctl reload nginx`
3. `certbot delete --cert-name centralizador.laerciogermano.com`
