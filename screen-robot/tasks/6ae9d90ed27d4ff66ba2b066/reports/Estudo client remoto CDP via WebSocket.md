# Estudo: client remoto (instalador + agent leve CDP via WebSocket)

**Card:** [3Glk2RLz](https://trello.com/c/3Glk2RLz) · **Data:** 2026-11-03  
**Contexto local:** `human-cdp` + `start-*.sh` no lab ([`pocs/chrome-cdp/`](../../../pocs/chrome-cdp/README.md))

## 1. Problema → proposta

Hoje o Chrome com `--remote-debugging-port` e a lib `human-cdp` vivem na mesma máquina do operador. Para frota em PCs de terceiros, a pessoa só deve instalar um pacote leve; o **servidor** cadastra o device e emite operações CDP — sem Node/npm no client e **sem expor a porta CDP na internet**.

**Modelo escolhido:** agent **outbound** (client diala WSS para o servidor). Funciona atrás de NAT/firewall; o servidor nunca abre porta no PC da pessoa.

```text
┌──────────────┐  WSS (auth+proto)  ┌─────────────────┐  CDP WS :922x  ┌────────────┐
│  Servidor    │◄──────────────────►│  Agent leve     │◄──────────────►│  Chrome    │
│  (Node ok)   │  cmds / eventos    │  (binário Go)   │  localhost     │  + perfil  │
│  human-cdp   │                    │  + instalador   │                │            │
└──────────────┘                    └─────────────────┘                └────────────┘
        ▲
        │ HTTP/API (lista devices, emite op)
   Dashboard / scripts
```

**Camada humana:** fica no **servidor** (reusa `human-cdp`). O agent é um **pipe CDP** + lifecycle do Chrome — não reimplementa trajetória no client na v1.

## 2. Instalador

| Item | Decisão v1 |
|------|-----------|
| OS alvo | **macOS** (lab atual) + Linux; Windows depois |
| Artefato | 1 binário `sr-agent` + script/app que registra token |
| Chrome | Pré-instalado **ou** detector + link para baixar; agent lança com flags CDP |
| Perfil | `~/Library/Application Support/sr-agent/profiles/<deviceId>/` (equivalente a `~/chrome-profiles`) |
| Permissões | Rede egress HTTPS/WSS; sem Accessibility/Screen Recording (só CDP) |
| UX | “colar token” → agent sobe → device aparece no servidor |
| Update | HTTP check + replace binário (assinatura); sem auto-update forçado na POC |

Flags Chrome alinhadas ao lab: `--remote-debugging-port=<local>` `--user-data-dir=<perfil>` `--remote-allow-origins=*` (só localhost). Porta **só 127.0.0.1**.

## 3. Runtime do agent — comparação

| Critério | Go | Rust | Python embutido | Node |
|----------|----|------|-----------------|------|
| Binário único | sim (~8–15 MB) | sim (~2–8 MB) | PyInstaller ~30–50 MB+ | precisa runtime / pkg pesado |
| WebSocket | std / gorilla / nhooyr | tokio-tungstenite | websockets | nativo |
| CDP | `chromedp` + [chromedp-proxy](https://github.com/chromedp/chromedp-proxy) | crates ad-hoc | pychrome | já temos no lab |
| Cross-compile | excelente (`GOOS/GOARCH`) | bom, mais atrito | frágil | médio |
| Manutenção time JS | curva baixa | curva alta | média | alta no client (evitar) |
| Tamanho / cold start | bom | melhor | pior | pior no client |

### Recomendação: **Go**

- Binário estático, fácil de distribuir e cross-compilar (darwin/linux/amd64/arm64).
- Ecossistema CDP maduro (`chromedp`, proxy de referência).
- Equilíbrio tamanho × velocidade de entrega; card pede **não-Node** no client.
- Rust vence em tamanho/RSS, mas o agent v1 é thin pipe — ganho não justifica o custo agora.
- Python embutido e Node violam o objetivo de runtime mínimo.

## 4. Controle CDP local (no agent)

Responsabilidades do agent:

1. Garantir Chrome up (spawn ou attach se porta já em LISTEN + mesmo perfil).
2. Descobrir `webSocketDebuggerUrl` via `http://127.0.0.1:PORT/json/version` e `/json/list`.
3. Manter 1 WS CDP local; multiplexar pedidos do servidor.
4. Encaminhar **JSON-RPC CDP** bidirecional (commands + events).
5. Telemetria: Chrome version, target count, RSS, uptime, lastError.

**Não** no agent v1: trajetória humana, OCR, `Page.bringToFront` / activate SO (mesmas regras do lab).

Referência útil: `chromedp-proxy` (proxy WS CDP + `/json`) — padrão de bridge, não produto final (ele *expõe* porta; nosso agent *sai* por WSS).

## 5. Canal WebSocket ↔ servidor

### 5.1 Transporte e auth

- URL: `wss://<host>/agent/v1?device_id=<id>`  
- Auth: header `Authorization: Bearer <token>` **ou** 1ª mensagem `hello` com token (preferir header).
- Token = enrollment one-time ou device credential rotativo.
- TLS obrigatório fora do lab; lab pode `ws://127.0.0.1`.

### 5.2 Handshake / cadastro

```json
// client → server
{ "type": "hello", "proto": 1, "token": "...", "meta": {
  "hostname": "macbook-ana",
  "os": "darwin", "arch": "arm64",
  "agentVersion": "0.1.0",
  "chrome": { "version": "131.0.x", "port": 9222, "profile": "default" },
  "caps": ["cdp.raw", "screenshot"]
}}

// server → client
{ "type": "welcome", "deviceId": "dev_…", "heartbeatSec": 20 }
```

Cadastro persiste: `deviceId`, meta, `status` (`online`|`offline`|`busy`|`error`), `lastSeen`.

### 5.3 Heartbeat / reconexão

- Client envia `{ "type": "ping", "ts": … }` a cada `heartbeatSec`; server responde `pong`.
- Drop → exponential backoff (1s…30s) + re-`hello` com mesmo `deviceId`/credencial.
- Server marca `offline` após 2–3 heartbeats perdidos.

### 5.4 Protocolo de operação (esboço)

Envelope comum:

```json
{ "v": 1, "id": "msg_…", "type": "<kind>", "payload": { } }
```

| type | Direção | Payload |
|------|---------|---------|
| `cdp.send` | S→C | `{ "method", "params", "sessionId?" }` — JSON-RPC CDP |
| `cdp.result` | C→S | `{ "id", "result" \| "error" }` correlacionado ao `id` do send |
| `cdp.event` | C→S | `{ "method", "params", "sessionId?" }` (ex. `Target.*`, `Page.*`) |
| `chrome.ensure` | S→C | `{ "port?", "profile?", "url?" }` — sobe/reusa Chrome |
| `chrome.status` | C→S | estado local |
| `screenshot` | S→C | atalho → `Page.captureScreenshot` (opcional na POC) |
| `error` | C→S | `{ "code", "message" }` |

Correlação: cada `cdp.send` usa `id`; agent ecoa no `cdp.result`.

**Fluxo operação remota:**

```text
API/UI → server escolhe device online
      → WSS cdp.send (Input.dispatchMouseEvent / Page.navigate / …)
      → agent → CDP localhost
      → cdp.result (+ cdp.event assíncronos)
      → human-cdp no server orquestra sequência (click = vários sends)
```

Assim `createCdpSession` do lab pode ganhar um transport “remote” que fala o proto em vez de `WebSocket(wsUrl)` local.

## 6. Operação pelo servidor

| Peça | Papel |
|------|-------|
| Registry de devices | CRUD mínimo (id, meta, status, lastSeen) — espelha ideia do [CRUD CDPs](https://trello.com/c/hoLSkLko) |
| Hub WSS | conexões agent + roteamento por `deviceId` |
| API | `GET /devices`, `POST /devices/:id/cdp` (body = method/params) |
| Adapter | `human-cdp` com transport remoto |
| UI frota | **fora** — card [A1h6DvaX](https://trello.com/c/A1h6DvaX) |

POC pode ser só CLI/API sem dashboard.

## 7. Riscos

| Risco | Mitigação |
|-------|-----------|
| Token vazado = controle do Chrome | token por device, rotação, escopo mínimo, revoke |
| CDP na LAN/internet | bind **127.0.0.1** apenas; nunca abrir 9222 externo |
| Superfície do agent | binário assinado; sem shell remoto genérico na v1 |
| Chrome ausente / porta ocupada | `chrome.ensure` + erros claros; reusar se LISTEN + perfil ok |
| Update malicioso | HTTPS + checksum/assinatura |
| Foco / janela | mesma política lab: só `Emulation.setFocusEmulationEnabled`; sem activate SO |
| Firewall/NAT | outbound WSS resolve; proxy corporativo HTTP CONNECT a validar |
| Event flood CDP | filtrar domains; backpressure no hub |
| Multi-aba / sessionId | passar `sessionId` no envelope (como `human-cdp` já faz) |

## 8. Fora de escopo / próximo passo (POC)

**Fora (este card):** instalador produção, multi-tenant, dashboard frota, agent com lógica humana embarcada.

**POC sugerida (próximo card):**

1. Binário Go mínimo: sobe/conecta Chrome local + WSS echo ao server Node de lab.
2. Mensagens: `hello` / `ping` / `cdp.send` / `cdp.result` / `cdp.event`.
3. Server: lista 1 device + `Page.navigate` + `Page.captureScreenshot` round-trip.
4. Opcional: plugar transport remoto no `createCdpSession` e rodar 1 teste `human-cdp` (click) contra o agent.
5. Critério de aceite: máquina “remota” (outro user-data-dir) operada só via WSS, sem Node no client.

## 9. Decisões resumidas

| Tema | Decisão |
|------|---------|
| Topologia | Agent outbound WSS; CDP só localhost |
| Runtime client | **Go** (binário único) |
| Lógica humana | Servidor (`human-cdp`); agent = pipe + Chrome lifecycle |
| Protocolo | JSON envelopes `hello` / `cdp.*` / heartbeat |
| Instalador v1 | Binário + token; perfil dedicado; Chrome detect/launch |
| Próximo | Card POC agent Go + hub WSS mínimo |
