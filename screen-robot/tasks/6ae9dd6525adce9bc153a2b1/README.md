# Task Trello: Escolhidos v2 (persona × LinkedIn layout)

- **Card:** [Escolhidos v2: persona + perfil LinkedIn (layout página real)](https://trello.com/c/aTIPjSjZ)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção)
- **ID:** `6ae9dd6525adce9bc153a2b1`
- **Descrição:** [`card-description.md`](card-description.md)

## Objetivo

Documento dos 6 escolhidos com **A) persona** (interno) + **B) mock da página LinkedIn** (banner + foto + sobre + experiência).

## Entrega

| Artefato | Caminho |
|---|---|
| PDF | [`reports/Vendedores-escolhidos-v2-linkedin-layout.pdf`](reports/Vendedores-escolhidos-v2-linkedin-layout.pdf) |
| MD | [`escolhidos-v2.md`](escolhidos-v2.md) |
| HTML (fonte do PDF) | [`reports/escolhidos-v2.html`](reports/escolhidos-v2.html) |
| Gerador | [`generate-escolhidos-v2.mjs`](generate-escolhidos-v2.mjs) |
| CSV / fotos / banners | [`vendedores.csv`](vendedores.csv) · [`avatars/`](avatars/) · [`banners/`](banners/) |

## Regenerar

```bash
cd screen-robot/tasks/6ae9dd6525adce9bc153a2b1
node generate-escolhidos-v2.mjs
```

**Antes → depois:** PDF escolhidos só texto/foto → v2 com duas seções e mock LinkedIn + banners BR Supply. Rollback: usar [`../6ae9db12f2929dff03af4f93/`](../6ae9db12f2929dff03af4f93/README.md).

## Rollback

```bash
rm -rf screen-robot/tasks/6ae9dd6525adce9bc153a2b1
trello card:archive --id 6ae9dd6525adce9bc153a2b1
```
