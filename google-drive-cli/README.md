# google-drive-cli

CLI mínimo da **Google Drive API** (OAuth do usuário). Projeto GCP: `connect-512401`.

## Pré-requisitos

- Drive API ativada no GCP
- Cliente OAuth tipo **Desktop** + tela de consentimento
- Seu e-mail como **usuário de teste** (app em Testing)
- Credencial em `~/.config/google-drive-cli/credentials.json` (fora do git)

## Setup

```bash
pip3 install --user -r requirements.txt
# copiar o JSON baixado do console:
# cp ~/Downloads/client_secret_….json ~/.config/google-drive-cli/credentials.json
# chmod 600 ~/.config/google-drive-cli/credentials.json
```

## Uso

```bash
python3 drive.py auth          # login no browser → grava token.json
python3 drive.py ls            # lista arquivos
python3 drive.py ls --folder ID_DA_PASTA --limit 20
```

Credenciais locais:

| Arquivo | Função |
|---|---|
| `~/.config/google-drive-cli/credentials.json` | client OAuth (Desktop) |
| `~/.config/google-drive-cli/token.json` | token do usuário (criado no `auth`) |

Escopos: `drive.readonly` + `spreadsheets` (ler Drive; ler/escrever planilhas).

Pré-requisito GCP: **Google Sheets API** ativada no mesmo projeto do cliente OAuth.

## Caminho inverso / rollback

- Apagar token: `rm ~/.config/google-drive-cli/token.json` (próximo `auth` pede login de novo)
- Revogar app: [Google Account → Segurança → Acesso de apps de terceiros](https://myaccount.google.com/permissions)
- Remover cliente OAuth no Console → Google Auth Platform → Clientes
- Antes (SA): chave de service account **não** acessa My Drive sem compartilhar pasta com o e-mail da SA; este CLI usa OAuth de usuário

## Segurança

Não versionar `credentials.json`, `token.json` nem chaves de service account. Se uma chave vazou no chat/Downloads, revogue no Console e crie outra.
