# Chrome CDP (controlar instância aberta)

Controla um Chrome já rodando com `--remote-debugging-port=9222` (mesmo perfil/cookies).

## Subir o Chrome (perfis isolados)

```bash
./start-marcelino-jidarir-facebook.sh          # CDP :9222
./start-laercio-germano.sh                     # CDP :9223
# opcional URL: ./start-laercio-germano.sh https://bot.sannysoft.com/
```

Registro: [`../android-studio/contas-facebook-chrome.csv`](../android-studio/contas-facebook-chrome.csv)

## Script

```bash
# mínimo: conecta, abre sannysoft, imprime pontos
node sannysoft-points.mjs

node control-chrome.mjs                          # versão com meta/resumo
node control-chrome.mjs --url https://example.com

# LinkedIn logado na aba CDP: avatar → banner (assets ConectMax em src/assets/)
CDP_URL=http://127.0.0.1:9223 node setup-avatar-banner.mjs
CDP_URL=http://127.0.0.1:9223 node setup-avatar-banner.mjs --avatar-only
CDP_URL=http://127.0.0.1:9223 node setup-avatar-banner.mjs --banner-only
```

Deps: Node 22+ (`fetch`/`WebSocket`). Clique via CDP (`Input.dispatchMouseEvent`) — janela pode ficar atrás.

**Antes → depois (setup mídia LI):** só control/sannysoft → `setup-avatar-banner.mjs` sobe `conectmax-black.jpg` e `conectmax-banner.jpg` na conta da aba CDP. Rollback: `--avatar-only` / `--banner-only` / editar mídia no LinkedIn.

## Caminho inverso

- Parar: fechar a janela do Chrome desse `user-data-dir` ou `pkill -f marcelino-jidarir-facebook`
- Sem CDP: suba o Chrome **sem** `--remote-debugging-port`
- Clique SO (antigo): `cliclick` + `osascript` activate
