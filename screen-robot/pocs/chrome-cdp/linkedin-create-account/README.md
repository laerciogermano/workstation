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
| [`wait-signup-after-name.mjs`](wait-signup-after-name.mjs) | `waitSignupAfterName({ id })` → após nome: próxima tela **ou** espera indeterminada na verificação humana |
| [`fill-signup-location.mjs`](fill-signup-location.mjs) | `fillSignupLocation({ id, location })` → digita → 1ª opção → Continuar |
| [`fill-signup-job.mjs`](fill-signup-job.mjs) | `fillSignupJob({ id, job })` → cargo (typeahead) |
| [`fill-signup-company.mjs`](fill-signup-company.mjs) | `fillSignupCompany({ id, company })` → empresa → Continuar |
| [`fetch-signup-pin.mjs`](fetch-signup-pin.mjs) | `fetchSignupPin({ email })` → poll Mailcow ≤5 min pelo PIN 6 dígitos |
| [`fill-signup-pin.mjs`](fill-signup-pin.mjs) | `fillSignupPin({ id, code })` → digita PIN → Continuar |
| [`click-signup-age18.mjs`](click-signup-age18.mjs) | `clickSignupAge18({ id })` → Sim, maior de 18 → Continuar |
| [`click-signup-skip.mjs`](click-signup-skip.mjs) | `clickSignupSkip({ id })` → Pular / Skip (unitário) |
| [`click-signup-finish.mjs`](click-signup-finish.mjs) | `clickSignupFinish({ id })` → Concluir (unitário) |
| [`finish-signup-onboarding.mjs`](finish-signup-onboarding.mjs) | `finishSignupOnboarding({ id })` → loop Pular→Concluir→Continuar até `/feed` |

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
```

Saída: progresso em **stderr** (`[create-mailbox]`, `[createLinkedin]`, `[PIN]`); JSON final em **stdout** `{ email, cdp, csv, linkedin }`.

**Ordem:** mailbox+CDP → **CSV** → `createLinkedin` (signup até `/feed`). Após nome+Continuar: se **verificação humana**, espera **sem timeout** até a próxima tela (localidade etc.). Sem regravar CSV depois do LinkedIn (`li_criado` fica `nao` no save inicial). Defaults: localidade `Rio de Janeiro`, cargo/empresa ConectMax, senha `in@12345678`. `--no-browser` pula o browser. `saveAccountCsv` grava [`contas-linkedin-clozzy.csv`](../../android-studio/contas-linkedin-clozzy.csv) (`fp_*` + `ip`) e [`contas-facebook-chrome.csv`](../../android-studio/contas-facebook-chrome.csv).

**Antes → depois (captcha):** seguia direto p/ localidade → `waitSignupAfterName` pausa indeterminada se iframe/desafio de segurança. Rollback: remover a chamada.

**Antes → depois (onboarding):** sequência fixa de Pulares → `finishSignupOnboarding` adaptativo (Pular se houver, senão Concluir/Continuar) até `/feed`. Rollback: voltar calls `clickSignupSkip`/`Continue`/`Finish`.

**Antes → depois (logs):** silencioso no meio → logs de passo em stderr. Rollback: remover `log()` / `console.error` de progresso.

**Antes → depois (CSV):** save antes + update `li_criado` após feed → só save antes do LinkedIn. Rollback: voltar o 2º `saveAccountCsv` com `liCriado: 'sim'`.

**Antes → depois (fp cols):** só ua/platform/lang/tz/hw/mem/geo/chrome → + accept_language, geo_accuracy, max_touch, touch, webrtc, ch_platform, platform_version, arch, model, mobile, bitness, brands, full_version_list. Sem hash. Rollback: remover cols novas do header/`save-csv.mjs`.

**Coluna `li_criado`:** `sim`/`nao` — se a conta LinkedIn foi criada (signup). Default na criação mailbox+CDP: `nao`. Atualizar para `sim` após signup. Rollback: remover a coluna.

**CDP:** porta livre a partir de `9237`; fingerprint **dinâmico** via `generateFingerprint()` — catálogo **conservador** (Win64 / Mac 10_15_7 / **Linux**, Chrome 129–132, cidades BR principais; sem viewport). Evita colisão tz+UA+platformVersion+hw+mem. `debug: true`. Override: `createLinkedInCdp({ fingerprint })`.

**E-mail:** `MAIL_SSH_HOST` · `MAIL_SSH_PASS` · `MAIL_DOMAIN`. Quota mailbox default `1024` MiB (`MAIL_MBOX_QUOTA_MIB`). Antes de criar, `ensureDomainQuotaHigh` sobe o teto do domínio para **10 TiB** (`MAIL_DOMAIN_MAX_QUOTA_MIB=10485760`) e até **500** caixas via MySQL (a API `edit/domain` não persiste). Idempotente se a caixa já existir.

**Antes → depois (quota):** domínio 50 GiB → estouro `mailbox_quota_left_exceeded` → teto 10 TiB + ensure no createEmail. Rollback: `UPDATE domain SET quota=51200, mailboxes=50 …`.

**Rollback:** apagar mailbox Mailcow + linha `credenciais.md`; `removeCdp('<id>', { deleteProfile: true })`.

**Antes → depois:** só e-mail → e-mail+CDP em paralelo na main. Rollback: remover chamada/`create-cdp.mjs`.

## Próximos passos (ainda não)

3. `startCdp` + signup LinkedIn  
4. CSV / IP
