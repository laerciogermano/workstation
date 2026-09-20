# Implementation plan — EP-05 Extrair elementos

**Por quê:** plano técnico do épico (sequências · agentes · passo a passo · contratos · classes · modelos · BDDs).  
**Épico:** [`2.epics.md`](../2.epics.md).  
**US:** [`1.stories.md`](../1.stories.md) · [`4.scenarios.md#ep-05--extrair-elementos`](../4.scenarios.md#ep-05--extrair-elementos) · [`5.bdds.md#ep-05--extrair-elementos`](../5.bdds.md#ep-05--extrair-elementos).  
**Handle:** `extract` é método do [`AgentHandle`](EP-01-provisionar-agente.md) — **não** é função solta com `serial`.  
**Pré-requisito:** [`EP-01`](EP-01-provisionar-agente.md) · handle.  
**Implementação interna:** [`../src/lib/extract.js`](../src/lib/extract.js) (anexado ao handle em `provision.js`).

**Stack:** Node ≥ 18 · JavaScript · `adb` · **OCR** · **visão** (detecção + template match) · runtime provisionado.

**Princípio:** percepção = **frame/imagem** → OCR (textos + bounds) + visão (ícones/listas/imagens) → **lista plana de elementos**.  
**Proibido** como fonte: dump uiautomator / árvore de acessibilidade ADB.  
**Fonte de frame:** screenshot ADB, stream ou **câmera** (device real) — mesmo pipeline.  
**Não** devolver árvore DOM (`root` / `children`); contrato = **array de elementos**.

---

## Escopo

| ID | Item |
|----|------|
| US-13 | Extrair elementos (OCR) |
| US-14 | Extrair ícones |
| US-15 | Extrair listas |
| US-16 | Extrair imagens |
| US-23 | Buscar elemento(s) por texto (similaridade) |
| SC-17..21 · SC-29..30 | Cenários correspondentes (SC-30 = LinkedIn Sign in with Email) |

**Resultado:** **lista plana** `UiElement[]` — cada item tem `type`, `bounds`, opcionalmente `text` / `center`.  
`handle.extract()` — **um método, sem parâmetros**; cada chamada (por estória/SC) **acrescenta elementos** na mesma lista acumulada.

---

## Árvore de arquivos

```text
src/
├── lib/
│   ├── extract.js                      # createExtract · extractElements · findByText
│   ├── frame.js                        # captura de frame
│   ├── ocr.js                          # tesseract → palavras + bounds
│   ├── vision.js                       # heurísticas icon/list/image
│   ├── extract.test.js
│   ├── find-by-text.test.js            # matchByText / encapsulamento
│   ├── find-by-text.fixture.test.js    # SC-30 unitário (fixture LinkedIn)
│   └── provision.js
└── test/
    ├── fixtures/
    │   └── linkedin-tela-inicial.png   # print inicial LinkedIn (SC-30)
    └── bdd/
        ├── ep-05-extrair-elementos.test.js
        └── sc-30-linkedin-sign-in-with-email.test.js
```

---

## Fluxo (obrigatório)

1. **Provisionar** → handle.  
2. **Capturar frame** (screenshot ADB / stream / câmera) — interno.  
3. **Extrair** → `handle.extract()`; OCR/visão sobre o frame; retorno = **lista de elementos**; cada chamada enriquece a lista.

```js
const handle = await provisionEmulator(cfg);

const e1 = await handle.extract();
// frame → OCR textos + bounds → elementos type "text" (SC-17)

const e2 = await handle.extract();
// mesmo frame → visão + OCR → lista enriquecida (SC-18)

const e3 = await handle.extract();
// + elementos type "icon" (SC-19 / US-14)

const e4 = await handle.extract();
// + elementos type "list" (SC-20 / US-15)

const e5 = await handle.extract();
// + elementos type "image" (SC-21 / US-16)

// US-23 / SC-29..30 — busca por texto (encapsula OCR)
const hit = await findByText(handle.serial, "Sign in with Email", { minScore: 0.8 });
// elementos lado a lado contidos na string maior → Sign, in, with, Email
```

**Regra `extract()`:** sempre → `Promise<UiElement[]>`. Sem `kind`/opts.  
**Regra `findByText()`:** `findByText(serial, query)` encapsula `extractElements`; retorna só elementos **lado a lado** cujo texto unido está **na string maior** (`query`); `{ elements, score, bounds, center }` ou `null`.  
**Sequência canônica:** frame → OCR/visão → lista (não XML dump, não árvore DOM).

**Público:** `handle.extract() → Promise<UiElement[]>` (lista plana) · `findByText(serial, query) → Promise<FindByTextHit | null>`  
**Privado:** capturar frame · OCR · visão · tipar/inserir elementos · match lado a lado na query

### US-23 — Buscar por texto (similaridade)

OCR costuma devolver a frase partida (piloto LinkedIn: `"Sign"` + `"in"` + `"with"` + `"Email"`, não a string inteira).  
`findByText(serial, query, { minScore })` **encapsula** `extractElements` — o caller **não** passa a lista de elementos.

**Regras de retorno:**
- elementos **lado a lado** (mesma linha / bounds vizinhos)
- o texto de cada um (e o texto **unido**) está **contido na string maior** (`query`)
- score de similaridade ≥ `minScore`

```js
const hit = await findByText(handle.serial, "Sign in with Email", { minScore: 0.8 });
// hit.elements → [Sign, in, with, Email] — lado a lado, dentro da query
// hit.score elevado; hit.center para tap
```

---

## Exemplo de JSON (lista de elementos)

### Após 1ª chamada — SC-17 (textos OCR)

```json
[
  {
    "type": "text",
    "text": "Entrar",
    "bounds": { "x": 120, "y": 1800, "w": 840, "h": 96 },
    "center": [540, 1848]
  },
  {
    "type": "text",
    "text": "E-mail ou telefone",
    "bounds": { "x": 120, "y": 900, "w": 840, "h": 72 },
    "center": [540, 936]
  }
]
```

### Após 2ª chamada — SC-18 (lista enriquecida)

Mesma lista de textos; podem entrar elementos auxiliares de visão (ainda sem ícones/listas/imagens dedicados se forem passos 3–5):

```json
[
  {
    "type": "text",
    "text": "E-mail ou telefone",
    "bounds": { "x": 120, "y": 900, "w": 840, "h": 72 },
    "center": [540, 936]
  },
  {
    "type": "text",
    "text": "Entrar",
    "bounds": { "x": 120, "y": 1800, "w": 840, "h": 96 },
    "center": [540, 1848]
  }
]
```

### Após 3ª–5ª chamadas — ícones / listas / imagens na mesma lista

Elementos novos com `"type": "icon" | "list" | "image"` são **append** na lista (sem aninhar `children`):

```json
[
  { "type": "text", "text": "Entrar", "bounds": { "x": 120, "y": 1800, "w": 840, "h": 96 }, "center": [540, 1848] },
  { "type": "icon", "bounds": { "x": 48, "y": 64, "w": 72, "h": 72 }, "center": [84, 100] },
  { "type": "list", "bounds": { "x": 0, "y": 400, "w": 1080, "h": 1200 }, "center": [540, 1000] },
  { "type": "text", "text": "Item 1", "bounds": { "x": 40, "y": 420, "w": 200, "h": 40 }, "center": [140, 440] },
  { "type": "image", "bounds": { "x": 24, "y": 420, "w": 128, "h": 128 }, "center": [88, 484] }
]
```

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
  participant X as extract (interno)
  participant D as Device / FrameSource

  loop uma chamada por estória / SC
    Dev->>H: extract()
    note over H,X: sem parâmetros; retorno = lista
    H->>X: nextStep(list)
    X->>D: capturar frame (screenshot / câmera)
    D-->>X: imagem
    X->>X: OCR / visão → tipar / append elementos
    X-->>H: UiElement[]
    H-->>Dev: lista enriquecida
  end
```

### Por US — mesma chamada, lista que ganha elementos

| Ordem | US | SC | Chamada | O que a lista ganha |
|-------|----|-----|---------|---------------------|
| 1 | US-13 | SC-17 | `extract()` | elementos `type: "text"` via **OCR** |
| 2 | US-13 | SC-18 | `extract()` | lista enriquecida (visão + OCR; sem hierarquia) |
| 3 | US-14 | SC-19 | `extract()` | elementos `type: "icon"` via **visão** |
| 4 | US-15 | SC-20 | `extract()` | elementos `type: "list"` — **visão + OCR** |
| 5 | US-16 | SC-21 | `extract()` | elementos `type: "image"` via **visão** |

Caller filtra/itera o array (`el.type`, `el.text`, `el.center`) — **não** há walk em `children`.

#### Contratos

```ts
type ElementType = "text" | "icon" | "list" | "image" | "other";

/** Elemento plano encontrado por OCR/visão. */
type UiElement = {
  type: ElementType;
  text?: string;
  bounds: { x: number; y: number; w: number; h: number };
  center?: [number, number];
};

type AgentHandle = {
  // … EP-01..04 …
  /** Sem parâmetros. Retorna lista de elementos; cada chamada acrescenta itens. */
  extract(): Promise<UiElement[]>;
};

/** Hit de findByText: elementos lado a lado contidos na string maior. */
type FindByTextHit = {
  elements: UiElement[];
  score: number;
  text: string;
  bounds: { x: number; y: number; w: number; h: number };
  center: [number, number];
};

// findByText(serial, query) → Promise<FindByTextHit | null>

const elements = await handle.extract();
// Array.isArray(elements)
// elements[0].type === "text" | "icon" | …
```

**Interno:** cursor de passo no handle; lista mutável/acumulada; após o passo 5, nova chamada pode devolver a lista completa (idempotente).

---

## Modelos / Erros

| Código | Quando |
|--------|--------|
| `EXTRACT_FRAME_FAILED` | frame/imagem indisponível (screenshot/câmera) |
| `EXTRACT_OCR_FAILED` | falha no OCR |
| `EXTRACT_VISION_FAILED` | falha na visão/detecção |
| `EXTRACT_STEP_FAILED` | falha ao tipar/inserir elementos no passo |

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
    +extract() Promise~UiElement[]~
  }
  class UiElement {
    +ElementType type
    +string text
    +bounds
    +center
  }
  class extract_js {
    <<internal>>
    createExtract(serial)
    -step
    -elements
  }
  note for AgentHandle "Retorno = lista plana (OCR/visão)"
  AgentHandle --> extract_js
  extract_js ..> UiElement : devolve array
```

---

## Cenários BDD

Fonte: [`5.bdds.md#ep-05--extrair-elementos`](../5.bdds.md#ep-05--extrair-elementos).  
“Quando…” = `handle.extract()`; “Então…” = lista contém elementos do tipo da estória.

---

## Plano de implementação (gaps → entregas)

| # | Entrega | SC | Critério |
|---|---------|-----|----------|
| I1 | `createExtract` + `handle.extract()` → `UiElement[]` | — | Lista plana; sem árvore DOM |
| I2 | Fonte de frame (screenshot ADB; abstrair câmera) | — | Imagem disponível sem dump XML |
| I3 | Passo 1 → OCR textos + bounds → elementos `text` | SC-17 | Itens texto na lista |
| I4 | Passo 2 → visão + OCR → lista enriquecida | SC-18 | Mais elementos / tipos |
| I5 | Passos 3–5 → elementos `icon` / `list` / `image` | SC-19..21 | Tipos na lista |
| I6 | Sem uiautomator dump como fonte | — | Só frame → OCR/visão |
| I7 | Piloto: `extract()` ×5 + JSON da lista | — | linkedin-login |
| I8 | `findByText(serial, query)` encapsula `extractElements` + match por similaridade | SC-29 | Score ≥ limiar; caller não passa lista |
| I9 | BDD SC-30 LinkedIn fixture `"Sign in with Email"` → 4 partes | SC-30 | `Sign`+`in`+`with`+`Email` |

### Ordem

```text
I1 → I2 → I3 → I4 → I5 → I6 → I7 → I8 → I9
```

---

## Mapeamento código atual

| Peça | Status |
|------|--------|
| `createExtract` → `handle.extract()` | Existe (ainda árvore); **migrar retorno para lista** |
| Fonte = frame → OCR/visão | Feito (`frame.js` / `ocr.js` / `vision.js`) |
| `dumpUiXml` | Só legado eventos EP-02 |
| `extractElements` lista plana | Feito |
| `findByText` (US-23) | Feito — encapsula `extractElements`; lado a lado + contidos na query |
| Fixture + BDD SC-30 | Feito — `linkedin-tela-inicial.png` · `sc-30-*.test.js` |

---

## Como rodar (SC-30 / LinkedIn)

```bash
cd screen-robot/src

# BDD oficial SC-30 (fixture, sem device)
node --test --test-timeout=120000 test/bdd/sc-30-linkedin-sign-in-with-email.test.js

# Unitário da mesma fixture
node --test --test-timeout=120000 lib/find-by-text.fixture.test.js

# Piloto ao vivo (device)
npm run linkedin-login
```

---

## Critério de pronto (épico)

1. `handle.extract()` sem parâmetros  
2. Retorno = **lista** `UiElement[]` (não árvore `root`/`children`)  
3. Pipeline = **frame → OCR/visão → lista** (sem dump uiautomator)  
4. Cada chamada acrescenta tipos de elemento na lista  
5. `findByText(serial, query)`: elementos **lado a lado** contidos na **string maior**  
6. BDD **SC-30** LinkedIn verde (fixture)  
7. BDDs US-13 + EP-05  

## Próximos passos

→ Aceite: [`5.bdds.md#ep-05--extrair-elementos`](../5.bdds.md#ep-05--extrair-elementos) · SC-30
