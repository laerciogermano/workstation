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

## Copiloto · painel direito

Não é visão do dock: ícone `message-square` no `.tb` → `COPILOT.open` + `copilotPanel()` à direita (abas `COPILOT.tabs`). T-60/T-61. Visão **Estados** = `v: "estados"` (T-70) no dock.

**Antes → depois:** Chat como item do menu → copiloto lateral + Estados no transversal.

**Voltar:** devolver `chat` em `VIEWS`; remover `estados`/`copilotPanel`/`.body.copilot-on`.

## Gantt · só calendário + dock

- Gantt sem modo Estado / `gm` / marcas e0…eN (T-37 removido).
- Menu transversal: `.vdock` absoluto no centro inferior de `.content`.

**Antes → depois:** Calendário + Estado (FOP) no Gantt → só calendário; estados na visão `estados`.

**Voltar:** restaurar `gm`/`T-37`/`ganttFopStates` no histórico git.

## Estados · árvore de dados

- Ícone dock: `dice-5` (dado).
- `planStateObject(plan)` → `{ root, sources }`; UI = canvas em árvore L→R (nós + edges) + `state.json`. T-70.

**Antes → depois:** lista indentada / e0…eN → árvore visual de dados com ícone dado.

**Voltar:** `database` + rows `erow` / `ganttFopStates`.

## Flow · Gantt por passos

Flow no layout Gantt (`flowLayout` + `.funit`): **um** □ entrada e **um** □ saída por etapa. Sem setas SVG de dependência.

**Antes → depois:** vários quadrados por I/O + deps → 1+1 quadrados, sem setas.

**Voltar:** multi-sq + `.gsvg` deps no `flow()`.

## Zoom/pan · Gantt · Flow · Árvore · Fluxograma

Mesmo padrão: `ZVIEWS[key]` + `.zcanvas` / `.zworld` + toolbar `zzoom-*`. Scroll = zoom no cursor; arrastar fundo = pan; − / % / + / ajustar.

Fluxograma: sem sticky “Onboarding Acme”, sem select de plano e sem “Executar via IAs” na barra.

**Antes → depois:** só Fluxograma com zoom → as quatro visões; sticky/plan/run na barra → removidos do diagram.

**Voltar:** `DVIEW` só no diagram; restaurar sticky + acts de plan/run no `bar()`.
