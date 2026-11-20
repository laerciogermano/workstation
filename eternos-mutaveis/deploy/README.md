# Deploy — Eternos Mutáveis

**URL:** https://eternosmutaveis.com/ · https://www.eternosmutaveis.com/ · https://eternos-mutaveis.laerciogermano.com/  
**Host:** Contabo `185.250.37.82` · root `/opt/eternos-mutaveis` · nginx [`nginx-eternos-mutaveis.conf`](nginx-eternos-mutaveis.conf)  
**DNS Hostinger**
- zona `eternosmutaveis.com`: A `@` → `185.250.37.82` (TTL 300); CNAME `www` → `eternosmutaveis.com`
- zona `laerciogermano.com`: A `eternos-mutaveis` → `185.250.37.82`
**Cert LE:** `eternos-mutaveis.laerciogermano.com` (SAN: apex + www)  
**Nota:** hPanel só DNS (sem plano de hospedagem). CDP Germano `:9230` para editar zona.

**Antes → depois (apex 2026-11-20):** parking A `@` `2.57.91.91` → Contabo `185.250.37.82`; nginx/`certbot --expand` com `eternosmutaveis.com` + `www`. Rollback: A `@` → `2.57.91.91`; tirar os hostnames do `server_name`/cert; `nginx -t && systemctl reload nginx`.

## Republicar (todas as versões, com seletor)

```bash
SSHPASS='…' bash deploy/publicar.sh      # Contabo 185
```

`deploy/_montar_site.py` monta `/tmp/eternos-mutaveis-deploy`: `index.html` = 5.0 e `v5.html` … `v1.html` (de `livro-v5.html` … `livro-v1.html`), cada página com o seletor "Versão X ▾" no canto superior esquerdo, mais só os arquivos referenciados. Para incluir uma versão nova, gere `livro-vN.html` e acrescente-a em `VERSOES` no script.

Rollback para a 3.0 sozinha: `cp livro-v3.html /tmp/x/index.html` + arquivos referenciados e o mesmo rsync.

## Rollback

1. hPanel → DNS `eternosmutaveis.com` → A `@` de volta a `2.57.91.91` (ou excluir); DNS `laerciogermano.com` → excluir A `eternos-mutaveis`
2. No Contabo: `rm /etc/nginx/sites-enabled/eternos-mutaveis /etc/nginx/sites-available/eternos-mutaveis; rm -rf /opt/eternos-mutaveis; nginx -t && systemctl reload nginx`
3. `certbot delete --cert-name eternos-mutaveis.laerciogermano.com`
