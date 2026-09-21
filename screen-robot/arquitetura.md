# Arquitetura — screen-robot

**Por quê:** visão estrutural única do runtime Node + ADB (módulos, contratos, sequências).  
**API canônica:** [`src/README.md`](src/README.md) · **Visão:** [`README.md`](README.md) · **Planos por épico:** [`implementation-plan/`](implementation-plan/README.md) · **Runtime:** [`pocs/`](pocs/README.md).

---

## 1. Princípios

| Princípio | Detalhe |
|-----------|---------|
| Funções puras | Sem handle; cada op recebe `{ serial, … }` e devolve dados |
| Percepção por imagem | `extract` = frame → OCR → textos; gestos por coordenadas |
| Runtime canônico | AVD (`kind: "avd"`); redroid = legado |
| Create / attach | Mesmo `name` → anexa; não cria segundo AVD/container |
| Deps injetáveis | `deps` opcional em libs (testes unitários) |

**Fora de escopo:** regras LinkedIn/vendas (consumidores externos).

---

## 2. Camadas

```text
scripts/ · cli.js          ← entry (pilotos / legado)
        ↓
lib/* públicos             ← provision · on · installApk · operate · extract · session · reset
        ↓
lib/* internos             ← start-runtime · events waiters · apk-* · frame · ocr · adb
        ↓
pocs/*/scripts/*.sh        ← start / reset AVD|redroid
        ↓
adb · emulator · docker · scrcpy · tesseract.js
```

| Camada | Papel |
|--------|--------|
| Scripts | Orquestram o fluxo piloto (`linkedin-login`, `app-home`, …) |
| API pública | Contratos EP-01..06 |
| Internos | Resolução de serial, waits, pipeline APK/OCR |
| Shell / vendor | Sobe ou wipe o runtime |
| Externos | ADB, emulador, OCR, scrcpy |

---

## 3. Diagrama de classes — sistema

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
    classText: '#ffffff'
---
classDiagram
  direction TB

  class provision_js {
    <<EP-01>>
    +provisionEmulator(cfg, deps) Promise~ProvisionResult~
  }
  class reset_instance_js {
    <<ops>>
    +resetInstance(cfg, deps) Promise~ResetResult~
    +defaultResetScript(kind)
  }
  class events_js {
    <<EP-02>>
    +on(cfg, deps) Promise~UiEventResult~
  }
  class apks_js {
    <<EP-03>>
    +installApk(cfg, deps) Promise~InstallResult~
  }
  class operate_js {
    <<EP-04>>
    +launch(cfg)
    +tap(cfg)
    +tapElement(cfg)
    +type(cfg)
    +scroll(cfg)
    +screenshot(cfg)
    +matchImage(cfg)
    +openScrcpy(cfg)
    +key(cfg)
    +buildKeyCenters(words)
  }
  class extract_js {
    <<EP-05>>
    +extract(cfg) Promise~TextElement[]~
    +extractElements(serial)
    +findByText(serial, query)
    +matchByText(elements, query)
  }
  class session_js {
    <<EP-06>>
    +saveSession(cfg)
    +restoreSession(cfg)
    +removeSession(cfg)
  }

  class start_runtime_js {
    +startRuntime(resolved)
    +findSerialForAvd(name)
    +isRuntimeReachable(serial)
    +defaultStartScript(kind)
  }
  class redroid_instance_js {
    +serialForRedroidName(name)
    +findSerialForRedroid(name)
    +portForRedroidName(name)
  }
  class ensure_adb_online_js {
    +ensureAdbOnline(serial, timeoutMs)
  }
  class wait_boot_completed_js {
    +waitBootCompleted(serial, timeoutMs)
  }
  class event_boot_js {
    +waitBoot(serial, opts)
  }
  class event_app_open_js {
    +waitAppOpen(serial, opts)
  }
  class event_ui_stable_js {
    +waitUiStable(serial, opts)
  }
  class event_dump_change_js {
    +waitDumpChange(serial, opts)
  }
  class apk_read_spec_js {
    +readAppSpec(app) AppSpec
  }
  class apk_get_installed_version_js {
    +getInstalledVersion(serial, pkg)
  }
  class apk_download_js {
    +ensureApkArtifact(spec)
  }
  class apk_install_package_js {
    +installPackage(serial, path)
  }
  class frame_js {
    +captureFrame(serial) path
  }
  class ocr_js {
    +ocrWords(imagePath) OcrWord[]
  }
  class adb_js {
    <<leaf>>
    +adb(serial, args)
    +adbOk(serial, args)
    +connectIfTcp(serial)
    +sleep(ms)
  }

  provision_js --> start_runtime_js
  provision_js --> ensure_adb_online_js
  provision_js --> wait_boot_completed_js
  reset_instance_js --> start_runtime_js
  reset_instance_js --> ensure_adb_online_js
  reset_instance_js --> wait_boot_completed_js
  start_runtime_js --> redroid_instance_js
  start_runtime_js --> adb_js
  ensure_adb_online_js --> adb_js
  wait_boot_completed_js --> adb_js

  events_js --> event_boot_js
  events_js --> event_app_open_js
  events_js --> event_ui_stable_js
  events_js --> event_dump_change_js
  event_boot_js --> adb_js
  event_app_open_js --> adb_js
  event_ui_stable_js --> extract_js : dumpUiXml
  event_dump_change_js --> extract_js : dumpUiXml

  apks_js --> apk_read_spec_js
  apks_js --> apk_get_installed_version_js
  apks_js --> apk_download_js
  apks_js --> apk_install_package_js
  apk_get_installed_version_js --> adb_js
  apk_install_package_js --> adb_js

  operate_js --> adb_js
  operate_js --> frame_js
  operate_js --> ocr_js
  extract_js --> frame_js
  extract_js --> ocr_js
  frame_js --> adb_js
```

Modelos de dados (tipos lógicos):

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
    lineColor: '#64748b'
    textColor: '#ffffff'
    mainBkg: '#000000'
    classText: '#ffffff'
---
classDiagram
  direction LR
  class DeviceConfig {
    +string device
    +ProvisionBlock provision
    +map apps
    +SessionBlock session
  }
  class ProvisionBlock {
    +string name
    +string kind
    +string serial
    +number connectTimeoutMs
    +string startScript
    +string resetScript
  }
  class ProvisionResult {
    +string serial
    +string kind
    +string provisionedAt
    +bool bootCompleted
  }
  class ResetResult {
    +string serial
    +string kind
    +string resetAt
  }
  class AppSpec {
    +string package
    +string version
    +string source
    +string artifact
  }
  class InstallResult {
    +string package
    +string version
    +bool skipped
    +string artifactPath
  }
  class OnConfig {
    +string serial
    +EventName event
    +number timeoutMs
    +number stableMs
    +string pkg
    +function onEvent
  }
  class TextElement {
    +string type
    +string text
    +Bounds bounds
    +number[] center
  }
  class OcrWord {
    +string text
    +Bounds bounds
    +number confidence
  }
  class SessionState {
    +string serial
    +string kind
    +string savedAt
    +object ...state
  }
  DeviceConfig --> ProvisionBlock
  DeviceConfig --> AppSpec
  ProvisionResult ..> ProvisionBlock : resultado de
  InstallResult ..> AppSpec : resultado de
  TextElement ..> OcrWord : derivado de
```

---

## 4. Sequências

### 4.1 Piloto completo (LinkedIn / app-home)

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
    lineColor: '#64748b'
    textColor: '#ffffff'
    mainBkg: '#000000'
    actorBkg: '#000000'
    actorBorder: '#64748b'
    actorTextColor: '#ffffff'
    signalColor: '#94a3b8'
    signalTextColor: '#ffffff'
    noteBorderColor: '#64748b'
    noteBkgColor: '#111111'
    noteTextColor: '#ffffff'
    activationBorderColor: '#64748b'
    activationBkgColor: '#1a1a1a'
    sequenceNumberColor: '#ffffff'
---
sequenceDiagram
  autonumber
  actor Script as scripts/*
  participant Reset as reset-instance
  participant Prov as provision
  participant Op as operate
  participant Apk as apks
  participant Ev as events.on
  participant X as extract

  Script->>Reset: resetInstance(cfg)
  Reset-->>Script: { serial, kind, resetAt }
  Script->>Prov: provisionEmulator(cfg)
  Prov-->>Script: { serial, kind, bootCompleted, provisionedAt }
  Script->>Op: openScrcpy({ serial })
  Script->>Apk: installApk({ serial, …app })
  Script->>Op: launch({ serial, package })
  Script->>Ev: on({ serial, event: ui_stable })
  Script->>X: findByText(serial, query)
  X-->>Script: hit { center, bounds, … }
  Script->>Op: tapElement({ serial, center })
  Script->>X: extract({ serial })
  X-->>Script: TextElement[]
```

### 4.2 Provisionar — `provisionEmulator`

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
    lineColor: '#64748b'
    textColor: '#ffffff'
    mainBkg: '#000000'
    actorBkg: '#000000'
    actorBorder: '#64748b'
    actorTextColor: '#ffffff'
    signalColor: '#94a3b8'
    signalTextColor: '#ffffff'
    noteBorderColor: '#64748b'
    noteBkgColor: '#111111'
    noteTextColor: '#ffffff'
    activationBorderColor: '#64748b'
    activationBkgColor: '#1a1a1a'
    sequenceNumberColor: '#ffffff'
    loopTextColor: '#ffffff'
---
sequenceDiagram
  autonumber
  actor Caller
  participant P as provision.js
  participant S as start-runtime.js
  participant Shell as pocs/*/start.sh
  participant ADB as ensure-adb-online
  participant Boot as wait-boot-completed
  participant D as Device / AVD

  Caller->>P: provisionEmulator(cfg)
  P->>P: resolveConfig (name, serial, kind, timeout)
  P->>S: startRuntime(resolved)
  alt AVD/redroid já online (mesmo name)
    S->>D: findSerial / isReachable
    D-->>S: serial
  else precisa subir
    S->>Shell: start.sh (AVD_NAME | REDROID_*)
    loop até serial online
      S->>D: poll findSerial / reachable
    end
  end
  S-->>P: { serial }
  Note over ADB,Boot: cada fase tem connectTimeoutMs próprio
  P->>ADB: ensureAdbOnline(serial, timeout)
  ADB->>D: wait-for-device
  P->>Boot: waitBootCompleted(serial, timeout)
  Boot->>D: getprop sys.boot_completed
  P-->>Caller: { serial, kind, provisionedAt, bootCompleted: true }
```

**Erros:** `PROVISION_NO_SERIAL` · `PROVISION_START_FAILED` · `PROVISION_ADB_TIMEOUT` · `PROVISION_BOOT_TIMEOUT`.

### 4.3 Reset — `resetInstance`

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
    lineColor: '#64748b'
    textColor: '#ffffff'
    mainBkg: '#000000'
    actorBkg: '#000000'
    actorBorder: '#64748b'
    actorTextColor: '#ffffff'
    signalColor: '#94a3b8'
    signalTextColor: '#ffffff'
    noteBorderColor: '#64748b'
    noteBkgColor: '#111111'
    noteTextColor: '#ffffff'
    activationBorderColor: '#64748b'
    activationBkgColor: '#1a1a1a'
    sequenceNumberColor: '#ffffff'
    loopTextColor: '#ffffff'
---
sequenceDiagram
  autonumber
  actor Caller
  participant R as reset-instance.js
  participant Shell as pocs/*/reset.sh
  participant S as start-runtime
  participant ADB as ensure-adb-online
  participant Boot as wait-boot-completed
  participant D as Device

  Caller->>R: resetInstance(cfg)
  Note over R: exige serial (provision.serial | device | ANDROID_SERIAL)
  R->>Shell: bash resetScript
  loop até reachable
    R->>S: isRuntimeReachable(serial)
  end
  R->>ADB: ensureAdbOnline
  R->>Boot: waitBootCompleted
  R-->>Caller: { serial, kind, resetAt }
```

**Erros:** `RESET_NO_SERIAL` · `RESET_FAILED` · `RESET_UNSUPPORTED`.

### 4.4 Eventos de UI — `on`

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
    lineColor: '#64748b'
    textColor: '#ffffff'
    mainBkg: '#000000'
    actorBkg: '#000000'
    actorBorder: '#64748b'
    actorTextColor: '#ffffff'
    signalColor: '#94a3b8'
    signalTextColor: '#ffffff'
    noteBorderColor: '#64748b'
    noteBkgColor: '#111111'
    noteTextColor: '#ffffff'
    activationBorderColor: '#64748b'
    activationBkgColor: '#1a1a1a'
    sequenceNumberColor: '#ffffff'
    loopTextColor: '#ffffff'
---
sequenceDiagram
  autonumber
  actor Caller
  participant E as events.js
  participant W as wait* (event-*.js)
  participant D as Device

  Caller->>E: on({ serial, event, … })
  alt boot
    E->>W: waitBoot
    loop poll
      W->>D: sys.boot_completed
    end
  else app_open
    E->>W: waitAppOpen
    loop poll
      W->>D: pidof pkg
    end
  else ui_stable
    E->>W: waitUiStable
    loop até hash estável stableMs
      W->>D: uiautomator dump → SHA1
    end
  else frame_change / dump_change
    E->>W: waitDumpChange
    Note over W: gap — hoje hash XML, alvo = hash imagem
    loop até hash ≠ previous
      W->>D: dump XML
    end
  end
  W-->>E: resultado tipado
  E-->>Caller: UiEventResult
```

**Classes EP-02:**

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
    lineColor: '#64748b'
    textColor: '#ffffff'
    mainBkg: '#000000'
    classText: '#ffffff'
---
classDiagram
  direction TB
  class events_js {
    +on(cfg) Promise
  }
  class event_boot_js {
    +waitBoot(serial, opts)
  }
  class event_app_open_js {
    +waitAppOpen(serial, opts)
  }
  class event_ui_stable_js {
    +waitUiStable(serial, opts)
  }
  class event_dump_change_js {
    +waitDumpChange(serial, opts)
  }
  events_js --> event_boot_js : boot
  events_js --> event_app_open_js : app_open
  events_js --> event_ui_stable_js : ui_stable
  events_js --> event_dump_change_js : frame_change / dump_change
```

### 4.5 Instalar APK — `installApk`

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
    lineColor: '#64748b'
    textColor: '#ffffff'
    mainBkg: '#000000'
    actorBkg: '#000000'
    actorBorder: '#64748b'
    actorTextColor: '#ffffff'
    signalColor: '#94a3b8'
    signalTextColor: '#ffffff'
    noteBorderColor: '#64748b'
    noteBkgColor: '#111111'
    noteTextColor: '#ffffff'
    activationBorderColor: '#64748b'
    activationBkgColor: '#1a1a1a'
    sequenceNumberColor: '#ffffff'
---
sequenceDiagram
  autonumber
  actor Caller
  participant A as apks.js
  participant Spec as apk-read-spec
  participant Ver as apk-get-installed-version
  participant Dl as apk-download
  participant Inst as apk-install-package
  participant D as Device

  Caller->>A: installApk({ serial, … })
  A->>Spec: readAppSpec
  Spec-->>A: AppSpec
  A->>Ver: getInstalledVersion(serial, package)
  alt version pin == instalada
    A-->>Caller: { skipped: true, package, version }
  else precisa instalar
    A->>Dl: ensureApkArtifact(spec)
    Note over Dl: apks/ local ou apkeep
    Dl-->>A: artifactPath
    A->>Inst: installPackage(serial, path)
    Inst->>D: adb install / install-multiple
    A->>Ver: getInstalledVersion (confirma)
    A-->>Caller: { skipped: false, package, version, artifactPath }
  end
```

### 4.6 Operar tela

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
    lineColor: '#64748b'
    textColor: '#ffffff'
    mainBkg: '#000000'
    actorBkg: '#000000'
    actorBorder: '#64748b'
    actorTextColor: '#ffffff'
    signalColor: '#94a3b8'
    signalTextColor: '#ffffff'
    noteBorderColor: '#64748b'
    noteBkgColor: '#111111'
    noteTextColor: '#ffffff'
    activationBorderColor: '#64748b'
    activationBkgColor: '#1a1a1a'
    sequenceNumberColor: '#ffffff'
---
sequenceDiagram
  autonumber
  actor Caller
  participant O as operate.js
  participant F as frame.js
  participant OCR as ocr.js
  participant D as Device

  alt launch
    Caller->>O: launch({ serial, package|activity })
    O->>D: am start / resolve-activity / monkey
  else tap / tapElement / key / scroll
    Caller->>O: tap|tapElement|key|scroll
    O->>D: input tap|swipe|keyevent
  else type (OCR teclado)
    Caller->>O: type({ serial, text, region? })
    O->>F: captureFrame
    F->>D: screencap
    O->>OCR: ocrWords
    O->>O: buildKeyCenters → tap por char
  else screenshot
    Caller->>O: screenshot({ serial, path })
    O->>D: screencap + pull
  else matchImage
    Caller->>O: matchImage({ serial, templatePath })
    Note over O: stub hit salvo deps.matchTemplate
  else openScrcpy
    Caller->>O: openScrcpy({ serial })
    O->>D: spawn scrcpy detached
    O-->>Caller: { pid, serial }
  end
```

### 4.7 Extrair / findByText

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
    lineColor: '#64748b'
    textColor: '#ffffff'
    mainBkg: '#000000'
    actorBkg: '#000000'
    actorBorder: '#64748b'
    actorTextColor: '#ffffff'
    signalColor: '#94a3b8'
    signalTextColor: '#ffffff'
    noteBorderColor: '#64748b'
    noteBkgColor: '#111111'
    noteTextColor: '#ffffff'
    activationBorderColor: '#64748b'
    activationBkgColor: '#1a1a1a'
    sequenceNumberColor: '#ffffff'
---
sequenceDiagram
  autonumber
  actor Caller
  participant X as extract.js
  participant F as frame.js
  participant OCR as ocr.js
  participant D as Device

  Caller->>X: extract({ serial }) / findByText(serial, query)
  X->>F: captureFrame(serial)
  F->>D: screencap → PNG temp
  F-->>X: framePath
  X->>OCR: ocrWords(framePath)
  OCR-->>X: OcrWord[]
  alt extract
    X-->>Caller: [{ type: text, text, bounds, center }, …]
  else findByText
    X->>X: matchByText (janelas lado a lado)
    X-->>Caller: hit | null
  end
```

### 4.8 Sessão

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
    lineColor: '#64748b'
    textColor: '#ffffff'
    mainBkg: '#000000'
    actorBkg: '#000000'
    actorBorder: '#64748b'
    actorTextColor: '#ffffff'
    signalColor: '#94a3b8'
    signalTextColor: '#ffffff'
    noteBorderColor: '#64748b'
    noteBkgColor: '#111111'
    noteTextColor: '#ffffff'
    activationBorderColor: '#64748b'
    activationBkgColor: '#1a1a1a'
    sequenceNumberColor: '#ffffff'
---
sequenceDiagram
  autonumber
  actor Caller
  participant S as session.js
  participant FS as Filesystem

  alt save
    Caller->>S: saveSession({ serial, kind, path, state })
    S->>FS: merge JSON + savedAt
  else restore
    Caller->>S: restoreSession({ path })
    S->>FS: read JSON
    S-->>Caller: state
  else remove
    Caller->>S: removeSession({ path })
    S->>FS: unlink se existir
    S-->>Caller: bool
  end
```

### 4.9 Ciclo de vida do runtime

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
    lineColor: '#64748b'
    textColor: '#ffffff'
    mainBkg: '#000000'
    actorBkg: '#000000'
    actorBorder: '#64748b'
    actorTextColor: '#ffffff'
    signalColor: '#94a3b8'
    signalTextColor: '#ffffff'
    noteBorderColor: '#64748b'
    noteBkgColor: '#111111'
    noteTextColor: '#ffffff'
---
sequenceDiagram
  autonumber
  participant Off as offline
  participant Up as process up
  participant Adb as ADB online
  participant Ready as boot completed

  Off->>Up: start.sh / reset.sh
  Up->>Adb: adb device
  Adb->>Ready: sys.boot_completed=1
  Note over Ready: provision mesmo name → attach
  Ready->>Off: reset wipe (volta ao início)
```

---

## 5. Mapa de módulos ↔ arquivos

| Recorte | Arquivo | Plano |
|---------|---------|-------|
| `provisionEmulator` | [`src/lib/provision.js`](src/lib/provision.js) | [EP-01](implementation-plan/EP-01-provisionar-agente.md) |
| `resetInstance` | [`src/lib/reset-instance.js`](src/lib/reset-instance.js) | EP-01 |
| start / attach / AVD serial | [`src/lib/start-runtime.js`](src/lib/start-runtime.js) | EP-01 |
| redroid name→porta | [`src/lib/redroid-instance.js`](src/lib/redroid-instance.js) | EP-01 |
| `on` | [`src/lib/events.js`](src/lib/events.js) | [EP-02](implementation-plan/EP-02-eventos-de-ui.md) |
| `installApk` | [`src/lib/apks.js`](src/lib/apks.js) | [EP-03](implementation-plan/EP-03-instalar-apks.md) |
| gestos | [`src/lib/operate.js`](src/lib/operate.js) | [EP-04](implementation-plan/EP-04-operar-tela.md) |
| `extract` / `findByText` | [`src/lib/extract.js`](src/lib/extract.js) | [EP-05](implementation-plan/EP-05-extrair-elementos.md) |
| sessão | [`src/lib/session.js`](src/lib/session.js) | [EP-06](implementation-plan/EP-06-sessao.md) |
| ADB leaf | [`src/lib/adb.js`](src/lib/adb.js) | — |
| frame / OCR | [`src/lib/frame.js`](src/lib/frame.js) · [`ocr.js`](src/lib/ocr.js) | EP-05 |

---

## 6. Gaps conhecidos (código vs alvo)

| Gap | Hoje | Alvo |
|-----|------|------|
| `ui_stable` / `frame_change` | hash de dump XML | hash / diff de imagem |
| `matchImage` | stub sem `deps.matchTemplate` | template match real |
| Árvore EP-01 | `attach-runtime` / `agent-registry` no plano | lógica dentro de `start-runtime.js` |
| `dumpUiXml` | usado por eventos | deprecado para `extract` |
| Runtime sample | `sample.js` ainda demos redroid | AVD canônico |

---

## 7. Caminho inverso

| Precisa de | Ir para |
|------------|---------|
| Contratos / uso | [`src/README.md`](src/README.md) |
| Sequência detalhada por EP | [`implementation-plan/`](implementation-plan/README.md) |
| Por que AVD | [`postmortem.md`](postmortem.md) |
| Sobe/wipe shell | [`pocs/android-studio/`](pocs/android-studio/README.md) · [`pocs/redroid/`](pocs/redroid/README.md) |
| Aceite | [`5.bdds.md`](5.bdds.md) |
