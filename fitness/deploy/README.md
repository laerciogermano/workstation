# Deploy — fitness.laerciogermano.com

**URL:** https://fitness.laerciogermano.com/  
**Host:** Contabo `185.250.37.82` · root `/opt/fitness` · nginx site `fitness`  
**DNS:** Hostinger (zona `laerciogermano.com`) · A `fitness` → `185.250.37.82`  
**Conteúdo:** [`prototipos/v1/`](../prototipos/v1/)

**Temas (v1):** 13 — padrão **Pista** (`data-theme="pista"` / `localStorage` `ft-theme` fallback). Também: Cobalto, Preto, Lima, Zona, Volt, Next, Esmeralda, Forja, Giz, Sálvia, Musgo, Neon. Voltar ao Cobalto: `getTheme`/`html` → `cobalto` + `publicar.sh`.

**UI (2026-11-16):** cartões/botões secundários sem contorno (`--ft-edge: transparent`); separação só por tom (`--ft-line-2` / `--ft-raise`), no padrão Clozzy. Rollback: restaurar `border: … var(--ft-line)` nos seletores `.card`/`.btn.s`/`.opt`/etc. e republicar; cache-bust em `index.html` (`?v=`).

**Dieta · Comi:** botão selected = `--ft-ok` (laranja nos temas Pista/Giz); card `.meal.done` = cinza `--ft-line-2` (sem tint laranja). Voltar card: `color-mix(… ft-ok 7%, surface)`.

**F-05 meta-card:** fundo `--ft-surface` sem borda; déficit tipografia `--ft-kc` (chip + kcal + diff); superávit `--ft-act`. Antes: fill laranja/azul ou borda `--ft-line-strong`. Voltar fill: `background: var(--ft-kc); color: #fff`.

**Onboarding por seção (PRD v1.3):** `S.gates` {hoje,dieta,treino,corpo}; 1ª entrada em cada aba → F-02…06 / F-20 / F-07 / F-08. Antes: `onboarded` monolítico + `GATED`. Voltar: restaurar gate único em `nav()`.

**Corpo · menu + métrica:** sheet `corpo-menu` (avaliação / métrica / foto); `F-44` + `S.customMeasures` / `MEASURE_PRESETS`. Voltar: só `+` → F-40; sem custom.

**F-03 `.opt.on`:** fundo `--ft-ok-soft` + texto `--ft-ok`/`--ft-ok-deep` (família Comi). Antes: só `border` `--ft-act`. Voltar: `border-color: var(--ft-act)` sem fill.

## Republicar

```bash
SSHPASS='…' bash deploy/publicar.sh
```

## Rollback

1. hPanel → DNS `laerciogermano.com` → excluir A `fitness`
2. Contabo: `rm /etc/nginx/sites-enabled/fitness /etc/nginx/sites-available/fitness; rm -rf /opt/fitness; nginx -t && systemctl reload nginx`
3. `certbot delete --cert-name fitness.laerciogermano.com`
