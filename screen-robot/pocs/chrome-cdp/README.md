# Chrome CDP (controlar instância aberta)

Controla um Chrome já rodando com `--remote-debugging-port=9222` (mesmo perfil/cookies).

## Subir o Chrome (perfis isolados)

```bash
./start-marcelino-jidarir-facebook.sh          # CDP :9222
./start-laercio-germano.sh                     # CDP :9223
./start-marina-costa.sh                        # CDP :9224 (Marina Costa / LI)
./start-lucas-mendes.sh                        # CDP :9225 (Lucas Mendes / LI)
./start-sofia-ribeiro.sh                       # CDP :9226 (Sofia Ribeiro / LI)
./start-pedro-almeida.sh                       # CDP :9227 (Pedro Almeida / LI)
./start-juliana-martins.sh                     # CDP :9228 (Juliana Martins / LI)
./start-camila-ferreira.sh                     # CDP :9229 (Camila Ferreira / LI)
# opcional URL: ./start-lucas-mendes.sh https://www.linkedin.com/
```

Registro: [`../android-studio/contas-facebook-chrome.csv`](../android-studio/contas-facebook-chrome.csv)

**Antes → depois (Marina):** sem perfil → `~/chrome-profiles/marina-costa` + `start-marina-costa.sh` (:9224). Rollback: fechar Chrome; `rm -rf ~/chrome-profiles/marina-costa`; remover script/linha do CSV.

**Antes → depois (Camila):** só Chrome desktop genérico / AVD → `~/chrome-profiles/camila-ferreira` + `start-camila-ferreira.sh` (:9229). Sessão LI antiga não migra automaticamente (login se necessário). Rollback: fechar Chrome; `rm -rf ~/chrome-profiles/camila-ferreira`; remover script/linha README/CSV.

**Antes → depois (Pedro / until-email):** signup completo (`linkedin-signup-cdp.mjs`) → variante `linkedin-signup-until-email-cdp.mjs` para no PIN e navega `/feed/` sem preencher onboarding. Ordem: nome+sobrenome → Continuar → se modal **Verificação de segurança** (iframe visível), pausa até resolução manual. Rollback: usar `./signup-*.sh` completo; apagar perfil `pedro-almeida`.

**Antes → depois (until-name):** until-email/completo → `linkedin-signup-until-name-cdp.mjs` para apos nome+sobrenome+Continuar (sem PIN/captcha wait/onboarding). Rollback: `until-email` ou signup completo.

**Antes → depois (confirm-email):** signup inclui PIN → `linkedin-confirm-email-cdp.mjs` confirma e-mail via **link** do Mailcow e/ou **PIN** (abre LI → settings e-mail → navega confirm link). Wrapper: `./confirm-email-juliana-martins.sh`. Rollback: confirmar manualmente / reenviar link.

## Cadastro LinkedIn via CDP (Marina)

```bash
./signup-marina-costa.sh --location "São Paulo, Brasil"
./signup-lucas-mendes.sh   # PIN via Mailcow; Pular carreira
./signup-sofia-ribeiro.sh  # idem :9226
./signup-pedro-almeida-until-email.sh  # so ate PIN; probe /feed sem onboarding
./signup-juliana-martins-until-email.sh  # idem :9228
# basico so ate nome:
# CDP_URL=http://127.0.0.1:PORT node linkedin-signup-until-name-cdp.mjs --email … --password … --first … --last …
./confirm-email-juliana-martins.sh  # so confirma e-mail (PIN Mailcow) :9228
```

Entradas CLI (completo): `--email` `--password` `--first|--nome` `--last|--sobrenome` `--location` `--job|--cargo` `--company|--empresa` (`--code` opcional — senao poll Mailcow). Until-email / until-name: so email/senha/nome. Confirm-email: `--email` + opcional `--password`/`--code`. **Regra (completo/until-email/confirm):** se aparecer **Pular**, clica. Cliques so CDP. Rollback: apagar mailbox/perfil; CSV `nao_criada`.

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

# so foto de perfil / banner / about (caminho ou texto passado):
CDP_URL=http://127.0.0.1:9228 node linkedin-update-avatar-cdp.mjs --photo /caminho/foto.jpg
CDP_URL=http://127.0.0.1:9228 node linkedin-update-banner-cdp.mjs --photo /caminho/banner.jpg
CDP_URL=http://127.0.0.1:9228 node linkedin-setup-about-cdp.mjs --about "Texto..."
# about sem --about usa src/assets/profile-defaults.json
```

Deps: Node 22+ (`fetch`/`WebSocket`). Clique via CDP (`Input.dispatchMouseEvent`) — janela pode ficar atrás.

**Antes → depois (setup mídia LI):** só control/sannysoft → `setup-avatar-banner.mjs` sobe `conectmax-black.jpg` e `conectmax-banner.jpg` na conta da aba CDP. Rollback: `--avatar-only` / `--banner-only` / editar mídia no LinkedIn.

**Antes → depois (update-avatar):** assets fixos ConectMax → `linkedin-update-avatar-cdp.mjs --photo PATH` na aba CDP logada. Rollback: trocar foto no LI ou reexecutar com outra imagem.

**Antes → depois (update-banner / about):** banner só no setup conjunto → `linkedin-update-banner-cdp.mjs --photo PATH`; about AVD/`linkedin-setup` → `linkedin-setup-about-cdp.mjs` (web CDP). Fluxo Help LI: Adicionar seção → Sobre; **SPA click** no ancora `/edit/forms/summary/new/` (não `Page.navigate` — form não hidrata). Limite 2600 chars. Rollback: editar capa/Sobre no LI.

## Caminho inverso

- Parar: fechar a janela do Chrome desse `user-data-dir` ou `pkill -f marcelino-jidarir-facebook`
- Sem CDP: suba o Chrome **sem** `--remote-debugging-port`
- Clique SO (antigo): `cliclick` + `osascript` activate
