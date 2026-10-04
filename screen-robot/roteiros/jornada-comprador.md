# Roteiro: Buscar "comprador" e conectar (UI via OCR)

Objetivo
- Automatizar a jornada do operador: buscar "comprador" no LinkedIn (AVD já na página do LinkedIn), abrir Show all results, clicar em People e conectar nos perfis (Skip se aparecer).

Pré-requisitos
- AVD/agent online e na tela principal do LinkedIn (emulator-5554).
- `adb` disponível e permissões concedidas.
- Pasta `src/screenshots/` para artefatos.

Regra de decisão (obrigatória)
- **Toda decisão** (o que clicar, se Skip apareceu, se há Connect, se scrollar, se a tela mudou) deve usar **somente** `extract()` / `findByText` e o retorno de texto `{ text, x, y }`.
- A IA **jamais** tira print do dispositivo sozinha para **olhar a imagem** e decidir o próximo passo.
- Screenshots no fluxo feliz são só artefato opcional de log — **não** entram no raciocínio da IA.
- **Exceção (debug):** se algo sair do planejado ou houver erro, aí pode tirar print e pedir análise da IA pela imagem — **só nessa exceção**, nunca no restante da jornada.

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
   - Para **cada** item da lista visível:
     1. achar o marcador de grau do perfil (`2nd` / `3rd+`) com `y > 180` (abaixo dos chips) e `x < 400` (não é o chip da barra)
     2. clicar o pill Connect à direita do card: `tapElement({ serial, x: ~458, y: grau.y })` (em 540px; manter `y` na faixa segura `180 < y < 850`)
     3. aguardar 1–2s
     4. se aparecer sheet `Add a note…`: clicar `Skip` / `Ignorar` (o Skip costuma ficar em `y` ~840–870 — **permitir** esse tap; não confundir com system nav)
     5. screenshot `screenshots/connect-N.png`
   - depois de clicar **todos** os Connects visíveis da tela: scroll **uma vez** no centro (`x: 270`, `y: 480`)
   - **após rolar, repetir o processo** (itens 1–5) para **cada** item novo da lista; continuar o ciclo scroll → conectar até esgotar os perfis ou o limite da sessão
   - **não** clicar botões de item com `y ≥ 850` (nav); só `Skip` do sheet pode estar nessa faixa
   - ignorar itens já `Pending` / `Following` (não são Connect)
   - teclado fechado antes de qualquer scroll

7) Encerramento
   - salvar `screenshots/connect-final.png` / `elements-final.json`
   - log resumido: total connects / skips

Critérios de aceite
- A jornada: Search → digitar → fechar teclado → Show all results → People → Connect (e Skip se aparecer).
- Scroll só no centro; nunca na zona do teclado nem na faixa inferior do system nav.
- Decisões só via OCR/texto; print+análise por imagem apenas em erro/debug.
- Artefatos: `elements-*.json`, log com totais; screenshots só se debug ou log opcional.

Notas operacionais
- Timeouts: esperar 1–3s entre ações; `findByText` com `minScore:0.75`.
- Scroll: `direction: "up"` para revelar conteúdo abaixo; ajustar `distance` conforme AVD.
- **Scroll — sempre no centro:** o gesto **jamais** pode começar/terminar na zona do teclado nem na faixa inferior do system nav (risco de fechar/minimizar o app). Origem **fixada no centro** da tela (ex. `x` = largura/2, `y` = altura/2; em 540×960 → `x: 270`, `y: 480`). Proibido scroll baixo (nav/teclado) ou alto demais (status). Se o teclado estiver aberto, **fechar antes** de qualquer scroll.
- Se OCR do teclado falhar, não clicar em `comprador` da lista — só digitar e depois fechar teclado → `Show all results` (não usar `adb input text`).

Como reproduzir manualmente (linha de comando)
1. Abrir AVD e navegar ao LinkedIn (manual ou `npm run linkedin-login` até o ponto de login já na home).
2. Executar snippets Node que chamem as interfaces acima (ver `src/scripts/linkedin-login.js` como base).

Responsável: automação `screen-robot/src/scripts/linkedin-login.js` (exemplo).

