# Roteiro: Buscar "comprador" e conectar (UI via OCR)

Objetivo
- Automatizar a jornada do operador: buscar "comprador" no LinkedIn (AVD já na página do LinkedIn), abrir Show all results, clicar em People e conectar nos perfis (Skip se aparecer), até o limite da sessão; se preciso, fechar o app (scroll nas bordas), reabrir e repetir.

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
   - teclado fechado antes de qualquer scroll da lista (centro)

7) Fechar LinkedIn, reabrir e repetir até o limite
   - se o limite de connects da sessão **ainda não** foi atingido (lista esgotada, travou, ou fim da rodada):
     1. **fechar o app LinkedIn** com scroll/gesto **nas bordas** (faixa inferior do system nav / borda — é a **única** exceção à regra de scroll no centro; propósito = sair/minimizar o app)
     2. confirmar saída via OCR (`extract()`): sumiram `Search` / abas Home|Network|…; ou apareceu launcher
     3. **abrir o LinkedIn de novo** (ícone no launcher via OCR/texto, ou relaunch do pacote se já for o fluxo operacional)
     4. esperar home (`extract()` achar `Search`)
     5. **repetir** os passos 1–6
   - continuar o ciclo fechar → abrir → Search → … → Connect até o **limite** ser atendido
   - só então ir ao Encerramento

8) Encerramento
   - log resumido: total connects / skips / ciclos (fechar+reabrir)
   - `elements-final.json` opcional via `extract()`

Critérios de aceite
- A jornada: Search → digitar → fechar teclado → Show all results → People → Connect (e Skip se aparecer).
- Se o limite não foi atingido: fechar LinkedIn (scroll nas bordas) → reabrir → repetir até o limite.
- Scroll da **lista** só no centro; scroll nas **bordas** só para fechar o app (passo 7).
- Decisões só via OCR/texto; print+análise por imagem apenas em erro/debug.
- Artefatos: `elements-*.json`, log com totais; screenshots só se debug ou log opcional.

Notas operacionais
- Timeouts: esperar 1–3s entre ações; `findByText` com `minScore:0.75`.
- Scroll lista: `direction: "up"`; origem **sempre no centro** (`x: 270`, `y: 480` em 540×960). Fechar teclado antes.
- **Scroll — centro vs borda:** na lista, **jamais** scroll na zona do teclado/nav (fecha o app sem querer). **Exceção:** passo 7 usa scroll/gesto nas bordas **de propósito** para fechar o LinkedIn.
- Limite da sessão: definir no run (ex. N connects); o ciclo 7 só para quando o limite ainda não foi cumprido.
- Se OCR do teclado falhar, não clicar em `comprador` da lista — só digitar e depois fechar teclado → `Show all results` (não usar `adb input text`).

Como reproduzir manualmente (linha de comando)
1. Abrir AVD e navegar ao LinkedIn (manual ou `npm run linkedin-login` até o ponto de login já na home).
2. Executar snippets Node que chamem as interfaces acima (ver `src/scripts/linkedin-login.js` como base).

Responsável: automação `screen-robot/src/scripts/linkedin-login.js` (exemplo).

