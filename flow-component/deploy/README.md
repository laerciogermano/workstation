# Deploy — fop.laerciogermano.com

**URL:** https://fop.laerciogermano.com/ (URL limpa — sem `flow-novo.html` nem `?tema=`)  
**Host:** Contabo `185.250.37.82` · root `/opt/fop` · nginx site `fop` · `index.html` (= editor)  
**DNS:** Hostinger (zona `laerciogermano.com`) · A `fop` → `185.250.37.82` (também coberto pelo wildcard `*` → `185.250.37.82`)  
**Tema:** default `eternos-black` no host FOP (localStorage / bolinhas; sem query na URL)  
**Conteúdo:** [`../example/`](../example/) · marca: logo no header + **Flow** (regra [`.cursor/rules/fop-flow-language.mdc`](../../../.cursor/rules/fop-flow-language.mdc))  
**Projeto padrão:** só o fluxo `main` (raiz vazia). O antigo `example` (demo de libs) saiu do sample — fica em `browserDemoProject()` só para testes.

**Antes → depois:** `/` redirecionava para `/flow-novo.html?tema=eternos-black` → `/` serve `index.html` e `/flow-novo.html` vira 301 `/`. Sample `main`+`example` → só `main`.

> Pedido: **só FOP** em `fop.lesgermano.com`. `lesgermano.com` não está na conta Hostinger Germano. Publicado em `fop.laerciogermano.com`. nginx também lista `fop.lesgermano.com` se o domínio for registrado depois.

### Wildcard DNS

Na zona `laerciogermano.com` há **A `*` → `185.250.37.82`**. Novos subdomínios resolvem sem novo registro no hPanel. Ainda precisa no Contabo: pasta + nginx `server_name` + `certbot -d <sub>.laerciogermano.com`. Apex `@` continua no parking Hostinger (`2.57.91.91`).

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
