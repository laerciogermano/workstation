# human-cdp — interface humana sobre Chrome CDP

Lib entre o **programador** e o **Chrome via CDP**: clique, digitar, drag, etc. com trajetória/ritmo/foco para o [bot-lab](../../bot-lab/README.md) marcar **humano**.

**Card:** [Lib CDP humana](https://trello.com/c/5tt5ZTeN) · task [`../../../tasks/6ae8ac1d5228997f864b40c5/README.md`](../../../tasks/6ae8ac1d5228997f864b40c5/README.md)  
**Debug overlay:** [modo debug no connect](https://trello.com/c/W4GN946S) · task [`../../../tasks/6ae8d5241aa4adad65cdd8f1/README.md`](../../../tasks/6ae8d5241aa4adad65cdd8f1/README.md)

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
await page.goto('https://example.com');
page.close();
```

### Modo debug

```js
const page = await connect({
  cdpUrl: 'http://127.0.0.1:9230',
  url: 'http://127.0.0.1:8766/',
  debug: true, // painel do bot-lab (feedback-rail) flutua junto ao mouse
});
// connectCdp('germano', { debug: true }) — mesma flag
```

No bot-lab: o `feedback-rail` vira overlay `position: fixed` ao lado do cursor (`pointer-events: none`). Fora do lab: badge mínimo `human-cdp debug · fora do bot-lab`. Default `debug: false` → zero overlay. Rollback: omitir a flag / `debug: false`.

```bash
CDP_URL=http://127.0.0.1:9230 npm run test:debug
```

### API

| Método | Comportamento |
|--------|----------------|
| `connect({ cdpUrl, url, newTab, urlIncludes, debug })` | abre sessão + **foco**; `debug: true` injeta overlay |
| `click` / `hover` / `type` / `fill` / `drag` / `scroll` / `select` / `goto` / `waitFor` | **sempre** chamam `ensureFocus` (aba + activate Chrome) antes da ação |
| `click(sel)` | foco + `mouseMoved` em curva + `press`/`release` |
| `type` / `fill` | foco + click humano + `Input.insertText` ritmado (sem `text` no keyDown — evita char duplicado) |
| `bringToFront` / `ensureFocus` | aba + app Chrome (+ `Emulation.setFocusEmulationEnabled`) |
| `enableDebugOverlay` | re-injeta o painel (já chamado em `connect`/`goto` se `debug`) |
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
import { listCdps, createCdp, connectCdp, removeCdp, updateCdp } from './src/index.mjs';

listCdps(); // pastas em ~/chrome-profiles + porta se Chrome estiver no ar
createCdp({ id: 'meu-perfil', name: 'Meu Perfil', port: 9240 });
const page = await connectCdp('meu-perfil');
page.close();
// removeCdp('meu-perfil') // default não apaga a pasta do perfil
```

### Fingerprint por CDP

Meta `~/chrome-profiles/<id>/.human-cdp.json` → `fingerprint`.

**startCdp (CLI):** só `--lang=…` (sem webrtc/AutomationControlled — infobar amarela).  
**connectCdp / goto:** UA + Client Hints (`userAgentMetadata`), platform, Accept-Language, timezone, locale, viewport/screen, geolocation, hardwareConcurrency, deviceMemory, maxTouchPoints, colorScheme, reducedMotion, touch, permissions + patch JS (`navigator`/`screen`, `webdriver=false`, WebRTC via inject).  
**Persistência:** `startCdp`/`connectCdp` sobem `fingerprint-keeper` (pid em `~/chrome-profiles/<id>/.fingerprint-keeper.pid`) que reaplica em F5/`frameNavigated`. Sem keeper, override some ao desconectar o CDP. `stopCdp` mata o keeper. Rollback: não chamar `ensureFingerprintKeeper` / apagar o processo.

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

**Antes → depois:** extras (battery, plugins, WebGL fake, canvas noise…) removidos — voltou ao conjunto estável acima. Rollback total: `updateCdp(id, { fingerprint: null })` + restart.

```bash
npm run test:registry  # usa só id temporário smoke-tmp-registry
```

**Card:** [CRUD de CDPs na lib](https://trello.com/c/hoLSkLko)

## Antes → depois

Scripts CDP crus (`el.click`, `dispatchMouseEvent` sem move) → importam `human-cdp` e usam `click`/`type`.

**Antes → depois (foco):** `focused: false` permitia background → toda interação chama `ensureFocus` (bringToFront + activate). Rollback: `ensureFocus` com early-return se `this.focused === false`.

**Antes → depois (type):** `keyDown` com `text` + `insertText` → cada char duplicado (Rafaela→RRaaffaaeellaa). Agora: keyDown/Up sem `text`; só `insertText` insere. `fill` clear: `el.select()` + Backspace + setter nativo (Cmd+A CDP falhava no FB). Rollback: keyDown com `text` + clear só Ctrl+A.

**Antes → depois (debug):** trilho fixo só no layout do bot-lab → `connect({ debug: true })` flutua o `feedback-rail` junto ao mouse (e badge fora do lab). Rollback: `debug: false` / omitir flag.

**Rollback:** voltar ao CDP cru nos scripts; apagar `human-cdp/`.

## Caminho inverso

Bypass da lib = WebSocket CDP direto (`Input.*` / `Runtime.evaluate` click) — detectável no bot-lab.
