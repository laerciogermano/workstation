# Deploy — eternos-mutaveis.laerciogermano.com

**URL:** https://eternos-mutaveis.laerciogermano.com/  
**Host:** Contabo `185.250.37.82` · root `/opt/eternos-mutaveis` · nginx site `eternos-mutaveis`  
**DNS:** Hostinger (zona `laerciogermano.com`) · A `eternos-mutaveis` → `185.250.37.82`  
**Nota:** hPanel não tem plano de hospedagem; o domínio só aponta DNS. CDP Germano `:9230` para editar zona.

## Republicar

```bash
ROOT=/Users/laerciogermano/Documents/works/eternos-mutaveis
DEST=/tmp/eternos-mutaveis-deploy
rm -rf "$DEST" && mkdir -p "$DEST"
cp "$ROOT/livro.html" "$DEST/index.html"
# copiar só paths referenciados em index.html (assets/, capa/v2/, inputs/imagens/, musica/)
# depois:
export SSHPASS='…'   # Contabo 185
RSH='sshpass -e ssh -o StrictHostKeyChecking=no'
sshpass -e rsync -az --delete -e "$RSH" "$DEST/" root@185.250.37.82:/opt/eternos-mutaveis/
```

## Rollback

1. hPanel → DNS `laerciogermano.com` → excluir A `eternos-mutaveis`
2. No Contabo: `rm /etc/nginx/sites-enabled/eternos-mutaveis /etc/nginx/sites-available/eternos-mutaveis; rm -rf /opt/eternos-mutaveis; nginx -t && systemctl reload nginx`
3. `certbot delete --cert-name eternos-mutaveis.laerciogermano.com`
