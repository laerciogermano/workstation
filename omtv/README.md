# OmTV — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do robô de marketing no OmeTV antes de histórias, telas ou código.  
**Importante:** fonte de verdade do produto — sem ela, operação e derivados divergem.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) → PRD / discovery → implementação.

Derivados: [`docs/`](docs/README.md).  
Timeline de prompts: [`prompts/`](prompts/README.md).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

**Não confundir com** [`ov/`](../ov/README.md) (criação e gestão de **contas** OmeTV via CDP). O OmTV é o **robô de marketing** que opera a sessão: vídeo, mensagens e conversas. Contas vêm do OV; a cadência de market é daqui. Também não é [`low-chat`](../low-chat/README.md) sozinho (só camada de reply) nem Connect (LinkedIn).

---

## Visão

O **OmTV** é o robô de marketing para o **OmeTV**: escolhe o **vídeo** a exibir, dispara **mensagens automáticas** e conduz **conversas automáticas** pedidas por IA — com operação via Chrome/CDP no lab.

## Problema

No OmeTV, marketing manual não escala: alguém precisa ficar na sessão, escolher o que aparece na câmera/vídeo, cumprimentar, manter papo e repetir isso em várias contas.

| Dor | O que acontece hoje |
|-----|---------------------|
| **Presença sem escala** | Humano na cadeira por conta; poucas sessões simultâneas. |
| **Vídeo improvisado** | Sem fluxo claro para **selecionar e trocar o vídeo** que alimenta a sessão. |
| **Mensagem repetitiva à mão** | Cumprimentos e pitches digitados um a um; ritmo irregular. |
| **Conversa sem continuidade** | Sem persona + histórico + IA, o papo morre ou vira script rígido. |
| **Conta ≠ marketing** | Ter conta (OV) não resolve cadência de vídeo + mensagem + conversa. |

Já existe conta e browser no lab. Falta o **produto de marketing** que orquestra vídeo + mensagens + conversa por IA.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Operador de market** | Quem roda campanhas no OmeTV | Escolher vídeo, ligar automação de mensagem/conversa, acompanhar status |
| **Dono da operação** | Quem define oferta e limites | Persona, scripts, o que a IA pode dizer, quando pausar |
| **Operação lab** | Quem mantém CDP / contas | Runtime saudável; contas OV ligadas ao robô |

## Objetivo

Ser o robô padrão de **marketing no OmeTV**: **selecionar vídeo**, enviar **mensagens automáticas** e manter **conversas automáticas com IA**, sobre as contas e o stack CDP do lab.

## Proposta de valor

O OmTV trata a sessão OmeTV como **canal de market operável**: mídia de vídeo + outbound de mensagens + diálogo com IA, sem o operador digitar cada linha.

| Necessidade | O que o OmTV faz |
|-------------|------------------|
| Escolher o que aparece | **Selecionar / trocar o vídeo** da sessão (arquivo de vídeo — não “adicionar câmera” física) |
| Abrir conversa | **Mensagens automáticas** (cumprimento, pitch, follow-up) |
| Manter papo | **Conversas automáticas** com persona e pedidos/regras definidos para a IA |
| Operar em escala | Rodar sobre contas/perfis CDP já provisionados (OV + human-cdp) |
| Controlar risco | Pausar, limites de conteúdo e handoff para humano quando pedido |

### Exemplos

**Vídeo da campanha** — Operador escolhe o arquivo de vídeo da oferta; o robô usa esse vídeo na sessão OmeTV.

**Abertura automática** — Ao casar com alguém, o robô envia a mensagem de abertura configurada.

**Conversa pedida por IA** — Com persona e objetivo (“qualificar interesse / direcionar para link”), a IA gera replies no fio até limite ou handoff.

**Troca de mídia** — No meio da operação, o operador seleciona outro vídeo; a sessão passa a usar o novo arquivo.

## Princípios

1. **Vídeo selecionável** — a mídia da sessão é escolha explícita de arquivo/vídeo, não gambiarra de câmera física no produto.
2. **Mensagem e conversa são camadas** — templates/automação de abertura ≠ diálogo contínuo com IA.
3. **Conta é pré-requisito, não o produto** — OV cria/mantém contas; OmTV faz market.
4. **IA com pedido e limites** — a conversa segue objetivo e regras do operador; não é chat livre sem política.
5. **CDP com foco lógico + trajetória** — interação via `human-cdp` (sem teleporte / sem `el.click()`).

## Escopo da visão

### Capacidades (v1)

| Área | Em escopo |
|------|-----------|
| **Seleção de vídeo** | Escolher arquivo de vídeo para a sessão; trocar durante a operação |
| **Mensagens automáticas** | Templates / filas de abertura e follow-up |
| **Conversas por IA** | Replies com persona, objetivo e histórico da thread |
| **Sessão OmeTV** | Operar match/chat via Chrome + CDP (`human-cdp`) |
| **Contas** | Usar contas/perfis já existentes (integração com OV / CDP ids) |
| **Controle** | Start/pause, status da sessão, log básico do que foi enviado |
| **Handoff** | Pausar IA e devolver o chat ao humano |

### Fora de escopo (v1)

- Criação em massa de contas Facebook/OmeTV (fica no [`ov/`](../ov/README.md))
- App mobile nativo
- Marketplace de scripts de terceiros
- Pagamento / billing dentro do OmTV
- Automação fora do OmeTV (Tinder, LinkedIn, etc.)

## Modelo conceitual

### Conta / perfil CDP

Identidade já logada no OmeTV (gerida no OV). O OmTV **consome**, não provisiona.

### Vídeo de sessão

Arquivo de vídeo escolhido pelo operador para alimentar a presença visual da sessão.

### Campanha / persona

Objetivo de market, tom, mensagens de abertura e regras do que a IA pode dizer.

### Mensagem automática

Envio disparado por evento (ex.: novo match) a partir de template ou fila.

### Conversa automática

Loop: mensagem_in → persona + histórico + pedido → reply (IA) → envio no canal OmeTV.

### Sessão

Uma conta + um vídeo + políticas de mensagem/conversa rodando até pause/fim.

## Critérios de sucesso (visão)

- Operador **seleciona um vídeo** e a sessão OmeTV usa esse vídeo.
- Mensagens automáticas saem no evento configurado sem digitação manual.
- Conversas pedidas por IA mantêm o fio com persona e objetivo até limite ou handoff.
- Contas OV existentes ligam ao robô sem recriar o fluxo de signup.

## Fora / adjacências

| Projeto | Papel |
|---------|--------|
| [`ov/`](../ov/README.md) | Contas OmeTV + planilha + signup CDP |
| [`low-chat`](../low-chat/README.md) | Camada reutilizável de persona + LLM (candidato a núcleo de reply) |
| [`human-cdp`](../screen-robot/pocs/chrome-cdp/human-cdp/README.md) | Clique/type com foco + trajetória |
| Connect / ConnectMax | Prospecção LinkedIn — outro canal |

## Próximos passos

1. Validar e refinar **este** documento de visão com o operador.
2. [`docs/`](docs/README.md) → PRD / funcionalidades.
3. Discovery (épicos / stories) só depois da visão estável.
