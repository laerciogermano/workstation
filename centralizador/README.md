# Centralizador

Hub público dos projetos (título, descrição, imagem, link).

**URL:** https://centralizador.laerciogermano.com/ · deploy: [`deploy/README.md`](deploy/README.md)

## Conteúdo

Estático em [`site/`](site/) — cards a partir dos banners em `boards/banners/projects/`. Projetos no ar abrem em nova aba; demais ficam “em breve”. Card **Flow** → Plans `#T-32`. Card **OmTV** → em breve (visão em [`../omtv/README.md`](../omtv/README.md)).

## Republicar

```bash
SSHPASS='…' bash deploy/publicar.sh
```
