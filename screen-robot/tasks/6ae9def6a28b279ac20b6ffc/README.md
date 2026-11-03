# Task Trello: Enriquecer Sobre e Experiências (escolhidos)

- **Card:** [Enriquecer Sobre e Experiências dos escolhidos (estudo + CDP LI)](https://trello.com/c/VMn5CsD0)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção)
- **ID:** `6ae9def6a28b279ac20b6ffc`
- **Descrição:** [`card-description.md`](card-description.md)

## Objetivo

Reescrever **Sobre** e **descrições de Experiência** dos 6 escolhidos com padrões do estudo de personas + perfis reais visitados via CDP.

## Entrega

| Artefato | Caminho |
|---|---|
| PDF v2.1 | [`reports/Vendedores-escolhidos-v2.1-sobre-experiencia.pdf`](reports/Vendedores-escolhidos-v2.1-sobre-experiencia.pdf) |
| MD | [`escolhidos-v2.1.md`](escolhidos-v2.1.md) |
| CSV | [`vendedores.csv`](vendedores.csv) · [`experiencia-por-vendedor.csv`](experiencia-por-vendedor.csv) |
| Notas CDP | [`research_notes/`](research_notes/padroes-enriquecimento.md) |

**Antes → depois:** about ~130–150 chars → ~500–700; desc. experiência ~117 → ~222 chars médios. Cargos/anos/fotos/banners iguais à v2. Rollback: [`../6ae9dd6525adce9bc153a2b1/`](../6ae9dd6525adce9bc153a2b1/README.md).

## Regenerar

```bash
cd screen-robot/tasks/6ae9def6a28b279ac20b6ffc
node generate-escolhidos-v2.mjs
```

## Rollback

```bash
rm -rf screen-robot/tasks/6ae9def6a28b279ac20b6ffc
trello card:archive --id 6ae9def6a28b279ac20b6ffc
```
