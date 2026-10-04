# Roteiro: Buscar "comprador" e conectar (UI via OCR)

Objetivo
- Automatizar a jornada do operador: buscar "comprador" no LinkedIn (AVD já na página do LinkedIn), abrir Show all results, clicar em People e conectar nos perfis (Skip se aparecer) até **exceder o limite do LinkedIn** (convites/semana ou equivalente mostrado pelo app).

Pré-requisitos
- AVD/agent online e na tela principal do LinkedIn (emulator-5554).
- `adb` disponível e permissões concedidas.
- Pasta `src/screenshots/` e pasta de logs da execução (ex. `src/logs/jornada-comprador/`) para artefatos.

Regra de decisão (obrigatória) — execução da jornada
- **Toda decisão** em runtime (o que clicar, se Skip apareceu, se há Connect, se scrollar, se a tela mudou) deve usar **somente** `extract()` / `findByText` e o retorno de texto `{ text, x, y }`.
- A IA **jamais** tira print do dispositivo sozinha para **olhar a imagem** e decidir o próximo passo da execução.
- Screenshots no fluxo feliz são só artefato opcional de log — **não** entram no raciocínio da IA em runtime.
- **Exceção (debug):** se algo sair do planejado ou houver erro, aí pode tirar print e pedir análise da IA pela imagem — **só nessa exceção**, nunca no restante da execução.

Montagem / evolução do roteiro (fora do runtime)
- Para **montar ou evoluir** esta jornada, a IA **pode** enviar imagem do dispositivo e extrair detalhes visuais (layout, pills, sheets, zonas) — **somente** para enriquecer o roteiro até ele ficar **auto-suficiente** (passos e critérios só com OCR/texto).
- Objetivo desse uso de imagem: fechar lacunas do doc (ex. “Connect não sai no OCR → usar grau `2nd` + x fixo”), não operar o AVD passo a passo pela visão.
- Quando o roteiro já for auto-suficiente, voltar à regra de execução: zero decisão por imagem.

Log por execução (obrigatório)
- A cada run, criar um arquivo de log (ex. `logs/jornada-comprador/YYYYMMDD-HHMMSS.jsonl` ou `.md`).
- **Para cada passo** (1–7 e cada iteração do Connect): registrar
  1. `passo` / `subpasso` / timestamp
  2. **saída OCR** usada na decisão (`extract` / `findByText`: lista ou trecho `{ text, x, y }`)
  3. **decisão** tomada (ex. “tap Search @180,78”, “pular Pending @y=508”, “Skip sheet”, “scroll centro”, “parar: limite LinkedIn”)
  4. ação executada e resultado observado no OCR seguinte
- Sem log de passo = execução incompleta para auditoria. Decisões continuam só por OCR; o log é o registro, não a fonte da decisão.

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
   - OCR **quase nunca** lê o texto do pill `Connect` (só às vezes o da linha cortada pelo nav).
   - **Só clicar em `Connect`** (match exato `^Connect$`). **Jamais** clicar em `Message`, `Pending`, `Follow`, `Following`, `Follow back`, nem qualquer outro CTA do card.
   - **Critério de saída (único):** parar **somente** quando o OCR indicar que **excedeu o limite do LinkedIn** (convites/semana ou bloqueio equivalente). Exemplos de texto junto: `weekly invitation limit`, `invitation limit`, `limit`, `can't send invitations`, `não é possível enviar`, `limite de convites`. **Não** usar limite N artificial no run; **não** parar por lista “esgotada” ou idle de scroll — continuar até o app bloquear.
   - **Armadilha Message / Premium:** tap errado (ou gesto curto no centro) pode abrir compose “Send a message” / InMail / paywall Premium. **Nunca** enviar mensagem nem clicar CTA Premium.
     - Detecção via OCR: textos como `Message`, `Send a message`, `InMail`, `Premium`, `Upgrade`, `Try Premium`, composer vazio + `Send`.
     - Recuperação: `key(KEYCODE_BACK)` (1–3×) até `extract()` voltar à lista People (`People` chip + graus `2nd`/`3rd+` / busca `comprador`) — **não** decidir por imagem.
     - Antes de cada Connect e após cada scroll: checar essa armadilha; se presente, BACK e seguir (logar OCR + decisão BACK).
   - Para **cada** item da lista visível:
     1. achar o marcador de grau do perfil (`2nd` / `3rd+`) com `y > 180` (abaixo dos chips) e `x < 400` (não é o chip da barra)
     2. na faixa `y` do card, se OCR mostrar `Message` / `Pending` / `Follow` / `Following` → **pular** o item (não tap) — logar motivo
     3. se OCR achar `Connect` exato nessa faixa → `tapElement` nesse `{ x, y }`; senão (OCR cego no pill) tap à direita `x: ~458, y: grau.y` **somente** se a faixa não tiver os CTAs proibidos acima (`180 < y < 850`)
     4. aguardar 1–2s; se OCR mostrar **limite LinkedIn** → ir ao Encerramento; se armadilha Message/Premium → BACK (não contar Connect)
     5. se sheet `Add a note…` / `Add a note`: **jamais** clicar em `Add a note` — só `Skip` / `Ignorar` (`y` ~840–870 ok). Skip do sheet **não** é CTA do card. OCR costuma partir o título em tokens (`Add` `a` `note`); detectar pelo texto **junto** (`join` dos `text`) com `/add\s+a\s+note/i`
     6. incrementar contador de connects; logar OCR pós-ação + decisão; **não** sair por N artificial
   - depois dos Connects elegíveis: scroll **swipe** no centro (`x: 270`, `y: 480`, `direction: "up"`, `distance` ≥ 350) — gesto contínuo, **não** tap; evitar `distance` baixa (vira clique e abre Message); logar scroll
   - **após rolar:** checar limite LinkedIn e armadilha Message/Premium; depois repetir itens até o limite do LinkedIn
   - **não** clicar botões de item com `y ≥ 850` (nav); só `Skip` do sheet pode estar nessa faixa
   - teclado fechado antes de qualquer scroll da lista (centro)

7) Encerramento
   - disparado quando OCR confirmar limite LinkedIn excedido (ou erro fatal documentado no log)
   - log final: total connects / skips + motivo de parada + caminho do arquivo de log
   - anexar último `extract()` no log

Critérios de aceite
- A jornada: Search → digitar → fechar teclado → Show all results → People → Connect (e Skip se aparecer) até **exceder o limite do LinkedIn**.
- Passo 6 só termina no limite do LinkedIn (OCR); sem teto N no run; scroll da lista só no centro (swipe, não tap).
- Cada passo/iteração registrado no log (OCR + decisão).
- Só clica em `Connect` (exato); jamais `Message` / `Pending` / `Follow` / `Following`.
- Após Connect, no sheet: só `Skip` — jamais `Add a note`.
- Se abrir Message/Premium: BACK via OCR até a lista; nunca enviar mensagem.
- Decisões só via OCR/texto; print+análise por imagem apenas em erro/debug.

Notas operacionais
- Timeouts: esperar 1–3s entre ações; `findByText` com `minScore:0.75`.
- Scroll lista: `direction: "up"`; origem **sempre no centro** (`x: 270`, `y: 480` em 540×960); `distance` ≥ 350. Fechar teclado antes.
- **Scroll — sempre no centro** na lista: **jamais** na zona do teclado/nav (risco de fechar o app). Swipe curto no centro pode abrir Message — preferir swipe longo.
- **Parada:** só limite do LinkedIn detectado por OCR — sem `LIMITE=N` artificial.
- Log: um arquivo por execução com OCR + decisões por passo.
- Se OCR do teclado falhar, não clicar em `comprador` da lista — só digitar e depois fechar teclado → `Show all results` (não usar `adb input text`).

Como reproduzir manualmente (linha de comando)
1. Abrir AVD e navegar ao LinkedIn (manual ou `npm run linkedin-login` até o ponto de login já na home).
2. Executar snippets Node que chamem as interfaces acima (ver `src/scripts/linkedin-login.js` como base).

Responsável: automação `screen-robot/src/scripts/linkedin-login.js` (exemplo).

