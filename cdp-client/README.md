# Edge Client (cdp-client) — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do cliente instalável que executa comandos remotos via WebSocket, antes de PRD ou código.  
**Importante:** fonte de verdade do produto — sem ela, instalador, daemon e host divergem.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) → plano → implementação.

Derivados: [`docs/`](docs/README.md) · plano: [`docs/plano-implementacao.md`](docs/plano-implementacao.md).  
Timeline de prompts: [`prompts/`](prompts/README.md).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

**Pasta:** `cdp-client/` (nome histórico). **Produto:** agente de **execução remota de comandos** no desktop — não um client “só CDP”.  
**Também chamado** Edge Client / command client / agente no desktop.  
**Não confundir com** [`gestao-cdps`](../gestao-cdps/README.md) (console gráfico no lab), [`human-cdp`](../screen-robot/pocs/chrome-cdp/human-cdp/README.md) (API de input humano no Chrome) nem com o Chrome remoto do lab (`start-*.sh` / `connectCdp`). Este projeto é o **binário que o cliente instala na própria máquina** e que **fica em background**, reconectando ao host WebSocket a cada boot, pronto para **rodar o que o servidor pedir**.

---

## Visão

O **Edge Client** é um **agente de desktop multiplataforma** (Linux, macOS, Windows) que o cliente **instala uma vez**. Na primeira execução ele **se registra como serviço em background** e **mantém uma conexão WebSocket persistente** com um **host configurado**. Sempre que a máquina ligar, o client **volta sozinho** e **reabre o canal**.

Pelo canal, o **servidor/host envia comandos arbitrários** (envelope tipado); o client **despacha para o handler** correspondente e devolve o resultado. **CDP / Chrome / human-cdp** são **um conjunto de comandos** entre outros — não o único propósito do produto.

## Problema

Falta um **agente instalável** na máquina do **cliente final** que:

| Dor | O que acontece hoje |
|-----|---------------------|
| **Sem presença remota** | O host não tem um executor na máquina do cliente sempre ligado |
| **Só automação local** | Comandos (browser, shell, apps, futuros) não chegam de forma unificada |
| **Setup manual** | Subir runtime (ex.: Chrome/CDP) e deixar a sessão viva exige intervenção |
| **Sem boot** | Reinício da máquina derruba o canal; ninguém reconecta sozinho |
| **SO fragmentado** | Linux / Mac / Windows exigem caminhos diferentes de serviço e instalador |
| **Confusão com o lab** | Gestão de CDPs e human-cdp resolvem operação **no lab**, não o edge no desktop do cliente |
| **Visão estreita “só CDP”** | Tratar o client como ponte CDP exclusiva impede o host de orquestrar outras ações na mesma máquina |

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Cliente final** | Quem instala o client na própria máquina | Instalar, configurar o host e esquecer — background + boot |
| **Operador / host** | Quem controla frota via WebSocket | Ver o client online, **enviar qualquer comando suportado**, receber resultado |
| **Produto / Agent Shop** | Quem precisa de “mãos” no desktop do usuário | Provisionar o client como runtime de execução remota |
| **Dev do lab** | Quem mantém human-cdp / Gestão de CDPs | Usar o client como **edge**; CDP/human-cdp = handlers, não o produto inteiro |

## Objetivo

Ser o **agente padrão no desktop do cliente**: instalável cross-platform que, após a primeira execução, **roda em background**, **inicia no boot**, **permanece conectado** ao WebSocket do host e **executa comandos** que o servidor despachar — CDP incluso, não exclusivo.

## Proposta de valor

O cliente **roda o instalador uma vez**; o client **vira serviço**, **abre o canal** e **sobrevive a reinícios**. O host remoto passa a ter um **executor estável** naquela máquina: manda comando → client executa → responde.

| Necessidade | O que o Edge Client faz |
|-------------|-------------------------|
| Instalar em qualquer SO | Binário / pacote para Linux, macOS e Windows |
| Primeira execução = setup | Grava config (URL do WebSocket, id, opções), registra serviço de boot |
| Background | Processo daemon/serviço sem UI obrigatória no dia a dia |
| Sempre no boot | LaunchAgent / systemd / Windows Service (ou equivalente suportado) |
| Canal persistente | WebSocket ao host; reconnect com backoff se a rede cair |
| Execução de comandos | Envelope `command` tipado; registry de handlers no client |
| CDP quando pedido | Handler(s) Chrome/`--remote-debugging-port` + human-cdp para gestos |
| Outros comandos | Qualquer handler registrado (shell controlado, filesystem, apps, etc. — contrato no PRD) |

### Modelo de comando (essência)

```text
Host  --WS-->  Client
                 │
                 ├─ command.type = "cdp.*"     → ponte Chrome / human-cdp
                 ├─ command.type = "shell"     → execução local (política no PRD)
                 ├─ command.type = "…"         → handler futuro
                 └─ result / error  --WS--> Host
```

O servidor **escolhe o comando**; o client **não assume** que todo tráfego é CDP.

### Exemplos

**Instalação** — Ana baixa o client, informa `wss://host.exemplo/ws` e um token; o instalador registra o serviço.

**Boot** — Reinicia o notebook; o serviço sobe, reconecta o WebSocket e o host volta a ver o client `online`.

**Queda de rede** — Wi-Fi cai; o client reconecta com backoff até o host aceitar de novo — sem intervenção.

**Comando CDP** — O host envia `cdp.screenshot` (ou gesto via human-cdp); o client aplica no Chrome local e devolve o resultado.

**Comando genérico** — O host envia outro `command.type` suportado; o client despacha ao handler e responde — **mesmo canal**, sem client paralelo.

## Princípios

1. **Client = executor de comandos** — CDP é capability/handler, não a identidade do produto.
2. **Cross-platform de verdade** — um produto, três SOs; diferença só na camada de serviço/instalador.
3. **Primeira execução instala o background** — não depender de o usuário “deixar uma janela aberta”.
4. **Boot = reconnect** — ligar a máquina implica client up + WebSocket tentando host.
5. **Handlers plugáveis** — protocolo de envelope + registry; novos tipos sem redesenhar o daemon.
6. **CDP via Chrome com debug remoto** quando o comando for de browser — alinhado ao lab (`browser-via-cdp`).
7. **Input humano quando houver gesto CDP** — cliques/type passam por **human-cdp** (foco lógico + trajetória); sem `el.click()` / press solto.
8. **Host configurável** — URL/credencial do WebSocket são config do client, não hardcoded de um único produto.
9. **Mínima superfície no desktop** — status/tray opcional; o núcleo é o daemon.
10. **Política de permissão no PRD** — o que o host pode pedir (allowlist de tipos, sandbox de shell, etc.) é contrato explícito, não “qualquer binário sem freio” por omissão.

## Stack (direção)

| Camada | Direção | Motivo |
|--------|---------|--------|
| Runtime do agente | **Go** (binário único) *ou* **Node** empacotado | Cross-compile / um artefato por SO |
| Dispatcher de comandos | Registry `type → handler` no daemon | CDP e não-CDP no mesmo processo/canal |
| Handler CDP | Node + [`human-cdp`](../screen-robot/pocs/chrome-cdp/human-cdp/README.md) (sidecar ou mesmo processo se Node) | Reusar foco + trajetória |
| Canal | WebSocket (TLS preferencial: `wss://`) | Pedido central; reconnect |
| Boot | systemd (Linux) · LaunchAgent (macOS) · Windows Service / Task Scheduler | Nativo por SO |
| Chrome | Perfil local + `--remote-debugging-port` | Só quando comandos CDP estiverem em uso |

Decisão Go vs Node puro fica no plano (Fase 0/1): critério = **um instalável simples** + **handlers (incl. human-cdp) sem fricção**.

## Fora de escopo (visão)

- UI rica de gestão de frota (isso é [`gestao-cdps`](../gestao-cdps/README.md))
- Substituir human-cdp ou LinkedIn Human CDP
- Controles que roubam foco do SO (`Page.bringToFront`, `osascript activate`) salvo pedido explícito do operador no host
- AVD / screen-robot Android (outro runtime)
- Definir aqui a allowlist completa de comandos não-CDP (fica no PRD)

## Relacionados

| Projeto | Papel |
|---------|--------|
| [`human-cdp`](../screen-robot/pocs/chrome-cdp/human-cdp/README.md) | Handler de input humano no CDP |
| [`gestao-cdps`](../gestao-cdps/README.md) | Console no lab (pode consumir clients online) |
| [`agent-shop`](../agent-shop/README.md) | Produto que pode provisionar o client como “mãos” no desktop |
| [`linkedin-human-cdp`](../linkedin-human-cdp/README.md) | Ops LinkedIn sobre CDP — possível consumidor remoto via host |

## Próximos passos

1. Validar esta visão (executor genérico + CDP como handler).  
2. Seguir [`docs/plano-implementacao.md`](docs/plano-implementacao.md).  
3. PRD (contrato WebSocket: envelope de comando + handlers + lifecycle install/boot/reconnect).
