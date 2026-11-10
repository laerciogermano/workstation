# CloseFans — inspeção (Clozzy benchmarking)

Site: https://close.fans/ · card: `Trello/Clozzy 2028/Backlog/Inspecionar CloseFans-…` · https://trello.com/c/JFzUjNaW

## Conta lab

| Campo | Valor |
|-------|--------|
| E-mail | `closefans.bench@brsupply.email` |
| Senha | `Cl0seFansBench26!` |
| CDP | `closefans` · `:9264` · `~/chrome-profiles/closefans` |
| Tipo | Fan logado · display `Closefans.bench` · signup só e-mail+senha+18+ (sem confirmação prévia) |

Credenciais espelhadas em [`credenciais-closefans.txt`](credenciais-closefans.txt).

## Escopo

Público + área logada fan profunda (Descobrir tabs/filtros, perfis, Assinar CTA, busca, settings, onboarding creator via `/wallet`). Sem KYC completo nem checkout Pix pago.

## Prints mobile

Pasta [`prints/mobile/`](prints/mobile/) — iPhone `390×844 @3x`.

| Print | Tela |
|-------|------|
| `01`–`15` | Público (landing → blog) |
| `50`–`54` | Feed / Descobrir / search / highlights / chat-404 |
| `55`–`59` | Descobrir tabs (Videochamadas, Assinaturas, Packs, Em Alta) |
| `60`–`63` | Search · Settings · Wallet/onboarding · Feed |
| `64`–`66` | Perfis (Larissa, Ani, Casal Amador) |

## Prints desktop logado

| Print | Tela |
|-------|------|
| `40`–`45` | Login falho → signup → `/my-feed` |
| `50`–`62` | Feed · Descobrir · search · settings · wallet |
| `63`–`69` | Descobrir tabs: Videochamadas · Em Alta · Assinaturas · Packs · Recomendado |
| `70`–`77` | Filtros: BF · Online · Telegram · Chamada · Seguidores · Ativas · Novidades · Todas |
| `78`–`79` | Search + query “Larissa” |
| `80`–`83` | Settings / editar / conta / privacidade (footer) |
| `84`–`89` | `/wallet` → onboarding creator (5 passos) |
| `90`–`91` | Menu usuário / indique |
| `92`–`101` | Perfis + CTA Assinar (Larissa, Ani, Casal Amador, Jamilly, Nina Nyx) |

**Nota UX:** cards em Descobrir são `div` clicáveis (poucos `<a href>` de perfil no DOM) — navegação por slug conhecido/`from=` links do feed.

## Docs

- [`benchmarking-closefans.html`](benchmarking-closefans.html) / [`benchmarking-closefans.pdf`](benchmarking-closefans.pdf)
- [`funcionalidades.md`](funcionalidades.md) · [`ia.md`](ia.md)

## App

Sem app nativo. Web App / “Instalar o App”.

## vs Privacy

- 3 em 1 site + CloseBot Telegram; taxa 20%+fixo; CloseMatch; ban IA explícito

## Rollback

```bash
rm -rf clozzy/marca/benchmarking-concorrentes/closefans
# removeCdp('closefans',{deleteProfile:true})
```
