# LinkedIn Human CDP — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* da lib de operações LinkedIn sobre Chrome CDP humano antes de hosts/HTTP extras.  
**Importante:** fonte de verdade do produto lib — sem ela, workers e scripts divergem.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) → PRD / discovery → extração total do código UI.

Derivados: [`docs/`](docs/README.md).  
Timeline de prompts: [`prompts/`](prompts/README.md).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

**Também chamado** LinkedIn Human CDP API (lib, não servidor HTTP).  
**Não confundir com** [`human-cdp`](../screen-robot/pocs/chrome-cdp/human-cdp/README.md) (clique/type genéricos) nem com a [Gestão de CDPs](../gestao-cdps/README.md) (UI de frota). Esta lib é o **domínio LinkedIn** em cima do human-cdp.

---

## Visão

A **LinkedIn Human CDP** é a lib Node que **conecta a um Chrome/CDP** (perfil do registry) e expõe **um método por operação de worker LinkedIn**: conectar, últimas conexões, enviar mensagem, unread, mensagens do perfil, busca/extract de leads — sempre via trajetória/foco do **human-cdp**.

## Problema

| Dor | O que acontece hoje |
|-----|---------------------|
| **Ops espalhadas** | Funções em `screen-robot/src/lib/cdp/` + scripts + API HTTP :3098 |
| **Acoplamento ConnectMax** | `notifyApi` / agentId misturados no fluxo UI |
| **Sem fachada** | Hosts (agents, CLIs) importam módulos internos do screen-robot |
| **Risco de clique cru** | Bypass de human-cdp quebra o padrão do lab |

## Para quem

| Persona | Necessidade |
|---------|-------------|
| **Worker / agent** | Chamar `li.connect` / `li.searchLeads` sem saber DOM |
| **Dev de automação** | API estável (`createLinkedInHumanCdp`) + CDP_ID |
| **Operação lab** | Reusar o mesmo Chrome aberto (aba fecha, browser fica) |

## Objetivo

Ser a **API de programador padrão** das ações LinkedIn web no lab: uma lib, sessão human-cdp, métodos = ops do worker.

## Proposta de valor

```js
import { createLinkedInHumanCdp } from "@works/linkedin-human-cdp";

const li = createLinkedInHumanCdp({ cdpId: "marina-costa" });

await li.connect({ url: "https://www.linkedin.com/in/…" });
await li.recentConnections({ n: 20 });       // últimas conexões
await li.sendMessage({ url: "…", text: "Oi" });
await li.unreadMessages({ maxResults: 20 });
await li.profileMessages({ url: "…", maxResults: 10 });
await li.searchLeads({ query: "comprador", n: 10 });

await li.withPage(async (page) => {
  await page.goto("https://www.linkedin.com/feed/");
});
```

| Método | Worker espelhado |
|--------|------------------|
| `connect` | `connectByLinkedInUrl` |
| `recentConnections` | `extractRecentConnections` |
| `sendMessage` | `sendLinkedInMessage` |
| `unreadMessages` | `listUnreadMessages` |
| `profileMessages` | `listProfileMessages` |
| `searchLeads` / `extractLeads` | `extractLeads` |
| `withPage` / `resolvePage` | `withLinkedInPage` / `resolveLinkedInPage` |

Default: **`notifyApi: false`** (só LinkedIn). Persistência ConnectMax: `notifyApi: true` + `agentId`.

## Stack

- Sessão / input: [`human-cdp`](../screen-robot/pocs/chrome-cdp/human-cdp/README.md)
- Fluxo UI atual: ponte para [`screen-robot/src/lib/cdp/`](../screen-robot/src/lib/cdp/README.md) (`worker-bridge`)
- Proibido: `el.click()`, `Input.*` solto, `Page.bringToFront` / activate SO

## Uso

```bash
cd linkedin-human-cdp && npm install
CDP_ID=marina-costa node examples/smoke.mjs
```

## Antes → depois

- Importar `screen-robot/src/lib/cdp/*.js` + cuidar sessão → `createLinkedInHumanCdp({ cdpId })` + métodos.
- `notifyApi` default true nos workers → na lib default **false**.

**Rollback:** importar de novo `screen-robot/src/lib/cdp/`; apagar `linkedin-human-cdp/`.

## Fora do v0.1

- Servidor HTTP (continua `linkedin-connect-api-cdp` no screen-robot)
- “Quem viu seu perfil” / analytics (não existe no worker hoje)
- Extração total do DOM para fora do screen-robot (próximo passo)
