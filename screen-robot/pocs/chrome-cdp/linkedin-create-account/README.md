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
| [`open-signup.mjs`](open-signup.mjs) | `openLinkedInSignup({ id })` → `startCdp` + URL signup |
| [`fill-signup-email.mjs`](fill-signup-email.mjs) | `fillSignupEmail({ id, email })` → `#email-or-phone` |
| [`fill-signup-password.mjs`](fill-signup-password.mjs) | `fillSignupPassword({ id, password })` → `#password` (default `in@12345678`) |
| [`click-signup-submit.mjs`](click-signup-submit.mjs) | `clickSignupSubmit({ id })` → Aceite e cadastre-se |
| [`fill-signup-name.mjs`](fill-signup-name.mjs) | `fillSignupName({ id, first, last })` → `#first-name` / `#last-name` |
| [`click-signup-continue.mjs`](click-signup-continue.mjs) | `clickSignupContinue({ id })` → Continuar |
| [`fill-signup-location.mjs`](fill-signup-location.mjs) | `fillSignupLocation({ id, location })` → digita → 1ª opção → Continuar |
| [`fill-signup-job.mjs`](fill-signup-job.mjs) | `fillSignupJob({ id, job })` → cargo (typeahead) |
| [`fill-signup-company.mjs`](fill-signup-company.mjs) | `fillSignupCompany({ id, company })` → empresa → Continuar |
| [`fetch-signup-pin.mjs`](fetch-signup-pin.mjs) | `fetchSignupPin({ email })` → poll Mailcow ≤5 min pelo PIN 6 dígitos |
| [`fill-signup-pin.mjs`](fill-signup-pin.mjs) | `fillSignupPin({ id, code })` → digita PIN → Continuar |
| [`click-signup-age18.mjs`](click-signup-age18.mjs) | `clickSignupAge18({ id })` → Sim, maior de 18 → Continuar |
| [`click-signup-skip.mjs`](click-signup-skip.mjs) | `clickSignupSkip({ id })` → Pular / Skip |

```bash
cd screen-robot/pocs/chrome-cdp/linkedin-create-account

node create-mailbox.mjs --first Bruno --last Nunes --dry-run
node create-mailbox.mjs --first Bruno --last Nunes --write-credenciais
# sem abrir Chrome:
node create-mailbox.mjs --first Bruno --last Nunes --write-credenciais --no-browser
```

Saída JSON: `{ email, cdp, csv, linkedin }`.

**LinkedIn:** após CSV, `createLinkedin` → … → nome → Continuar → **localidade** (digita → 1ª opção do dropdown → Continuar). `--no-browser` pula. Rollback: não chamar / usar `--no-browser`. Após criar, `saveAccountCsv` grava [`contas-linkedin-clozzy.csv`](../../android-studio/contas-linkedin-clozzy.csv) com **todos** os campos do fingerprint configurados (`fp_ua` … `fp_full_version_list`, `fp_webrtc`, geo accuracy, Client Hints; `fp_screen` vazio — sem viewport) + `ip` (ipify), e [`contas-facebook-chrome.csv`](../../android-studio/contas-facebook-chrome.csv).

**Antes → depois (fp cols):** só ua/platform/lang/tz/hw/mem/geo/chrome → + accept_language, geo_accuracy, max_touch, touch, webrtc, ch_platform, platform_version, arch, model, mobile, bitness, brands, full_version_list. Sem hash. Rollback: remover cols novas do header/`save-csv.mjs`.

**Coluna `li_criado`:** `sim`/`nao` — se a conta LinkedIn foi criada (signup). Default na criação mailbox+CDP: `nao`. Atualizar para `sim` após signup. Rollback: remover a coluna.

**CDP:** porta livre a partir de `9237`; fingerprint **dinâmico** via `generateFingerprint()` — catálogo **conservador** (Win64 / Mac 10_15_7 / **Linux**, Chrome 129–132, cidades BR principais; sem viewport). Evita colisão tz+UA+platformVersion+hw+mem. `debug: true`. Override: `createLinkedInCdp({ fingerprint })`.

**E-mail:** `MAIL_SSH_HOST` · `MAIL_SSH_PASS` · `MAIL_DOMAIN`. Quota default `1024` MiB. Idempotente se a caixa já existir.

**Rollback:** apagar mailbox Mailcow + linha `credenciais.md`; `removeCdp('<id>', { deleteProfile: true })`.

**Antes → depois:** só e-mail → e-mail+CDP em paralelo na main. Rollback: remover chamada/`create-cdp.mjs`.

## Próximos passos (ainda não)

3. `startCdp` + signup LinkedIn  
4. CSV / IP
