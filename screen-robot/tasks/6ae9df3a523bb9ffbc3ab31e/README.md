# Task Trello: Banner BR Supply (Daniela + Aline)

- **Card:** [Daniela + Aline: trocar banner 03 por BR Supply com logo](https://trello.com/c/r21j4TO0)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção)
- **ID:** `6ae9df3a523bb9ffbc3ab31e`
- **Descrição:** [`card-description.md`](card-description.md)

## Objetivo

Trocar `br-supply-03-logistica.jpg` (sem logo) por banner BR Supply com marca (01 ou 02) em **v06 Daniela Hoffmann** e **v12 Aline Monteiro** no escolhidos v2.

## Execução prevista

1. Atualizar `BANNERS.v06` / `BANNERS.v12` em [`../6ae9dd6525adce9bc153a2b1/generate-escolhidos-v2.mjs`](../6ae9dd6525adce9bc153a2b1/generate-escolhidos-v2.mjs)
2. Atualizar [`../6ae9dd6525adce9bc153a2b1/banners/README.md`](../6ae9dd6525adce9bc153a2b1/banners/README.md)
3. Regenerar MD/PDF (`node generate-escolhidos-v2.mjs`)
4. Remover cópia local do 03 na pasta banners da task v2 se não houver outro uso

**Antes → depois:** v06/v12 com capa logística genérica → 01 caixas / 02 fachada (logo BR). Rollback: restaurar mapa `BANNERS` + `br-supply-03-logistica.jpg` na task v2.

## Rollback

```bash
rm -rf screen-robot/tasks/6ae9df3a523bb9ffbc3ab31e
trello card:archive --id 6ae9df3a523bb9ffbc3ab31e
```
