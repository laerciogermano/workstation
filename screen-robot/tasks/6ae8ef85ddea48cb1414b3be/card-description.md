## Objetivo
Criar uma **interface gráfica** para **visualizar todos os bots** do lab, ver **o que cada um está fazendo** em tempo real e **controlá-los** (iniciar, pausar, retomar, parar, abrir sessão).

## Problema
Hoje bots/CDPs/agentes vivem em terminais, scripts e pastas (`~/chrome-profiles`, AVDs, CSV). Não há painel único para enxergar frota, status e ação atual — nem botões para operar sem digitar comando.

## Escopo
1. **Lista/frota**: todos os bots conhecidos (CDPs via CRUD da lib + agentes/AVD quando aplicável) com status (up/down/idle/busy/erro)
2. **Atividade ao vivo**: o que o bot está fazendo agora (fluxo, passo, URL/tela, última ação, log curto)
3. **Controles**: start / stop / pause / resume / connect (abrir sessão) por bot; ações em lote quando fizer sentido
4. **Detalhe**: painel ou drawer com meta (porta, perfil, conta, observações) e histórico recente
5. Atualização contínua (poll ou websocket) sem precisar recarregar a página

## Entrega
- UI web local do lab (dashboard de bots)
- Integração com o contrato CRUD de CDPs (`listCdps` / `statusCdp` / `startCdp` / `stopCdp` / `connectCdp`)
- Fonte de “o que está fazendo” (evento/log/estado do agente) documentada
- Aceite: abrir UI → ver frota → ver atividade de um bot ocupado → start/stop refletidos no status

## Fora de escopo
- Orquestração multi-host / cloud
- Redesign do bot-lab de detecção
- Autenticação multi-usuário

## Relacionados
- CRUD de CDPs na lib: https://trello.com/c/hoLSkLko
- Lib humana: https://trello.com/c/5tt5ZTeN
- Lab detecção: https://trello.com/c/XcjfqioO
