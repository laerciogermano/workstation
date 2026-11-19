# CDP Client — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do cliente instalável que mantém um Chrome/CDP acessível via WebSocket remoto, antes de PRD ou código.  
**Importante:** fonte de verdade do produto — sem ela, instalador, daemon e host divergem.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) → plano → implementação.

Derivados: [`docs/`](docs/README.md) · plano: [`docs/plano-implementacao.md`](docs/plano-implementacao.md).  
Timeline de prompts: [`prompts/`](prompts/README.md).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

**Também chamado** CDP Edge Client / agente CDP no desktop.  
**Não confundir com** [`gestao-cdps`](../gestao-cdps/README.md) (console gráfico no lab), [`human-cdp`](../screen-robot/pocs/chrome-cdp/human-cdp/README.md) (API de input humano) nem com o Chrome remoto do lab (`start-*.sh` / `connectCdp`). Este projeto é o **binário que o cliente instala na própria máquina** e que **fica em background**, reconectando ao host WebSocket a cada boot.

---

## Visão

O **CDP Client** é um **agente de desktop multiplataforma** (Linux, macOS, Windows) que o cliente **instala uma vez**. Na primeira execução ele **se registra como serviço em background**, sobe (ou reconecta) um **Chrome com Remote Debugging (CDP)** e **mantém uma conexão WebSocket persistente** com um **host configurado**. Sempre que a máquina ligar, o client **volta sozinho** e **reabre o canal** — o host remoto passa a enxergar e operar aquele CDP sem o usuário abrir nada manualmente.

## Problema

Hoje o CDP do lab vive em máquinas controladas (`user-data-dir`, porta fixa, scripts locais). Falta um **cliente instalável** para a máquina do **cliente final**, que:

| Dor | O que acontece hoje |
|-----|---------------------|
| **Sem presença remota** | O host não tem um agente na máquina do cliente sempre ligado |
| **Setup manual** | Subir Chrome/CDP e deixar a sessão viva exige intervenção |
| **Sem boot** | Reinício da máquina derruba o canal; ninguém reconecta sozinho |
| **SO fragmentado** | Linux / Mac / Windows exigem caminhos diferentes de serviço e instalador |
| **Confusão com o lab** | Gestão de CDPs e human-cdp resolvem operação **no lab**, não o edge no desktop do cliente |

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Cliente final** | Quem instala o client na própria máquina | Instalar, configurar o host e esquecer — background + boot |
| **Operador / host** | Quem controla frota via WebSocket + CDP | Ver o client online, enviar comandos, operar o Chrome remoto |
| **Produto / Agent Shop** | Quem precisa de “mãos” no browser do usuário | Provisionar o client como runtime de automação no desktop do dono |
| **Dev do lab** | Quem mantém human-cdp / Gestão de CDPs | Tratar o client como **edge** que expõe CDP; não misturar com o console local |

## Objetivo

Ser o **agente padrão no desktop do cliente**: um instalável cross-platform que, após a primeira execução, **roda em background**, **inicia no boot** e **permanece conectado** ao WebSocket do host configurado, mantendo um **CDP utilizável** pelo lado remoto.

## Proposta de valor

O cliente **roda o instalador uma vez**; o client **vira serviço**, **abre o canal** e **sobrevive a reinícios**. O host remoto passa a ter um **ponto CDP estável** naquela máquina.

| Necessidade | O que o CDP Client faz |
|-------------|------------------------|
| Instalar em qualquer SO | Binário / pacote para Linux, macOS e Windows |
| Primeira execução = setup | Grava config (URL do WebSocket, id, opções), registra serviço de boot |
| Background | Processo daemon/serviço sem UI obrigatória no dia a dia |
| Sempre no boot | LaunchAgent / systemd / Windows Service (ou equivalente suportado) |
| Canal persistente | WebSocket ao host; reconnect com backoff se a rede cair |
| CDP disponível | Chrome com `--remote-debugging-port` (ou perfil gerenciado) acessível via ponte do client |
| Operação remota | Host envia comandos; client executa/encaminha no CDP local (contrato a fechar no PRD) |

### Exemplos

**Instalação** — Ana baixa o client, informa `wss://host.exemplo/ws` e um token; o instalador registra o serviço e sobe o Chrome/CDP.

**Boot** — Reinicia o notebook; o serviço sobe, reconecta o WebSocket e o host volta a ver o client `online`.

**Queda de rede** — Wi-Fi cai; o client reconecta com backoff até o host aceitar de novo — sem intervenção.

**Controle** — O host (ou Gestão de CDPs / Agent Shop) envia uma ação; o client aplica no CDP local (preferência: via **human-cdp** quando o gesto for input humano).

## Princípios

1. **Cross-platform de verdade** — um produto, três SOs; diferença só na camada de serviço/instalador.
2. **Primeira execução instala o background** — não depender de o usuário “deixar uma janela aberta”.
3. **Boot = reconnect** — ligar a máquina implica client up + WebSocket tentando host.
4. **CDP via Chrome com debug remoto** — alinhado ao lab (`browser-via-cdp`); sem browser embutido do Cursor / MCP.
5. **Input humano quando houver gesto** — cliques/type passam por **human-cdp** (foco lógico + trajetória); sem `el.click()` / press solto.
6. **Host configurável** — URL/credencial do WebSocket são config do client, não hardcoded de um único produto.
7. **Mínima superfície no desktop** — status/tray opcional; o núcleo é o daemon.

## Stack (direção)

| Camada | Direção | Motivo |
|--------|---------|--------|
| Runtime do agente | **Go** (binário único) *ou* **Node** empacotado | Cross-compile / um artefato por SO; lab já é Node no CDP |
| Ponte CDP | Node + [`human-cdp`](../screen-robot/pocs/chrome-cdp/human-cdp/README.md) (sidecar ou mesmo processo se Node) | Reusar contrato de foco + trajetória |
| Canal | WebSocket (TLS preferencial: `wss://`) | Pedido central; reconnect |
| Boot | systemd (Linux) · LaunchAgent (macOS) · Windows Service / Task Scheduler | Nativo por SO |
| Chrome | Perfil local + `--remote-debugging-port` | Mesmo modelo do lab |

Decisão Go vs Node puro fica no plano (Fase 0/1): critério = **um instalável simples** + **ponte human-cdp sem fricção**.

## Fora de escopo (visão)

- UI rica de gestão de frota (isso é [`gestao-cdps`](../gestao-cdps/README.md))
- Substituir human-cdp ou LinkedIn Human CDP
- Controles que roubam foco do SO (`Page.bringToFront`, `osascript activate`) salvo pedido explícito do operador no host
- AVD / screen-robot Android (outro runtime)

## Relacionados

| Projeto | Papel |
|---------|--------|
| [`human-cdp`](../screen-robot/pocs/chrome-cdp/human-cdp/README.md) | Input humano no CDP |
| [`gestao-cdps`](../gestao-cdps/README.md) | Console no lab (pode consumir clients online) |
| [`agent-shop`](../agent-shop/README.md) | Produto que pode provisionar o client como “mãos” no desktop |
| [`linkedin-human-cdp`](../linkedin-human-cdp/README.md) | Ops LinkedIn sobre CDP — possível consumidor remoto via host |

## Próximos passos

1. Validar esta visão.  
2. Seguir [`docs/plano-implementacao.md`](docs/plano-implementacao.md).  
3. PRD (contrato WebSocket + lifecycle install/boot/reconnect) quando a visão estabilizar.
