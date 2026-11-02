# LinkedIn — criar conta (do zero)

Script novo, passo a passo. **Agora só o passo 1:** mailbox Mailcow.

## Passo 1 — e-mail (`create-mailbox.mjs`)

Cria `nome.sobrenome@clozzy.com.br` via API Mailcow no VPS (`add/mailbox` por SSH).

```bash
cd screen-robot/pocs/chrome-cdp/linkedin-create-account

# dry-run (não chama API)
node create-mailbox.mjs --first Bruno --last Nunes --dry-run

# cria mailbox + anexa em credenciais.md
node create-mailbox.mjs --first Bruno --last Nunes --write-credenciais
```

Saída JSON: `email`, `name`, `password`, `created` / `existed`.

**Env:** `MAIL_SSH_HOST` · `MAIL_SSH_PASS` (senão `credenciais.md`) · `MAIL_DOMAIN` (default `clozzy.com.br`).

**Idempotente:** se a caixa já existe, não recria (não devolve a senha antiga).

**Rollback:** apagar mailbox no Mailcow; remover linha de [`credenciais.md`](../../../../credenciais.md) se usou `--write-credenciais`.

## Próximos passos (ainda não)

2. CDP + fingerprint  
3. Signup LinkedIn  
4. CSV / IP  

**Antes → depois:** fluxo só ad-hoc nos chats / `signup-*.sh` → pasta `linkedin-create-account/` com passo 1 isolado. Rollback: apagar a pasta; continuar com `PROMPT-NOVO-VENDEDOR.md` / scripts antigos.
