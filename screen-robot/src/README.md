# src — screen-robot

API **Node** (≥ 18) para controlar Android via ADB: provisionar agents, instalar APKs, eventos de UI, gestos, extração DOM e sessão.

Visão do projeto: [`../README.md`](../README.md) · Runtimes: [`../pocs/`](../pocs/README.md) · Aceite: [`../5.bdds.md`](../5.bdds.md)

Com o runtime no ar, o Android fica **disponível para controle humano**: espelhar a tela e operar (tap, digitar, scroll, …) via scrcpy — [`scripts/view.sh`](scripts/view.sh) (`npm run view`). A API do handle automatiza as mesmas ações por código.

---

## Instalação / entrada

```bash
cd screen-robot/src
# Node ≥ 18, adb no PATH
# Docker/Colima se kind=redroid (a lib sobe o container)
```

Superfície pública:

```js
import { provisionEmulator } from "./lib/provision.js";
import { resetInstance } from "./lib/reset-instance.js"; // ops — fora do handle
```

Tudo o mais (gestos, APKs, eventos, extract, sessão) vem no **handle** retornado. Não passe `serial` nas operações — ele está no handle. `resetInstance` é export ops (wipe + boot); não é método do handle.

---

## 1. Provisionar agents — `provisionEmulator(cfg)`

Um único método: **cria** se o `name` for novo; **anexa** se o nome já existir (sem criar outro container).

```js
const handle = await provisionEmulator({
  provision: {
    name: "agent-a",          // obrigatório ([a-zA-Z0-9_-])
    kind: "redroid",          // redroid | avd | …
    connectTimeoutMs: 120_000,
    // host: "127.0.0.1",     // opcional
  },
});
// handle.name · handle.serial · handle.kind · handle.bootCompleted · handle.provisionedAt

// mesmo nome de novo → anexa ao agent existente
const again = await provisionEmulator({
  provision: { name: "agent-a", kind: "redroid" },
});
// again.serial === handle.serial
```

| Caso | Comportamento |
|------|----------------|
| Nome novo | Aloca porta ADB, sobe container novo, registra, boot ok |
| Nome já registrado | Reconecta serial existente, boot ok — **não** cria outro |
| Nome inválido | `PROVISION_INVALID_NAME` |

### Vários em paralelo

```js
const a = await provisionEmulator({ provision: { name: "a", kind: "redroid" } });
const b = await provisionEmulator({ provision: { name: "b", kind: "redroid" } });
// a.serial !== b.serial
```

Não é obrigatório rodar `pocs/redroid/scripts/start.sh` — o create já sobe o container.

Config de exemplo: [`device.config.json`](device.config.json) (`provision.name`, `kind`, apps, paths).

---

## 1b. Reset do zero — `resetInstance(cfg)`

Recria a instância limpa (apaga volume Docker e sobe de novo). Usado pelo piloto LinkedIn antes do provision.

```js
import { resetInstance } from "./lib/reset-instance.js";

const { serial, kind, resetAt } = await resetInstance(cfg);
// → ADB online + boot completo
```

| Item | Detalhe |
|------|---------|
| Script default | [`../pocs/redroid/scripts/reset.sh`](../pocs/redroid/README.md) (`docker compose down -v` + `start.sh`) |
| Override | `cfg.provision.resetScript` |
| Erros | `RESET_NO_SERIAL` · `RESET_FAILED` · `RESET_UNSUPPORTED` |

---

## 2. Instalar APKs — `handle.installApk(app)`

```js
const r = await handle.installApk({
  package: "com.linkedin.android",
  version: "4.1.1093",           // opcional: skip se já instalada
  artifact: "apks/app.apk",      // path local
  // source: "apk-pure",         // download via apkeep se não houver artifact
});
// { package, version, skipped, artifactPath? }
```

Erros: `APK_CONFIG_INVALID` · `APK_DOWNLOAD_FAILED` · `APK_INSTALL_FAILED`.

---

## 3. Eventos de UI — `handle.on(event, opts?, onEvent?)`

```js
await handle.on("boot");
await handle.on("app_open", { pkg: "com.linkedin.android", timeoutMs: 60_000 });
await handle.on("ui_stable", { timeoutMs: 90_000, stableMs: 800 }, (e) => {
  console.log(e.type, e.attempt);
});
await handle.on("dump_change", { timeoutMs: 30_000 });
```

| Evento | O quê |
|--------|--------|
| `boot` | Sinal de boot do device |
| `app_open` | Package em foreground (`opts.pkg`) |
| `ui_stable` | UI sem transição |
| `dump_change` | Dump uiautomator mudou |

Desconhecido → `EVENT_UNKNOWN`. Timeout → códigos `EVENT_*` / timeout do listener.

---

## 4. Operar tela

```js
await handle.launch("com.linkedin.android");           // ou launch(pkg, ".MainActivity")
handle.tap(360, 640);
handle.tapElement(el);                                 // el.center ou el.bounds
handle.type("olá");                                    // ASCII via input; unicode via ADBKeyBoard
handle.scroll({ direction: "down", distance: 800 });   // up|down|left|right; x/y opcionais
const shot = handle.screenshot("./screenshots/tela.png");
const { x, y, confidence } = await handle.matchImage("./templates/btn.png");
```

| Método | Erros tipados |
|--------|----------------|
| `launch` | `OPERATE_LAUNCH_FAILED` |
| `type` | `OPERATE_TYPE_FAILED` |
| `screenshot` | `OPERATE_SCREENSHOT_FAILED` |
| `matchImage` | `OPERATE_MATCH_NOT_FOUND` |

IME unicode: [`apks/ADBKeyboard.apk`](apks/ADBKeyboard.apk) (instalado sob demanda).

---

## 5. Extrair UI — `handle.extract()`

Sem parâmetros. Cada chamada **enriquece** a mesma árvore:

```js
const t1 = await handle.extract(); // textos
const t2 = await handle.extract(); // hierarquia
const t3 = await handle.extract(); // ícones
const t4 = await handle.extract(); // listas
const t5 = await handle.extract(); // imagens
// { type: "root", bounds, children: [ { type, text?, bounds?, children } ] }
```

Legado (piloto LinkedIn, lista plana): `extractElements` / `findLoginTarget` / `findEditableFields` em [`lib/extract.js`](lib/extract.js).

---

## 6. Sessão

```js
await handle.saveSession("./state/session.json", { step: "logged-in", apps: […] });
const state = await handle.restoreSession("./state/session.json");
// state inclui serial, kind, savedAt + campos passados
await handle.removeSession("./state/session.json"); // true se removeu
```

Erros: `SESSION_WRITE_FAILED` · `SESSION_NOT_FOUND` · `SESSION_INVALID`.

---

## 7. Fluxo completo (exemplo)

```js
import { readFileSync } from "node:fs";
import { provisionEmulator } from "./lib/provision.js";
import { resetInstance } from "./lib/reset-instance.js";

const cfg = JSON.parse(readFileSync("./device.config.json", "utf8"));

await resetInstance(cfg); // opcional: instância do zero
const handle = await provisionEmulator(cfg);

await handle.installApk(cfg.apps.linkedin);
await handle.launch(cfg.apps.linkedin.package);
await handle.on("ui_stable", { timeoutMs: 90_000 });

handle.screenshot("./screenshots/01-antes-agree.png");
const tree = await handle.extract();
```

---

## 8. Mapa de módulos

| Recorte | Arquivo |
|---------|---------|
| `provisionEmulator` | [`lib/provision.js`](lib/provision.js) |
| `resetInstance` | [`lib/reset-instance.js`](lib/reset-instance.js) |
| Container / porta / registry | `start-runtime` · `attach-runtime` · `agent-registry` |
| `installApk` | [`lib/apks.js`](lib/apks.js) |
| `on` | [`lib/events.js`](lib/events.js) |
| Gestos / captura | [`lib/operate.js`](lib/operate.js) |
| `extract` | [`lib/extract.js`](lib/extract.js) |
| Sessão | [`lib/session.js`](lib/session.js) |

---

## 9. Testes

| Tipo | Comando |
|------|---------|
| Unitário (mock/stub, ao lado do módulo) | `npm test` |
| BDD e2e US/EP (runtime real, sem doubles) | `npm run test:e2e` |

```bash
cd screen-robot/src
npm test
npm run test:e2e   # requer Docker/Colima + adb
```

---

## 10. Piloto LinkedIn

```bash
cd screen-robot/src
npm run linkedin-login
```

Script [`scripts/linkedin-login.js`](scripts/linkedin-login.js):

1. Limpa `screenshots/`
2. `resetInstance(cfg)`
3. `provisionEmulator` → `installApk(linkedin)` → `launch` → `on("ui_stable")`
4. `01-antes-agree.png`
5. **AGREE** (se houver) → wait 5s → `02-apos-agree.png`
6. **Already have an account? Sign in** → wait 5s → `03-apos-login.png`
7. `extract()` ×5 → `tree-screen.png` + `component-tree.json`

Só LinkedIn (sem Instagram). Sem digitar credenciais e sem `saveSession`.

---

## 10b. Ver / operar a tela — `scripts/view.sh`

```bash
cd screen-robot/src
npm run view
# ou: ./scripts/view.sh --device 127.0.0.1:5555
```

Abre **scrcpy** no serial de `device.config.json` (ou `--device`) para visualizar e controlar o Android (tap, digitar, scroll) enquanto a API Node roda.

---

## 11. CLI legado

Steps avulsos (serial explícito; preferir o handle):

```bash
node cli.js tap 360 640 --device 127.0.0.1:5555
node cli.js setup-ime
node cli.js type "olá"
node cli.js shot ./screenshots/tela.png
node cli.js launch com.linkedin.android
node cli.js config.example.json
```
