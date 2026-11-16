# Deploy — plans.laerciogermano.com

**URL:** https://plans.laerciogermano.com/  
**Host:** Contabo `185.250.37.82` · root `/opt/plans` · nginx site `plans`  
**DNS:** Hostinger (zona `laerciogermano.com`) · A `plans` → `185.250.37.82`  
**Conteúdo:** [`../prototipo/`](../prototipo/)

> Pedido: `plans.lesgerman.com`. `lesgerman.com` / `lesgermano.com` **não** estão na conta Hostinger Germano. Publicado em `plans.laerciogermano.com`. nginx já lista `plans.lesgerman.com` se o domínio for registrado depois.

## Republicar

```bash
SSHPASS='…' bash deploy/publicar.sh
```

## Rollback

1. hPanel → DNS `laerciogermano.com` → excluir A `plans`
2. Contabo: `rm /etc/nginx/sites-enabled/plans /etc/nginx/sites-available/plans; rm -rf /opt/plans; nginx -t && systemctl reload nginx`
3. `certbot delete --cert-name plans.laerciogermano.com`

## Galeria vazia (só hero + Temas)

Causa: `const FLOWS = [ … ];` fechado como `};` → `SyntaxError` e o script para antes de `buildGallery()`.

**Antes → depois:** `};` após o último fluxo → `];`.

**Voltar:** restaurar o `index.html` do commit anterior em `/opt/plans` (ou republicar o artefato antigo).

## Fluxograma · zoom

No canvas (T-36): **scroll** = zoom in/out no cursor; **arrastar o fundo** = pan; botões `−` / `%` / `+` e ajustar à tela. Estado em `DVIEW` (`plans/prototipo/index.html`).

**Antes → depois:** `.dcanvas` só com `overflow:auto` (sem zoom) → transform em `.dworld` + wheel/pan.

**Voltar:** remover `DVIEW` / listeners de wheel-pan e restaurar `overflow:auto` no `.dcanvas`.
