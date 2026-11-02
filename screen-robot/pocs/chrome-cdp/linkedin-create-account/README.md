# LinkedIn — criar conta (do zero)

Script novo, passo a passo. **Agora só o passo 1:** mailbox Mailcow.

## Passo 1 — e-mail

| Arquivo | Papel |
|---|---|
| [`create-mailbox.mjs`](create-mailbox.mjs) | **main** (CLI) |
| [`create-email.mjs`](create-email.mjs) | lógica encapsulada — `createEmail({ first, last, … })` |

```bash
cd screen-robot/pocs/chrome-cdp/linkedin-create-account

node create-mailbox.mjs --first Bruno --last Nunes --dry-run
node create-mailbox.mjs --first Bruno --last Nunes --write-credenciais
```

Programático:

```js
import { createEmail } from './create-email.mjs';
const r = createEmail({ first: 'Bruno', last: 'Nunes', writeCredenciais: true });
```

Saída: `email`, `name`, `password`, `created` / `existed`.

**Env:** `MAIL_SSH_HOST` · `MAIL_SSH_PASS` (senão `credenciais.md`) · `MAIL_DOMAIN` (default `clozzy.com.br`).

**Idempotente:** se a caixa já existe, não recria (não devolve a senha antiga).

**Quota:** default `1024` MiB (`opts.quota`). Antes `3072` — domínio com pouco espaço restante (`mailbox_quota_left_exceeded`). Rollback: `quota: '3072'` ou passar `quota` maior se houver espaço.

**Antes → depois:** tudo num arquivo → CLI + `createEmail` separados. Rollback: juntar de novo / apagar `create-email.mjs`.

**Rollback mailbox:** apagar no Mailcow; remover linha de [`credenciais.md`](../../../../credenciais.md) se usou `--write-credenciais`.

## Próximos passos (ainda não)

2. CDP + fingerprint  
3. Signup LinkedIn  
4. CSV / IP  

**Antes → depois:** fluxo só ad-hoc nos chats / `signup-*.sh` → pasta `linkedin-create-account/` com passo 1 isolado. Rollback: apagar a pasta; continuar com `PROMPT-NOVO-VENDEDOR.md` / scripts antigos.
