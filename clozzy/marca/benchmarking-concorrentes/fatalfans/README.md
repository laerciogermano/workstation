# FatalFans — inspeção (Clozzy benchmarking)

Site: https://fatalfans.com/ · ranking Clozzy #11 / #3 BR

## Conta lab

| Campo | Valor |
|-------|--------|
| E-mail | `fatalfans.bench@brsupply.email` |
| Senha | `Fata1FansBench26!` |
| Apelido | `FatalfansBench` (sem `.` — validação do form) |
| User id | `1671183` |
| CDP | `fatalfans` · `:9265` · `~/chrome-profiles/fatalfans` |
| Tipo | Fan logado · signup apelido+e-mail+senha+consent faixa etária → `/user` |
| Operadora | FF Tecnologia Ltda. · CNPJ 63.400.101/0001-70 |
| Suporte | `suporte@fatalfans.com` |

Credenciais: [`credenciais-fatalfans.txt`](credenciais-fatalfans.txt).

## Escopo

Público + área logada fan (menu `/user`, home, salvos, compras, chat, perfil Assinar, Awards, onboard creator, Telegram). Sem KYC completo nem checkout Pix pago.

## Prints desktop

| Print | Tela |
|-------|------|
| `00`–`11` | Público (age gate → campanha Fatal Model) |
| `40`–`48` | Fluxo signup |
| `50` | Menu `/user` (Editar perfil · Escuro · Telegram · Crie conteúdo · Salvos · Compras) |
| `51` | Home logada |
| `52`/`52c` | Editar perfil |
| `53`/`53c` | Salvos (perfis / conteúdo) |
| `54`/`54c` | Minhas compras (assinaturas · conteúdos pagos) |
| `55` | Subscriptions |
| `56`/`56b` | Chat |
| `57`/`57b` | Notificações |
| `58` | Perfil + Assinar (logado) |
| `59` | Awards logado |
| `60` | Crie conteúdo (onboard creator) |
| `61` | Telegram prévias |

## Prints mobile

iPhone `390×844 @3x` — público `01`–`11`; logado `50`–`60`.

## Docs

- [`benchmarking-fatalfans.html`](benchmarking-fatalfans.html) / [`benchmarking-fatalfans.pdf`](benchmarking-fatalfans.pdf)
- [`funcionalidades.md`](funcionalidades.md) · [`ia.md`](ia.md)

## Achados rápidos

- Taxa **15%** · Pix · Fatal Model · Creator Awards
- Bottom nav logado: Home · Compras · Busca · Chat · Painel
- Telegram nativo na conta (“prévias grátis”)
- IA: ban só conteúdo de menor (Termos 4.10)

## Rollback

```bash
rm -rf clozzy/marca/benchmarking-concorrentes/fatalfans
# removeCdp('fatalfans',{deleteProfile:true})
# apagar mailbox fatalfans.bench@brsupply.email no Mailcow
```
