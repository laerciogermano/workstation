# screen-robot — Documento de visão

**Por quê:** fixar o *quê* do robô de tela antes de goals de negócio.  
**Importante:** este projeto **só** opera o device/tela via **Node**; não implementa cadência comercial nem fila de leads.  
**No fluxo:** **este documento** → stories → epics (prioridade) → roadmap → refinar estória (scenarios → bdds → protótipo se houver) → `7.tasks` / implementation-plan → pasta [`tasks/`](tasks/README.md) (EP/US/SC) → implementação em [`src/`](src/README.md).  
**Umbrella:** [`../connectmax/README.md`](../connectmax/README.md).  
**Consumidor LinkedIn:** [`../connectmax/linkedin-agent/`](../connectmax/linkedin-agent/README.md).  
**Negócio (fila/faturamento):** [`../connectmax/vendas/`](../connectmax/vendas/README.md).  
**Config IA:** [`config/config-ia.md`](config/config-ia.md).  
**Prompts:** [`../connectmax/prompts/timeline.md`](../connectmax/prompts/timeline.md).

---

## Visão

O **screen-robot** é um agent Android controlado por código Node: provisiona o device, instala APKs, recebe eventos de UI, extrai elementos/informações da tela, executa operações e guarda estado de sessão.

## Problema

Automatizar apps móveis exige um caminho estável em código: agent pronto, apps na versão certa, leitura da tela e gestos confiáveis — sem acoplar regras de venda.

## Para quem

| Persona | Necessidade |
|---------|-------------|
| **Agente / desenvolvedor** | Libs Node para as seis capacidades sem acoplar a um app de negócio |
| **linkedin-agent** | Usar o robô como infra para operações no LinkedIn |
| **Projeto vendas** | Indireto: consome o linkedin-agent, não o robô |

## Objetivo

Expor via Node: **provisionar · instalar APKs · eventos · operar · extrair · sessão**. Cenário piloto: login LinkedIn (BDDs em [`5.bdds.md`](5.bdds.md)).

## Capacidades (v1)

Ver stories em [`1.stories.md`](1.stories.md) e cenários em [`4.scenarios.md`](4.scenarios.md).

## Fora de escopo

- Operações de domínio LinkedIn (login de negócio, busca, conexão) — isso é [`linkedin-agent`](../connectmax/linkedin-agent/README.md).
- Regras de prospecção, fila de leads, faturamento ou papéis de vendedor — isso é [`vendas`](../connectmax/vendas/README.md).
- Bypass de autenticação / scraping fora do uso legítimo do device.

---

## Como usar

API em [`src/`](src/README.md). Superfície pública: `provisionEmulator(cfg)` → **handle** com todos os métodos. Não passe `serial` nas operações — ele vem do handle.

### 1. Pré-requisitos

| Item | Detalhe |
|------|---------|
| Node | ≥ 18 |
| `adb` | no `PATH` |
| Runtime Android | redroid (`127.0.0.1:5555`) ou emulador — ver [`pocs/`](pocs/README.md) |
| Opcional | [`apkeep`](https://github.com/EFForg/apkeep) para baixar XAPK |

Subir redroid (exemplo):

```bash
cd screen-robot/pocs/redroid
./scripts/start.sh   # sobe container + adb connect
# opcional: ./scripts/view.sh  # scrcpy
```

### 2. Configuração

Edite [`src/device.config.json`](src/device.config.json):

| Campo | Uso |
|-------|-----|
| `provision.serial` / `device` | Serial ADB (ex. `127.0.0.1:5555`) |
| `provision.connectTimeoutMs` | Timeout de boot/conexão |
| `apps.*` | `package`, `version`, `artifact` (path local) ou `source` (download) |
| `session.path` / `screenshot.path` | Paths do piloto LinkedIn |
| `credentials.linkedin.*Env` | Nomes das env vars de user/senha |

### 3. Fluxo típico (código)

```js
import { readFileSync } from "node:fs";
import { provisionEmulator } from "./lib/provision.js";

const cfg = JSON.parse(readFileSync("./device.config.json", "utf8"));
const handle = await provisionEmulator(cfg);
// handle.serial · handle.kind · handle.bootCompleted
```

A partir daí, só o handle:

```js
// Instalar APK (skip se versão já ok)
await handle.installApk(cfg.apps.linkedin);

// Eventos (aguarda sinal antes de operar)
await handle.on("boot");
await handle.on("app_open", { pkg: "com.linkedin.android" });
await handle.on("ui_stable", { timeoutMs: 90_000 });
await handle.on("dump_change");

// Operar tela
await handle.launch("com.linkedin.android");
handle.tap(360, 640);
handle.type("olá");
handle.scroll({ direction: "down", distance: 800 });
handle.screenshot("./screenshots/tela.png");
const { x, y, confidence } = await handle.matchImage("./templates/btn.png");

// Extrair UI (cada chamada enriquece a mesma árvore)
const t1 = await handle.extract(); // textos
const t2 = await handle.extract(); // hierarquia
const t3 = await handle.extract(); // ícones
const t4 = await handle.extract(); // listas
const t5 = await handle.extract(); // imagens
// → { type: "root", children: [ … nodes com type/bounds/text ] }

// Sessão
await handle.saveSession("./state/session.json", { step: "logged-in" });
const state = await handle.restoreSession("./state/session.json");
await handle.removeSession("./state/session.json");
```

### 4. Métodos do handle

| Método | O quê |
|--------|--------|
| `installApk(app)` | Lê spec → baixa se preciso → instala; retorna `{ package, version, skipped }` |
| `on(event, opts?, cb?)` | `boot` · `app_open` · `ui_stable` · `dump_change` |
| `launch(pkg, activity?)` | Abre app |
| `tap(x, y)` / `tapElement(el)` | Toque |
| `type(text)` | Digita (ASCII via `input text`; unicode via ADBKeyBoard) |
| `scroll({ direction, distance, x?, y? })` | Swipe |
| `screenshot(path)` | Grava PNG |
| `matchImage(templatePath)` | `{ x, y, confidence }` |
| `extract()` | Árvore DOM progressiva |
| `saveSession` / `restoreSession` / `removeSession` | Persistência JSON |

Erros tipados (campo `err.code`): `PROVISION_*`, `APK_*`, `OPERATE_*`, `SESSION_*`, `EVENT_*`.

### 5. Piloto LinkedIn

```bash
cd screen-robot/src
export LINKEDIN_USER='seu@email.com'
export LINKEDIN_PASSWORD='***'
npm run linkedin-login
```

Ordem do script: provisionar → instalar Instagram/LinkedIn → launch → `ui_stable` → screenshot → extrair campos → digitar → Entrar → `saveSession`.

### 6. Testes

```bash
cd screen-robot/src
npm test          # unitários (mock/stub, sem device)
npm run test:e2e  # BDD e2e US/EP (precisa runtime Android)
```

Detalhe das libs e CLI legado: [`src/README.md`](src/README.md).

---

## Artefatos

| Artefato | Arquivo | Status |
|----------|---------|--------|
| Stories — US título + descrição | [`1.stories.md`](1.stories.md) | Feito |
| Épicos (prioridade) | [`2.epics.md`](2.epics.md) | Feito |
| Roadmap (Gantt) | [`3.roadmap.md`](3.roadmap.md) | Feito |
| Cenários | [`4.scenarios.md`](4.scenarios.md) | Feito |
| BDDs | [`5.bdds.md`](5.bdds.md) | Feito |
| Implementation plan | por épico em [`implementation-plan/`](implementation-plan/README.md) | Feito |
| Tasks (Gantt) | [`7.tasks.md`](7.tasks.md) | Feito |
| Tasks (EP/US/SC) | [`tasks/`](tasks/README.md) | EP-01..06 |
| Sources | [`src/`](src/README.md) | Feito |

## Próximos passos

→ Consumir o handle no [`linkedin-agent`](../connectmax/linkedin-agent/README.md) · aceite: [`5.bdds.md`](5.bdds.md)
