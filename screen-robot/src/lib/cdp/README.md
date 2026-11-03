# LinkedIn actions — CDP (espelho AVD)

Mesmas interfaces das libs AVD (`src/lib/linkedin-*.js`) para workers, usando Chrome + [`human-cdp`](../../../pocs/chrome-cdp/human-cdp/README.md).

| AVD (`serial`) | CDP (`page` \| `cdpId` \| `cdpUrl`) |
|----------------|-------------------------------------|
| `connectByLinkedInUrl` | `./linkedin-connect.js` |
| `extractRecentConnections` | `./linkedin-extract-connections.js` |
| `sendLinkedInMessage` | `./linkedin-message.js` |
| `listUnreadMessages` | `./linkedin-unread-messages.js` |
| `listProfileMessages` | `./linkedin-profile-messages.js` |
| extract leads (job) | `./linkedin-extract-leads.js` → `extractLeads` |

## Sessão

```js
import { connectByLinkedInUrl } from "./linkedin-connect.js";

// registry (~/chrome-profiles/marina-costa)
await connectByLinkedInUrl({ cdpId: "marina-costa", url: "https://www.linkedin.com/in/…" });

// porta explícita
await connectByLinkedInUrl({ cdpUrl: "http://127.0.0.1:9224", url: "…" });

// sessão já aberta
await connectByLinkedInUrl({ page, url: "…" });
```

| Opt AVD | Opt CDP | Default |
|---------|---------|---------|
| `serial` | `page` / `cdpId` / `cdpUrl` (`CDP_ID` / `CDP_URL`) | — |
| `closeApp` | `closePage` (legado) | WS CDP sempre desconecta se a sessão foi criada aqui; Chrome/aba ficam abertos |
| `notifyApi`, `agentId`, `dryRun`, `outDir` | iguais | iguais |

Retornos (`ok`, `status`, `steps`, `notify`/`db`, …) iguais ao AVD.

## API HTTP (workers)

Espelho de `linkedin-connect-api` (AVD :3099):

```bash
cd screen-robot/src
CDP_ID=marina-costa npm run linkedin-connect-api-cdp   # :3098
curl -s -X POST http://127.0.0.1:3098/connect -H 'content-type: application/json' \
  -d '{"url":"https://www.linkedin.com/in/…"}'
```

Endpoints: `POST /connect`, `POST|GET /connections`, `POST /message`, `POST|GET /unread-messages`, `POST /profile-messages`, `POST /extract-leads`.

## CLI

```bash
CDP_ID=marina-costa npm run linkedin-connect-cdp -- --url 'https://www.linkedin.com/in/…'
CDP_URL=http://127.0.0.1:9224 npm run linkedin-extract-connections-cdp -- --n 20
CDP_ID=… npm run linkedin-message-cdp -- --url '…' --text 'Oi'
CDP_ID=… npm run linkedin-unread-messages-cdp -- --max 20
CDP_ID=… npm run linkedin-profile-messages-cdp -- --url '…' --max 10
CDP_ID=… npm run linkedin-extract-leads-cdp -- -n 5 --query 'comprador'
```

## Antes → depois

- Só AVD (`serial` + uiautomator/OCR) → libs CDP com o mesmo contrato para workers web.
- Scripts ad-hoc em `pocs/chrome-cdp/linkedin-*-cdp.mjs` (signup/setup) continuam; **ações de worker** passam por aqui.
- **extract leads CDP:** abria cada `/in/` após o card → **só lista**: parse do HTML/texto do card (name, title, city, current/past, level, action, mutual, photoUrl/photoBase64, profileUrl); sem `goto` no perfil. **Paginação:** ~10/página (`page=1`, `page=2`, …) quando `n > 10`. `POST /profiles` manda `agentId`+`profileUrl` de cara (API reserva conexão).
- **avatar `photoBase64`:** `fetch`/canvas da CDN LinkedIn falham (CORS / canvas tainted) → clip `Page.captureScreenshot` no retângulo do `<img>` → `data:image/jpeg;base64,…` no POST. Rollback: volte `toDataUrl(fetch)` no browser (vai voltar a gravar `null`).
- **Message ≠ conectado:** botão “Enviar mensagem” em **2º/3º** (Open Profile) ia para status=2 → agora só 1º+Message = connected; Message+3º → `connect` (candidato). `POST` manda `inviteStatus` canônico. Rollback: `inviteStatusFromAction` Message→connected cego.

**Rollback:** use as libs AVD / `npm run linkedin-connect-api`; remova `src/lib/cdp/` e scripts `*-cdp`.

## Proibido

- `Page.bringToFront` / `Target.activateTarget` / `osascript activate` (bloqueados no human-cdp)
- `el.click()` / `dispatchEvent` / `Input.*` solto fora do human-cdp — só `page.click` / `clickAt` / `type` / `fill` / `scroll`
- **Connect CDP:** Mais → `menuitem` Conectar → **Enviar sem nota** (`aria-label`, em open shadow) → Pending.
- **Enviar sem nota:** `document.querySelector` não acha (shadow) → `findSkipInvite` percorre `shadowRoot` e `page.clickAt` no centro. Rollback: `querySelector('button[aria-label="Enviar sem nota"]')` cego.
