# Chrome CDP (controlar instância aberta)

Controla um Chrome já rodando com `--remote-debugging-port=9222` (mesmo perfil/cookies).

## Subir o Chrome (ex.: Marcelino)

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --user-data-dir="$HOME/chrome-profiles/marcelino-jidarir-facebook" \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9222 \
  --remote-allow-origins='*' \
  --no-first-run \
  --no-default-browser-check \
  https://bot.sannysoft.com/
```

## Script

```bash
# mínimo: conecta, abre sannysoft, imprime pontos
node sannysoft-points.mjs

node control-chrome.mjs                          # versão com meta/resumo
node control-chrome.mjs --url https://example.com
```

Sem dependências (Node 22+ com `fetch`/`WebSocket` nativos).

## Caminho inverso

- Parar: fechar a janela do Chrome desse `user-data-dir` ou `pkill -f marcelino-jidarir-facebook`
- Sem CDP: suba o Chrome **sem** `--remote-debugging-port`
