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

**Antes → depois:** sem projeto → pasta `OV/` + CSV; conta `rafaela.nogueira@clozzy.com.br` no Mailcow + linha no CSV.

**Rollback:** apagar linha no CSV; remover mailbox no Mailcow; tirar linha de `credenciais.md`; se só o projeto, remover `OV/`.
