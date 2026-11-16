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
| `closeApp` | `closeBrowser` / `keepBrowser` | **default: Chrome fica aberto**; fecha só a aba (`closeTab` + standby `about:blank`). Nested (`page`) não fecha. Matar: `closeBrowser: true` / `keepBrowser: false` / `CDP_CLOSE_BROWSER=1` / `CDP_KEEP_BROWSER=0` |
| `closePage` | legado | lifecycle já fecha a aba; não precisa setar |
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
CDP_ID=… npm run linkedin-message-cdp -- --url '…' --text 'Oi' [--cliente-linkedin-id UUID]
CDP_ID=… npm run linkedin-unread-messages-cdp -- --max 20
CDP_ID=… npm run linkedin-profile-messages-cdp -- --url '…' --max 10
CDP_ID=… npm run linkedin-extract-leads-cdp -- -n 10 --query 'comprador'
```

## Antes → depois

- **Enviar mensagem (composer):** (1) sticky topo `y≈27`; (2) clique CDP no hero **não abre** overlay; (3) `page.fill` char-a-char/`textContent` deixava **Enviar disabled**. Sintoma: `não abriu composer / não enviou` (Débora Mendes 2026-11-16). Agora: `openProfileComposer` → `goto /messaging/compose/…`; `fillMessageComposer` → select+Backspace + `Input.insertText` (Enter p/ `\n`). Rollback: clique/`page.fill` em [`linkedin-message.js`](linkedin-message.js) / [`linkedin-dom.js`](linkedin-dom.js).
- **Persistência após send:** `--cliente-linkedin-id` / `CLIENTE_LINKEDIN_ID` no POST (evita lookup por URL truncada). Rollback: só `profileUrl`.
- **Debug overlay:** workers e `human-cdp` **só** injetam overlay com `debug: true` explícito; omitido/`false` → sem script de UI (ToS LinkedIn: não alterar aparência). `connectCdp` não herda `meta.debug`. Rollback: herdar meta / `debug: opts.debug` em [`session.js`](session.js) + `registry.mjs`.
- **Lifecycle Chrome:** antes **matava** o Chrome no `finally` (`stopCdp`) → cada job reabria e roubava foco. Agora **default = manter aberto**: `closeTab` (aba de trabalho) + standby `about:blank`; próximo job reusa a porta sem `startCdp`. Escape p/ matar: `closeBrowser: true` / `keepBrowser: false` / `CDP_CLOSE_BROWSER=1` / `CDP_KEEP_BROWSER=0`. Nested (`page`) não fecha aba. Rollback: `closeBrowser: true` ou recoloque `stopCdp` no `finally` de [`session.js`](session.js).
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
- **Antes → depois (já conectado):** perfil com **Enviar mensagem** e **sem** Conectar/Seguir (já 1º) abria ⋮ → “Conectar no menu não apareceu” → job falhava e a fila recolocava o mesmo lead (`status=0`) em loop. Agora: detecta → `already_connected` → upsert `status=2` (`connectedAt`) e `ok:true` (igual ao atalho `already_pending`). Se ainda abrir Mais e o menu não tiver Conectar + hero tem Mensagem → mesmo upsert. Rollback: remova `isAlreadyConnectedSignals` / `finishAlreadyConnected` em [`linkedin-connect.js`](linkedin-connect.js).
- **Antes → depois (convite recebido):** perfil com **Aceitar/Accept** (+ Ignorar) — a pessoa te convidou — seguia o fluxo de Conectar/⋮ e falhava. Agora: `hasAccept` → clica Aceitar → `accepted_incoming` → upsert `status=2` (`connectedAt`). Sem Aceitar → fluxo anterior. Rollback: remova `hasAccept` em [`linkedin-dom.js`](linkedin-dom.js) e o branch em [`linkedin-connect.js`](linkedin-connect.js).
- **Antes → depois (404 PT):** UI PT diz **“Esta página não existe”** (+ redirect `/404/`); o detector só batia em “essa…” → `pageMissing=false` → job `conectar` falhava em loop (`douglas-ba`). Agora: `esta|essa`, `página não existe|encontrada`, `verifique sua url`, path `/404` → `ok:true` `status:discarded` + POST `status=3`/`discardReason` (coluna Descartados). Rollback: regex só `essa página não existe` em [`linkedin-dom.js`](linkedin-dom.js).
- **Antes → depois (⋮ primeiro):** `clickProfileMenuConnect` chamava `dismissA11ySkipMenu` (X “Fechar menu pular” no topo, perto de Premium) + `_moveTo` antes do Mais → em tela cheia ia ao canto superior direito. Agora o 1º `clickAt` é só o Mais do perfil; a11y skip não é dismissado por clique. Rollback: recoloque `dismissA11ySkipMenu` + pré-`_moveTo` no início de `clickProfileMenuConnect`.
- **Enviar sem nota:** `document.querySelector` não acha (shadow) → `findSkipInvite` percorre `shadowRoot` e `page.clickAt` no centro. Rollback: `querySelector('button[aria-label="Enviar sem nota"]')` cego.
