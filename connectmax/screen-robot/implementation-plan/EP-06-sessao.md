# Implementation plan — EP-06 Sessão

**Por quê:** plano técnico do épico (sequências · agentes · passo a passo · contratos · classes · modelos · BDDs).  
**Épico:** [`2.epics.md`](../2.epics.md).  
**US:** [`1.stories.md`](../1.stories.md) · [`3.scenarios/EP-06-sessao.md`](../3.scenarios/EP-06-sessao.md) · [`4.bdds/EP-06-sessao.md`](../4.bdds/EP-06-sessao.md).
**Código:** [`../sources/android-control/lib/session.js`](../sources/android-control/lib/session.js).

**Stack:** Node ≥ 18 · `adb` · runtime provisionado (EP-01).

---

## Escopo

| ID | Item |
|----|------|
| US-17 | Salvar sessão |
| US-18 | Remover sessão |
| US-19 | Recuperar sessão |
| SC-22..24 | Cenários correspondentes |

**Resultado:** estado do robô persistido, apagado e restaurado.

---

## Diagramas de sequência

### US-17 — Salvar sessão

#### Agentes

| Agente | Responsabilidade |
|--------|------------------|
| Caller | Entrega o estado atual e o path onde persistir |
| SessionStore | Enriquece com `savedAt`, serializa e grava o JSON |
| Filesystem | Cria diretórios e escreve o arquivo no disco |

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
  participant S as SessionStore
  participant FS as Filesystem

  Dev->>S: saveSession(path, state)
  S->>S: merge savedAt
  S->>FS: mkdir + write JSON
  FS-->>S: ok
  S-->>Dev: absPath
```

#### Passo a passo

| # | De | Para | Chamada | Descrição | Entradas | Execução | Saídas |
|---|----|------|---------|---------|----------|----------|--------|
| 1 | Dev | SessionStore | `saveSession(path, state)` | Persistir | `path`, state | Serializa | Promise |
| 2 | SessionStore | SessionStore | `merge savedAt` | Carimbar | state | Injeta ISO timestamp | state |
| 3 | SessionStore | FS | `mkdir + write JSON` | Gravar | path + JSON | Cria dirs e escreve | pedido |
| 4 | FS | SessionStore | `ok` | Escrita ok | — | Confirma | `ok` |
| 5 | SessionStore | Dev | `absPath` | Path canônico | — | Resolve | absPath |

#### Contratos

Exemplos TypeScript das chamadas (# do passo a passo).

```ts
// Pré: path gravável
// Erro: SESSION_WRITE_FAILED

type SessionState = {
  serial?: string;
  apps?: string[];
  step?: string;
  paths?: Record<string, string>;
  savedAt?: string;
  [k: string]: unknown;
};

// #1 Dev → SessionStore
declare function saveSession(path: string, state: SessionState): string;

const absPath = saveSession("sessions/linkedin.json", {
  serial: "127.0.0.1:5555",
  apps: ["com.linkedin.android"],
  step: "logged-in",
  paths: { screenshot: "artifacts/screen.png" },
});
// → ".../sessions/linkedin.json" (com savedAt ISO)

// #2–4 FS
declare function writeJson(path: string, data: SessionState): void;
writeJson(absPath, {
  serial: "127.0.0.1:5555",
  savedAt: "2026-09-19T21:00:00.000Z",
});
```


### US-18 — Remover sessão

#### Agentes

| Agente | Responsabilidade |
|--------|------------------|
| Caller | Pede remoção da sessão no path informado |
| SessionStore | Apaga o arquivo (idempotente) e limpa o contexto em memória |
| Filesystem | Executa o unlink do arquivo de sessão, se existir |

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
  participant S as SessionStore
  participant FS as Filesystem

  Dev->>S: removeSession(path)
  S->>FS: unlink se existe
  FS-->>S: removed|absent
  S->>S: limpar contexto runtime
  S-->>Dev: { removed: boolean }
```

#### Passo a passo

| # | De | Para | Chamada | Descrição | Entradas | Execução | Saídas |
|---|----|------|---------|---------|----------|----------|--------|
| 1 | Dev | SessionStore | `removeSession(path)` | Apagar sessão | `path` | Unlink idempotente | Promise |
| 2 | SessionStore | FS | `unlink` | Remover arquivo | `path` | Apaga se existe | pedido |
| 3 | FS | SessionStore | `removed/absent` | Resultado FS | — | Retorna flag | status |
| 4 | SessionStore | SessionStore | `limpar contexto` | Alinhar memória | handles | Reset runtime | — |
| 5 | SessionStore | Dev | `{ removed }` | Resultado | — | Resolve | `{ removed }` |

#### Contratos

Exemplos TypeScript das chamadas (# do passo a passo).

```ts
// Pré: — (idempotente)

// #1 Dev → SessionStore
declare function removeSession(
  path: string,
): { removed: boolean };

const out = removeSession("sessions/linkedin.json");
// → { removed: true }  ou  { removed: false } se já inexistente

// FS
declare function unlinkIfExists(path: string): boolean;
unlinkIfExists("sessions/linkedin.json");
```


### US-19 — Recuperar sessão

#### Agentes

| Agente | Responsabilidade |
|--------|------------------|
| Caller | Pede restauração do estado a partir do path |
| SessionStore | Lê o JSON, valida o schema e devolve `SessionState` |
| Filesystem | Fornece o conteúdo do arquivo no path |

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
  participant S as SessionStore
  participant FS as Filesystem

  Dev->>S: restoreSession(path)
  S->>FS: read JSON
  alt arquivo ok
    FS-->>S: content
    S->>S: validar schema
    S-->>Dev: state
  else ausente/inválido
    FS-->>S: missing|invalid
    S-->>Dev: erro
  end
```

#### Passo a passo

| # | De | Para | Chamada | Descrição | Entradas | Execução | Saídas |
|---|----|------|---------|---------|----------|----------|--------|
| 1 | Dev | SessionStore | `restoreSession(path)` | Restaurar | `path` | Read + validate | Promise |
| 2 | SessionStore | FS | `read JSON` | Carregar | `path` | fs.readFile | pedido |
| 3 | FS | SessionStore | `content` | Arquivo ok | — | alt ok | JSON |
| 4 | SessionStore | SessionStore | `validar schema` | Garantir campos | JSON | Valida | state |
| 5 | SessionStore | Dev | `state` | Sessão pronta | — | Resolve | `SessionState` |
| 6 | FS | SessionStore | `missing/invalid` | Falha de leitura | — | alt erro | erro |
| 7 | SessionStore | Dev | `erro` | Não restaurável | código | Rejeita | `SESSION_*` |

#### Contratos

Exemplos TypeScript das chamadas (# do passo a passo).

```ts
// Pré: arquivo JSON válido
// Erros: SESSION_NOT_FOUND | SESSION_INVALID

type SessionState = {
  serial?: string;
  apps?: string[];
  step?: string;
  paths?: Record<string, string>;
  savedAt?: string;
  [k: string]: unknown;
};

// #1 Dev → SessionStore
declare function restoreSession(path: string): SessionState;
declare function loadSession(path: string): SessionState | null;

const state = restoreSession("sessions/linkedin.json");
// → { serial, apps, step, paths, savedAt }

const maybe = loadSession("sessions/missing.json");
// → null
```


---

## Modelos

### SessionState

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `serial` / `device` | `string` | Device |
| `apps` | `object?` | Versões/pacotes |
| `step` | `string?` | Etapa do fluxo |
| `paths` | `object?` | screenshot/session |
| `savedAt` | `ISO-8601` | Persistência |

### Erros

| Código | US |
|--------|-----|
| `SESSION_WRITE_FAILED` | US-17 |
| `SESSION_NOT_FOUND` | US-19 |
| `SESSION_INVALID` | US-19 |

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
  class SessionState {
    +string serial
    +object apps
    +string step
    +string savedAt
  }
  class SessionStore {
    +saveSession(path, state) string
    +removeSession(path) object
    +loadSession(path) SessionState
    +restoreSession(path) SessionState
  }
  SessionStore ..> SessionState
```

**Hoje / gap:** ver mapeamento abaixo.

---

## Cenários BDD

Fonte: `US-17`..`US-19` / `4.bdds/EP-06-sessao.md`.

```gherkin
Cenário: US-17 Sessão é gravada em disco
  Dado estado em memória e path da sessão
  Quando a serialização grava o arquivo
  Então o arquivo de sessão existe
```

```gherkin
Cenário: US-18 Sessão é removida
  Dado um path de sessão
  Quando a remoção da sessão é executada
  Então o arquivo de sessão não existe
  E o runtime não mantém o contexto daquela sessão
```

```gherkin
Cenário: US-19 Sessão é recuperada
  Dado um arquivo de sessão existente
  Quando a leitura reaplica o contexto
  Então o runtime possui o estado restaurado
```

---

## Plano de implementação (gaps → entregas)

| # | Entrega | US | Critério |
|---|---------|-----|----------|
| I1 | Schema mínimo `SessionState` | US-17 | Doc + validação |
| I2 | `removeSession` | US-18 | SC-23 |
| I3 | `restoreSession` (falha se inválido) | US-19 | SC-24 |

### Ordem

```text
I1 → I2 → I3
```

---

## Mapeamento código atual

| Peça | Status |
|------|--------|
| `saveSession` / `loadSession` | Existe |
| `removeSession` / `restoreSession` | **Gap** |

---

## Critério de pronto (épico)

1. Três APIs US-17..19  
2. BDDs SC-22..24  
3. Schema estável para o piloto LinkedIn  

## Próximos passos

→ Implementar gaps em [`sources/android-control`](../sources/android-control/README.md)  
→ Aceite: BDDs em [`4.bdds/EP-06-sessao.md`](../4.bdds/EP-06-sessao.md)
