# Implementation plan — EP-04 Operar tela

**Por quê:** plano técnico do épico (sequências · agentes · passo a passo · contratos · classes · modelos · BDDs).  
**Épico:** [`2.epics.md`](../2.epics.md).  
**US:** [`1.stories.md`](../1.stories.md) · [`4.scenarios.md#ep-04--operar-tela`](../4.scenarios.md#ep-04--operar-tela) · [`5.bdds.md#ep-04--operar-tela`](../5.bdds.md#ep-04--operar-tela).  
**Handle:** gestos são métodos do [`AgentHandle`](EP-01-provisionar-agente.md) — **não** funções soltas com `serial`.  
**Pré-requisito:** [`EP-01`](EP-01-provisionar-agente.md) · [`EP-02`](EP-02-eventos-de-ui.md) (`handle.on` para confirmar app/UI).  
**Implementação interna:** [`../sources/android-control/lib/operate.js`](../sources/android-control/lib/operate.js) (anexado ao handle em `provision.js`).

**Stack:** Node ≥ 18 · JavaScript · `adb` · runtime provisionado.

---

## Escopo

| ID | Item |
|----|------|
| US-07 | Abrir aplicativo |
| US-08 | tap |
| US-09 | type |
| US-10 | scroll |
| US-11 | screenshot |
| US-12 | Resgatar coordenadas x,y a partir de uma imagem |
| SC-11..16 | Cenários correspondentes |

**Resultado:** gestos e captura via `handle.launch` / `tap` / `type` / `scroll` / `screenshot` / `matchImage`.

---

## Fluxo (obrigatório)

1. **Provisionar** → handle.  
2. **Operar** via métodos do handle (serial implícito).  
3. Opcional: confirmar com `handle.on("app_open" | "ui_stable", …)` (EP-02).

```js
const handle = await provisionEmulator(cfg);

await handle.launch("com.linkedin.android");
await handle.on("app_open", { pkg: "com.linkedin.android" });
await handle.on("ui_stable", { stableMs: 800 });

await handle.tap(360, 640);
await handle.type("olá");
await handle.scroll({ direction: "down", distance: 800 });
await handle.screenshot("./screenshots/tela.png");
const { x, y } = await handle.matchImage("./templates/btn.png");
```

| Superfície | O quê |
|------------|--------|
| **Público** | `handle.launch` · `tap` · `type` · `scroll` · `screenshot` · `matchImage` |
| **Privado** | am start · input tap/text/swipe · screencap · template match |

---

## Diagramas de sequência

### Visão geral

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
  participant H as AgentHandle
  participant O as operate (interno)
  participant D as Device

  Dev->>H: launch / tap / type / scroll / screenshot / matchImage
  H->>O: (serial do handle)
  O->>D: adb shell / screencap / match
  D-->>O: ok / path / coords
  O-->>H: resultado
  H-->>Dev: void | path | { x, y, confidence }
```

### Por US (caller → handle)

| US | SC | Chamada pública | Interno |
|----|-----|-----------------|---------|
| US-07 | SC-11 | `handle.launch(pkg, activity?)` | am start; opcional `on("app_open")` |
| US-08 | SC-12 | `handle.tap(x, y)` / `tapElement(el)` | input tap |
| US-09 | SC-13 | `handle.type(text)` | input text / IME |
| US-10 | SC-14 | `handle.scroll(opts)` | swipe |
| US-11 | SC-15 | `handle.screenshot(path)` | screencap + pull |
| US-12 | SC-16 | `handle.matchImage(templatePath)` | template match → x,y |

#### Contratos

```ts
type ScrollOpts = {
  direction: "up" | "down" | "left" | "right";
  distance?: number;
  x?: number;
  y?: number;
};

type AgentHandle = {
  // … EP-01..03 …
  launch(pkg: string, activity?: string): Promise<void>;
  tap(x: number, y: number): void;
  tapElement(el: { bounds?: { centerX: number; centerY: number } }): void;
  type(text: string): void;
  scroll(opts: ScrollOpts): void;
  screenshot(path: string): string;
  matchImage(templatePath: string): Promise<{ x: number; y: number; confidence: number }>;
};
```

---

## Modelos / Erros

| Código | US |
|--------|-----|
| `OPERATE_LAUNCH_FAILED` | US-07 |
| `OPERATE_TYPE_FAILED` | US-09 |
| `OPERATE_SCREENSHOT_FAILED` | US-11 |
| `OPERATE_MATCH_NOT_FOUND` | US-12 |

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
    classText: '#ffffff'
---
classDiagram
  direction TB
  class AgentHandle {
    +launch(pkg, activity)
    +tap(x, y)
    +type(text)
    +scroll(opts)
    +screenshot(path)
    +matchImage(path)
  }
  class operate_js {
    <<internal>>
    bindOperate(serial)
  }
  AgentHandle --> operate_js
```

---

## Cenários BDD

Fonte: [`5.bdds.md#ep-04--operar-tela`](../5.bdds.md#ep-04--operar-tela). “Quando…” = método do handle.

---

## Plano de implementação (gaps → entregas)

| # | Entrega | SC | Critério |
|---|---------|-----|----------|
| I1 | `bindOperate(serial)` + anexar ao handle | — | Sem serial no caller |
| I2 | `launch` + integração `on("app_open")` | SC-11 | US-07 |
| I3 | `tap` / `tapElement` | SC-12 | US-08 |
| I4 | `type` (IME se necessário) | SC-13 | US-09 |
| I5 | `scroll` | SC-14 | US-10 |
| I6 | `screenshot` | SC-15 | US-11 |
| I7 | `matchImage` | SC-16 | US-12 |
| I8 | Piloto usa handle.* | — | linkedin-login |

### Ordem

```text
I1 → I2 → I3 → I4 → I5 → I6 → I7 → I8
```

---

## Mapeamento código atual

| Peça | Status |
|------|--------|
| `operate.js` com `serial` no 1º arg | Existe — **mover** para handle |
| `matchImage` / scroll | **Gap** / parcial |
| `handle.launch`… | **Gap** |

---

## Critério de pronto (épico)

1. Caller só usa métodos do handle  
2. SC-11..16 encapsulados  
3. BDDs US-07..12  

## Próximos passos

→ Implementar I1–I8 em [`sources/android-control`](../sources/android-control/README.md)  
→ Aceite: [`5.bdds.md#ep-04--operar-tela`](../5.bdds.md#ep-04--operar-tela)
