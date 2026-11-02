# bot-lab — site laboratório (humano vs robô)

UI mínima + painel de detecção para validar automação Chrome/CDP e, depois, mouse humano.

**Card:** [Site laboratório: UI + detecção de operação por robô](https://trello.com/c/XcjfqioO) · board [Robô Prospecção](https://trello.com/b/JPntFgwO/robô-prospecção)

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

- trajetória do ponteiro (teleporte / caminho curto)
- mousemove antes do clique
- `click.isTrusted`
- ritmo de cliques e digitação
- drag com distância

**Veredito:** `humano` · `inconclusivo` · `robô / suspeito`. Layout: site à esquerda · trilho fixo à direita (veredito + comportamento).

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

## Antes → depois

Não existia alvo local controlado → `pocs/bot-lab/` com checks sannysoft-like + playground UI.

**Rollback:** apagar `screen-robot/pocs/bot-lab/`; remover linha na tabela de [`../README.md`](../README.md).
