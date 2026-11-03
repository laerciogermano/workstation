# LinkedIn — criar conta (do zero)

Script novo, passo a passo. **Agora só o passo 1:** mailbox Mailcow.

## Main — e-mail + CDP em paralelo

| Arquivo | Papel |
|---|---|
| [`create-mailbox.mjs`](create-mailbox.mjs) | **main** — email+CDP → CSV → abre signup |
| [`create-email.mjs`](create-email.mjs) | `createEmail({ first, last, … })` |
| [`create-cdp.mjs`](create-cdp.mjs) | `createLinkedInCdp({ first, last, … })` |
| [`save-csv.mjs`](save-csv.mjs) | `saveAccountCsv({ email, cdp })` → LI + chrome CSV |
| [`create-linkedin.mjs`](create-linkedin.mjs) | `createLinkedin({ id, email })` — signup + preenche e-mail |
| [`open-signup.mjs`](open-signup.mjs) | `openLinkedInSignup({ id })` → `startCdp` + URL signup + espera `#email-or-phone` |
| [`fill-signup-email.mjs`](fill-signup-email.mjs) | `fillSignupEmail({ id, email })` → espera campo (até 60s) → `#email-or-phone` |
| [`fill-signup-password.mjs`](fill-signup-password.mjs) | `fillSignupPassword({ id, password })` → `#password` (default `in@12345678`) |
| [`click-signup-submit.mjs`](click-signup-submit.mjs) | `clickSignupSubmit({ id })` → Aceite e cadastre-se |
| [`fill-signup-name.mjs`](fill-signup-name.mjs) | `fillSignupName({ id, first, last })` → `#first-name` / `#last-name` |
| [`click-signup-continue.mjs`](click-signup-continue.mjs) | `clickSignupContinue({ id })` → Continuar |
| [`wait-signup-after-name.mjs`](wait-signup-after-name.mjs) | `waitSignupAfterName({ id })` → após nome: próxima tela **ou** espera indeterminada na verificação humana (captcha manual) |
| [`fill-signup-location.mjs`](fill-signup-location.mjs) | `fillSignupLocation({ id, location })` → digita → 1ª opção → Continuar |
| [`fill-signup-job.mjs`](fill-signup-job.mjs) | `fillSignupJob({ id, job })` → cargo (typeahead) |
| [`fill-signup-company.mjs`](fill-signup-company.mjs) | `fillSignupCompany({ id, company })` → empresa → Continuar |
| [`fetch-signup-pin.mjs`](fetch-signup-pin.mjs) | `fetchSignupPin({ email })` → poll Mailcow ≤5 min pelo PIN 6 dígitos |
| [`fill-signup-pin.mjs`](fill-signup-pin.mjs) | `fillSignupPin({ id, code })` → digita PIN → Continuar |
| [`click-signup-age18.mjs`](click-signup-age18.mjs) | `clickSignupAge18({ id })` → Sim, maior de 18 → Continuar |
| [`click-signup-skip.mjs`](click-signup-skip.mjs) | `clickSignupSkip({ id })` → Pular / Skip (unitário) |
| [`click-signup-finish.mjs`](click-signup-finish.mjs) | `clickSignupFinish({ id })` → Concluir (unitário) |
| [`finish-signup-onboarding.mjs`](finish-signup-onboarding.mjs) | `finishSignupOnboarding({ id })` → choice (job-seeker “Não”)→Pular→Concluir→Continuar até `/feed` |
| [`upload-profile-photo.mjs`](upload-profile-photo.mjs) | `uploadProfilePhoto({ id, photo })` — `/in/me` → Carregar foto → `DOM.setFileInputFiles` → Salvar |
| [`upload-profile-banner.mjs`](upload-profile-banner.mjs) | `uploadProfileBanner({ id, banner })` — `/in/me` → imagem de fundo/capa → Carregar → Salvar |
| [`upload-profile-about.mjs`](upload-profile-about.mjs) | `uploadProfileAbout({ id, about })` — `/in/me` → SPA `/edit/forms/summary` → insertText → Salvar |
| [`upload-profile-experience.mjs`](upload-profile-experience.mjs) | `uploadProfileExperience({ id, experiences[] })` — SPA `/edit/forms/position` → cargo/empresa/datas/desc → Salvar |

```bash
cd /Users/laerciogermano/Documents/works/screen-robot/pocs/chrome-cdp/linkedin-create-account

# fluxo completo (mailbox + CDP + signup até /feed):
node create-mailbox.mjs --first Bruno --last Nunes --write-credenciais \
  --location "Rio de Janeiro" \
  --job "Especialista em suprimentos e itens corporativos" \
  --company ConectMax

# só simular:
node create-mailbox.mjs --first Bruno --last Nunes --dry-run

# sem abrir Chrome:
node create-mailbox.mjs --first Bruno --last Nunes --write-credenciais --no-browser

# foto de perfil (pós-signup; human-cdp) — usar avatar do doc escolhidos-v2.1:
node upload-profile-photo.mjs --id daniela-hoffmann \
  --photo ../../../tasks/6ae9def6a28b279ac20b6ffc/avatars/v06-daniela-hoffmann.jpg

# banner BR Supply com logo (01 caixas; não usar 03 sem logo):
node upload-profile-banner.mjs --id daniela-hoffmann \
  --banner ../../../src/assets/banners/br-supply-01-caixas.jpg

# Sobre (escolhidos-v2.1):
node upload-profile-about.mjs --id daniela-hoffmann \
  --about-file ./about-daniela-hoffmann.txt

# Experiências (JSON; atual pode já existir do signup → skip):
node upload-profile-experience.mjs --id daniela-hoffmann \
  --file ./experience-daniela-hoffmann.json
```

**Antes → depois (foto):** sem passo de avatar no create-account → `upload-profile-photo.mjs` (cliques human-cdp + `setFileInputFiles`). Foto Daniela = escolhidos-v2.1 (`6ae9def6a28b279ac20b6ffc`, Vitaly Gariev), **não** a lista Unsplash nova (`6ae9def02d6e0ab7a0ab0737`). Rollback: remover o script; editar/excluir foto no LinkedIn.

**Antes → depois (banner):** sem passo de capa → `upload-profile-banner.mjs`. Daniela: `br-supply-01-caixas.jpg` (logo BR; card prioriza 01/02, não o 03). Rollback: remover o script; editar/excluir capa no LinkedIn.

**Antes → depois (about):** só `linkedin-setup-about-cdp.mjs` (CDP cru) → `upload-profile-about.mjs` (human-cdp + `--id` / `--about-file`). Clique SPA no `/edit/forms/summary` (não `Page.navigate`). Rollback: remover o script; editar Sobre no LI.

**Antes → depois (experiência):** só `linkedin-setup-job-cdp.mjs` (1 cargo) → `upload-profile-experience.mjs` (lote JSON: cargo/empresa/datas/descrição; SPA `/edit/forms/position`). Rollback: remover o script; apagar experiências no LI.

Saída: progresso em **stderr** (`[create-mailbox]`, `[createLinkedin]`, `[PIN]`); JSON final em **stdout** `{ email, cdp, csv, linkedin }`.

**Ordem:** mailbox+CDP → **CSV** (`li_criado=nao`) → `createLinkedin` → se chegar no `/feed`, `markLiCriado` → **`li_criado=sim`**. Após nome+Continuar: se **verificação humana**, espera **sem timeout**. Defaults: localidade `Rio de Janeiro`, cargo/empresa ConectMax, senha `in@12345678`. `--no-browser` pula o browser. CSVs: [`contas-linkedin-clozzy.csv`](../../android-studio/contas-linkedin-clozzy.csv) + [`contas-facebook-chrome.csv`](../../android-studio/contas-facebook-chrome.csv).

**Personas (job/location/about/avatar):** catálogo [`../../../tasks/6ae9c89d7f2951914a023746/personas.csv`](../../../tasks/6ae9c89d7f2951914a023746/personas.csv) · mapa [`persona-para-vendedor.md`](../../../tasks/6ae9c89d7f2951914a023746/persona-para-vendedor.md). Antes: só defaults genéricos em `profile-defaults.json`. Depois: escolher `id` da persona e passar `--job`/`--location`/`--company`. Rollback: defaults do JSON.

**Lista de vendedores (nome + aparência):** [`../../../tasks/6ae9ca1e215a10fb339d26e4/vendedores.csv`](../../../tasks/6ae9ca1e215a10fb339d26e4/vendedores.csv) · resumo [`vendedores.md`](../../../tasks/6ae9ca1e215a10fb339d26e4/vendedores.md). Usar `first`/`last`/`job`/`location` da linha + `aparencia`/`avatar_style` para foto. Rollback: signup só com CLI/defaults.

**Antes → depois (li_criado):** só save inicial `nao` → ao fim com `/feed`, atualiza para `sim` via `markLiCriado`. Rollback: não chamar `markLiCriado`.

**Antes → depois (captcha):** seguia direto p/ localidade → `waitSignupAfterName` pausa indeterminada se iframe/desafio de segurança. Rollback: remover a chamada.

**Antes → depois (não-robô):** tentava clicar “Não sou um robô” via script → **só humano** resolve o captcha; script só espera. Rollback: restaurar `FIND_NOT_ROBOT` do commit `ca71c342`.

**Antes → depois (onboarding):** sequência fixa de Pulares → `finishSignupOnboarding` adaptativo (Pular se houver, senão Concluir/Continuar) até `/feed`. Rollback: voltar calls `clickSignupSkip`/`Continue`/`Finish`.

**Antes → depois (job-seeker):** parava em `/job-seeker-intent` sem botão → clica “Não / Não estou procurando” e segue. Rollback: remover branch `choice` no SNAP/loop.

**Antes → depois (Pular/foto):** `click('[data-hcdp=ob-skip]')` podia dar `waitFor timeout` na foto → `clickAt(x,y)` do SNAP; Pular sempre antes de Concluir/Continuar (modal foto incluso). Rollback: voltar clique por seletor.

**Antes → depois (logs):** silencioso no meio → logs de passo em stderr. Rollback: remover `log()` / `console.error` de progresso.

**Antes → depois (CSV):** save antes + update `li_criado` após feed → só save antes do LinkedIn. Rollback: voltar o 2º `saveAccountCsv` com `liCriado: 'sim'`.

**Antes → depois (fp cols):** só ua/platform/lang/tz/hw/mem/geo/chrome → + accept_language, geo_accuracy, max_touch, touch, webrtc, ch_platform, platform_version, arch, model, mobile, bitness, brands, full_version_list. Sem hash. Rollback: remover cols novas do header/`save-csv.mjs`.

**Antes → depois (cidade/company):** só em observacoes/CLI → cols `cidade` + `company` no CSV LI (via `--location` / `--company`). Linhas antigas ficam vazias (`ensureLinkedinCsvHeader`). Rollback: remover as 2 cols do header/`saveAccountCsv`.

**Coluna `li_criado`:** `sim`/`nao` — se a conta LinkedIn foi criada (signup). Default na criação mailbox+CDP: `nao`. Atualizar para `sim` após signup. Rollback: remover a coluna.

**CDP:** porta livre a partir de `9237`; fingerprint **dinâmico** via `generateFingerprint()` — catálogo **conservador** (Win64 / Mac 10_15_7 / **Linux**, Chrome 129–132, cidades BR principais; sem viewport). Evita colisão tz+UA+platformVersion+hw+mem. `debug: true`. Override: `createLinkedInCdp({ fingerprint })`.

**E-mail:** default `@brsupply.email` (`MAIL_DOMAIN` override, ex. `clozzy.com.br`). `MAIL_SSH_HOST` · `MAIL_SSH_PASS`. Quota mailbox default `1024` MiB (`MAIL_MBOX_QUOTA_MIB`). Antes de criar, `ensureDomainQuotaHigh` sobe o teto do domínio para **10 TiB** (`MAIL_DOMAIN_MAX_QUOTA_MIB=10485760`) e até **500** caixas via MySQL (a API `edit/domain` não persiste). Idempotente se a caixa já existir. `--write-credenciais` grava na seção `### Caixas @<domínio>` de `credenciais.md`.

**Antes → depois (domínio):** default `clozzy.com.br` → `brsupply.email`. Rollback: `MAIL_DOMAIN=clozzy.com.br` ou restaurar default no código.

**Antes → depois (quota):** domínio 50 GiB → estouro `mailbox_quota_left_exceeded` → teto 10 TiB + ensure no createEmail. Rollback: `UPDATE domain SET quota=51200, mailboxes=50 …`.

**Rollback:** apagar mailbox Mailcow + linha `credenciais.md`; `removeCdp('<id>', { deleteProfile: true })`.

**Antes → depois:** só e-mail → e-mail+CDP em paralelo na main. Rollback: remover chamada/`create-cdp.mjs`.

## Próximos passos (ainda não)

3. `startCdp` + signup LinkedIn  
4. CSV / IP
