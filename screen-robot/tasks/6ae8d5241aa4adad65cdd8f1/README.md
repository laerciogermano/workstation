# Task Trello: Modo debug no connect

- **Card:** [Modo debug no connect: painel de diagnóstico do bot-lab junto ao mouse](https://trello.com/c/W4GN946S)
- **Board:** [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção) · lista `Concluído`
- **ID:** `6ae8d5241aa4adad65cdd8f1`
- **Descrição:** [`card-description.md`](card-description.md)

## Implementação

- Overlay: [`../../pocs/chrome-cdp/human-cdp/src/debug-overlay.mjs`](../../pocs/chrome-cdp/human-cdp/src/debug-overlay.mjs)
- Flag em `connect` / sessão: [`../../pocs/chrome-cdp/human-cdp/src/session.mjs`](../../pocs/chrome-cdp/human-cdp/src/session.mjs)
- `connectCdp(..., { debug })`: [`../../pocs/chrome-cdp/human-cdp/src/registry.mjs`](../../pocs/chrome-cdp/human-cdp/src/registry.mjs)
- Aceite: `npm run test:debug` (bot-lab + Chrome CDP)
- Docs: [`../../pocs/chrome-cdp/human-cdp/README.md`](../../pocs/chrome-cdp/human-cdp/README.md)

## Relacionados

- Lib humana: [`../6ae8ac1d5228997f864b40c5/README.md`](../6ae8ac1d5228997f864b40c5/README.md)
- CRUD CDPs: [`../6ae8b23dccd25f22a26e5916/README.md`](../6ae8b23dccd25f22a26e5916/README.md)
- Lab: [`../../pocs/bot-lab/README.md`](../../pocs/bot-lab/README.md)
