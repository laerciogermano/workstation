# LinkedIn — criar conta (do zero)

Script novo, passo a passo. **Agora só o passo 1:** mailbox Mailcow.

## Main — e-mail + CDP em paralelo

| Arquivo | Papel |
|---|---|
| [`create-mailbox.mjs`](create-mailbox.mjs) | **main** (CLI) — `Promise.all` email + CDP |
| [`create-email.mjs`](create-email.mjs) | `createEmail({ first, last, … })` |
| [`create-cdp.mjs`](create-cdp.mjs) | `createLinkedInCdp({ first, last, … })` |

```bash
cd screen-robot/pocs/chrome-cdp/linkedin-create-account

node create-mailbox.mjs --first Bruno --last Nunes --dry-run
node create-mailbox.mjs --first Bruno --last Nunes --write-credenciais
```

Saída JSON: `{ email, cdp }`.

**CDP:** porta livre a partir de `9237`; fingerprint **dinâmico** via `generateFingerprint()` (OS/Chrome/cidade BR coerentes, sem viewport; evita tz+UA+hw+mem já usados); `debug: true`. Idempotente se o id já existir. Override: `createLinkedInCdp({ fingerprint })`.

**E-mail:** `MAIL_SSH_HOST` · `MAIL_SSH_PASS` · `MAIL_DOMAIN`. Quota default `1024` MiB. Idempotente se a caixa já existir.

**Rollback:** apagar mailbox Mailcow + linha `credenciais.md`; `removeCdp('<id>', { deleteProfile: true })`.

**Antes → depois:** só e-mail → e-mail+CDP em paralelo na main. Rollback: remover chamada/`create-cdp.mjs`.

## Próximos passos (ainda não)

3. `startCdp` + signup LinkedIn  
4. CSV / IP
