# Implementation plan — EP-03 Instalar APKs

**Por quê:** plano técnico do épico (sequências · agentes · passo a passo · contratos · classes · modelos · BDDs).  
**Épico:** [`2.epics.md`](../2.epics.md).  
**US:** [`1.stories.md`](../1.stories.md) · [`4.scenarios.md#ep-03--instalar-apks`](../4.scenarios.md#ep-03--instalar-apks) · [`5.bdds.md#ep-03--instalar-apks`](../5.bdds.md#ep-03--instalar-apks).  
**Handle:** `installApk` é método do [`AgentHandle`](EP-01-provisionar-agente.md) — **não** é função solta com `serial`.  
**Pré-requisito:** [`EP-01`](EP-01-provisionar-agente.md) · `provisionEmulator` → handle.  
**Implementação interna:** [`../src/lib/apks.js`](../src/lib/apks.js) (anexado ao handle em `provision.js`).

**Stack:** Node ≥ 18 · JavaScript · `adb` · runtime provisionado (EP-01).

---

## Escopo

| ID | Item |
|----|------|
| US-06 | Instalar APKs |
| SC-08 | Ler versão na config |
| SC-09 | Baixar APK na versão definida |
| SC-10 | Instalar pacote no agent |

**Resultado:** apps da config instalados na versão pedida via `handle.installApk(...)`.

---

## Árvore de arquivos

```text
src/
├── lib/
│   ├── apks.js                      # createInstallApk → handle.installApk
│   ├── apks.test.js
│   ├── apk-read-spec.js             # SC-08
│   ├── apk-read-spec.test.js
│   ├── apk-get-installed-version.js
│   ├── apk-get-installed-version.test.js
│   ├── apk-download.js              # SC-09
│   ├── apk-download.test.js
│   ├── apk-install-package.js       # SC-10
│   ├── apk-install-package.test.js
│   └── provision.js                 # anexa installApk ao handle
├── apks/
│   └── ADBKeyboard.apk              # artefato local (e2e)
└── test/
    └── bdd/
        ├── ep-03-instalar-apks.test.js
        └── us-06-apps-da-config-ficam-instalados.test.js
```

---

## Fluxo (obrigatório)

1. **Provisionar** (EP-01) → `AgentHandle`.  
2. **Usar o handle** → `handle.installApk(app)`.

```js
import { provisionEmulator } from "./lib/provision.js";

const handle = await provisionEmulator(cfg);
await handle.installApk(cfg.apps.linkedin);
// → { package, version, skipped, artifactPath? }
```

Não passar `serial` — vem do handle. Sequência SC-08→SC-10 encapsulada por dentro.

| Superfície | O quê |
|------------|--------|
| **Público (caller)** | `provisionEmulator` → `handle.installApk(app)` |
| **Privado** | ler spec · versionName · download · adb install |

---

## Diagramas de sequência

### Visão geral — provisionar, depois `handle.installApk`

#### Agentes

| Agente | Responsabilidade |
|--------|------------------|
| Caller | `provisionEmulator` → `handle.installApk(app)` |
| AgentHandle | Expõe `installApk`; carrega `serial` |
| apks.js (interno) | Encapsula SC-08→SC-10 |
| Device | Recebe o package |

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
  actor Dev as Caller
  participant P as provision.js
  participant H as AgentHandle
  participant K as apks (interno)
  participant D as Device

  Dev->>P: provisionEmulator(cfg)
  P-->>Dev: handle

  Dev->>H: installApk(app)
  H->>K: installApk(serial, app)
  note over K: SC-08 ler alvo · SC-09 baixar · SC-10 instalar
  alt já na versão
    K-->>H: skipped
  else
    K->>D: download + adb install
    D-->>K: ok
    K-->>H: installed
  end
  H-->>Dev: InstallResult
```

#### Contratos

```ts
// Pré: handle de EP-01; apkeep ou artefato local
// Erros: APK_CONFIG_INVALID | APK_DOWNLOAD_FAILED | APK_INSTALL_FAILED

type AppSpec = {
  package: string;
  version?: string;
  source?: string;
  artifact?: string;
};

type InstallResult = {
  package: string;
  version: string;
  skipped: boolean;
  artifactPath?: string;
};

type AgentHandle = {
  // … EP-01 / EP-02 …
  installApk(app: AppSpec): Promise<InstallResult>;
};

const handle = await provisionEmulator(cfg);
const r = await handle.installApk({
  package: "com.linkedin.android",
  version: "4.1.986",
  source: "apk-pure",
});
```

**Interno (não exportar ao caller como API com serial):** `downloadApk`, `getInstalledVersion`, `adbInstall` — usados por `createInstallApk(serial)` anexado ao handle.

---

## Modelos

### AppSpec / InstallResult

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `package` | `string` | Package Android |
| `version` | `string?` | Versão alvo |
| `source` | `string?` | Ex. apk-pure |
| `artifact` | `string?` | Path local |
| `skipped` | `boolean` | Já na versão (resultado) |

### Erros

| Código | Quando |
|--------|--------|
| `APK_CONFIG_INVALID` | Sem package |
| `APK_DOWNLOAD_FAILED` | apkeep/artefato |
| `APK_INSTALL_FAILED` | adb install |

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
    classText: '#ffffff'
---
classDiagram
  direction TB
  class AgentHandle {
    +installApk(app) Promise~InstallResult~
  }
  class apks_js {
    <<internal>>
    createInstallApk(serial)
  }
  note for AgentHandle "Caller: provision → handle.installApk"
  AgentHandle --> apks_js : installApk
```

---

## Cenários BDD

Fonte: [`5.bdds.md#ep-03--instalar-apks`](../5.bdds.md#ep-03--instalar-apks). Caller: handle já provisionado; “Quando…” = `handle.installApk`.

---

## Plano de implementação (gaps → entregas)

| # | Entrega | SC | Critério |
|---|---------|-----|----------|
| I1 | `createInstallApk(serial)` + anexar `handle.installApk` | — | Sem `serial` no caller |
| I2 | Skip se versionName == alvo | SC-08/10 | Idempotente |
| I3 | Validar versão pós-install | SC-10 | Assert |
| I4 | Erros tipados | SC-09/10 | Códigos estáveis |
| I5 | Piloto usa `handle.installApk` | — | linkedin-login |

### Ordem

```text
I1 → I2 → I3 → I4 → I5
```

---

## Mapeamento código atual

| Peça | Status |
|------|--------|
| `handle.installApk` | Existe via `createInstallApk` |
| SC-08 / 09 / 10 | `apk-read-spec` · `apk-download` · `apk-install-package` |
| Skip se versão ok | Sim |
| Erros tipados | `APK_CONFIG_INVALID` · `APK_DOWNLOAD_FAILED` · `APK_INSTALL_FAILED` |
| Piloto LinkedIn | `handle.installApk` |

---

## Critério de pronto (épico)

1. Caller: `provisionEmulator` → `handle.installApk`  
2. SC-08..10 encapsulados  
3. BDDs US-06 + SC  

## Próximos passos

→ Implementar I1–I5 em [`src`](../src/README.md)  
→ Aceite: [`5.bdds.md#ep-03--instalar-apks`](../5.bdds.md#ep-03--instalar-apks)
