# Deploy — fitness.laerciogermano.com

**URL:** https://fitness.laerciogermano.com/  
**Host:** Contabo `185.250.37.82` · root `/opt/fitness` · nginx site `fitness`  
**DNS:** Hostinger (zona `laerciogermano.com`) · A `fitness` → `185.250.37.82`  
**Conteúdo:** [`prototipos/v1/`](../prototipos/v1/)

**Temas (v1):** 13 — padrão **Pista** (`data-theme="pista"` / `localStorage` `ft-theme` fallback). Também: Cobalto, Preto, Lima, Zona, Volt, Next, Esmeralda, Forja, Giz, Sálvia, Musgo, Neon. Voltar ao Cobalto: `getTheme`/`html` → `cobalto` + `publicar.sh`.

**UI (2026-11-16):** cartões/botões secundários sem contorno (`--ft-edge: transparent`); separação só por tom (`--ft-line-2` / `--ft-raise`), no padrão Clozzy. Rollback: restaurar `border: … var(--ft-line)` nos seletores `.card`/`.btn.s`/`.opt`/etc. e republicar; cache-bust em `index.html` (`?v=`).

**Dieta · Comi:** selected usa tinta/cinza (`--ft-ink` / `--ft-line-2`), não laranja do `--ft-ok` nos temas Pista/Giz. Card `.meal.done` = `--ft-line-2`. Voltar: `.mk button.on.feito` → `var(--ft-ok)`.

## Republicar

```bash
SSHPASS='…' bash deploy/publicar.sh
```

## Rollback

1. hPanel → DNS `laerciogermano.com` → excluir A `fitness`
2. Contabo: `rm /etc/nginx/sites-enabled/fitness /etc/nginx/sites-available/fitness; rm -rf /opt/fitness; nginx -t && systemctl reload nginx`
3. `certbot delete --cert-name fitness.laerciogermano.com`
