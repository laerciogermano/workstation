# Deploy — centralizador.laerciogermano.com

**Status:** fora do ar desde 2026-11-20.  
**Antes:** Contabo `185.250.37.82` · `/opt/centralizador` · nginx `centralizador` · DNS A `centralizador` → `185.250.37.82` · cert Let’s Encrypt.  
**Conteúdo local:** [`../site/`](../site/)

> Pedido original: `centralizador.lesgermano.com`. `lesgermano.com` **não está registrado**. Hub ficou em `centralizador.laerciogermano.com` até o teardown.

## Republicar (voltar ao ar)

1. hPanel → DNS `laerciogermano.com` → A `centralizador` → `185.250.37.82` (ou API DELETE inversa / PATCH)
2. `SSHPASS='…' bash deploy/publicar.sh` (recria `/opt/centralizador`, nginx e certbot)

```bash
SSHPASS='…' bash deploy/publicar.sh
```

## Card Flow.dev → Flow IDE

Card **Flow.dev** aponta para `https://flow-ide.laerciogermano.com/` (protótipo [`../../flow-dev/`](../../flow-dev/README.md)).

**Antes → depois:** deep link Plans `#T-32` → Flow IDE próprio.

**Voltar:** no `site/index.html`, card com `url: "https://plans.laerciogermano.com/#T-32"` (ou `null`).

## Card OmTV

Card **OmTV** no hub (`img/omtv.jpg`, `url: null` = em breve). Visão local: [`../../omtv/README.md`](../../omtv/README.md).

**Antes → depois:** sem card → card OmTV “em breve”.

**Voltar:** remover o objeto OmTV de `site/index.html` e `site/img/omtv.jpg`; republicar.

## Card CRM

Card **CRM** no hub (`img/crm.jpg`, `url: null` = em breve). Visão local: [`../../crm/README.md`](../../crm/README.md).

**Antes → depois:** sem card → card CRM “em breve”.

**Voltar:** remover o objeto CRM de `site/index.html` e `site/img/crm.jpg`; republicar.

## Card Gestão de CDPs

Card **Gestão de CDPs** no hub (`img/gestao-cdps.jpg`, `url: null` = em breve). Visão local: [`../../gestao-cdps/README.md`](../../gestao-cdps/README.md).

**Antes → depois:** sem card → card Gestão de CDPs “em breve”.

**Voltar:** remover o objeto Gestão de CDPs de `site/index.html` e `site/img/gestao-cdps.jpg`; republicar.

## Cards locais (lote 2026-11-26)

Incluídos no hub com `url: null` (em breve): Flow (`img/flow-core.jpg`), Flow Language, Flow Component, screen-robot, Edge Client (`img/cdp-client.jpg`), google-drive-cli, Chines, Provas UFPR, OV (`img/ov-contas.jpg`).

**Antes → depois:** pastas locais sem card → 9 cards no `site/index.html` + JPGs em `site/img/` (espelho em `boards/banners/projects/` quando gerados).

**Voltar:** remover esses 9 objetos de `site/index.html` e os JPGs novos (`flow-core`, `flow-language`, `flow-component`, `screen-robot`, `cdp-client`, `google-drive-cli`, `chines`, `provas-ufpr`, `ov-contas`); republicar se o hub estiver no ar.

## Teardown (feito 2026-11-20)

1. Hostinger API: `DELETE` em `api/dns/v1/direct/zone/resource-records` com `domain=laerciogermano.com` e `filters: [{ name: 'centralizador', type: 'A' }]` (A `centralizador` removido; wildcard `*` na zona ainda resolve o hostname para o IP Contabo)
2. Contabo: removidos nginx `centralizador`, `/opt/centralizador` e `certbot delete --cert-name centralizador.laerciogermano.com`
3. HTTPS sem cert válido → browser falha; site do hub não existe mais no servidor
