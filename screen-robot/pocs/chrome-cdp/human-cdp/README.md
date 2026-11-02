# human-cdp — interface humana sobre Chrome CDP

Lib entre o **programador** e o **Chrome via CDP**: clique, digitar, drag, etc. com trajetória/ritmo/foco para o [bot-lab](../../bot-lab/README.md) marcar **humano**.

**Card:** [Lib CDP humana](https://trello.com/c/5tt5ZTeN) · task [`../../../tasks/6ae8ac1d5228997f864b40c5/README.md`](../../../tasks/6ae8ac1d5228997f864b40c5/README.md)

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

### API

| Método | Comportamento |
|--------|----------------|
| `connect({ cdpUrl, url, newTab, urlIncludes })` | abre sessão + **foco** |
| `click` / `hover` / `type` / `fill` / `drag` / `scroll` / `select` / `goto` / `waitFor` | **sempre** chamam `ensureFocus` (aba + activate Chrome) antes da ação |
| `click(sel)` | foco + `mouseMoved` em curva + `press`/`release` |
| `type` / `fill` | foco + click humano + `Input.insertText` ritmado |
| `bringToFront` / `ensureFocus` | aba + app Chrome (+ `Emulation.setFocusEmulationEnabled`) |
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
import { listCdps, createCdp, connectCdp, removeCdp } from './src/index.mjs';

listCdps(); // pastas em ~/chrome-profiles + porta se Chrome estiver no ar
createCdp({ id: 'meu-perfil', name: 'Meu Perfil', port: 9240 });
const page = await connectCdp('meu-perfil');
page.close();
// removeCdp('meu-perfil') // default não apaga a pasta do perfil
```

```bash
npm run test:registry  # usa só id temporário smoke-tmp-registry
```

**Card:** [CRUD de CDPs na lib](https://trello.com/c/hoLSkLko)

## Antes → depois

Scripts CDP crus (`el.click`, `dispatchMouseEvent` sem move) → importam `human-cdp` e usam `click`/`type`.

**Antes → depois (foco):** `focused: false` permitia background → toda interação chama `ensureFocus` (bringToFront + activate). Rollback: `ensureFocus` com early-return se `this.focused === false`.

**Rollback:** voltar ao CDP cru nos scripts; apagar `human-cdp/`.

## Caminho inverso

Bypass da lib = WebSocket CDP direto (`Input.*` / `Runtime.evaluate` click) — detectável no bot-lab.
