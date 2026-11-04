# Chrome CDP (controlar instância aberta)

Controla um Chrome já rodando com `--remote-debugging-port=9222` (mesmo perfil/cookies).

**Lib humana (clique + CRUD + debug overlay):** [`human-cdp/README.md`](human-cdp/README.md) · `npm run test:bot-lab` · `npm run test:debug` · `npm run test:registry` · cards [5tt5ZTeN](https://trello.com/c/5tt5ZTeN) · [hoLSkLko](https://trello.com/c/hoLSkLko) · [W4GN946S](https://trello.com/c/W4GN946S). CDPs = `start-*.sh` + `~/chrome-profiles` (sem JSON/CSV).

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

## Prompt — novo vendedor

Copiar/colar: [`PROMPT-NOVO-VENDEDOR.md`](PROMPT-NOVO-VENDEDOR.md) (mailbox + CDP + fingerprint **sem viewport** + signup LI + CSV).

**Antes → depois:** fluxo só nos chats → prompt reutilizável. Rollback: apagar o arquivo / esta seção.

## Criar conta LinkedIn (script do zero)

Pasta [`linkedin-create-account/`](linkedin-create-account/README.md) — por enquanto **só passo 1** (mailbox Mailcow):

```bash
cd linkedin-create-account
node create-mailbox.mjs --first Nome --last Sobrenome --dry-run
node create-mailbox.mjs --first Nome --last Sobrenome --write-credenciais
```

**Antes → depois:** mailbox ad-hoc via SSH no chat → `create-mailbox.mjs` reutilizável. Rollback: apagar a pasta; criar mailbox manualmente / pelo prompt antigo.

## Cadastro LinkedIn via CDP (Marina)

```bash
./signup-marina-costa.sh --location "São Paulo, Brasil"
./signup-lucas-mendes.sh   # PIN via Mailcow; Pular carreira
./signup-sofia-ribeiro.sh  # idem :9226
./signup-amanda-rocha.sh   # PIN via Mailcow; fingerprint Win129 Manaus :9236
./signup-bruno-nunes.sh    # PIN via Mailcow; fingerprint Mac130 Fortaleza :9237
./signup-pedro-almeida-until-email.sh  # so ate PIN; probe /feed sem onboarding
./signup-juliana-martins-until-email.sh  # idem :9228
# basico so ate nome:
# CDP_URL=http://127.0.0.1:PORT node linkedin-signup-until-name-cdp.mjs --email … --password … --first … --last …
./confirm-email-juliana-martins.sh  # so confirma e-mail (PIN Mailcow) :9228
```

Entradas CLI (completo): `--email` `--password` `--first|--nome` `--last|--sobrenome` `--location` `--job|--cargo` `--company|--empresa` (`--code` opcional — senao poll Mailcow). Until-email / until-name: so email/senha/nome. Confirm-email: `--email` + opcional `--password`/`--code`. **Regra (completo/until-email/confirm):** se aparecer **Pular**, clica. Cliques so CDP. Rollback: apagar mailbox/perfil; CSV `nao_criada`.

**Fingerprint no CSV:** cols `cdp`,`cdp_port`,`cdp_debug` + todos os `fp_*` do fingerprint configurado (`fp_ua`, `fp_platform`, `fp_lang`, `fp_accept_language`, `fp_timezone`, `fp_locale`, `fp_hw`, `fp_mem`, `fp_geo_lat`/`lon`/`accuracy`, `fp_max_touch`, `fp_touch`, `fp_webrtc`, Client Hints `fp_ch_platform`/`fp_platform_version`/`fp_arch`/`fp_model`/`fp_mobile`/`fp_bitness`/`fp_brands`/`fp_full_version_list`, `fp_chrome`; `fp_screen` vazio). `cdp_debug` = `true`/`false` (histórico = `true`). Ver [`linkedin-create-account/save-csv.mjs`](linkedin-create-account/save-csv.mjs). Rollback: limpar cols novas.

**IP no CSV:** a cada signup novo, gravar IPv4 de egress (`curl -sS https://api.ipify.org`) na col `ip` de [`../android-studio/contas-linkedin-clozzy.csv`](../android-studio/contas-linkedin-clozzy.csv). Rollback: deixar `ip` vazio só em linhas históricas sem evidência.

**Antes → depois (Bruno Nunes 2026-11-02):** sem linha → CSV `bruno.nunes@clozzy.com.br` + CDP `bruno-nunes` :9237 + fingerprint Mac/Chrome130/`America/Fortaleza` nas cols `fp_*`; signup `./signup-bruno-nunes.sh` → `/feed`. Rollback: remover linha CSV/`credenciais.md`; `removeCdp('bruno-nunes', { deleteProfile: true })`; apagar mailbox Mailcow.

**Antes → depois (Amanda Rocha 2026-11-02):** sem linha → CSV `amanda.rocha@clozzy.com.br` + CDP `amanda-rocha` :9236 + fingerprint Win/Chrome129/`America/Manaus` gravado em cols `fp_*`; signup `./signup-amanda-rocha.sh` → `/feed`. Rollback: remover linha CSV/`credenciais.md`; `removeCdp('amanda-rocha', { deleteProfile: true })`; apagar mailbox Mailcow.

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

# extrair leads (espelho AVD login-extract-profiles): People search → abre perfil → JSON (+ API)
CDP_URL=http://127.0.0.1:9224 node linkedin-extract-leads-cdp.mjs -n 5 --query "comprador"
# opcional API (mesmo contrato do AVD):
# PROFILES_API_URL=http://localhost:3000 AGENT_ID=… AGENT_API_KEY=… CDP_URL=… node linkedin-extract-leads-cdp.mjs -n 5 --query "…"
```

## Workers LinkedIn CDP (libs = contrato AVD)

Ações de worker (connect / connections / message / unread / profile-messages / extract leads) com **mesma interface** das libs AVD: [`../../src/lib/cdp/README.md`](../../src/lib/cdp/README.md).

```bash
cd ../../src
CDP_ID=marina-costa npm run linkedin-connect-api-cdp   # HTTP :3098
CDP_ID=marina-costa npm run linkedin-connect-cdp -- --url 'https://www.linkedin.com/in/…'
```

**Antes → depois:** só scripts ad-hoc nesta pasta + AVD `src/lib/linkedin-*.js` → `src/lib/cdp/` + API `:3098` para workers. Signup/setup continuam nos `.mjs` daqui. Rollback: AVD `:3099` / libs `serial`.

**Antes → depois (extract leads CDP):** só extract no AVD (`login-extract-profiles` / job `extrair_leads`) → `linkedin-extract-leads-cdp.mjs` (POC) **e** lib worker `src/lib/cdp/linkedin-extract-leads.js` (`npm run linkedin-extract-leads-cdp`). Lib worker: **só cards da lista** (sem abrir `/in/`) + **paginação** `page=N` (~10/página). Saída: `screenshots/linkedin-extract-leads-cdp/<stamp>/profiles.json`. Rollback: AVD; ou lib sem paginação/abrir perfil.

**Antes → depois (parser UI LI 2026):** seletores `li.reusable-search__result-container` / `div.entity-result` → 0 cards (classes ofuscadas) → parse por `a[href*="/in/"]` + texto “Nome • grau … Conectar”; header do perfil pela 1ª linhas do `main` (sem depender de `h1`). Rollback: commit anterior do `.mjs`.

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

**Autorização:** rascunho `[EU]` → “Autorizo enviar?” → só manda após ok explícito. Conteúdo decide sozinho; envio não.

**Tom:** informal de celular; simpático; sempre puxa/continua papo; **vinho na brecha**; **proibido** português extremamente correto.

**Antes → depois:** prompt só voz/última não lida → + ok antes de enviar + anti-português-certo + simpatia/continuidade + vinho na brecha → vinho sem insistência → tom **engraçado+provocativo** como default e vinho **raro**/sem excesso. Rollback: commit anterior do `PROMPT-TINDER-LAERCIO.md`; ou apagar o arquivo e usar só o doc de personalidade.

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

