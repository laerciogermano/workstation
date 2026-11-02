# bot-lab — site laboratório (humano vs robô)

UI mínima + painel de detecção para validar automação Chrome/CDP e, depois, mouse humano.

**Card:** [Site laboratório: UI + detecção de operação por robô](https://trello.com/c/XcjfqioO) · board [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção)

**Próximo (lib):** [Lib CDP humana — interface programador↔browser anti-detecção](https://trello.com/c/5tt5ZTeN) · task [`../../tasks/6ae8ac1d5228997f864b40c5/README.md`](../../tasks/6ae8ac1d5228997f864b40c5/README.md)

## Subir

```bash
cd screen-robot/pocs/bot-lab
./serve.sh
# → http://127.0.0.1:8766/
```

Sem script: `python3 -m http.server 8766` nesta pasta.

## O que mede

### Ambiente (paridade [bot.sannysoft.com](https://bot.sannysoft.com/))

| Check lab | Equivalente sannysoft / Intoli |
|-----------|--------------------------------|
| User Agent (Old) | UA sem `HeadlessChrome` |
| WebDriver (New) | `navigator.webdriver` |
| WebDriver Advanced | rastros `$cdc_` / selenium / `html[webdriver]` |
| Chrome (New) | `window.chrome` presente |
| Permissions (New) | inconsistência Notification vs `permissions.query` |
| Plugins Length / PluginArray | plugins > 0 e tipo `PluginArray` |
| Languages (Old) | `navigator.languages` |
| WebGL Vendor / Renderer | vendor; renderer soft (SwiftShader) = fail |
| Broken Image Dimensions | imagem 404 → `0x0` |

### Comportamento

- trajetória do ponteiro **só com `isTrusted`** (teleporte / caminho curto)
- mousemove antes do clique
- `click.isTrusted`
- ritmo de cliques e digitação
- drag: **pass só com distância trusted**; drag JS sintético → **fail**
- **tela/aba com foco** — `hasFocus` + visible; sem foco/`blur` → **tainted** (poll 150ms; CDP `Input` re-foca no clique). Ação enquanto tainted → **fail** + **lock** até reset → veredito **robô**. Sem ação: limpa após ~450ms de foco estável.

**Veredito:** `humano` (pass≥3 e 0 fails) · `robô / suspeito` (qualquer ação sem foco; ≥2 fails; ou ≥1 fail com pass&lt;3) · `inconclusivo` (pouca evidência). Layout: site à esquerda · trilho fixo à direita.

## Aceite rápido

1. Abrir no Chrome normal → interagir (mover mouse, digitar, arrastar) → veredito **humano** / poucos fails.
2. Abrir via CDP e clicar só com `Input.dispatchMouseEvent` sem `mouseMoved` → falha em trajetória / pre-click / (e flags webdriver se expostas).
3. Comparar lado a lado com https://bot.sannysoft.com/ — mesmos pontos críticos de ambiente.

Script CDP existente que lê o sannysoft: [`../chrome-cdp/sannysoft-points.mjs`](../chrome-cdp/sannysoft-points.mjs).

### Teste automatizado (JS vs CDP vs trajetória)

Com Chrome Germano em `:9230` e o lab no ar:

```bash
CDP_URL=http://127.0.0.1:9230 node test-cdp-clicks.mjs
```

Esperado: `el.click` / `dispatchEvent` → robô; CDP sem `mouseMoved` → robô (mesmo com `isTrusted=true`); CDP com trajetória + ritmo → humano.

### Teste de foco (com vs sem)

```bash
CDP_URL=http://127.0.0.1:9230 node test-cdp-focus.mjs
```

Esperado: mesma trajetória CDP **com foco** → `humano`; **sem foco** (Cursor na frente) → `robô / suspeito` (page-focus fail).

**Antes → depois (foco):** page-focus falhava na lista mas CDP `Input` re-focava o document e/ou o veredito ignorava 1 fail com pass≥3 → podia dar `humano`. Agora: tainted+lock em ação sem foco → sempre **robô**; `test-cdp-focus.mjs` cobre A/B. Rollback: `renderVerdict` antigo + só `hasFocus` live (sem tainted/lock).

## Antes → depois

Não existia alvo local controlado → `pocs/bot-lab/` com checks sannysoft-like + playground UI.

**Rollback:** apagar `screen-robot/pocs/bot-lab/`; remover linha na tabela de [`../README.md`](../README.md).
