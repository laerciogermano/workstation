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

## Chat · harness

Visão `chat` (T-60/T-61): thread + composer ligados ao `sel` do Explorar (`CHAT[id]`). Sem arquivo, composer bloqueado.

**Antes → depois:** sem aba Chat → `VIEWS` + `chat()` + fluxo `08` na galeria.

**Voltar:** remover entrada `chat` de `VIEWS`/`FLOWS`/`SCREENS` e a função `chat()`.

## Gantt · e0…eN + dock

- `gm: cal|fop` — Calendário vs Estado (FOP); `ganttFopStates()` gera e0…eN; T-37.
- Menu transversal: `.vdock` absoluto no centro inferior de `.content` (saiu do `.bar`).

**Antes → depois:** Gantt só deps de calendário + seg no topo → estados FOP + dock inferior.

**Voltar:** `gm`/`T-37`/`ganttFopStates` off; recolocar `.seg` no `.bar`.
