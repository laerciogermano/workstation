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
| `closeApp` | `closeBrowser` (mata Chrome) / `keepBrowser` | **mata** o Chrome no fim (`stopCdp`) se a sessão foi criada aqui; `page` passada (nested) não mata |
| `closePage` | legado | ignorado no lifecycle; use `keepBrowser: true` ou `CDP_KEEP_BROWSER=1` p/ deixar aberto |
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
CDP_ID=daniela-hoffmann npm run linkedin-extract-connections-cdp -- --n 20
# lista vazia ("0 conexão") → ok:true count=0 (não erro)
CDP_ID=… npm run linkedin-message-cdp -- --url '…' --text 'Oi'
CDP_ID=… npm run linkedin-unread-messages-cdp -- --max 20
CDP_ID=… npm run linkedin-profile-messages-cdp -- --url '…' --max 10
CDP_ID=… npm run linkedin-extract-leads-cdp -- -n 10 --query 'comprador'
```

## Antes → depois

- **Debug overlay:** workers e `human-cdp` **só** injetam overlay com `debug: true` explícito; omitido/`false` → sem script de UI (ToS LinkedIn: não alterar aparência). `connectCdp` não herda `meta.debug`. Rollback: herdar meta / `debug: opts.debug` em [`session.js`](session.js) + `registry.mjs`.
- **Lifecycle Chrome:** `withLinkedInPage` só fechava o WebSocket → Chrome ficava logado na tela. Agora **provisiona** (`connectCdp`/`startCdp` se down) e **mata** (`stopCdp`) no `finally`. Escape: `keepBrowser: true` / `closeBrowser: false` / `CDP_KEEP_BROWSER=1`. Nested (`page` já aberta, ex. unread→chat) não mata. Rollback: `keepBrowser: true` ou reverta o `finally` com `stopCdp` em [`session.js`](session.js).
- Só AVD (`serial` + uiautomator/OCR) → libs CDP com o mesmo contrato para workers web.
- Scripts ad-hoc em `pocs/chrome-cdp/linkedin-*-cdp.mjs` (signup/setup) continuam; **ações de worker** passam por aqui.
- **extract leads CDP:** abria cada `/in/` após o card → **só lista**: parse do HTML/texto do card (name, title, city, current/past, level, action, mutual, photoUrl/photoBase64, profileUrl); sem `goto` no perfil. **Paginação:** ~10/página (`page=1`, `page=2`, …) quando `n > 10`. Default `-n`/`EXTRACT_MAX_PROFILES` = **10** (1 página mapeada no CDP Matheus 2026-11-12). `POST /profiles` manda `agentId`+`profileUrl` de cara (API reserva conexão).
- **title truncado (“Comprador”):** regex de cidade com flag `/i` fazia `[A-ZÀ-Ü]` casar “material” em “Comprador - material direto Campinas…”. Agora título/cidade saem das **linhas** do card; fallback do regex **sem** `/i` no `[A-ZÀ-Ü]`. Rollback: volte o parse só por `cardText` colapsado + `/i`.
- **avatar `photoBase64`:** `fetch`/canvas da CDN LinkedIn falham (CORS / canvas tainted) → clip `Page.captureScreenshot` no retângulo do `<img>` → `data:image/jpeg;base64,…` no POST. Rollback: volte `toDataUrl(fetch)` no browser (vai voltar a gravar `null`).
- **Message ≠ conectado:** botão “Enviar mensagem” em **2º/3º** (Open Profile) ia para status=2 → agora só 1º+Message = connected; Message+3º → `connect` (candidato). `POST` manda `inviteStatus` canônico. Rollback: `inviteStatusFromAction` Message→connected cego.

**Rollback:** use as libs AVD / `npm run linkedin-connect-api`; remova `src/lib/cdp/` e scripts `*-cdp`.

## Proibido

- `debug: true` / overlay human-cdp nos workers (`session.js` força `false`)
- `Page.bringToFront` / `Target.activateTarget` / `osascript activate` (bloqueados no human-cdp)
- `el.click()` / `dispatchEvent` / `Input.*` solto fora do human-cdp — só `page.click` / `clickAt` / `type` / `fill` / `scroll`
- **Connect CDP:** se Connect/Conectar já no hero → clica direto (sem ⋮). O hero pode ser `button`, `<a href*="vanityName|custom-invite">` **ou** `<a href="/in/…">` com texto/aria Conectar (Matheus/Julio: `aria="Convidar … para se conectar"` + `href` do próprio perfil — sem isso `hasConnect` falhava e abria ⋮). Senão: **1º clique = ⋮/Mais** → `menuitem` Conectar → **Enviar sem nota** (shadow) → Pending. Também aceita `+ Conectar`. Vanity com acento: `decodeURIComponent`. **Pending** também é `<a aria-label="Pendente; …">`. Rollback: seletor só `a[href*="custom-invite"], a[href*="vanityName="]` + exact `^(connect|conectar)$`.
- **Antes → depois (⋮ primeiro):** `clickProfileMenuConnect` chamava `dismissA11ySkipMenu` (X “Fechar menu pular” no topo, perto de Premium) + `_moveTo` antes do Mais → em tela cheia ia ao canto superior direito. Agora o 1º `clickAt` é só o Mais do perfil; a11y skip não é dismissado por clique. Rollback: recoloque `dismissA11ySkipMenu` + pré-`_moveTo` no início de `clickProfileMenuConnect`.
- **Enviar sem nota:** `document.querySelector` não acha (shadow) → `findSkipInvite` percorre `shadowRoot` e `page.clickAt` no centro. Rollback: `querySelector('button[aria-label="Enviar sem nota"]')` cego.
