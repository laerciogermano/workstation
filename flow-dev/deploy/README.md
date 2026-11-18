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

`nginx-flow-ide.conf` já inclui **:443 + fullchain**. Antes o template era só `:80` e o `publicar.sh` dava reload antes do certbot — na janela (ou se o certbot falhasse) o HTTPS caía no default (`centralizador`) e o browser “não acessava” o Flow IDE.

**Voltar ao bug:** conf só com `listen 80` + reload sem SSL.

## Rollback

1. hPanel → DNS `laerciogermano.com` → excluir A `flow-ide`
2. Contabo: `rm /etc/nginx/sites-enabled/flow-ide /etc/nginx/sites-available/flow-ide; rm -rf /opt/flow-ide; nginx -t && systemctl reload nginx`
3. `certbot delete --cert-name flow-ide.laerciogermano.com`

## Antes → depois

Sem site próprio (só Plans `#T-32`) → protótipo Flow.dev em `/opt/flow-ide` + A `flow-ide`.

## Flow · gantt-sample + Programação Orientada a Fluxo

Flow segue [`../inputs/gantt-sample.png`](../inputs/gantt-sample.png): colunas Nome · Início · Passos · % feito (anel) · Agente, cabeçalho em dois níveis, barras por composição (azul / verde) com progresso, ◆ dados, barra-resumo com marcos, conectores de sequência e tags (∥ paralelo, if seleção, ↻ repetição). Painel **Contexto · camadas** (T-36) e export **JavaScript** no estilo do documento FOP (T-35).

**Antes → depois:** barras sem setas, esquerda agente | descrição → tabela do sample + conectores (desligáveis no botão **Sequência**), dados, seleção/repetição, camadas e contexto.

**Voltar:** `git log -- flow-dev/prototipo/index.html` e restaurar o commit `1751ce82` (barras sem setas).
