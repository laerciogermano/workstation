## Objetivo
Criar uma **lib TypeScript/Node** que seja a **interface única entre o programador e o Chrome via CDP**: toda manipulação de browser (clique, digitar, scroll, drag, hover, navegação) passa por ela, simulando **comportamento humano**, de modo que o [bot-lab](https://trello.com/c/XcjfqioO) (e sites reais) **não marquem a operação como robô**.

## Problema
Hoje os scripts em `screen-robot/pocs/chrome-cdp/` falam CDP direto (`Input.dispatchMouseEvent`, `Runtime.evaluate`, `el.click()`). Clique JS e CDP sem trajetória são detectados como robô no bot-lab. Precisamos de uma fachada estável para **todos** os sistemas que usam CDP.

## Escopo da lib
1. **API de alto nível** (exemplos): `connect({ cdpUrl })`, `goto`, `click`, `type`, `hover`, `scroll`, `drag`, `select`, `fill`, `waitFor`, `bringToFront` / modo foco
2. **Todo clique de botão/link** obriga **trajetória de mouse** antes (`mouseMoved` com curva + jitter + timing humano) — nunca `el.click()` / `dispatchEvent` sintético como caminho default
3. **Comportamentos humanos** alinhados ao bot-lab:
   - trajetória contínua (não teleporte)
   - mousemove antes do clique
   - eventos CDP `isTrusted`
   - ritmo de cliques e digitação (delays variáveis)
   - drag com trajetória trusted
   - **tela/aba com foco** no momento da ação (activate/`bringToFront` quando a operação exige “humano”; documentar modo background = detectável)
4. **Ambiente**: reutilizar perfis/portas do CSV `contas-facebook-chrome.csv` + `start-*.sh`; sem flags óbvias de automation quando evitável
5. **Aceite obrigatório**: suíte contra `http://127.0.0.1:8766/` (`test-cdp-clicks.mjs` / `test-cdp-focus.mjs` ou equivalentes da lib) → veredito **humano** nos fluxos cobertos; JS sintético e CDP sem move continuam **robô**
6. Docs: README com exemplos, modo foco vs background, caminho inverso (bypass da lib = CDP cru)

## Entrega
- Pacote em `screen-robot/` (ex. `packages/cdp-human/` ou `pocs/chrome-cdp/human-cdp/`)
- Testes automatizados vs bot-lab
- Migrar **pelo menos 1** script existente (ex. Hostinger login ou um fluxo LinkedIn) para a lib como prova

## Fora de escopo (neste card)
- Bypass garantido de anti-bot proprietário (LinkedIn/Cloudflare etc.) — meta é passar no **nosso** lab e boas práticas humanas
- Driver de mouse OS (`cliclick`) — CDP Input humano primeiro
- Firefox / não-CDP

## Relacionados
- Lab detecção: https://trello.com/c/XcjfqioO · `screen-robot/pocs/bot-lab/`
- CDP atual: `screen-robot/pocs/chrome-cdp/`
- Regra Cursor: browser sempre via CDP (`.cursor/rules/browser-via-cdp.mdc`)
