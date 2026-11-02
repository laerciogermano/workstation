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
| `status` | `ativa` / `banida_ometv` / … |
| `cdp` | id Chrome (`ometv-1`…) |
| `observacoes` | ban, testes, notas |

**Antes → depois (status):** só criação → + `status`/`cdp`/`observacoes`. Rafaela = `banida_ometv` (2026-11-02, imagem irrelevante no teste OBS). Rollback: remover colunas extras; `status=ativa` na linha.

Mailbox Mailcow: criar via API no VPS (`add/mailbox`); senha em [`credenciais.md`](../credenciais.md) (§ Caixas `@clozzy.com.br`).

CDP: `createCdp` / `startCdp` / `connectCdp` em [`human-cdp`](../screen-robot/pocs/chrome-cdp/human-cdp/README.md) (`ometv-1` :9232, `ometv-2` :9233, `ometv-3` :9234). Browser só via human-cdp (`debug: true` no fluxo). Fingerprint distinto por perfil (`meta.fingerprint`: UA/lang/timezone/viewport) — ver README da lib.

**Antes → depois:** Rafaela / Beatriz → + Larissa Souza (`ometv-3`, Win/Chrome131/Recife fingerprint, Mailcow + FB + OmeTV via FB).

**Rollback:** apagar linha no CSV; remover mailbox no Mailcow; tirar linha de `credenciais.md`; `removeCdp('ometv-3', { deleteProfile: true })`; se só o projeto, remover `OV/`.
