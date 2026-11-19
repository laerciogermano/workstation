# human-cdp — interface humana sobre Chrome CDP

Lib entre o **programador** e o **Chrome via CDP**: clique, digitar, drag, etc. com trajetória/ritmo/foco para o [bot-lab](../../bot-lab/README.md) marcar **humano**.

**Card:** [Lib CDP humana](https://trello.com/c/5tt5ZTeN) · task [`../../../tasks/6ae8ac1d5228997f864b40c5/README.md`](../../../tasks/6ae8ac1d5228997f864b40c5/README.md)
**Debug overlay:** [modo debug no connect](https://trello.com/c/W4GN946S) · task [`../../../tasks/6ae8d5241aa4adad65cdd8f1/README.md`](../../../tasks/6ae8d5241aa4adad65cdd8f1/README.md)
**Trajetória contínua:** [sem teleportes](https://trello.com/c/5N5E2vlJ) · task [`../../../tasks/6ae8dd3e5c359e796ef30a66/README.md`](../../../tasks/6ae8dd3e5c359e796ef30a66/README.md) — ponteiro parte de onde parou; passos ≤36px; press na posição atual.

## Pré-req

```bash
# terminal A
cd screen-robot/pocs/bot-lab && ./serve.sh   # :8766

# terminal B
cd screen-robot/pocs/chrome-cdp && ./start-germano.sh http://127.0.0.1:8766/
```

## Uso

```js
import { connect } from './src/index.mjs';

const page = await connect({
  cdpUrl: 'http://127.0.0.1:9230',
  url: 'http://127.0.0.1:8766/',
});

await page.click('#btn-primary');      // foco + trajetória + press/release
await page.type('#input-nome', 'oi');  // foco + click + teclas ritmadas
await page.drag('#drag-handle', { dx: 160 });

// OCR da viewport (CDP screenshot + macos-vision|rapidocr|tesseract)
const { text, words } = await page.ocr();           // HUMAN_CDP_OCR / SCREEN_ROBOT_OCR
const hit = await page.findByOcr('Iniciar');        // { cx, cy, bounds, text }
await page.clickOcr('Iniciar');                     // trajetória + clique no texto

await page.goto('https://example.com');
page.close();
```

### OCR

| Método | Retorno |
|--------|---------|
| `screenshot(opts?)` | `Buffer` PNG |
| `ocr({ engine, lang, path, keepFile, clip })` | `{ text, words[], imagePath, engine }` |
| `findByOcr(query, opts?)` | `{ text, bounds, cx, cy, confidence }` ou `null` |
| `clickOcr(query, opts?)` | clique humano no centro do hit |

Engines: `macos-vision` (default darwin), `rapidocr`, `tesseract` (CLI). Reusa [`../../../src/lib/`](../../../src/lib/README.md). Env: `HUMAN_CDP_OCR` / `SCREEN_ROBOT_OCR`.

**Antes → depois:** sem OCR na lib → screenshot+OCR+find/click por texto. Rollback: não chamar `ocr`/`clickOcr`; apagar `src/ocr.mjs`.

### Modo debug

```js
const page = await connect({
  cdpUrl: 'http://127.0.0.1:9230',
  url: 'http://127.0.0.1:8766/',
  debug: true, // painel do bot-lab (feedback-rail) flutua junto ao mouse
});
// connectCdp('germano', { debug: true }) — mesma flag
```

No bot-lab: o `feedback-rail` vira overlay `position: fixed` ao lado do cursor (`pointer-events: none`). Fora do lab: badge mínimo `human-cdp debug · fora do bot-lab`. **Só injeta com `debug: true` explícito** — omitido/`false` → `meta.debug=false`, zero script de overlay (não herda meta antiga). Workers LinkedIn nunca passam `true`. Rollback: `connectCdp(id, { debug: true })`.

```bash
CDP_URL=http://127.0.0.1:9230 npm run test:debug
```

### API

| Método | Comportamento |
|--------|----------------|
| `connect({ cdpUrl, url, newTab, urlIncludes, debug })` | abre sessão + **foco**; `debug: true` injeta overlay |
| `click` / `hover` / `type` / `fill` / `drag` / `scroll` / `select` / `goto` / `waitFor` | **sempre** chamam `ensureFocus` (só emulação CDP; sem activate) |
| `click(sel)` | foco + `mouseMoved` em curva + `press`/`release` |
| `type` / `fill` | foco + click humano + `Input.insertText` ritmado (sem `text` no keyDown — evita char duplicado) |
| `bringToFront` / `ensureFocus` | só `Emulation.setFocusEmulationEnabled` (não eleva SO) |
| `enableFocusEmulation` | liga emulação de foco na página (padrão no `connect` / `ensureFocus` / keeper) |
| `send` | **bloqueia** `Page.bringToFront` / `Target.activateTarget` (no-op) |
| `openPage` | `Target.createTarget({ background: true })` — **não** usa `/json/new` |
| `enableDebugOverlay` | Verdict + Fingerprint (incl. `cam`/`vid`/`ycap`) + Diagnostics; `debug: true` → keeper |
| `setCamera` / `getCamera` / `clearCamera` | vídeo local + label da webcam (fake flags + spoof); UI: `npm run camera-ui` |
| `evaluate` | só leitura/DOM — **não** usa foco; **não** use para clicar |

Toda interação de UI **obriga foco** (não há mais `focused: false`).

## Aceite (bot-lab)

```bash
cd screen-robot/pocs/chrome-cdp/human-cdp
CDP_URL=http://127.0.0.1:9230 npm run test:bot-lab
# esperado: veredicto humano · exit 0
```

## CRUD de CDPs (contrato na lib)

Sem UI, **sem CSV**, **sem JSON central**, **sem `start-*.sh`**. Fonte no disco:

- pastas `~/chrome-profiles/<id>/`
- meta `~/chrome-profiles/<id>/.human-cdp.json` (só se criado via `createCdp`)
- porta `up`: processo Chrome com `--user-data-dir` + `--remote-debugging-port`

```js
import { listCdps, createCdp, connectCdp, stopCdp, removeCdp, updateCdp } from './src/index.mjs';

listCdps(); // pastas em ~/chrome-profiles + porta se Chrome estiver no ar
createCdp({ id: 'meu-perfil', name: 'Meu Perfil', port: 9240 });
const page = await connectCdp('meu-perfil'); // sobe se down
page.close();
await stopCdp('meu-perfil'); // só se quiser matar o processo
// removeCdp('meu-perfil') // default não apaga a pasta do perfil
```

**Workers LinkedIn (`src/lib/cdp/session.js`):** sobe o Chrome se down; no fim **fecha só a aba** (`page.closeTab` + standby) e **deixa o browser aberto** — evita reabrir/roubar foco. `getCdp` também casa `preferredPort`. Matar: `CDP_CLOSE_BROWSER=1` / `closeBrowser: true`.

### Fingerprint por CDP

Meta `~/chrome-profiles/<id>/.human-cdp.json` → `fingerprint`.

**startCdp (CLI):** só `--lang=…` (sem webrtc/AutomationControlled — infobar amarela).  
**connectCdp / goto:** UA + Client Hints (`userAgentMetadata`), platform, Accept-Language, timezone, locale, viewport/screen, geolocation, hardwareConcurrency, deviceMemory, maxTouchPoints, colorScheme, reducedMotion, touch, permissions + patch JS (`navigator`/`screen`, `webdriver=false`, WebRTC via inject).  
**Persistência:** `startCdp`/`connectCdp` sobem `fingerprint-keeper` (pid em `~/chrome-profiles/<id>/.fingerprint-keeper.pid`). O keeper usa o **browser WS** + `Target.setAutoAttach` (flatten) e aplica em **todas** as abas — F5 e `page.close()` do connect não revertem ao fingerprint real. Reaplica em `frameNavigated`/`load` (só `Runtime.evaluate` no F5; `addScriptToEvaluateOnNewDocument` uma vez por aba). `ensureFingerprintKeeper(id, { restart: true })` mata e sobe de novo. Sem keeper, override some ao desconectar o CDP. `stopCdp` mata o keeper. Rollback: não chamar `ensureFingerprintKeeper` / apagar o processo.

**Câmera (OBS / fake Chrome):** o keeper/`applyFingerprint` sempre injeta spoof JS — labels `OBS`/`Virtual Camera`/`fake_device*`/`y4m` viram `FaceTime HD Camera` (ou `fingerprint.cameraLabel`). Demais videoinputs ficam.

**Selecionar vídeo + nome (API / UI):**

```js
import { setCamera, getCamera, clearCamera } from './src/index.mjs';

await setCamera('ometv-2', {
  video: '/caminho/oferta.mp4',      // mp4→y4m em ~/chrome-profiles/<id>/camera/
  label: 'FaceTime HD Camera',
  // apply: true (default) → se Chrome up, stop+start p/ flags entrarem
});
getCamera('ometv-2');
await clearCamera('ometv-2');
```

```bash
npm run camera-ui   # http://127.0.0.1:18770/ — Gestão de CDPs
npm run test:camera
```

**UI (`http://127.0.0.1:18770/`):** lista de CDPs (**mais recente primeiro**); criar/editar/remover; **fingerprint** (Gerar); **galeria** com seletor de arquivo (`~/chrome-cdp-media/`); **snapshots** (`~/chrome-cdp-snapshots/` — criação já gera um; **Baixar** `.tar.gz` / **Importar**; **Executar** sempre para → restaura snapshot → sobe); **controlar** = prints JPEG. Visão: [`../../../../gestao-cdps/README.md`](../../../../gestao-cdps/README.md).

### Galeria de mídias

```text
~/chrome-cdp-media/<mediaId>/
  meta.json
  <arquivo.mp4|y4m|…>
```

```js
import { addMedia, listMedia, selectMediaForCdp, applySelectedMedia, startCdp } from './src/index.mjs';
addMedia({ path: '/Users/…/oferta.mp4', name: 'Oferta' });
selectMediaForCdp('ometv-2', '<mediaId>');
await applySelectedMedia('ometv-2'); // setCamera
await startCdp('ometv-2');           // reaplica mídia selecionada antes do spawn
```

### Fingerprint (gerar)

```js
import { listFingerprintOptions, generateFingerprint } from './src/index.mjs';
listFingerprintOptions(); // os, chrome, locale, hw, mem, lang…
generateFingerprint({ os: 'win10', locale: 'sp' });
```

Catálogo em `src/fingerprint-catalog.mjs` (também usado por LinkedIn `createLinkedInCdp`).

### Snapshots (só arquivos)

```text
~/chrome-cdp-snapshots/<cdpId>/
  selected.json
  <ISO-stamp>/
    meta.json
    profile/          ← cópia de ~/chrome-profiles/<cdpId>/
```

`createCdp` já grava o snapshot **criação**. Todo `startCdp` **para** o Chrome se up, **apaga** o perfil e **copia** o snapshot selecionado (histórico/cache da sessão anterior não permanece).

```js
import { createSnapshot, selectSnapshot, startCdp, packSnapshotStream, importSnapshot } from './src/index.mjs';
createSnapshot('meu-cdp', { note: 'após login', select: true });
await startCdp('meu-cdp');
// Baixar: GET /api/cdps/:id/snapshots/:sid/download → .tar.gz (tar -cz)
// Importar: POST /api/cdps/:id/snapshots/import (body binário + X-Filename) → novo stamp
```

Meta `.human-cdp.json` atual é preservada no restore. Legado `~/chrome-cdp-backups/` ainda é lido.

**Antes → depois (export/import):** só criar/usar/apagar na UI → **Baixar** `.tar.gz` + **Importar** (novo snapshotId; seleciona). Rollback: não usar os botões; remover `packSnapshotStream` / `importSnapshot` e rotas `/download` `/import`.

### Visão / controle (prints)

```text
~/chrome-cdp-view/<cdpId>/
  config.json     # quality (default 15), intervalMs (100), maxKeep
  latest.jpg
  frames/*.jpg
```

```js
import { startView, stopView, setViewConfig, setViewTarget } from './src/index.mjs';
setViewConfig('meu-cdp', { quality: 12, intervalMs: 100 });
await startView('meu-cdp'); // CDP precisa estar up
await setViewTarget('meu-cdp', targetId); // troca aba fotografada
```

**UI controle:** ao abrir Controlar a visão **já inicia** (sem botão); intervalo default **100 ms**; abas (nova / fechar / Ir URL); clique na tela arma o teclado (digitar, Enter, Backspace, Ctrl/Cmd+V cola); **rolagem** no print → `scroll({ x, y, dx, dy, exact: true })` com os mesmos deltas (px). Página **Telas ao vivo**: grid dos CDPs up → clique abre o modal. Rollback: restaurar `camera-ui/` + `scroll` sem `x/y/dx/exact` + remover handler `wheel` / `type: scroll` no input.

Campo vídeo já vem com o sample do lab (`omtv/pocs/fake-webcam-cdp/media/testsrc.y4m`, senão `chrome-cdp/media/sample.y4m`). Override: `HUMAN_CDP_DEFAULT_VIDEO=/caminho`.

**Antes → depois (UI):** form só câmera → gestão completa (lista, fingerprint, backups, visão). Rollback: restaurar `camera-ui/` + remover `src/backup.mjs` / `src/view.mjs` / `src/fingerprint-catalog.mjs`.

Fingerprint: `cameraVideo`, `cameraCaptureFile`, `cameraLabel`. `startCdp` deriva `--use-fake-*` de `cameraCaptureFile`. Infobar amarela das flags é esperada (lab). POC OmTV: [`omtv/pocs/fake-webcam-cdp/README.md`](../../../../omtv/pocs/fake-webcam-cdp/README.md).

**Editar → Salvar:** grava também a mídia do select (`media/select` + `setCamera`). Antes só “Aplicar no CDP” persistia o vídeo — Salvar sozinho deixava a câmera sem face. O PATCH da UI ainda preserva `camera*` se houver `selectedMediaId`. Rollback: remover o sync no submit de `camera-ui/index.html` e o merge no PATCH de `camera-ui/server.mjs`.

**Permissão câmera (POC OmTV):** `setCamera` grava `fingerprint.permissions` (video/audio granted) para `defaultUrl`; `applyFingerprint` chama `Browser.grantPermissions` na origem atual + listadas. Com `cameraCaptureFile`, `startCdp` sobe em `about:blank`, faz grant e só então navega — senão o site (OmeTV) pede mídia antes do grant e fica em “Você negou o acesso…”. Spoof v3 também renomeia mic fake (`Fake Default Audio Input` → `MacBook Pro Microphone`). Antes: só flags fake / URL no spawn / spoof só de vídeo. Rollback: voltar URL no spawn, spoof v2 e remover grant/deferNav.

**Vídeo grande:** `ensureCaptureFile` sempre gera Y4M leve no cache (`640x360`, `12fps`, máx. `30s`) — inclusive se a fonte já for `.y4m`. Antes devolvia y4m/mjpeg cru (arquivo enorme → Chrome lento). Override: `setCamera(id, { size, fps, maxSeconds })`. Rollback: voltar early-return de `.y4m`/`.mjpeg` em `camera.mjs`.

**Controle webcam (pause/play/seek/zoom + preview):** UI no Editar + `POST /api/camera/playback` (`zoomIn|zoomOut|zoom`) e `GET /api/camera/preview?id=`. Zoom = crop central no ffmpeg (1×–3×). Preview JPEG do instante atual em `camera/preview.jpg`. Publica `live.y4m` sem truncar a zero. Rollback: remover zoom/preview da UI e de `controlCameraPlayback`.

**Antes → depois:** só spoof OBS / chromeArgs manuais → `setCamera` + UI + campos no fingerprint. Rollback: `clearCamera(id)`; remover `src/camera.mjs` / `camera-ui/` / exports.

**Antes → depois:** keeper numa única aba (`pickPage`) → multi-target no browser WS.

```js
updateCdp('ometv-2', {
  fingerprint: {
    userAgent: 'Mozilla/5.0 … Chrome/140.0.0.0 Safari/537.36',
    platform: 'MacIntel',
    lang: 'en-US',
    acceptLanguage: 'en-US,en;q=0.9',
    timezone: 'America/Fortaleza',
    locale: 'en-US',
    viewport: {
      width: 1440, height: 900, deviceScaleFactor: 2,
      screenWidth: 1920, screenHeight: 1080,
    },
    geolocation: { latitude: -3.73, longitude: -38.52, accuracy: 40 },
    hardwareConcurrency: 8,
    deviceMemory: 8,
    maxTouchPoints: 0,
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
    touch: false,
    webrtcIpHandling: 'default_public_interface_only',
    userAgentMetadata: {
      platform: 'macOS', platformVersion: '14.5.0', architecture: 'x86',
      model: '', mobile: false, bitness: '64',
      brands: [
        { brand: 'Chromium', version: '140' },
        { brand: 'Not=A?Brand', version: '24' },
        { brand: 'Google Chrome', version: '140' },
      ],
    },
    permissions: [
      { origin: 'https://ome.tv', permission: 'geolocation', setting: 'granted' },
    ],
  },
});
// --lang só no próximo startCdp
```

Override pontual: `connectCdp(id, { fingerprint })`.  
**Não cobre:** vendor/product/battery/plugins/WebGL/canvas/audio/fonts/mediaDevices fakes, IP de egress.

**Catálogo de combinações reais (device + browser):** card [x3dClHJu](https://trello.com/c/x3dClHJu) · task [`../../../tasks/6ae8dc57b01c993b519a5030/README.md`](../../../tasks/6ae8dc57b01c993b519a5030/README.md) — lista curada para preencher `fingerprint` sem inconsistências (UA ↔ CH ↔ screen ↔ cores/mem).

**Antes → depois:** extras (battery, plugins, WebGL fake, canvas noise…) removidos — voltou ao conjunto estável acima. Rollback total: `updateCdp(id, { fingerprint: null })` + restart.

```bash
npm run test:registry  # usa só id temporário smoke-tmp-registry
```

**Card:** [CRUD de CDPs na lib](https://trello.com/c/hoLSkLko)

## Antes → depois

Scripts CDP crus (`el.click`, `dispatchMouseEvent` sem move) → importam `human-cdp` e usam `click`/`type`.

**Antes → depois (foco):** `focused: false` permitia background → toda interação chama `ensureFocus` (bringToFront + activate). Rollback: `ensureFocus` com early-return se `this.focused === false`.

**Antes → depois (type):** `keyDown` com `text` + `insertText` → cada char duplicado (Rafaela→RRaaffaaeellaa). Agora: keyDown/Up sem `text`; só `insertText` insere. `fill` clear: `el.select()` + Backspace + setter nativo (Cmd+A CDP falhava no FB). Rollback: keyDown com `text` + clear só Ctrl+A.

**Antes → depois (fill contenteditable):** clear usava `HTMLInputElement.prototype.value` em `div[contenteditable]` → `Illegal invocation`; `textContent=''` deixava Enviar disabled (React LI). Agora: INPUT/TEXTAREA → setter `value`; contenteditable → só select+Backspace (sem zerar DOM). Rollback: setter genérico anterior.

**Antes → depois (debug):** fora do bot-lab mostrava “fora do bot-lab” sem veredito → painel com detector portátil (trajetória/cliques/teclas/foco) e veredito live humano/robô/inconclusivo. No lab, usa o trilho nativo. Rollback: `debug: false`.

**Antes → depois (debug persistente):** overlay herdava `meta.debug` se omitisse a flag → agora **só** `debug: true` explícito; omitido/`false` grava `meta.debug=false` e **não** chama `enableDebugOverlay` / `addScript`. Keeper só injeta overlay se `meta.debug`. Scripts já no processo Chrome somem com restart (`stopCdp`/`startCdp`). Rollback: herdar `meta.debug` no `wantDebug` de `connectCdp`.

**Antes → depois (trajetória):** pontas com jitter + passos longos + press deslocado do último `mouseMoved` → teleportes no bot-lab. Agora: âncoras exatas, densify ≤36px, step ≥16ms, press na posição atual, cursor persistido por `cdpUrl`. Rollback: `trajectoryPoints`/`_moveTo`/`click` anteriores.

**Antes → depois (clique):** distância curta podia só âncora sem “arrasto” → `pathToTarget` + `clickAt`: **sempre** trajetória multi-ponto até o alvo antes do press (micro-arco se perto). Regra: [`.cursor/rules/human-cdp-clique-com-trajetoria.mdc`](../../../../.cursor/rules/human-cdp-clique-com-trajetoria.mdc).

**Antes → depois (todas interações):** `hover`/`drag`/`scroll`/`select`/`type` alinhados — `_pointOf` + arrasto obrigatório; `scroll` move ao centro/alvo antes do wheel; `drag` usa `pathToTarget`; `select` tenta clicar a option. Rollback: métodos anteriores em `session.mjs`.

**Antes → depois (scroll espelho):** só `dy`/`steps`/`selector` → também `x`/`y`/`dx`/`exact` (um `mouseWheel` com deltas do operador). Rollback: assinatura antiga sem esses campos.

**Antes → depois (foco):** `ensureFocus` só activate/bringToFront sem checar → agora lê `document.hasFocus()`; se false, traz ao foco e **bloqueia** a operação até true (clique já exige). Rollback: early-return por throttle 120ms sem verificação.

**Antes → depois (foco lógico):** emulação só no fim do retry → `Emulation.setFocusEmulationEnabled` **padrão** em `connect`, todo `ensureFocus` e no `fingerprint-keeper` (todas as abas). `Page.bringToFront` + `activate` do SO **comentados** (não roubam Cursor). Rollback: descomentar o loop em `ensureFocus`; remover `enableFocusEmulation` do `connect`/keeper.

**Antes → depois (anti-roubo SO):** `activateApp`/`osascript` removidos; `send` no-op em `Page.bringToFront`/`Target.activateTarget`; `openPage` deixa `/json/new` e usa `Target.createTarget({ background: true })`. Rollback: restaurar `activateApp` + `/json/new` + send direto.

**Antes → depois (sem aba):** `pickPage` falhava com “Nenhuma página” se `/json/list` vazio (Chrome up sem tab) → retry curto + `openPage(about:blank|url)`. Rollback: throw imediato sem `createIfMissing`.

**Rollback:** voltar ao CDP cru nos scripts; apagar `human-cdp/`.

## Caminho inverso

Bypass da lib = WebSocket CDP direto (`Input.*` / `Runtime.evaluate` click) — detectável no bot-lab.
