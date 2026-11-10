# Fansly — inspeção (Clozzy benchmarking)

Site: https://fansly.com/ · ranking Clozzy **#4** · card Priorizados: `Inspecionar Fansly-…` · https://trello.com/c/HxwNb1E7

## Conta lab

| Campo | Valor |
|-------|--------|
| E-mail | `fansly.bench@brsupply.email` |
| Senha | `F4nslyBench26!` |
| Username | `FanslyBench26` |
| CDP | `fansly` · `:9266` · `~/chrome-profiles/fansly` |
| Tipo | Fan logado · e-mail **NOT VERIFIED** (ativação não chegou ao Mailcow nesta sessão) |
| Mailbox | Mailcow Contabo `185.250.37.82` (criada após o 1º envio) |

Credenciais: [`credenciais-fansly.txt`](credenciais-fansly.txt).

## Escopo

Público (age gate, landing, explore, legal, Help AI) + signup fan + área logada (home, explore, search, messages, notifications, settings, payments, perfil creator). Sem KYC creator completo nem checkout pago. Verificação de e-mail pendente.

## Prints desktop

| Print | Tela |
|-------|------|
| `00`–`01c` | Age gate / cookies |
| `01`–`05` | Home · Explore · Discover · Search · Become creator |
| `06`–`15` | ToS · Privacy · 2257 · DMCA · Help · Contact |
| `21`–`22` | Help AI policy · NCII deepfake |
| `30`–`37` | Signup → Join → `/home` |
| `50`–`72` | Logado: home · explore · search · messages · notif · settings · payments · perfis |

## Prints mobile

iPhone `390×844 @3x` — home · explore · search · messages · notifications · settings · account · perfil.

## Docs

- [`benchmarking-fansly.html`](benchmarking-fansly.html) / [`benchmarking-fansly.pdf`](benchmarking-fansly.pdf)
- [`funcionalidades.md`](funcionalidades.md) · [`ia.md`](ia.md)

## Achados rápidos

- Taxa típica mercado **20%** (âncora ranking Clozzy); **sem Pix** óbvio na UI payments lab
- Discovery forte: Explore tags + live streams + For You
- OAuth X/Google/Twitch + senha forte
- IA: ban fotorealista (label não libera) + ban AI chat sem humano
- Operadora Select Media LLC (US)

## Rollback

```bash
rm -rf clozzy/marca/benchmarking-concorrentes/fansly
# removeCdp('fansly',{deleteProfile:true})
# apagar mailbox fansly.bench@brsupply.email no Mailcow
```
