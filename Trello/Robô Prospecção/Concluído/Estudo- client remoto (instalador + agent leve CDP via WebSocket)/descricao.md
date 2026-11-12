## Objetivo
Estudar como seria um **client remoto** na máquina da pessoa: um **instalador** sobe um **runtime mínimo** que controla o Chrome via **CDP** e se conecta ao **servidor por WebSocket**, permitindo cadastro do device e **operação remota** (emitir comandos CDP) a partir do servidor.

## Problema
Hoje CDP/human-cdp rodam no lab local. Para escalar a frota em máquinas de terceiros, precisamos de um modelo em que a pessoa só instala algo simples e o servidor passa a enxergar e operar aquele Chrome — sem depender de Node pesado no client.

## Escopo do estudo
1. **Instalador**: o que a pessoa baixa/roda (OS alvo, permissões, Chrome com remote debugging, perfil).
2. **Runtime no client** (leve, **não Node** preferencialmente): candidatos (Go, Rust, Python embutido, binário único, etc.) — critérios: tamanho, distribuição, WebSocket, CDP, manutenção.
3. **Controle CDP local**: abrir/reusar Chrome `--remote-debugging-port`, proxy de comandos CDP (click/type/navigate/screenshot etc.) alinhado à lib humana quando fizer sentido.
4. **Canal WebSocket ↔ servidor**:
   - handshake / auth
   - **cadastro do device** (meta: OS, hostname, Chrome, porta, capacidade, status)
   - heartbeat / reconexão
   - protocolo de mensagens: server → client (emitir operação CDP) e client → server (resultado, eventos, telemetria)
5. **Operação pelo servidor**: API/UI que lista devices cadastrados e emite operações CDP no device escolhido.
6. **Riscos**: segurança (token, superfície de ataque), update do agent, Chrome não instalado / porta ocupada, foco/janela, firewall/NAT.
7. **Entrega do estudo**: doc com arquitetura proposta (diagrama + fluxo), comparação de runtimes, rascunho do protocolo WS e POC mínima sugerida (próximo card).

## Entrega
- Documento de estudo (arquitetura client remoto CDP via WS)
- Recomendação de runtime do agent (com porquê)
- Esboço do protocolo (cadastro + comandos + respostas)
- Lista do que fica fora / próximo passo (POC)

## Fora de escopo
- Implementar o instalador/agent em produção
- Orquestração multi-tenant completa
- Dashboard de frota (card separado: A1h6DvaX)

## Relacionados
- Dashboard de bots: https://trello.com/c/A1h6DvaX
- Lib humana CDP: https://trello.com/c/5tt5ZTeN
- CRUD CDPs: https://trello.com/c/hoLSkLko