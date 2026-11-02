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
./start-germano.sh                             # CDP :9230 (Germano / Hostinger rolego)
./start-germano-firefox.sh                     # Firefox isolado (sem CDP; perfil ~/firefox-profiles/germano)
# opcional URL: ./start-lucas-mendes.sh https://www.linkedin.com/
# opcional URL: ./start-germano-firefox.sh https://tinder.com
```

Registro: [`../android-studio/contas-facebook-chrome.csv`](../android-studio/contas-facebook-chrome.csv)

**Antes → depois (Germano):** sem perfil → `~/chrome-profiles/germano` + `start-germano.sh` (:9230) para painel Hostinger do domínio `rolego.com.br`. Rollback: fechar Chrome; `rm -rf ~/chrome-profiles/germano`; remover script/linha README/CSV.

**Antes → depois (Germano Firefox):** só Chrome CDP → `~/firefox-profiles/germano` + `start-germano-firefox.sh` (`-no-remote -profile`). Sem porta CDP (Marionette/RDP sob demanda). Rollback: fechar Firefox; `rm -rf ~/firefox-profiles/germano`; remover `start-germano-firefox.sh`/linha README.

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

**IP no CSV:** a cada signup novo, gravar IPv4 de egress (`curl -sS https://api.ipify.org`) na col `ip` de [`../android-studio/contas-linkedin-clozzy.csv`](../android-studio/contas-linkedin-clozzy.csv). Rollback: deixar `ip` vazio só em linhas históricas sem evidência.

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
CDP_URL=http://127.0.0.1:9224 node linkedin-setup-job-cdp.mjs
# job/company sem flags → profile-defaults.json; --force regrava
```

Deps: Node 22+ (`fetch`/`WebSocket`). Clique via CDP (`Input.dispatchMouseEvent`) — janela pode ficar atrás.

**Antes → depois (setup mídia LI):** só control/sannysoft → `setup-avatar-banner.mjs` sobe `conectmax-black.jpg` e `conectmax-banner.jpg` na conta da aba CDP. Rollback: `--avatar-only` / `--banner-only` / editar mídia no LinkedIn.

**Antes → depois (update-avatar):** assets fixos ConectMax → `linkedin-update-avatar-cdp.mjs --photo PATH` na aba CDP logada. Rollback: trocar foto no LI ou reexecutar com outra imagem.

**Antes → depois (update-banner / about):** banner só no setup conjunto → `linkedin-update-banner-cdp.mjs --photo PATH`; about AVD/`linkedin-setup` → `linkedin-setup-about-cdp.mjs` (web CDP). Fluxo Help LI: Adicionar seção → Sobre; **SPA click** no ancora `/edit/forms/summary/new/` (não `Page.navigate` — form não hidrata). Limite 2600 chars. Rollback: editar capa/Sobre no LI.

**Antes → depois (job / experiência):** signup preenche cargo só no onboarding → `linkedin-setup-job-cdp.mjs` adiciona experiência no perfil logado (SPA `/edit/forms/position`, typeahead cargo+empresa ConectMax). Skip se já tem ambos (salvo `--force`). Rollback: apagar a experiência / editar intro no LI; ou reexecutar com outro `--job`/`--company`.

**Antes → depois (banner menu / file-input):** 1 tentativa no menuitem + só `Carregar*` → falhava quando o menu LI usa `<a>` curto (“Adicionar imagem de capa”) ou rótulo “Selecionar imagem”. Depois: retry 4× no menu (`a`/`button`/`menuitem`, labels Adicionar/Alterar/Editar + EN), espera 2.5s, e também clica `Selecionar imagem` / `Alterar foto` / `Editar` antes do `setFile`. Scripts: `setup-avatar-banner.mjs`, `linkedin-update-banner-cdp.mjs`. Rollback: reverter esses dois arquivos ao commit anterior ao patch; fluxo manual: câmera capa → `<a>` “Adicionar imagem de capa” → Carregar foto única → setFile → Salvar alterações.

## DM Instagram (Dora) — regras de tom

Canônico: [`ig-dora-watch/REGRAS-CONVERSA.md`](ig-dora-watch/REGRAS-CONVERSA.md) (confirmação antes de enviar; tom informal; rodear; não fechar o papo).

**Antes → depois:** regras só no chat → doc versionado em `ig-dora-watch/`. Rollback: apagar/reverter esse arquivo.

## Tinder — prompt Laércio

System prompt (IA = Laércio Germano no Tinder; **só a última não lida**; próxima msg + vinho se propício): [`PROMPT-TINDER-LAERCIO.md`](PROMPT-TINDER-LAERCIO.md). Voz canônica: [`core/PERSONALIDADE-LAERCIO-GERMANO.md`](../../../core/PERSONALIDADE-LAERCIO-GERMANO.md).

**Antes → depois:** só personalidade/§7.1 → prompt autocontido com template PERFIL/HISTÓRICO + regra “uma não lida por vez”. Rollback: apagar o arquivo; usar só o doc de personalidade.

### Loop contínuo (CDP :9230)

```bash
# Chrome Germano com Tinder aberto; depois:
python3 tinder-laercio-loop.py
# ou:
nohup python3 -u tinder-laercio-loop.py >> /tmp/tinder-laercio-loop.log 2>&1 &
```

Uma não lida por ciclo (match falou por último) → extrai chat/perfil → 1–2 bolhas no tom do prompt → próxima. Estado: `/tmp/tinder-laercio-loop-state.json`. Log: `/tmp/tinder-laercio-loop.log`.

**Antes → depois:** respostas manuais / loop genérico em `/tmp` → `tinder-laercio-loop.py` no repo. Rollback: `pkill -f tinder-laercio-loop.py`; apagar o script.

## Caminho inverso

- Parar: fechar a janela do Chrome desse `user-data-dir` ou `pkill -f marcelino-jidarir-facebook`
- Sem CDP: suba o Chrome **sem** `--remote-debugging-port`
- Clique SO (antigo): `cliclick` + `osascript` activate

## Tinder → Postgres Contabo

Schema `tinder` no DB Contabo `connectmax` (conta `germano`): perfis, conversas e mensagens.

- Código/docs: [`tinder-db/README.md`](tinder-db/README.md)
- Import: `cd tinder-db && python3 import.py` (ou `dumps` / `xlsx`)
- Dump local das não respondidas: `tinder-conversas-nao-respondidas/`
- Lista: `tinder-conversas-germano.xlsx` / `tinder-nao-respondidas.md`

**Antes → depois:** só arquivos locais → `connectmax.tinder.*`. Rollback: `DROP SCHEMA tinder CASCADE;`.

