# Roteiro: Buscar "comprador" e conectar (UI via OCR)

Objetivo
- Automatizar a jornada do operador: buscar "comprador" no LinkedIn (AVD já na página do LinkedIn), navegar aos resultados, abrir People → Show all e conectar nos perfis listados.

Pré-requisitos
- AVD/agent online e na tela principal do LinkedIn (emulator-5554).
- `adb` disponível e permissões concedidas.
- Pasta `src/screenshots/` para artefatos.

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
   - fallback: se `type` falhar, localizar `comprador` em `extract()` (Recent/autocomplete) e `tapElement` sobre ele
   - esperar 1–3s

4) Clicar no resultado desejado
   - `findByText(serial, "comprador")` → hit `{ x, y }`
   - `tapElement({ serial, x, y })`
   - esperar 2–3s

5) Navegar até seção People
   - usar `extract()` repetidamente e `scroll({ serial, direction: "up", distance })` até detectar header `People` (y alto) ou sinais de People (tokens: `mutual`, `2nd`, `1st`)
   - validar com OCR; salvar screenshot a cada iteração

6) Clicar em "Show all" (People)
   - procurar par vizinho `Show` + `all` (mesma linha) via `extract()` ou `findByText(serial,"Show all")`
   - `tapElement({ serial, x, y })`
   - esperar 3s

7) Iterar perfis e conectar
   - para cada item listado:
     - localizar botão/link `Connect` / `connections` via `extract()` (proximal ao perfil)
     - `tapElement({ serial, x, y })`
     - aguardar 1–2s
     - checar `findByText(serial, "Skip"|"Cancelar"|"Ignorar")` — se aparecer, `tapElement` no `Skip`
     - salvar screenshot por ação (`screenshots/connect-N.png`)
   - rolar a lista periodicamente (`scroll`) para trazer novos perfis

8) Encerramento
   - salvar `screenshots/connect-final.png`
   - gerar `elements-<etapa>.json` com `extract()` em pontos chave
   - log resumido: total connects / skips / falhas

Critérios de aceite
- A jornada encontra e clica em pelo menos um `Connect` e trata `Skip` quando presente.
- Artefatos gerados: `screenshots/*.png`, `elements-*.json`, log com totais.

Notas operacionais
- Timeouts: esperar 1–3s entre ações; `findByText` com `minScore:0.75`.
- Scroll: `direction: "up"` para revelar conteúdo abaixo; ajustar `distance` conforme AVD.
- Se OCR do teclado falhar, usar fallback por resultados/autocomplete (não usar `adb input text`).

Como reproduzir manualmente (linha de comando)
1. Abrir AVD e navegar ao LinkedIn (manual ou `npm run linkedin-login` até o ponto de login já na home).
2. Executar snippets Node que chamem as interfaces acima (ver `src/scripts/linkedin-login.js` como base).

Responsável: automação `screen-robot/src/scripts/linkedin-login.js` (exemplo).

