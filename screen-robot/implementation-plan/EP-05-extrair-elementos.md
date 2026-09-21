# Implementation plan — EP-05 Extrair elementos

**Por quê:** plano técnico do épico (sequências · agentes · passo a passo · contratos · classes · modelos · BDDs).  
**Épico:** [`2.epics.md`](../2.epics.md).  
**US:** [`1.stories.md`](../1.stories.md) · [`4.scenarios.md#ep-05--extrair-elementos`](../4.scenarios.md#ep-05--extrair-elementos) · [`5.bdds.md#ep-05--extrair-elementos`](../5.bdds.md#ep-05--extrair-elementos).  
**Handle:** `extract` é método do [`AgentHandle`](EP-01-provisionar-agente.md) — **não** é função solta com `serial`.  
**Pré-requisito:** [`EP-01`](EP-01-provisionar-agente.md) · handle.  
**Implementação interna:** [`../src/lib/extract.js`](../src/lib/extract.js) (anexado ao handle em `provision.js`).

**Stack:** Node ≥ 18 · JavaScript · `adb` · **OCR** · runtime provisionado.  
**Visão (`vision.js`):** legado / usado só em template match (US-12 `matchImage`) — **não** entra no contrato de `extract()`.

**Princípio:** percepção em `extract` = **frame/imagem** → **OCR** → **lista plana só de textos**.  
**Proibido** como fonte: dump uiautomator / árvore de acessibilidade ADB.  
**Fonte de frame:** screenshot ADB, stream ou **câmera** (device real) — mesmo pipeline.  
**Não** devolver árvore DOM (`root` / `children`); contrato = **array de elementos `type: "text"`**.

**Antes → depois:** `extract()` deixou de enriquecer com visão (ícones/listas/imagens em chamadas sucessivas). Agora devolve **somente** textos OCR; chamadas repetidas = mesma lista plana.

---

## Escopo

| ID | Item | Status |
|----|------|--------|
| US-13 | Extrair elementos (OCR) — só textos | Ativo |
| US-23 | Buscar elemento(s) por texto (similaridade) | Ativo |
| SC-17 | Extrair textos | Ativo |
| SC-29..30 | `findByText` (SC-30 = LinkedIn Sign in with Email) | Ativo |
| US-14 · US-15 · US-16 | Extrair ícones / listas / imagens | **Cancelado / removido** |
| SC-18 · SC-19 · SC-20 · SC-21 | Enriquecer / ícones / listas / imagens | **Cancelado / removido** |

**Resultado:** **lista plana** `UiElement[]` — cada item `{ type: "text", text, bounds, center }`.  
`handle.extract()` — **um método, sem parâmetros**; uma chamada (ou repetidas) devolve a **mesma** lista de textos OCR — **sem** fases 1/2 nem accumulate de outros tipos.

---

## Árvore de arquivos

```text
src/
├── lib/
│   ├── extract.js                      # createExtract · extractElements · findByText
│   ├── frame.js                        # captura de frame
│   ├── ocr.js                          # tesseract → palavras + bounds
│   ├── vision.js                       # legado; template match (US-12) — não tipa extract
│   ├── extract.test.js
│   ├── find-by-text.test.js
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
3. **Extrair** → `handle.extract()`; OCR sobre o frame; retorno = **lista de textos**.

```js
const handle = await provisionEmulator(cfg);

const elements = await handle.extract();
// frame → OCR → [ { type: "text", text, bounds, center }, … ]

const again = await handle.extract();
// mesma lista plana de textos (sem enriquecer com ícones/listas/imagens)

// US-23 / SC-29..30 — busca por texto (encapsula OCR)
const hit = await findByText(handle.serial, "Sign in with Email", { minScore: 0.8 });
// elementos lado a lado contidos na string maior → Sign, in, with, Email
```

**Regra `extract()`:** sempre → `Promise<UiElement[]>` com `type: "text"` apenas. Sem `kind`/opts. Sem fases.  
**Regra `findByText()`:** `findByText(serial, query)` encapsula `extractElements`; retorna só elementos **lado a lado** cujo texto unido está **na string maior** (`query`); `{ elements, score, bounds, center }` ou `null`.  
**Sequência canônica:** frame → OCR → lista de textos (não XML dump, não árvore DOM, não visão para tipar).

**Público:** `handle.extract() → Promise<UiElement[]>` (só textos) · `findByText(serial, query) → Promise<FindByTextHit | null>`  
**Privado:** capturar frame · OCR · tipar `text` · match lado a lado na query

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

## Exemplo de JSON (lista de textos)

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

Não há elementos `icon` / `list` / `image` / `other` no retorno de `extract()`.

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

  Dev->>H: extract()
  note over H,X: sem parâmetros; retorno = só textos OCR
  H->>X: extractElements
  X->>D: capturar frame (screenshot / câmera)
  D-->>X: imagem
  X->>X: OCR → elementos type text
  X-->>H: UiElement[]
  H-->>Dev: lista plana de textos
```

### Por US — ativo

| Ordem | US | SC | Chamada | O que devolve |
|-------|----|-----|---------|----------------|
| 1 | US-13 | SC-17 | `extract()` | elementos `type: "text"` via **OCR** |
| — | US-23 | SC-29..30 | `findByText` | hit com textos lado a lado na query |

Caller filtra/itera o array (`el.text`, `el.center`) — **não** há walk em `children` nem tipos de visão.

#### Contratos

```ts
type ElementType = "text";

/** Elemento plano encontrado por OCR. */
type UiElement = {
  type: "text";
  text: string;
  bounds: { x: number; y: number; w: number; h: number };
  center?: [number, number];
};

type AgentHandle = {
  // … EP-01..04 …
  /** Sem parâmetros. Retorna lista plana só de textos OCR. */
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

const elements = await handle.extract();
// [ { type: "text", text, bounds, center }, … ]
```

---

## Modelos / Erros

| Código | Quando |
|--------|--------|
| `EXTRACT_FRAME_FAILED` | frame/imagem indisponível (screenshot/câmera) |
| `EXTRACT_OCR_FAILED` | falha no OCR |

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
    +text type
    +string text
    +bounds
    +center
  }
  class extract_js {
    <<internal>>
    createExtract(serial)
    -elements
  }
  note for AgentHandle "Retorno = lista plana só textos OCR"
  AgentHandle --> extract_js
  extract_js ..> UiElement : devolve array
```

---

## Cenários BDD

Fonte: [`5.bdds.md#ep-05--extrair-elementos`](../5.bdds.md#ep-05--extrair-elementos).  
“Quando…” = `handle.extract()`; “Então…” = lista só com `type: "text"`.

---

## Plano de implementação (gaps → entregas)

| # | Entrega | SC | Critério |
|---|---------|-----|----------|
| I1 | `createExtract` + `handle.extract()` → `UiElement[]` | — | Lista plana só `text`; sem árvore DOM |
| I2 | Fonte de frame (screenshot ADB; abstrair câmera) | — | Imagem disponível sem dump XML |
| I3 | OCR textos + bounds → elementos `text` | SC-17 | Itens texto na lista |
| I4 | Sem uiautomator dump como fonte | — | Só frame → OCR |
| I5 | Piloto: `extract()` + JSON da lista de textos | — | linkedin-login |
| I6 | `findByText(serial, query)` encapsula `extractElements` + match por similaridade | SC-29 | Score ≥ limiar; caller não passa lista |
| I7 | BDD SC-30 LinkedIn fixture `"Sign in with Email"` → 4 partes | SC-30 | `Sign`+`in`+`with`+`Email` |

### Ordem

```text
I1 → I2 → I3 → I4 → I5 → I6 → I7
```

---

## Mapeamento código atual

| Peça | Status |
|------|--------|
| `createExtract` → `handle.extract()` | Feito — só `type: "text"` (lista plana, sem `children`) |
| Fonte = frame → OCR | Feito (`frame.js` / `ocr.js`) |
| `vision.js` tipando extract | **Removido do produto** — legado; US-12 `matchImage` permanece |
| `dumpUiXml` | Só legado eventos EP-02 |
| `extractElements` lista plana de textos | Feito |
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
2. Retorno = **lista** `UiElement[]` só com `type: "text"` (não árvore `root`/`children`)  
3. Pipeline = **frame → OCR → lista de textos** (sem dump uiautomator; sem enriquecimento por visão)  
4. Chamadas repetidas = mesma lista de textos (sem accumulate de ícones/listas/imagens)  
5. `findByText(serial, query)`: elementos **lado a lado** contidos na **string maior**  
6. BDD **SC-30** LinkedIn verde (fixture)  
7. BDDs US-13 + EP-05  

## Próximos passos

→ Aceite: [`5.bdds.md#ep-05--extrair-elementos`](../5.bdds.md#ep-05--extrair-elementos) · SC-30
