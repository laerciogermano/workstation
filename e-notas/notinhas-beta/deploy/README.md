# Deploy Contabo — notinhas.shop Beta

**URL:** https://notinhas.shop/ · https://www.notinhas.shop/  
**Host:** Contabo `185.250.37.82` · código `/opt/notinhas-beta` · unit `notinhas-api` · Node `127.0.0.1:4174`  
**ean-serp:** `/opt/ean-serp` · unit `ean-serp` · `127.0.0.1:4180` (SI5 + Google Imagens; `EAN_SERP_URL`)  
**Chrome CDP:** unit `notinhas-chrome` · `127.0.0.1:9223` (REQ-042 fotos)  
**nginx:** `sites-available/notinhas` — `/` → `apps/web/dist`; `/api/` → API; `/enotas/` → lab `:4175`  
**Postgres:** schema `notinhas` no Docker `postgres-db-1` (`connectmax`)  
**Cert LE:** `/etc/letsencrypt/live/notinhas.shop/` (já emitido)

### PWA / viewport (app-like, espelho RoleGo)

- Viewport: `maximum-scale=1, user-scalable=no, viewport-fit=cover` + metas `apple-mobile-web-app-*`
- Gestos: `installAppGestures()` bloqueia pinch/double-tap/Ctrl± (mapa Leaflet pode pinçar)
- CSS: `html`/`body`/`#root` sem overflow do browser; scroll no `.shell`; inputs **16px**
- Manifest: `display: standalone` + `display_override` + `orientation: portrait-primary`
- Ícone / favicon: `apps/web/public/favicon.svg` — fundo **#00984B** + tiras brancas (antes: azul+verde sem fundo). Manifest `theme_color` / `background_color` = `#00984B`. Rollback: restaurar SVG azul `#014380` + verde `#00984B` sem `rect` e theme `#F6F6F4`.

**Antes → depois:** viewport só `initial-scale=1` (zoom livre) → travado + gestos + shell scroll.  
**Rollback:** reverter `apps/web/index.html`, `src/main.tsx`, `src/lib/app-gestures.ts`, `src/styles/app.css`, `vite.config.ts`.

### Chunks stale pós-deploy (import module script fail)

**Sintoma:** após `rsync --delete`, navegar p/ rota lazy (ex.: Perfil) → “Unexpected Application Error” / failed to fetch module; F5 resolve.  
**Causa:** shell JS antigo (aba aberta ou SW) pedia `/assets/*-HASH.js` já apagado; `index.html` sem `Cache-Control: no-cache`; `registerSW.js` só registrava SW sem reload no update.

**Mitigações (atuais):**
1. nginx: `no-cache` em `/`, `/index.html`, `/sw.js`; `/assets/` continua `immutable`
2. PWA: `virtual:pwa-register` + `autoUpdate` + `cleanupOutdatedCaches` / `skipWaiting` / `clientsClaim`
3. `lazyPage()`: 1× `location.reload()` se o dynamic import falhar

**Antes → depois:** index sem cache headers + registerSW mínimo → no-cache + reload no SW/chunk.  
**Rollback:** reverter `deploy/nginx.conf` (e `/etc/nginx/sites-available/notinhas`), `vite.config.ts`, `main.tsx`, `router.tsx`, `lib/lazy-page.ts`.

## Antes → depois

| | Antes | Depois |
|---|---|---|
| `/` | protótipo v2 `/opt/notinhas-v2` | SPA Beta `/opt/notinhas-beta/apps/web/dist` |
| API | lab `enotas.service` `:4174` em `/enotas/` | `notinhas-api` `:4174` em `/api/` |
| Lab | `:4174` | `:4175` em `/enotas/` (legado) |

## Republicar

```bash
export SSHPASS='…'   # Contabo 185 (credenciais.md)
SRC=/Users/laerciogermano/Documents/works/e-notas/notinhas-beta
sshpass -e rsync -az --delete \
  --exclude node_modules --exclude .git --exclude .env --exclude '**/node_modules' \
  -e 'ssh -o StrictHostKeyChecking=no' \
  "$SRC/" root@185.250.37.82:/opt/notinhas-beta/

sshpass -e ssh -o StrictHostKeyChecking=no root@185.250.37.82 '
  cd /opt/notinhas-beta && npm ci && npm run build && npm run db:migrate
  chown -R notinhas:notinhas /opt/notinhas-beta
  chown root:notinhas /opt/notinhas-beta/.env && chmod 640 /opt/notinhas-beta/.env
  systemctl restart notinhas-api
  nginx -t && systemctl reload nginx
'
```

Arquivos de referência: [`nginx.conf`](nginx.conf) · [`notinhas-api.service`](notinhas-api.service) · [`ean-serp.service`](ean-serp.service).

### ean-serp + Chrome CDP (primeira vez / atualizar)

```bash
SRC_SERP=/Users/laerciogermano/Documents/works/e-notas/ean-serp
sshpass -e rsync -az --delete --exclude node_modules --exclude .git \
  -e 'ssh -o StrictHostKeyChecking=no' \
  "$SRC_SERP/" root@185.250.37.82:/opt/ean-serp/

sshpass -e ssh -o StrictHostKeyChecking=no root@185.250.37.82 '
  # Google Chrome .deb (snap chromium não serve p/ CDP sob user notinhas)
  if [ ! -x /usr/bin/google-chrome-stable ]; then
    curl -fsSL -o /tmp/google-chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq /tmp/google-chrome.deb
  fi
  install -d -o notinhas -g notinhas /var/lib/notinhas-chrome
  cd /opt/ean-serp && npm ci --omit=dev
  chown -R notinhas:notinhas /opt/ean-serp
  cp /opt/notinhas-beta/deploy/notinhas-chrome.service /etc/systemd/system/notinhas-chrome.service
  cp /opt/notinhas-beta/deploy/ean-serp.service /etc/systemd/system/ean-serp.service
  grep -q EAN_SERP_URL /opt/notinhas-beta/.env || echo "EAN_SERP_URL=http://127.0.0.1:4180" >> /opt/notinhas-beta/.env
  systemctl daemon-reload
  systemctl enable --now notinhas-chrome
  sleep 2
  curl -sf http://127.0.0.1:9223/json/version >/dev/null
  systemctl enable --now ean-serp
  systemctl restart ean-serp notinhas-api
'
```

## Rollback

1. Restaurar nginx: `root /opt/notinhas-v2`; `/enotas/` → `:4174` (ou backup `notinhas.bak.*`)
2. `systemctl disable --now notinhas-api` · opcional `systemctl disable --now ean-serp`
3. Em `/opt/e-notas/.env`: `PORT=4174` + `systemctl restart enotas`
4. Opcional: `DROP SCHEMA notinhas CASCADE` (só com confirmação) · `rm -rf /opt/notinhas-beta`
