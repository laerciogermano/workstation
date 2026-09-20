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

Além da automação por API, a instância Android permanece **disponível para controle interativo**: visualizar a tela (espelhamento) e operar manualmente — tocar, digitar, rolar e demais gestos — em paralelo ou em complemento ao código.

## Problema

Automatizar apps móveis exige um caminho estável em código: agent pronto, apps na versão certa, leitura da tela e gestos confiáveis — sem acoplar regras de venda.

## Para quem

| Persona | Necessidade |
|---------|-------------|
| **Agente / desenvolvedor** | Libs Node para as seis capacidades sem acoplar a um app de negócio |
| **Operador / debug** | Ver e operar a tela do Android (tap, digitar, etc.) enquanto o agent está no ar |
| **linkedin-agent** | Usar o robô como infra para operações no LinkedIn |
| **Projeto vendas** | Indireto: consome o linkedin-agent, não o robô |

## Objetivo

Expor via Node: **provisionar · instalar APKs · eventos · operar · extrair · sessão**. Cenário piloto: login LinkedIn (BDDs em [`5.bdds.md`](5.bdds.md)).

Também será possível **deixar o controle do Android disponível** para um operador humano: ver a tela e agir (tap, type, scroll, etc.) via espelhamento ([`src/scripts/view.sh`](src/scripts/view.sh) / scrcpy · `npm run view`), sem depender só do script.

## Capacidades (v1)

Ver stories em [`1.stories.md`](1.stories.md) e cenários em [`4.scenarios.md`](4.scenarios.md).

## Fora de escopo

- Operações de domínio LinkedIn (login de negócio, busca, conexão) — isso é [`linkedin-agent`](../connectmax/linkedin-agent/README.md).
- Regras de prospecção, fila de leads, faturamento ou papéis de vendedor — isso é [`vendas`](../connectmax/vendas/README.md).
- Bypass de autenticação / scraping fora do uso legítimo do device.

---

## Como usar

API em [`src/`](src/README.md). Superfície do handle: `provisionEmulator(cfg)` → **handle** (cria se o `name` for novo; anexa se já existir). Ops paralelo (fora do handle): `resetInstance(cfg)` — recria o runtime do zero. Não passe `serial` nas operações do handle — ele vem do handle.

### 1. Pré-requisitos

| Item | Detalhe |
|------|---------|
| Node | ≥ 18 |
| `adb` | no `PATH` |
| Docker/Colima | para `kind: "redroid"` (lib sobe **container novo** por nome) — ver [`pocs/redroid/`](pocs/redroid/README.md) |
| Opcional | [`apkeep`](https://github.com/EFForg/apkeep) para baixar XAPK |

A lib sobe o container quando o `name` é novo. Com o mesmo `name` de novo, só reconecta. Não é necessário rodar `start.sh` manualmente nesse fluxo.

**Controle interativo da tela:** com o agent no ar, use [`src/scripts/view.sh`](src/scripts/view.sh) (`cd src && npm run view`) para visualizar e operar o Android (tocar, digitar, etc.) enquanto a API Node também pode automatizar.

### 2. Configuração

Edite [`src/device.config.json`](src/device.config.json):

| Campo | Uso |
|-------|-----|
| `provision.name` | **Obrigatório** — id do agent |
| `provision.kind` | `redroid` · `avd` · … |
| `provision.connectTimeoutMs` | Timeout de boot/conexão |
| `apps.*` | `package`, `version`, `artifact` (path local) ou `source` (download) |
| `provision.resetScript` | Opcional — script de wipe (`resetInstance`); default = `pocs/redroid/scripts/reset.sh` |
| `session.path` | Path genérico de sessão (API EP-06; o piloto atual **não** grava sessão) |
| `screenshot.path` | Path ilustrativo na config; o piloto usa nomes fixos em `screenshots/` |
| `credentials.linkedin.*Env` | Reservado para login completo (piloto atual **não** digita user/senha) |

Serial/porta são **alocados** pela lib por agent (não fixar um único `127.0.0.1:5555` para multi-instância).

### 3. Fluxo típico (código)

```js
import { provisionEmulator } from "./lib/provision.js";

const a = await provisionEmulator({
  provision: { name: "agent-a", kind: "redroid" },
});
const b = await provisionEmulator({
  provision: { name: "agent-b", kind: "redroid" },
});
// a.serial !== b.serial — containers distintos

const again = await provisionEmulator({
  provision: { name: "agent-a", kind: "redroid" },
});
// again.serial === a.serial — anexou sem criar
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

### 4. API pública e métodos do handle

| Método | O quê |
|--------|--------|
| `provisionEmulator(cfg)` | Cria se `name` novo; anexa se já existir; aloca serial; boot ok |
| `resetInstance(cfg)` | **Ops** (não é método do handle): wipe do volume + sobe de novo; ADB + boot ok |
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

Erros tipados (campo `err.code`): `PROVISION_*` (incl. `PROVISION_INVALID_NAME`), `RESET_*`, `APK_*`, `OPERATE_*`, `SESSION_*`, `EVENT_*`.

### 5. Piloto LinkedIn

```bash
cd screen-robot/src
npm run linkedin-login
```

Ordem do script ([`src/scripts/linkedin-login.js`](src/scripts/linkedin-login.js)):

1. Limpar `screenshots/`
2. `resetInstance(cfg)` — instância do zero
3. `provisionEmulator` → `installApk(linkedin)` → `launch` → `ui_stable`
4. Screenshot `01-tela-inicial.png`
5. `extract()` ×5 → console da árvore + `tree-screen.png` + `component-tree.json`

Não digita credenciais e não chama `saveSession`. Próximos taps (ex. Sign in with Email) entram depois de validar a tela nova.

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

→ Consumir `provisionEmulator` no [`linkedin-agent`](../connectmax/linkedin-agent/README.md) · aceite: [`5.bdds.md`](5.bdds.md)
