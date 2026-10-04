# Roteiro: Buscar "comprador" e conectar (UI via OCR)

Objetivo
- Automatizar a jornada do operador: buscar "comprador" no LinkedIn (AVD já na página do LinkedIn), abrir Show all results, clicar em People e conectar nos perfis (Skip se aparecer), **scrollando até achar `Connect` no OCR**, até fim explícito da lista ou limite do LinkedIn.

Pré-requisitos
- AVD/agent online e na tela principal do LinkedIn (emulator-5554).
- `adb` disponível e permissões concedidas.
- Pasta `src/screenshots/` e pasta de logs da execução (ex. `src/logs/jornada-comprador/`) para artefatos.

Regra de decisão (obrigatória) — execução da jornada
- **Toda decisão** em runtime (o que clicar, se Skip apareceu, se há Connect, se scrollar, se a tela mudou) deve usar **somente** `extract()` / `findByText` e o retorno de texto `{ text, x, y }`.
   - **CTA do card:** **jamais** clicar em `Message` (nem `Msg`, `Send a message`). **Apenas** `Connect` (match exato `^Connect$` no OCR). **Proibido** tap estimado à direita do card (`x: ~458`) — era isso que acertava `Message` quando o pill não saía no OCR. Sem `Connect` no extract → pular/scroll; se abrir Message → `KEYCODE_BACK` e não contar.
- A IA **jamais** tira print do dispositivo sozinha para **olhar a imagem** e decidir o próximo passo da execução.
- Screenshots no fluxo feliz são só artefato opcional de log — **não** entram no raciocínio da IA em runtime.
- **Exceção (debug):** se algo sair do planejado ou houver erro, aí pode tirar print e pedir análise da IA pela imagem — **só nessa exceção**, nunca no restante da execução.

Montagem / evolução do roteiro (fora do runtime)
- Para **montar ou evoluir** esta jornada, a IA **pode** enviar imagem do dispositivo e extrair detalhes visuais (layout, pills, sheets, zonas) — **somente** para enriquecer o roteiro até ele ficar **auto-suficiente** (passos e critérios só com OCR/texto).
- Objetivo desse uso de imagem: fechar lacunas do doc — **não** voltar a autorizar tap estimado em Message; se Connect não sai no OCR, o runtime deve scrollar, não chutar `x,y`.
- Quando o roteiro já for auto-suficiente, voltar à regra de execução: zero decisão por imagem.

Log por execução (obrigatório)
- A cada run, criar um **documento explicativo** Markdown: `logs/jornada-comprador/YYYYMMDD-HHMMSS.md` (não só `.jsonl` cru).
- Formato de **relatório legível**: texto explicando a decisão **separado** do JSON do OCR (JSON só em bloco de código).
- Por passo (1–7 e cada iteração Connect), incluir nesta ordem:
  1. Cabeçalho `## Passo N — título (timestamp)`
  2. `### Decisão` — prosa: por que e o que foi feito (ex.: “achei Search com y&lt;120; tap @180,78; ignorei search do feedback”)
  3. `### OCR usado na decisão` — bloco `json` com a lista `{ text, x, y }` (ou trecho) usada
  4. `### Resultado` — prosa do que aconteceu depois; opcionalmente outro bloco `json` se o OCR seguinte importar
- Sem documento de passo = execução incompleta para auditoria. Decisões continuam só por OCR; o log é o registro, não a fonte da decisão.

Passos (interfaces usadas)
1) Capture frame + OCR
   - chamar: `extract({ serial })`
   - saída: lista `{ type: "text", text, x, y }`
   - log: OCR completo + decisão “iniciar jornada”

2) Clicar em Search
   - localizar elemento `text === "Search"` (case-insensitive; preferir `y < 120` — não confundir com “search” do feedback)
   - `tapElement({ serial, x, y })`
   - esperar 1–2s (`sleep`)
   - log: hit Search + decisão tap

3) Digitar "comprador"
   - preferir `type({ serial, text: "comprador", region? })` (OCR teclado)
   - fallback: se `type` falhar, usar outra estratégia de digitação — **não** clicar no item `comprador` da lista
   - esperar 1–3s
   - **não** clicar no item `comprador` (autocomplete / recent)
   - após digitar, **remover o teclado** (ex.: `key({ serial, code: "KEYCODE_BACK" })` ou tap fora da área do teclado) para revelar `Show all results`
   - esperar 0.8–1.5s
   - log: OCR pós-type + decisão (type/fallback + BACK teclado)

4) Clicar em "Show all results"
   - após abrir os resultados (buscar "comprador"), localizar `Show all results`:
     - `findByText(serial, "Show all")` → hit `{ x, y }` ou detectar par vizinho `Show` + `all` na mesma linha via `extract()`
   - `tapElement({ serial, x, y })`
   - esperar 2–3s
   - log: OCR + decisão tap Show all (persistir trecho OCR no log; `elements-*.json` opcional)

5) Clicar em People
   - após `Show all results`, localizar a aba/filtro `People` (preferir `y` baixo, barra de chips — tipicamente `y < 200`)
   - `extract()` ou `findByText(serial, "People")` → `{ x, y }`
   - `tapElement({ serial, x, y })`
   - esperar 2–3s
   - log: OCR + decisão tap People

6) Iterar perfis e conectar (um Connect por item da lista)
   - **Só clicar onde o OCR devolveu `Connect`** (match exato `^Connect$`, `180 < y < 850`). **Jamais** clicar em `Message` / `Pending` / `Follow` / `Following`.
   - **Proibido tap estimado** por grau/`x: ~458`: se o extract não tiver a palavra `Connect`, **não** há clique nesse item — só scroll e tentar de novo. (O estimado era a causa de clicar em Message e ter que dar BACK.)
   - **Sem teto de rounds:** se a tela não tiver `Connect` no OCR, **scrollar no centro infinitamente** até aparecer algum `Connect` — **não** parar após 3 (nem N) rounds vazios.
   - **Critérios de saída** (só estes encerram o passo 6 e o processo):
     1. **Fim explícito da lista** no OCR: `No more results` / `End of results` / `You've reached the end` / `não há mais resultados`. **Não** usar “Are these results helpful?” sozinho nem idle de N scrolls.
     2. **Limite LinkedIn:** `weekly invitation limit`, `invitation limit`, `can't send invitations`, `limite de convites`, `não é possível enviar`, etc.
   - **Não** usar limite N artificial de connects nem de rounds no run.
   - Ao bater critério de saída: ir ao Encerramento, gravar log, **`process.exit` / encerrar o script imediatamente** — o AVD não deve continuar sendo manipulado.
   - **Armadilha Message / Premium:** tap errado (ou gesto curto no centro) pode abrir compose “Send a message” / InMail / paywall Premium. **Nunca** enviar mensagem nem clicar CTA Premium.
     - Detecção via OCR: textos como `Message`, `Send a message`, `InMail`, `Premium`, `Upgrade`, `Try Premium`, composer vazio + `Send`.
     - Recuperação: `key(KEYCODE_BACK)` (1–3×) até `extract()` voltar à lista People (`People` chip + graus `2nd`/`3rd+` / busca `comprador`) — **não** decidir por imagem.
     - Antes de cada Connect e após cada scroll: checar essa armadilha; se presente, BACK e seguir (logar OCR + decisão BACK).
   - Em cada tela (via `extract()`):
     1. listar todos os hits `text === "Connect"` com `180 < y < 850` (ignorar OCR `connections` / `Message`)
     2. se a mesma faixa `y` tiver `Message` / `Pending` / `Follow` → **não** tap (logar)
     3. para cada `Connect` OCR válido: `tapElement({ serial, x, y })` **só** nessas coordenadas do OCR
     4. aguardar 1–2s; se abriu Message/Premium → BACK (não contar); se limite LinkedIn / fim → Encerramento
     5. sheet `Add a note…`: **só** `Skip` / `Ignorar` — jamais `Add a note` (detectar título pelo texto junto `/add\s+a\s+note/i`)
     6. se OCR mostrar `Withdraw invitation` / `Withdraw` + `invitation`: **clicar `Cancel`** (jamais confirmar Withdraw) — logar; não contar Connect
     7. incrementar contador só se Connect + Skip ok (sem Message/Withdraw); logar no `.md`
   - se **zero** `Connect` no OCR da tela: scroll centro (não inventar clique) e **repetir sem limite de rounds** até achar `Connect` ou critério de saída
   - depois dos Connects OCR da tela: scroll **swipe** no centro (`x: 270`, `y: 480`, `direction: "up"`, `distance` ≥ 350); logar scroll
   - **após rolar:** repetir; Encerramento só por fim explícito / limite LinkedIn
   - **não** clicar botões de item com `y ≥ 850` (nav); só `Skip` do sheet pode estar nessa faixa
   - teclado fechado antes de qualquer scroll da lista (centro)

7) Encerramento
   - disparado por: fim explícito da lista (OCR) **ou** limite LinkedIn **ou** erro fatal (tudo documentado no log)
   - log final no `.md`: totais + motivo de parada
   - **parar o script de imediato** — proibido continuar scroll/tap/extract em loop após o encerramento

Critérios de aceite
- A jornada: Search → digitar → fechar teclado → Show all results → People → Connect (e Skip); scroll infinito até achar `Connect` OCR; para só em fim explícito ou limite LinkedIn.
- Após Encerramento, o AVD deixa de ser manipulado (processo termina).
- Passo 6: sem teto de rounds vazios; scroll só no centro; log `.md` com Decisão + OCR JSON por passo.
- Só clica em `Connect` lido no OCR; **proibido** tap estimado; **jamais** `Message` (nem Pending/Follow/Following).
- Após Connect, no sheet: só `Skip` — jamais `Add a note`.
- Se `Withdraw invitation`: só `Cancel` — jamais confirmar Withdraw.
- Se abrir Message/Premium: BACK via OCR até a lista; nunca enviar mensagem.
- Decisões só via OCR/texto; print+análise por imagem apenas em erro/debug.

Notas operacionais
- Timeouts: esperar 1–3s entre ações; `findByText` com `minScore:0.75`.
- Scroll lista: `direction: "up"`; origem **sempre no centro** (`x: 270`, `y: 480` em 540×960); `distance` ≥ 350. Fechar teclado antes.
- **Scroll — sempre no centro** na lista: **jamais** na zona do teclado/nav (risco de fechar o app). Swipe curto no centro pode abrir Message — preferir swipe longo.
- **Parada:** fim explícito da lista (OCR) **ou** limite LinkedIn — **não** parar por “3 rounds sem Connect”; scroll até achar `Connect`; ao parar, encerrar o processo.
- Log: um `.md` por execução (documento: Decisão em prosa + OCR em JSON separado).
- Se OCR do teclado falhar, não clicar em `comprador` da lista — só digitar e depois fechar teclado → `Show all results` (não usar `adb input text`).

Como reproduzir manualmente (linha de comando)
1. Abrir AVD e navegar ao LinkedIn (manual ou `npm run linkedin-login` até o ponto de login já na home).
2. Executar snippets Node que chamem as interfaces acima (ver `src/scripts/linkedin-login.js` como base).

Responsável: automação `screen-robot/src/scripts/linkedin-login.js` (exemplo).

