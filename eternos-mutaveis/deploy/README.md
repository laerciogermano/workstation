# Deploy — eternos-mutaveis.laerciogermano.com

**URL:** https://eternos-mutaveis.laerciogermano.com/  
**Host:** Contabo `185.250.37.82` · root `/opt/eternos-mutaveis` · nginx site `eternos-mutaveis`  
**DNS:** Hostinger (zona `laerciogermano.com`) · A `eternos-mutaveis` → `185.250.37.82`  
**Nota:** hPanel não tem plano de hospedagem; o domínio só aponta DNS. CDP Germano `:9230` para editar zona.

## Republicar (todas as versões, com seletor)

```bash
SSHPASS='…' bash deploy/publicar.sh      # Contabo 185
```

`deploy/_montar_site.py` monta `/tmp/eternos-mutaveis-deploy`: `index.html` = 5.0 e `v5.html` … `v1.html` (de `livro-v5.html` … `livro-v1.html`), cada página com o seletor "Versão X ▾" no canto superior esquerdo, mais só os arquivos referenciados. Para incluir uma versão nova, gere `livro-vN.html` e acrescente-a em `VERSOES` no script.

Rollback para a 3.0 sozinha: `cp livro-v3.html /tmp/x/index.html` + arquivos referenciados e o mesmo rsync.

## Rollback

1. hPanel → DNS `laerciogermano.com` → excluir A `eternos-mutaveis`
2. No Contabo: `rm /etc/nginx/sites-enabled/eternos-mutaveis /etc/nginx/sites-available/eternos-mutaveis; rm -rf /opt/eternos-mutaveis; nginx -t && systemctl reload nginx`
3. `certbot delete --cert-name eternos-mutaveis.laerciogermano.com`
