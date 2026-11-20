# 002 — Client como executor de comandos (não só CDP)

| Campo | Valor |
|-------|-------|
| Data | 2026-11-20 |
| Status | feito |

## Original

O projeto do client do human CDP lá, que foi criado anteriormente no projeto, pesquise ele, ele não deve ser focado apenas pra comando CDP, mas deve ser focado como um client de execução de comandos como um todo. Então, se é... Os comandos não, não, não precisam ser apenas CDP, pode ser qualquer comando. Então, o servidor pode acionar um client a executar um determinado comando que ele quiser. Não apenas CDP, mas todos.

## Interpretação

- Localizar o projeto `cdp-client/` (visão docs-only do agente desktop).
- Realinhar produto: de “ponte CDP” para **executor remoto de comandos** via WebSocket.
- CDP / human-cdp passam a ser **um handler** entre outros; o host escolhe o `command.type`.
- Atualizar visão, plano, config IA e índice; salvar este prompt.

## Feito

- Visão (`README.md`) reescrita: Edge Client = dispatcher de comandos; modelo envelope + handlers.
- Plano: Fase 3 = dispatcher + eco + handler CDP; Fase 7 = handler não-CDP; aceite MVP cobre ambos.
- `config/config-ia.md`, `docs/README.md`, linha no `works/README.md`.
- Pasta mantida `cdp-client/` (nome histórico); produto descrito como Edge Client / command client.
