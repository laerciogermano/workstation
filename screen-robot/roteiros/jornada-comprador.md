# Roteiro: Buscar "comprador" e conectar (UI via OCR)

Objetivo
- Automatizar a jornada do operador: buscar "comprador" no LinkedIn (AVD já na página do LinkedIn), abrir Show all results, clicar em People e conectar nos perfis (Skip se aparecer) até o limite de conexão ser estourado.

Pré-requisitos
- AVD/agent online e na tela principal do LinkedIn (emulator-5554).
- `adb` disponível e permissões concedidas.
- Pasta `src/screenshots/` para artefatos.

Regra de decisão (obrigatória) — execução da jornada
- **Toda decisão** em runtime (o que clicar, se Skip apareceu, se há Connect, se scrollar, se a tela mudou) deve usar **somente** `extract()` / `findByText` e o retorno de texto `{ text, x, y }`.
- A IA **jamais** tira print do dispositivo sozinha para **olhar a imagem** e decidir o próximo passo da execução.
- Screenshots no fluxo feliz são só artefato opcional de log — **não** entram no raciocínio da IA em runtime.
- **Exceção (debug):** se algo sair do planejado ou houver erro, aí pode tirar print e pedir análise da IA pela imagem — **só nessa exceção**, nunca no restante da execução.

Montagem / evolução do roteiro (fora do runtime)
- Para **montar ou evoluir** esta jornada, a IA **pode** enviar imagem do dispositivo e extrair detalhes visuais (layout, pills, sheets, zonas) — **somente** para enriquecer o roteiro até ele ficar **auto-suficiente** (passos e critérios só com OCR/texto).
- Objetivo desse uso de imagem: fechar lacunas do doc (ex. “Connect não sai no OCR → usar grau `2nd` + x fixo”), não operar o AVD passo a passo pela visão.
- Quando o roteiro já for auto-suficiente, voltar à regra de execução: zero decisão por imagem.

Passos (interfaces usadas)
1) Capture frame + OCR
   - chamar: `extract({ serial })`
   - saída: lista `{ type: "text", text, x, y }`

2) Clicar em Search
   - localizar elemento `text === "Search"` (case-insensitive)
   - `tapElement({ serial, x, y })`
   - esperar 1–2s (`sleep`)

3) Digitar "comprador"
   - preferir `type({ serial, text: "comprador", region? })` (OCR teclado)
   - fallback: se `type` falhar, usar outra estratégia de digitação — **não** clicar no item `comprador` da lista
   - esperar 1–3s
   - **não** clicar no item `comprador` (autocomplete / recent)
   - após digitar, **remover o teclado** (ex.: `key({ serial, code: "KEYCODE_BACK" })` ou tap fora da área do teclado) para revelar `Show all results`
   - esperar 0.8–1.5s

4) Clicar em "Show all results"
   - após abrir os resultados (buscar "comprador"), localizar `Show all results`:
     - `findByText(serial, "Show all")` → hit `{ x, y }` ou detectar par vizinho `Show` + `all` na mesma linha via `extract()`
   - `tapElement({ serial, x, y })`
   - esperar 2–3s
   - salvar `elements-showall.json` e screenshot (`screenshots/after-showall.png`)

5) Clicar em People
   - após `Show all results`, localizar a aba/filtro `People` (preferir `y` baixo, barra de chips — tipicamente `y < 200`)
   - `extract()` ou `findByText(serial, "People")` → `{ x, y }`
   - `tapElement({ serial, x, y })`
   - esperar 2–3s
   - salvar screenshot (`screenshots/after-people.png`)

6) Iterar perfis e conectar (um Connect por item da lista)
   - OCR **quase nunca** lê o texto do pill `Connect` (só às vezes o da linha cortada pelo nav).
   - **Critério de saída:** o passo 6 **só finaliza** quando o **limite de conexão for estourado** (ex. N connects do run). Não encerrar por lista “esgotada”, scroll sem novos itens ou fim aparente da tela — continuar rolando e tentando até estourar o limite.
   - **Armadilha Message / Premium:** tap errado (ou gesto curto no centro) pode abrir compose “Send a message” / InMail / paywall Premium. **Nunca** enviar mensagem nem clicar CTA Premium.
     - Detecção via OCR: textos como `Message`, `Send a message`, `InMail`, `Premium`, `Upgrade`, `Try Premium`, composer vazio + `Send`.
     - Recuperação: `key(KEYCODE_BACK)` (1–3×) até `extract()` voltar à lista People (`People` chip + graus `2nd`/`3rd+` / busca `comprador`) — **não** decidir por imagem.
     - Antes de cada Connect e após cada scroll: checar essa armadilha; se presente, BACK e seguir.
   - Para **cada** item da lista visível:
     1. achar o marcador de grau do perfil (`2nd` / `3rd+`) com `y > 180` (abaixo dos chips) e `x < 400` (não é o chip da barra)
     2. ignorar se o card mostra `Pending` / `Following` / `Message` (não são Connect)
     3. clicar o pill Connect à direita: `tapElement({ serial, x: ~458, y: grau.y })` (540px; `180 < y < 850`) — **só** se não houver `Message` na mesma faixa `y`
     4. aguardar 1–2s; se caiu na armadilha Message/Premium → BACK (não contar Connect)
     5. se sheet `Add a note…`: `Skip` / `Ignorar` (`y` ~840–870 ok)
     6. incrementar contador; se `connects >= limite` → sair do passo 6
   - depois dos Connects elegíveis: scroll **swipe** no centro (`x: 270`, `y: 480`, `direction: "up"`, `distance` ≥ 350) — gesto contínuo, **não** tap; evitar `distance` baixa (vira clique e abre Message)
   - **após rolar:** checar armadilha Message/Premium; depois repetir itens; até o limite estourar
   - **não** clicar botões de item com `y ≥ 850` (nav); só `Skip` do sheet pode estar nessa faixa
   - teclado fechado antes de qualquer scroll da lista (centro)

7) Encerramento
   - log resumido: total connects / skips (limite atingido)
   - `elements-final.json` opcional via `extract()`

Critérios de aceite
- A jornada: Search → digitar → fechar teclado → Show all results → People → Connect (e Skip se aparecer) até o limite de conexão estourar.
- Passo 6 só termina no limite; scroll da lista só no centro (swipe, não tap).
- Se abrir Message/Premium: BACK via OCR até a lista; nunca enviar mensagem.
- Decisões só via OCR/texto; print+análise por imagem apenas em erro/debug.
- Artefatos: `elements-*.json`, log com totais; screenshots só se debug ou log opcional.

Notas operacionais
- Timeouts: esperar 1–3s entre ações; `findByText` com `minScore:0.75`.
- Scroll lista: `direction: "up"`; origem **sempre no centro** (`x: 270`, `y: 480` em 540×960); `distance` ≥ 350. Fechar teclado antes.
- **Scroll — sempre no centro** na lista: **jamais** na zona do teclado/nav (risco de fechar o app). Swipe curto no centro pode abrir Message — preferir swipe longo.
- Limite da sessão: definir no run (ex. N connects); passo 6 só para quando esse limite for estourado.
- Se OCR do teclado falhar, não clicar em `comprador` da lista — só digitar e depois fechar teclado → `Show all results` (não usar `adb input text`).

Como reproduzir manualmente (linha de comando)
1. Abrir AVD e navegar ao LinkedIn (manual ou `npm run linkedin-login` até o ponto de login já na home).
2. Executar snippets Node que chamem as interfaces acima (ver `src/scripts/linkedin-login.js` como base).

Responsável: automação `screen-robot/src/scripts/linkedin-login.js` (exemplo).

