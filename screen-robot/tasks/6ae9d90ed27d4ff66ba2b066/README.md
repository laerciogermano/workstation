# Task Trello: Estudo client remoto CDP via WebSocket

- **Card:** [Estudo: client remoto (instalador + agent leve CDP via WebSocket)](https://trello.com/c/3Glk2RLz)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção) · lista `Concluído`
- **ID:** `6ae9d90ed27d4ff66ba2b066`
- **Descrição:** [`card-description.md`](card-description.md)

## Objetivo

Estudar arquitetura de client remoto: instalador + agent leve (não-Node) que controla Chrome via CDP e se conecta ao servidor por WebSocket.

## Entrega

| Artefato | Caminho |
|---|---|
| Estudo (arquitetura + runtime + protocolo + POC) | [`reports/Estudo client remoto CDP via WebSocket.md`](reports/Estudo%20client%20remoto%20CDP%20via%20WebSocket.md) |
| Notas | [`research_notes/`](research_notes/) |

**Decisão:** agent **Go** outbound WSS; CDP só localhost; `human-cdp` permanece no servidor.

## Relacionados

- Lib humana: [`../6ae8ac1d5228997f864b40c5/README.md`](../6ae8ac1d5228997f864b40c5/README.md) · [5tt5ZTeN](https://trello.com/c/5tt5ZTeN)
- CRUD CDPs: [`../6ae8b23dccd25f22a26e5916/README.md`](../6ae8b23dccd25f22a26e5916/README.md) · [hoLSkLko](https://trello.com/c/hoLSkLko)
- Dashboard frota: [`../6ae8ef85ddea48cb1414b3be/README.md`](../6ae8ef85ddea48cb1414b3be/README.md) · [A1h6DvaX](https://trello.com/c/A1h6DvaX)

## Rollback

```bash
rm -rf screen-robot/tasks/6ae9d90ed27d4ff66ba2b066
trello card:archive --id 6ae9d90ed27d4ff66ba2b066
```
