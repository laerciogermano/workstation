# Deploy — flow-ide.laerciogermano.com

**URL:** https://flow-ide.laerciogermano.com/  
**Host:** Contabo `185.250.37.82` · root `/opt/flow-ide` · nginx site `flow-ide`  
**DNS:** Hostinger (zona `laerciogermano.com`) · A `flow-ide` → `185.250.37.82`  
**Conteúdo:** [`../prototipo/`](../prototipo/)

> Pedido: subdomínio **Flow IDE** no Germano. Publicado em `flow-ide.laerciogermano.com` (`lesgermano.com` não está na conta Hostinger). nginx também lista `flow-ide.lesgermano.com` se o domínio for registrado depois.

## Republicar

```bash
SSHPASS='…' bash deploy/publicar.sh
```

## Rollback

1. hPanel → DNS `laerciogermano.com` → excluir A `flow-ide`
2. Contabo: `rm /etc/nginx/sites-enabled/flow-ide /etc/nginx/sites-available/flow-ide; rm -rf /opt/flow-ide; nginx -t && systemctl reload nginx`
3. `certbot delete --cert-name flow-ide.laerciogermano.com`

## Antes → depois

Sem site próprio (só Plans `#T-32`) → protótipo Flow.dev em `/opt/flow-ide` + A `flow-ide`.

## Barras Flow · gantt-sample

Flow usa barras arredondadas com progresso + deps (como [`../inputs/gantt-sample.png`](../inputs/gantt-sample.png)); esquerda = responsável + descrição.

**Antes → depois:** linhas FOP (□ na divisória) → barras estilo sample.

**Voltar:** restaurar `.funit` / `faxis` no histórico git do `prototipo/index.html`.
