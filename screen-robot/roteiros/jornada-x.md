# Jornada X — pesquisar comprador (cenários BDD)

Objetivo: do ZERO abrir LinkedIn → buscar `comprador` → People → filtro Campinas → Connect+Skip até fim da lista ou limite semanal.
1 ação/turno. Tap só com `x,y` EXATOS do OCR atual. Proibido inventar coords.

---

## Cenário 1 — Abrir gaveta de apps

**Dado** que estou na tela inicial (launcher, só hora/data, sem apps)

```json
[
  { "text": "2:17", "x": 123, "y": 23 },
  { "text": "Mon, Oct 6", "x": 270, "y": 48 }
]
```

**Então** faço scroll down 1× (abrir gaveta). Sem tap. Sem sleep. Sem KEYCODE_BACK.

---

## Cenário 2 — Abrir LinkedIn na gaveta

**Dado** que estou na gaveta de apps (Chrome + Calendar + LinkedIn)

```json
[
  { "text": "Chrome", "x": 90, "y": 220 },
  { "text": "Calendar", "x": 270, "y": 220 },
  { "text": "LinkedIn", "x": 450, "y": 220 },
  { "text": "Settings", "x": 90, "y": 400 }
]
```

**Então** tap no text `LinkedIn` (ou `Linkedln`). Não tap Chrome/Calendar/Settings. Não scroll.

---

## Cenário 3 — Aguardar LinkedIn abrir

**Dado** que tap LinkedIn já ocorreu e o OCR ainda não tem tab bar (splash / loading / poucos tokens)

```json
[
  { "text": "2:18", "x": 123, "y": 23 },
  { "text": "in", "x": 270, "y": 480 }
]
```

**Então** sleep 2000. Sem scroll. Sem retap coords antigas. Sem HOME.

---

## Cenário 4 — Clicar em Search

**Dado** que o LinkedIn está aberto (Home / Network / Jobs) e há `Search` com y&lt;120

```json
[
  { "text": "2:17", "x": 123, "y": 23 },
  { "text": "Search", "x": 181, "y": 79 },
  { "text": "Recommendedforyou", "x": 123, "y": 153 },
  { "text": "Home", "x": 54, "y": 920 },
  { "text": "Network", "x": 162, "y": 920 },
  { "text": "Jobs", "x": 486, "y": 920 }
]
```

**Então** tap `Search` nas x,y do OCR (y&lt;120). Única ação. Sem type. Sem scroll. Sem Connect.

---

## Cenário 5 — Digitar comprador

**Dado** que o campo Search / teclado está aberto (após tap Search) e ainda não tem `Add a location`

```json
[
  { "text": "2:18", "x": 123, "y": 23 },
  { "text": "Search", "x": 143, "y": 82 },
  { "text": "q", "x": 54, "y": 700 },
  { "text": "w", "x": 108, "y": 700 },
  { "text": "e", "x": 162, "y": 700 }
]
```

**Então** type `"comprador"`. Sem tap. Sem scroll. Proibido digitar Campinas neste campo.

---

## Cenário 6 — Fechar teclado (ou pular se Show all já visível)

**Dado** que o campo y&lt;120 = `comprador` e o teclado ainda cobre a tela **sem** `Show all results`

```json
[
  { "text": "comprador", "x": 143, "y": 82 },
  { "text": "q", "x": 54, "y": 700 },
  { "text": "w", "x": 108, "y": 700 }
]
```

**Então** key `KEYCODE_BACK` 1×. Sem type. Sem tap.

**Exceção — Dado** campo = `comprador` **e** OCR já tem `Show all results` / `Show all` / `Showall`:

```json
[
  { "text": "comprador", "x": 143, "y": 82 },
  { "text": "Show all", "x": 270, "y": 520 },
  { "text": "Show all results", "x": 270, "y": 560 }
]
```

**Então** NÃO dê BACK (BACK fecha a busca). Vá direto ao Cenário 7 e tap nesse text.

---

## Cenário 7 — Show all results

**Dado** que o campo y&lt;120 = `comprador` e há `Show all results` (ou `Show all` / `Showall`) fora da tab bar

```json
[
  { "text": "comprador", "x": 143, "y": 82 },
  { "text": "Recent", "x": 80, "y": 200 },
  { "text": "Show all", "x": 270, "y": 520 },
  { "text": "Show all results", "x": 270, "y": 560 }
]
```

**Então** tap o text EXATO do OCR (`Show all results` ou `Show all`). Não inventar coords. Não scroll no feed. Não tap Post/Jobs y≥850.

---

## Cenário 8 — Aba People

**Dado** que os resultados abriram com chips `People` / `Posts` / `Jobs` (y&lt;180) e ainda sem lista 1st/2nd

```json
[
  { "text": "comprador", "x": 143, "y": 82 },
  { "text": "People", "x": 80, "y": 150 },
  { "text": "Posts", "x": 180, "y": 150 },
  { "text": "Jobs", "x": 280, "y": 150 },
  { "text": "Schools", "x": 380, "y": 150 }
]
```

**Então** tap `People` (y&lt;180). Não tap y≥200.

**Exceção — Dado** `1st` / `2nd` já visíveis (lista People já aberta): pule para o Cenário 9.

---

## Cenário 9 — Abrir filtro Location

**Dado** que estou na lista People (1st/2nd/3rd+) com chip `Location` / `Locatior` e **sem** chip Campinas na barra (y~150, fora do campo y&lt;120)

```json
[
  { "text": "comprador", "x": 143, "y": 82 },
  { "text": "1st", "x": 243, "y": 152 },
  { "text": "2nd", "x": 318, "y": 152 },
  { "text": "3rd+", "x": 399, "y": 152 },
  { "text": "Locatior", "x": 502, "y": 152 },
  { "text": "Comprador", "x": 198, "y": 225 },
  { "text": "Connect", "x": 458, "y": 344 }
]
```

**Então** tap `Location` ou `Locatior`. Única ação. Proibido Connect. Proibido tap no cargo `Comprador` / nome. Belo Horizonte nos cards = filtro ainda não aplicado.

---

## Cenário 10 — Campo Add a location

**Dado** que o sheet de localização abriu com `Add a location` / `Add alocation` e sem teclado

```json
[
  { "text": "Locations", "x": 270, "y": 120 },
  { "text": "Add a location", "x": 200, "y": 220 },
  { "text": "Australia", "x": 180, "y": 320 },
  { "text": "United States", "x": 200, "y": 380 }
]
```

**Então** tap `Add a location` / `Add alocation` (campo do sheet, não o chip Location da lista).

---

## Cenário 11 — Digitar Campinas

**Dado** que o teclado está aberto no filtro de cidade (`Add a location` + sugestões Australia/UnitedStates)

```json
[
  { "text": "Add a location", "x": 200, "y": 220 },
  { "text": "Australia", "x": 180, "y": 320 },
  { "text": "q", "x": 54, "y": 700 },
  { "text": "w", "x": 108, "y": 700 }
]
```

**Então** type `"Campinas"`. Sem tap. Sem type `comprador`. Chip Location sozinho NÃO muda o type para Campinas.

---

## Cenário 12 — Selecionar sugestão Campinas

**Dado** que o campo tem Campinas e há sugestão na lista (Sao Paulo / Brazil)

```json
[
  { "text": "Campinas", "x": 160, "y": 82 },
  { "text": "Campinas, Sao Paulo, Brazil", "x": 250, "y": 260 },
  { "text": "Show results", "x": 270, "y": 880 }
]
```

**Então** tap a **sugestão** Campinas (não o campo y&lt;120). Preferir match com `Campinas` + `Paulo`/`Brazil`.

---

## Cenário 13 — Aplicar filtro (Show results)

**Dado** que a sugestão Campinas está selecionada/destacada e `Show results` está visível

```json
[
  { "text": "Campinas", "x": 160, "y": 82 },
  { "text": "Campinas, Sao Paulo, Brazil", "x": 250, "y": 260 },
  { "text": "Show results", "x": 270, "y": 880 }
]
```

**Então** tap `Show results` (também aceita `Done` / `Apply` / `Mostrar resultados`). Não retap a sugestão.

---

## Cenário 14 — Connect

**Dado** que a lista People tem chip Campinas/Locations na barra (y~150, **não** só no Search y&lt;120) e há text EXATO `Connect` (180&lt;y&lt;850)

```json
[
  { "text": "comprador", "x": 143, "y": 82 },
  { "text": "People", "x": 80, "y": 150 },
  { "text": "1st", "x": 243, "y": 152 },
  { "text": "2nd", "x": 318, "y": 152 },
  { "text": "Campinas", "x": 420, "y": 152 },
  { "text": "Ana Silva", "x": 160, "y": 320 },
  { "text": "Comprador", "x": 180, "y": 360 },
  { "text": "Connect", "x": 458, "y": 344 },
  { "text": "Bruno Costa", "x": 160, "y": 560 },
  { "text": "Connect", "x": 457, "y": 589 },
  { "text": "Message", "x": 458, "y": 720 }
]
```

**Então** tap o text EXATO `Connect` (coords do hit; 180&lt;y&lt;850). Jamais `Message` / `Pending` / `Follow` / cargo `Comprador` / nome. Sem chip Campinas na barra → proibido Connect (volte ao Cenário 9).

---

## Cenário 15 — Skip no Add a note

**Dado** que abriu o sheet `Add a note`

```json
[
  { "text": "Add a note to your invitation?", "x": 270, "y": 400 },
  { "text": "Skip", "x": 150, "y": 880 },
  { "text": "Send", "x": 400, "y": 880 }
]
```

**Então** tap `Skip` / `Ignorar`. Não done. Não Connect. Não `Add a note` / Send.

---

## Cenário 16 — Sem Connect na tela → scroll

**Dado** que a lista People com filtro Campinas está aberta e **não** há `Connect` no OCR

```json
[
  { "text": "comprador", "x": 143, "y": 82 },
  { "text": "Campinas", "x": 420, "y": 152 },
  { "text": "2nd", "x": 318, "y": 152 },
  { "text": "Pending", "x": 458, "y": 344 },
  { "text": "Message", "x": 458, "y": 560 }
]
```

**Então** scroll up curto (~150–200, centro). Repita desde o Cenário 14.

---

## Cenário 17 — Encerrar

**Dado** limite semanal (pós-Skip):

```json
[
  { "text": "Your invitation to Ana was not sent because you have reached the weekly limit for connection invitations.", "x": 270, "y": 800 },
  { "text": "Please try again next week", "x": 270, "y": 860 }
]
```

**Então** done `limite_convites`. Sem novo Connect. Sem scroll.

**Dado** fim da lista:

```json
[
  { "text": "No more results", "x": 270, "y": 700 }
]
```

**Então** done `fim_lista`.

---

## Interruptos (antes de qualquer cenário)

| OCR | Ação |
| --- | --- |
| `Add a note` / Skip visível | tap Skip — não done, não Connect |
| Shade Notifications / Clear all / AndroidSetup sem tab bar | KEYCODE_BACK |
| Message / InMail / Premium / perfil (About/Experience) sem lista Connect | KEYCODE_BACK |
| Withdraw invitation | tap Cancel |
| OCR &lt;15 hits, histórico já tem Search/People, sem gaveta Chrome+Calendar | sleep 1500 — não é home; proibido scroll down |

---

## Regras globais

- Ordem: Cenários 1→17. Não pule filtro Campinas (9–13) antes do primeiro Connect.
- Tap: `x,y` só do extract atual; `element` = text desse hit. Proibido recalcular / inventar / relabelar.
- Type: `comprador` só no Search; `Campinas` só no Add a location.
- done: N Connect+Skip + motivo (`limite_convites` / `fim_lista` / `filter_campinas_failed`).
