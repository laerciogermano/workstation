# OV

Contas OmeTV (Chrome CDP `ometv-*`).

## Planilha

[`contas.csv`](contas.csv) — contas criadas.

| Coluna | Significado |
|---|---|
| `nome` | primeiro nome |
| `sobrenome` | sobrenome |
| `email` | caixa `@clozzy.com.br` |
| `data_hora` | criação (`YYYY-MM-DD HH:MM:SS`) |
| `ip` | IPv4 de egress no signup (`curl -sS https://api.ipify.org`) |
| `senha_facebook` | senha da conta Facebook |

Mailbox Mailcow: criar via API no VPS (`add/mailbox`); senha em [`credenciais.md`](../credenciais.md) (§ Caixas `@clozzy.com.br`).

CDP: `createCdp` / `startCdp` / `connectCdp` em [`human-cdp`](../screen-robot/pocs/chrome-cdp/human-cdp/README.md) (`ometv-1` :9232, `ometv-2` :9233). Browser só via human-cdp. Fingerprint distinto por perfil (`meta.fingerprint`: UA/lang/timezone/viewport) — ver README da lib.

**Antes → depois:** só Rafaela → + Beatriz Carvalho (`ometv-2`, Mailcow + FB + OmeTV via FB).

**Rollback:** apagar linha no CSV; remover mailbox no Mailcow; tirar linha de `credenciais.md`; `removeCdp('ometv-2', { deleteProfile: true })`; se só o projeto, remover `OV/`.
