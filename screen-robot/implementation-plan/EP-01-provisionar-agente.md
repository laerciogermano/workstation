# Implementation plan — EP-01 Provisionar agente

**Por quê:** plano técnico do épico (sequências · agentes · passo a passo · contratos · classes · modelos · BDDs).  
**Épico:** [`2.epics.md`](../2.epics.md).  
**US:** [`1.stories.md`](../1.stories.md) · [`4.scenarios.md#ep-01--provisionar-agente`](../4.scenarios.md#ep-01--provisionar-agente) · [`5.bdds.md#ep-01--provisionar-agente`](../5.bdds.md#ep-01--provisionar-agente).  
**Biblioteca:** [`../src/lib/provision.js`](../src/lib/provision.js) — público: `provisionEmulator` (create-or-attach por `name`).  
**Runtime:** [`../pocs/redroid/`](../pocs/redroid/README.md) · [`../pocs/android-studio/`](../pocs/android-studio/README.md).

**Stack:** Node ≥ 18 · JavaScript · `adb` · Docker/Colima (redroid) ou AVD.

---

## Escopo

| ID | Item |
|----|------|
| US-01 | Provisionar um agente (container **novo** + **nome**) |
| SC-01 | Criar container/runtime nomeado |
| SC-02 | Garantir serial ADB online |
| SC-03 | Aguardar boot completo |
| US-20 | Resgatar agente existente |
| SC-25 | Localizar agent pelo nome |
| SC-26 | Reconectar e confirmar boot |

**Resultado:** handle com `name` + serial ADB `device` + `sys.boot_completed=1` → pronto para EP-02..06. Vários nomes ⇒ vários containers em paralelo.

---

## Árvore de arquivos

```text
src/
├── lib/
│   ├── provision.js                 # provisionEmulator (create-or-attach)
│   ├── provision.test.js
│   ├── start-runtime.js             # cria container novo (nome → porta/serial)
│   ├── start-runtime.test.js
│   ├── attach-runtime.js            # resolve nome → runtime existente
│   ├── attach-runtime.test.js
│   ├── ensure-adb-online.js
│   ├── ensure-adb-online.test.js
│   ├── wait-boot-completed.js
│   ├── wait-boot-completed.test.js
│   ├── adb.js
│   └── events.js
├── device.config.json               # provision.name (obrigatório no create)
└── test/
    └── bdd/
        ├── ep-01-provisionar-agente.test.js
        ├── us-01-agent-fica-pronto-para-adb.test.js
        └── us-20-resgatar-agente-existente.test.js
pocs/redroid/
├── docker-compose.yml               # multi-instância (nome / porta)
└── scripts/                         # start/stop por nome
```

Unitários ao lado do módulo (deps mock/stub). BDD e2e só US/EP.

---

## Biblioteca JavaScript

Arquivo: `src/lib/provision.js`.

**API pública:**

```js
import { provisionEmulator } from "./lib/provision.js";

// nome novo → cria container
const a = await provisionEmulator({
  provision: { name: "agent-a", kind: "redroid" },
});
// → { name, serial, kind, provisionedAt, bootCompleted: true, … }

// mesmo nome → anexa (US-20)
const again = await provisionEmulator({
  provision: { name: "agent-a", kind: "redroid" },
});
```

Helpers internos (`resolveConfig`, `startRuntime`, `attachRuntime`, `ensureAdbOnline`, `waitBootCompleted`) **não** são exportados.

| Superfície | O quê |
|------------|--------|
| **Público** | `provisionEmulator(cfg)` |
| **Privado** | alocar porta/serial · criar/anexar container · ADB · boot |

`cfg.provision.name` (ou `cfg.name`) é **obrigatório**. Serial/porta são **alocados** pela lib no create (não fixos na config do caller para multi-agent).

---

## Diagramas de sequência

### US-01 — Provisionar um agente

#### Agentes

| Agente | Responsabilidade |
|--------|------------------|
| Caller / CLI | Chama **só** `provisionEmulator(cfg)` e consome o `AgentHandle` |
| provision.js | Biblioteca: encapsula SC-01→SC-03 (start, ADB, boot) |
| Runtime (interno) | Cria container novo por `name` (ou resolve existente no attach) |
| AdbClient (interno) | `adb` connect, wait-for-device, getprop — **não** exportado |
| Device / emulador | Android alvo |

```mermaid
---
config:
  theme: base
  themeVariables:
    darkMode: true
    background: '#000000'
    primaryColor: '#000000'
    primaryTextColor: '#ffffff'
    primaryBorderColor: '#64748b'
    secondaryColor: '#000000'
    secondaryTextColor: '#ffffff'
    secondaryBorderColor: '#64748b'
    tertiaryColor: '#000000'
    tertiaryTextColor: '#ffffff'
    tertiaryBorderColor: '#64748b'
    lineColor: '#64748b'
    textColor: '#ffffff'
    mainBkg: '#000000'
    nodeBorder: '#64748b'
    clusterBkg: '#000000'
    clusterBorder: '#333333'
    titleColor: '#ffffff'
    edgeLabelBackground: '#000000'
    actorBkg: '#000000'
    actorBorder: '#64748b'
    actorTextColor: '#ffffff'
    actorLineColor: '#333333'
    signalColor: '#94a3b8'
    signalTextColor: '#ffffff'
    labelBoxBkgColor: '#000000'
    labelBoxBorderColor: '#64748b'
    labelTextColor: '#ffffff'
    loopTextColor: '#ffffff'
    noteBorderColor: '#64748b'
    noteBkgColor: '#111111'
    noteTextColor: '#ffffff'
    activationBorderColor: '#64748b'
    activationBkgColor: '#1a1a1a'
    sequenceNumberColor: '#ffffff'
    classText: '#ffffff'
---
sequenceDiagram
  autonumber
  actor Dev as Caller / CLI
  participant Lib as provision.js
  participant R as Runtime (interno)
  participant A as AdbClient (interno)
  participant D as Emulador / Device

  Dev->>Lib: provisionEmulator(cfg)
  note over Lib: único método público
  Lib->>Lib: resolveConfig(cfg)

  rect rgb(17,17,17)
    note over Lib,D: SC-01 Subir / conectar
    Lib->>R: startRuntime(cfg) se ainda não reachable
    R->>D: scripts/start.sh (docker/AVD)
    D-->>R: up
    R-->>Lib: reachable
  end

  rect rgb(26,26,26)
    note over Lib,D: SC-02 Serial ADB online
    loop até device ou timeout
      Lib->>A: connectIfTcp(serial)
      A->>D: adb connect
      D-->>A: connected
      Lib->>A: wait-for-device
      A->>D: adb -s serial wait-for-device
      D-->>A: device
      A-->>Lib: online
    end
  end

  rect rgb(34,34,34)
    note over Lib,D: SC-03 Boot completo
    loop até boot=1 ou timeout
      Lib->>A: getprop sys.boot_completed
      A->>D: adb shell getprop
      D-->>A: "1"
      A-->>Lib: boot=1
    end
  end

  Lib-->>Dev: AgentHandle { serial, kind, provisionedAt, bootCompleted }
```

#### Passo a passo

| # | De | Para | Chamada | Descrição | Entradas | Execução | Saídas |
|---|----|------|---------|-----------|----------|----------|--------|
| 1 | Dev | provision.js | `provisionEmulator(cfg)` | **Única** chamada pública | `cfg` | Orquestra SC-01→SC-03 por dentro | Promise `AgentHandle` |
| 2 | Lib | Lib | `resolveConfig` *(privado)* | Normalizar config | `cfg` + env | Defaults e precedência | config resolvida |
| 3 | Lib | Runtime | `startRuntime` *(privado)* | Garantir emulador up (SC-01) | `kind`, `startScript?` | Start se não reachable | `reachable` |
| 4 | Runtime | Device | `scripts/start.sh` | Materializar Android | script | Spawn docker/AVD | `up` |
| 5–6 | Device → Lib | — | reachable | Fechar SC-01 | `up` | Confirma | `true` |
| 7–14 | Lib ↔ Adb | *(privado)* | connect + wait-for-device | SC-02 | `serial` | Loop até `device` | `online` |
| 15–18 | Lib ↔ Adb | *(privado)* | getprop boot | SC-03 | `serial` | Poll até `1` | `boot=1` |
| 19 | Lib | Dev | `AgentHandle` | Entregar handle | estado interno | Monta saída + anexa `on` | `{ serial, kind, provisionedAt, bootCompleted, on }` |

#### Contratos

**API pública** (só isto é importável pelo caller):

```ts
// Pré: host com adb; runtime redroid/AVD disponível ou startável
// Erros: PROVISION_NO_SERIAL | PROVISION_START_FAILED | PROVISION_ADB_TIMEOUT | PROVISION_BOOT_TIMEOUT

type ProvisionConfig = {
  device?: string;
  provision?: {
    serial?: string;
    kind?: "adb" | "redroid" | "avd";
    connectTimeoutMs?: number;
    startScript?: string;
  };
};

type AgentHandle = {
  serial: string;
  kind: string;
  provisionedAt: string; // ISO-8601
  bootCompleted: true;
  /** EP-02: eventos de UI (serial já no handle). */
  on(
    event: "boot" | "app_open" | "ui_stable" | "dump_change",
    opts?: Record<string, unknown>,
    onEvent?: (payload: { type: string; [k: string]: unknown }) => void,
  ): Promise<unknown>;
};

/** Único método exportado pela biblioteca. */
declare function provisionEmulator(cfg: ProvisionConfig): Promise<AgentHandle>;

const handle = await provisionEmulator({
  provision: {
    serial: "127.0.0.1:5555",
    kind: "redroid",
    connectTimeoutMs: 120_000,
  },
});
// → { serial, kind, provisionedAt, bootCompleted: true, on }
// EP-02: await handle.on("ui_stable", { stableMs: 1_200 });
```

**Interno (não exportar):** `resolveConfig`, `startRuntime`, `ensureAdbOnline`, `waitBootCompleted` — encapsulam as linhas #2–#18 do passo a passo. `on` é anexado ao handle via `events.createOn(serial)` (EP-02).

---

## Modelos

### ProvisionConfig

| Campo | Tipo | Origem | Descrição |
|-------|------|--------|-----------|
| `serial` | `string` | `cfg.provision.serial` \| `cfg.device` \| `ANDROID_SERIAL` | Ex.: `127.0.0.1:5555` |
| `kind` | `"adb" \| "redroid" \| "avd"` | `cfg.provision.kind` | Runtime alvo |
| `connectTimeoutMs` | `number` | `cfg.provision.connectTimeoutMs` | Default `120000` |
| `startScript` | `string?` | futuro | Path do script de start (SC-01) |
| `host` | `string?` | futuro | Host Docker/Colima |

### AgentHandle (saída)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `serial` | `string` | Serial ADB online |
| `kind` | `string` | Kind efetivo |
| `provisionedAt` | `ISO-8601` | Momento do aceite |
| `bootCompleted` | `boolean` | Sempre `true` no sucesso |
| `on` | `(event, opts?, onEvent?) => Promise` | EP-02: eventos de UI |
| `installApk` | `(app) => Promise` | EP-03 |
| `launch` / `tap` / `type` / `scroll` / `screenshot` / `matchImage` | métodos | EP-04 |
| `extract` | `() => Promise` | EP-05 — JSON acumulado a cada chamada |
| `saveSession` / `removeSession` / `restoreSession` | métodos | EP-06 |

Métodos EP-02..06 são anexados ao handle em `provisionEmulator` (libs internas).

### DeviceState (máquina de estados)

```text
Absent → Starting → Reachable → AdbOnline → Booted
                ↘──────── timeout / error ────────↗
```

| Estado | Significado | SC |
|--------|-------------|-----|
| `Absent` | Sem processo/container | — |
| `Starting` | Script de start em curso | SC-01 |
| `Reachable` | Runtime alcançável (porta/processo) | SC-01 |
| `AdbOnline` | `adb` lista serial como `device` | SC-02 |
| `Booted` | `sys.boot_completed=1` | SC-03 |

### Erros

| Código | Quando |
|--------|--------|
| `PROVISION_NO_SERIAL` | Config sem serial |
| `PROVISION_START_FAILED` | Script/runtime não sobe (SC-01) |
| `PROVISION_ADB_TIMEOUT` | Serial não fica `device` (SC-02) |
| `PROVISION_BOOT_TIMEOUT` | Boot não completa (SC-03) |

---

## Diagrama de classes

```mermaid
---
config:
  theme: base
  themeVariables:
    darkMode: true
    background: '#000000'
    primaryColor: '#000000'
    primaryTextColor: '#ffffff'
    primaryBorderColor: '#64748b'
    secondaryColor: '#000000'
    secondaryTextColor: '#ffffff'
    secondaryBorderColor: '#64748b'
    tertiaryColor: '#000000'
    tertiaryTextColor: '#ffffff'
    tertiaryBorderColor: '#64748b'
    lineColor: '#64748b'
    textColor: '#ffffff'
    mainBkg: '#000000'
    nodeBorder: '#64748b'
    clusterBkg: '#000000'
    clusterBorder: '#333333'
    titleColor: '#ffffff'
    edgeLabelBackground: '#000000'
    actorBkg: '#000000'
    actorBorder: '#64748b'
    actorTextColor: '#ffffff'
    actorLineColor: '#333333'
    signalColor: '#94a3b8'
    signalTextColor: '#ffffff'
    labelBoxBkgColor: '#000000'
    labelBoxBorderColor: '#64748b'
    labelTextColor: '#ffffff'
    loopTextColor: '#ffffff'
    noteBorderColor: '#64748b'
    noteBkgColor: '#111111'
    noteTextColor: '#ffffff'
    activationBorderColor: '#64748b'
    activationBkgColor: '#1a1a1a'
    sequenceNumberColor: '#ffffff'
    classText: '#ffffff'
---
classDiagram
  direction TB

  class provision_js {
    <<library>>
    +provisionEmulator(cfg) Promise~AgentHandle~
  }

  note for provision_js "Único export público.\nSC-01..03 encapsulados."

  class ProvisionConfig {
    +string serial
    +string kind
    +number connectTimeoutMs
    +string startScript
  }

  class AgentHandle {
    +string serial
    +string kind
    +string provisionedAt
    +boolean bootCompleted
    +on(event, opts, onEvent) Promise
  }

  note for AgentHandle "on anexado no provision (EP-02)"

  class Internals {
    <<private>>
    resolveConfig()
    startRuntime()
    ensureAdbOnline()
    waitBootCompleted()
  }

  class AdbClient {
    <<private module adb.js>>
    adb()
    connectIfTcp()
    sleep()
  }

  class events_js {
    <<EP-02 internal>>
    createOn(serial)
  }

  provision_js --> Internals : usa
  Internals --> AdbClient : usa
  provision_js ..> ProvisionConfig : lê
  provision_js ..> AgentHandle : cria
  provision_js --> events_js : anexa on
  AgentHandle --> events_js : on
```

**Hoje:** `provisionEmulator` exportado; ADB + boot encapsulados; `on` no handle (EP-02).  
**Gap:** completar `startRuntime` (redroid/AVD) **dentro** da lib, sem expandir a API pública além do handle.

---

## Cenários BDD

Fonte canônica: [`5.bdds.md#ep-01--provisionar-agente`](../5.bdds.md#ep-01--provisionar-agente).

### US-01 — Agent nomeado fica pronto para ADB

```gherkin
Cenário: US-01 Agent nomeado fica pronto para ADB
  Dado o config com nome único e o runtime Android disponíveis
  Quando o provisionamento cria um container novo para esse nome, garante serial online e aguarda boot completo
  Então o agent está pronto para ADB (nome, serial online e boot ok)
```

### SC-01 — Criar container/runtime nomeado

```gherkin
Cenário: SC-01 Container novo sobe e fica alcançável
  Dado nome único do agent, host e imagem/runtime
  Quando a lib aloca serial/porta e cria um container novo ligado ao nome
  Então o agent nomeado está em execução e alcançável
```

### SC-02 — Garantir serial ADB online

```gherkin
Cenário: SC-02 Serial ADB fica online
  Dado o agent alcançável e o serial alocado ao nome
  Quando adb connect / listagem de devices é repetida até o serial aparecer como device
  Então o serial ADB está online
```

### SC-03 — Aguardar boot completo

```gherkin
Cenário: SC-03 Boot completo no device
  Dado o serial ADB online
  Quando o sistema faz poll de boot (ex. sys.boot_completed)
  Então o device reporta boot completo
```

### US-20 — Agent existente é resgatado pelo nome

```gherkin
Cenário: US-20 Agent existente é resgatado pelo nome
  Dado um agent já provisionado com determinado nome
  Quando provisionEmulator é chamado de novo com o mesmo nome
  Então o handle fica pronto sem criar outro emulador
```

### SC-25 — Localizar agent pelo nome

```gherkin
Cenário: SC-25 Runtime é resolvido pelo nome
  Dado o nome de um agent já criado
  Quando a lib resolve container/runtime e serial associados ao nome
  Então a referência ao runtime existente está disponível
```

### SC-26 — Reconectar e confirmar boot

```gherkin
Cenário: SC-26 Handle anexado fica pronto
  Dado o runtime localizado pelo nome
  Quando adb connect / wait-for-device e poll de boot concluem
  Então o handle está pronto (serial online, boot ok) sem novo container
```

---

## Plano de implementação (gaps → entregas)

| # | Entrega | SC | Arquivos | Critério |
|---|---------|-----|----------|----------|
| I1 | `provisionEmulator` exige `name`; cria se novo | US-01 / SC-01 | `provision.js` · `start-runtime.js` | Container novo |
| I2 | Alocação de porta/serial por agent | SC-01 | `start-runtime.js` · pocs redroid | N agents em paralelo |
| I3 | `ensureAdbOnline` + `waitBootCompleted` no serial alocado | SC-02/03 | existentes | Encapsulados |
| I4 | Mesmo `provisionEmulator` anexa se nome existe | US-20 / SC-25..26 | `attach-runtime.js` · `provision.js` | Sem novo container |
| I5 | Handle inclui `name` | US-01/20 | `provision.js` | `handle.name` estável |
| I6 | BDD e2e US-01 / US-20 / EP-01 | — | `test/bdd/` | Aceite multi-agent |
| I7 | Piloto LinkedIn passa `name` | US-01 | `linkedin-login.js` · config | Compatível |

### Ordem

```text
I1 → I2 → I3 → I5 → I4 → I6 → I7
```

---

## Mapeamento código atual

| Peça | Status |
|------|--------|
| `provisionEmulator` (create-or-attach por `name`) | Existe — evoluir / consolidar |
| `attachRuntime` interno | Interno do provision |
| Alocação multi-porta / multi-container | Gap (POC redroid multi) |
| Internos ADB / boot | `ensure-adb-online` · `wait-boot-completed` |
| BDD e2e US-01 / US-20 / EP-01 | Estender multi-nome |

---

## Critério de pronto (épico)

1. `provisionEmulator({ name })` cria se novo; anexa se o nome já existir  
2. SC-01..03 e SC-25..26 encapsulados no mesmo método  
3. Handle com `name`, `serial`, `bootCompleted`  
4. ≥2 agents simultâneos no e2e  
5. Piloto LinkedIn usa `name`  

## Próximos passos

→ Implementar I1–I7 em [`src`](../src/README.md)  
→ Aceite: [`5.bdds.md#ep-01--provisionar-agente`](../5.bdds.md#ep-01--provisionar-agente)
