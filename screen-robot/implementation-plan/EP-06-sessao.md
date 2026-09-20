# Implementation plan — EP-06 Sessão

**Por quê:** plano técnico do épico (sequências · agentes · passo a passo · contratos · classes · modelos · BDDs).  
**Épico:** [`2.epics.md`](../2.epics.md).  
**US:** [`1.stories.md`](../1.stories.md) · [`4.scenarios.md#ep-06--sessao`](../4.scenarios.md#ep-06--sessao) · [`5.bdds.md#ep-06--sessao`](../5.bdds.md#ep-06--sessao).  
**Handle:** sessão são métodos do [`AgentHandle`](EP-01-provisionar-agente.md) — **não** funções soltas desligadas do agent.  
**Pré-requisito:** [`EP-01`](EP-01-provisionar-agente.md) · handle.  
**Implementação interna:** [`../src/lib/session.js`](../src/lib/session.js) (anexado ao handle em `provision.js`).

**Stack:** Node ≥ 18 · JavaScript · runtime provisionado.

---

## Escopo

| ID | Item |
|----|------|
| US-17 | Salvar sessão |
| US-18 | Remover sessão |
| US-19 | Recuperar sessão |
| SC-22..24 | Cenários correspondentes |

**Resultado:** estado persistido/apagado/restaurado via `handle.saveSession` / `removeSession` / `restoreSession`.

---

## Árvore de arquivos

```text
src/
├── lib/
│   ├── session.js                 # createSessionApi → handle.save/remove/restoreSession
│   ├── session.test.js
│   └── provision.js               # anexa session ao handle
└── test/
    └── bdd/
        ├── ep-06-sessao.test.js
        └── us-17-salvar-sessao.test.js
```

---

## Fluxo (obrigatório)

1. **Provisionar** → handle.  
2. **Sessão** via métodos do handle (path + estado; serial/contexto do handle inclusos ao salvar).

```js
const handle = await provisionEmulator(cfg);
// … operar …

await handle.saveSession("./sessions/linkedin.json", { step: "logged-in", apps: […] });
await handle.removeSession("./sessions/linkedin.json");
const state = await handle.restoreSession("./sessions/linkedin.json");
// restore reaplica contexto no runtime ligado ao handle
```

| Superfície | O quê |
|------------|--------|
| **Público** | `handle.saveSession` · `removeSession` · `restoreSession` |
| **Privado** | serialize JSON · unlink · reaplicar serial/apps/etapa |

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
  participant S as session (interno)
  participant FS as Filesystem

  alt US-17 save
    Dev->>H: saveSession(path, state)
    H->>S: merge serial + state + savedAt
    S->>FS: write JSON
    FS-->>S: ok
    H-->>Dev: path
  else US-18 remove
    Dev->>H: removeSession(path)
    H->>S: unlink
    S->>FS: delete
    H-->>Dev: removed
  else US-19 restore
    Dev->>H: restoreSession(path)
    H->>S: read JSON
    S->>FS: read
    FS-->>S: payload
    S->>H: reaplicar contexto
    H-->>Dev: SessionState
  end
```

### Por US

| US | SC | Chamada |
|----|-----|---------|
| US-17 | SC-22 | `handle.saveSession(path, state?)` |
| US-18 | SC-23 | `handle.removeSession(path)` |
| US-19 | SC-24 | `handle.restoreSession(path)` |

#### Contratos

```ts
type SessionState = {
  serial?: string;
  kind?: string;
  step?: string;
  apps?: unknown[];
  savedAt?: string;
  [k: string]: unknown;
};

type AgentHandle = {
  // … EP-01..05 …
  saveSession(path: string, state?: SessionState): Promise<string>;
  removeSession(path: string): Promise<boolean>;
  restoreSession(path: string): Promise<SessionState>;
};

await handle.saveSession("./sessions/li.json", { step: "logged-in" });
await handle.removeSession("./sessions/li.json");
const s = await handle.restoreSession("./sessions/li.json");
```

`saveSession` inclui `handle.serial` / `kind` no payload automaticamente.

#### Exemplo de JSON (arquivo de sessão)

Ilustrativo da API EP-06 (o piloto LinkedIn atual **não** grava sessão):

```json
{
  "serial": "127.0.0.1:5555",
  "kind": "redroid",
  "step": "ready",
  "apps": {
    "linkedin": {
      "package": "com.linkedin.android",
      "version": "4.1.1248"
    }
  },
  "screenshot": "./screenshots/01-antes-agree.png",
  "paths": {
    "session": "./sessions/linkedin.json",
    "screenshot": "./screenshots/01-antes-agree.png"
  },
  "extract": [
    {
      "type": "text",
      "text": "Sign in",
      "bounds": { "x": 120, "y": 1800, "w": 840, "h": 96 },
      "center": [540, 1848]
    }
  ],
  "events": [
    { "type": "ui_stable", "attempt": 3, "at": "2026-09-19T23:00:00.000Z" }
  ],
  "savedAt": "2026-09-19T23:00:01.000Z"
}
```

| Campo | Origem |
|-------|--------|
| `serial` / `kind` | handle (EP-01) |
| `step` | estado passado pelo caller |
| `apps` | instalação (EP-03) |
| `paths` | paths úteis para restore |
| `extract` | última lista de elementos (EP-05), opcional |
| `events` | últimos eventos (EP-02), opcional |
| `savedAt` | preenchido no save |

`restoreSession` lê esse JSON e reaplica `serial`, `apps`, `step` e `paths` no runtime do handle.

---

## Modelos / Erros

| Código | Quando |
|--------|--------|
| `SESSION_WRITE_FAILED` | US-17 |
| `SESSION_NOT_FOUND` | US-19 |
| `SESSION_INVALID` | JSON inválido |

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
    +saveSession(path, state)
    +removeSession(path)
    +restoreSession(path)
  }
  class session_js {
    <<internal>>
    bindSession(handle)
  }
  AgentHandle --> session_js
```

---

## Cenários BDD

Fonte: [`5.bdds.md#ep-06--sessao`](../5.bdds.md#ep-06--sessao).

---

## Plano de implementação (gaps → entregas)

| # | Entrega | SC | Critério |
|---|---------|-----|----------|
| I1 | Anexar `saveSession` / `removeSession` / `restoreSession` ao handle | — | Sem API solta no caller |
| I2 | save inclui serial/kind do handle | SC-22 | US-17 |
| I3 | remove limpa arquivo + contexto | SC-23 | US-18 |
| I4 | restore reaplica no handle/runtime | SC-24 | US-19 |
| I5 | Piloto **não** chama `saveSession` (fluxo atual = lista OCR / AGREE|Sign In) | — | linkedin-login | API de sessão disponível; piloto não grava |

### Ordem

```text
I1 → I2 → I3 → I4 → I5
```

---

## Mapeamento código atual

| Peça | Status |
|------|--------|
| `createSessionApi` → handle | Existe |
| `saveSession` / `removeSession` / `restoreSession` | Existe |
| Legado `saveSession` / `loadSession` soltos | Deprecado |

---

## Critério de pronto (épico)

1. Sessão só via handle  
2. SC-22..24 encapsulados  
3. BDDs US-17 + EP-06  

## Próximos passos

→ Aceite: [`5.bdds.md#ep-06--sessao`](../5.bdds.md#ep-06--sessao)
