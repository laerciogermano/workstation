# Task Trello: Trajetória contínua do mouse

- **Card:** [Trajetória contínua do mouse (sem teleportes) na human-cdp](https://trello.com/c/5N5E2vlJ)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção) · lista `Em andamento`
- **ID:** `6ae8dd3e5c359e796ef30a66`
- **Descrição:** [`card-description.md`](card-description.md)

## Implementação

- Trajetória densificada + timing ≥16ms: [`../../pocs/chrome-cdp/human-cdp/src/human.mjs`](../../pocs/chrome-cdp/human-cdp/src/human.mjs)
- Cursor persistente por CDP + press na posição atual: [`../../pocs/chrome-cdp/human-cdp/src/session.mjs`](../../pocs/chrome-cdp/human-cdp/src/session.mjs)
- Aceite: bot-lab nos dois ometv → trajetória **pass** · veredito **humano**

## Relacionados

- Lib humana: [`../6ae8ac1d5228997f864b40c5/README.md`](../6ae8ac1d5228997f864b40c5/README.md)
- Lab: [`../../pocs/bot-lab/README.md`](../../pocs/bot-lab/README.md)
