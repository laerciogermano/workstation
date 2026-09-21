# screen-robot — Documento de visão

**Por quê:** fixar o *quê* do robô de tela antes de goals de negócio.  
**Importante:** este projeto **só** opera o device/tela via **Node**; não implementa cadência comercial nem fila de leads.  
**No fluxo:** **este documento** → stories → epics (prioridade) → roadmap → refinar estória (scenarios → bdds → protótipo se houver) → `7.tasks` / implementation-plan → pasta [`tasks/`](tasks/README.md) (EP/US/SC) → implementação em [`src/`](src/README.md).  
**Umbrella:** [`../connectmax/README.md`](../connectmax/README.md).  
**Consumidor LinkedIn:** [`../connectmax/linkedin-agent/`](../connectmax/linkedin-agent/README.md).  
**Negócio (fila/faturamento):** [`../connectmax/vendas/`](../connectmax/vendas/README.md).  
**Config IA:** [`config/config-ia.md`](config/config-ia.md).  
**Prompts:** [`../connectmax/prompts/timeline.md`](../connectmax/prompts/timeline.md).  
**Postmortem (runtime):** [`postmortem.md`](postmortem.md) — por que saímos do redroid e adotamos Android Studio.

---

## Visão

O **screen-robot** é um agent Android controlado por código Node: provisiona o device, instala APKs, recebe eventos de UI, **percebe a tela por imagem** (OCR para textos; visão/template para coords), executa operações e guarda estado de sessão.

**Princípio de percepção:** ler e automatizar a UI a partir de um **frame/imagem** (screenshot, stream ou **câmera em aparelho real**) — **OCR** para textos (`extract()` → lista plana só de `type: "text"`) e **visão/template** para coords (US-12 `matchImage`). **Não** depende de dump uiautomator / árvore de acessibilidade ADB. O caminho futuro (device físico + câmera) usa o **mesmo** pipeline imagem → OCR → **lista de textos** → gestos.

Além da automação por API, a instância Android permanece **disponível para controle interativo**: visualizar a tela (espelhamento) e operar manualmente — tocar, digitar, rolar e demais gestos — em paralelo ou em complemento ao código.

O runtime Android (**AVD** via [`pocs/android-studio/`](pocs/android-studio/README.md)) **deve mascarar** a identidade do ambiente: apps e telas **não** devem ver o nome do emulador/vendor, e sim props de um aparelho Android comum (marca/modelo de mercado).

## Mascarar identidade do aparelho

**US-22 · SC-28 · EP-01.** Contrato e detalhes: [`pocs/README.md`](pocs/README.md#mascarar-identidade-do-aparelho). Cada vendor só documenta *como* aplica.

## Problema

Automatizar apps móveis (emulador **ou** aparelho real filmado/capturado) exige um caminho estável em código: agent pronto, apps na versão certa, **leitura da tela por imagem/OCR** e gestos confiáveis — sem acoplar regras de venda e sem depender de acessibilidade ADB que não existe no fluxo só-câmera.

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

API em [`src/`](src/README.md). `provisionEmulator(cfg)` → `{ serial, kind, bootCompleted, provisionedAt }` (só dados). Ops: `on` / `installApk` / `launch` / … com `{ serial, … }`. `resetInstance(cfg)` recria o runtime do zero.

### 1. Pré-requisitos

| Item | Detalhe |
|------|---------|
| Node | ≥ 18 |
| `adb` | no `PATH` |
| Android SDK / Emulator | runtime **AVD** (`kind: "avd"`) — ver [`pocs/android-studio/`](pocs/android-studio/README.md) |
| System image | **Google APIs** ou **Google Play** (arm64 no Apple Silicon) — GMS para LinkedIn/Instagram/Tinder |
| Opcional | [`apkeep`](https://github.com/EFForg/apkeep) para baixar XAPK |

Create = sobe AVD nomeado por `provision.name` (ou `AVD_NAME`). Attach = reconecta ao serial existente (`emulator-5554`, …). Não é necessário rodar `start.sh` manualmente nesse fluxo.

**Controle interativo da tela:** janela nativa do emulator; opcionalmente [`src/scripts/view.sh`](src/scripts/view.sh) (`cd src && npm run view`) / scrcpy enquanto a API Node automatiza.

### 2. Configuração

Edite [`src/device.config.json`](src/device.config.json):

| Campo | Uso |
|-------|-----|
| `provision.name` | **Obrigatório** — id do agent / nome do AVD |
| `provision.kind` | `"avd"` (default documentado) |
| `provision.connectTimeoutMs` | Timeout de boot/conexão |
| `apps.*` | `package`, `version`, `artifact` (path local) ou `source` (download) |
| `provision.resetScript` | Opcional — wipe (`resetInstance`); default = `pocs/android-studio/scripts/reset.sh` (TODO — gap) |
| `session.path` | Path genérico de sessão (API EP-06; o piloto atual **não** grava sessão) |
| `screenshot.path` | Path ilustrativo na config; o piloto usa nomes fixos em `screenshots/` |
| `credentials.linkedin.*Env` | Reservado para login completo (piloto atual **não** digita user/senha) |

Serial é **resolvido** pela lib por agent (ex. `emulator-5554`).

### 3. Fluxo típico (código)

```js
import { provisionEmulator } from "./lib/provision.js";

const a = await provisionEmulator({
  provision: { name: "agent-a", kind: "avd" },
});
const b = await provisionEmulator({
  provision: { name: "agent-b", kind: "avd" },
});
// a.serial !== b.serial — AVDs distintos (mais pesado — ver EP-01)

const again = await provisionEmulator({
  provision: { name: "agent-a", kind: "avd" },
});
// again.serial === a.serial — anexou sem criar
```

A partir daí:

```js
import { on } from "./lib/events.js";
import { installApk } from "./lib/apks.js";
import { launch, tap, type, scroll, screenshot, matchImage } from "./lib/operate.js";
import { extract } from "./lib/extract.js";
import { saveSession, restoreSession, removeSession } from "./lib/session.js";

const { serial, kind } = a;

await installApk({ serial, ...cfg.apps.linkedin });

await on({ serial, event: "boot" });
await on({ serial, event: "app_open", pkg: "com.linkedin.android" });
await on({ serial, event: "ui_stable", timeoutMs: 90_000 });
await on({ serial, event: "frame_change" });

await launch({ serial, package: "com.linkedin.android" });
tap({ serial, x: 360, y: 640 });
await type({ serial, text: "11999999999", region: { x: 0, y: 700, width: 720, height: 500 } });
scroll({ serial, direction: "down", distance: 800 });
screenshot({ serial, path: "./screenshots/tela.png" });
const { x, y, confidence } = await matchImage({ serial, templatePath: "./templates/btn.png" });

const elements = await extract({ serial });
// → [ { type: "text", text, bounds, center }, … ]

await saveSession({ serial, kind, path: "./state/session.json", state: { step: "logged-in" } });
const state = await restoreSession({ path: "./state/session.json" });
await removeSession({ path: "./state/session.json" });
```

### 4. API pública (funções puras)

| Função | O quê |
|--------|--------|
| `provisionEmulator(cfg)` | Cria se `name` novo; anexa se já existir; retorna `{ serial, kind, bootCompleted, provisionedAt }` |
| `resetInstance(cfg)` | Wipe do AVD + sobe de novo; ADB + boot ok |
| `installApk({ serial, … })` | Lê spec → baixa se preciso → instala; `{ package, version, skipped }` |
| `on(cfg)` | `boot` · `app_open` · `ui_stable` · `frame_change` |
| `launch` / `tap` / `tapElement` / `type` / `scroll` / `screenshot` / `matchImage` / `openScrcpy` | Gestos e captura (`serial` no cfg) |
| `extract({ serial })` | Lista plana só de textos OCR |
| `findByText(serial, query)` | US-23: elementos lado a lado na query |
| `saveSession` / `restoreSession` / `removeSession` | Persistência JSON |

**Antes → depois:** métodos no handle → funções com `{ serial, … }`.

Erros tipados (campo `err.code`): `PROVISION_*` (incl. `PROVISION_INVALID_NAME`), `RESET_*`, `APK_*`, `OPERATE_*`, `SESSION_*`, `EVENT_*`.

### 5. Piloto LinkedIn

```bash
cd screen-robot/src
npm run linkedin-login
```

Ordem do script ([`src/scripts/linkedin-login.js`](src/scripts/linkedin-login.js)):

1. Limpar `screenshots/`
2. `resetInstance(cfg)` — instância do zero
3. `provisionEmulator` → `openScrcpy` → `installApk(linkedin)` → `launch` → `ui_stable`
4. Screenshot `01-tela-inicial.png`
5. `findByText(serial, "Sign in with Email")` → tap no `center` → `02-apos-sign-in-email.png`
6. `extract()` → console da lista de textos OCR + `frame-screen.png` + `elements.json`

Não digita credenciais e não chama `saveSession`.

**Aceite SC-30 (OCR partido):** fixture [`src/test/fixtures/linkedin-tela-inicial.png`](src/test/fixtures/linkedin-tela-inicial.png) — query devolve `Sign`+`in`+`with`+`Email`.

### 6. Testes

```bash
cd screen-robot/src
npm test          # unitários (inclui fixture LinkedIn)
npm run test:e2e  # BDD e2e US/EP (precisa runtime Android, exceto SC-30)

# Só LinkedIn / SC-30
node --test --test-timeout=120000 test/bdd/sc-30-linkedin-sign-in-with-email.test.js
node --test --test-timeout=120000 lib/find-by-text.fixture.test.js
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
